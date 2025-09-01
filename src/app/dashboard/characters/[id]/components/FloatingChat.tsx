// src/app/dashboard/characters/[id]/components/FloatingChat.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send, MessageSquare, X, Minus } from 'lucide-react';
import { ref, onValue, push, serverTimestamp, get, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useCharacter } from '../layout';
import { Character } from '@/lib/types';

interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: number;
  read: boolean;
}

interface Chat {
  id: string;
  participants: string[];
  participantNames: { [key: string]: string };
  participantAvatars: { [key: string]: string };
  participantUsernames: { [key: string]: string };
  lastMessage: string;
  lastMessageTime: number;
}

export default function FloatingChat() {
  const { character, allCharacters } = useCharacter() as {
    character: Character | null;
    allCharacters: Character[];
  };
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escuchar evento para abrir chat específico
  useEffect(() => {
    const handleOpenChat = (event: any) => {
      const { targetCharacterId } = event.detail;
      if (targetCharacterId) {
        // Busca el chat existente o crea uno nuevo
        const existingChat = chats.find(chat => chat.participants.includes(targetCharacterId));
        if (existingChat) {
          setSelectedChat(existingChat);
        } else {
          // Si no existe, podrías iniciar uno nuevo
          console.log('Iniciar chat con:', targetCharacterId);
        }
        setIsOpen(true);
        setIsMinimized(false);
      }
    };

    window.addEventListener('openFloatingChat', handleOpenChat);
    return () => window.removeEventListener('openFloatingChat', handleOpenChat);
  }, [chats]);

  // Cargar chats
  useEffect(() => {
    if (!character?.id) return;

    const chatsRef = ref(db, `chats`);
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      const chatsData = snapshot.val();
      if (chatsData) {
        const userChats = Object.entries(chatsData)
          .filter(([_, chat]: any) => chat.participants?.includes(character.id))
          .map(([id, chat]: any) => ({
            id,
            ...chat,
          }))
          .sort((a: any, b: any) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));

        setChats(userChats);

        // Calcular total de mensajes no leídos
        const totalUnread = userChats.reduce((total: number, chat: any) => {
          return total + (chat.unreadCount?.[character.id] || 0);
        }, 0);
        setUnreadTotal(totalUnread);
      }
    });

    return () => unsubscribe();
  }, [character]);

  // Cargar mensajes del chat seleccionado
  useEffect(() => {
    if (!selectedChat) return;

    const messagesRef = ref(db, `chatMessages/${selectedChat.id}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val();
      if (messagesData) {
        const messagesList = Object.entries(messagesData)
          .map(([id, message]: any) => ({
            id,
            ...message,
          }))
          .sort((a: any, b: any) => a.timestamp - b.timestamp);
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [selectedChat]);

  // Auto scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !character) return;

    const messagesRef = ref(db, `chatMessages/${selectedChat.id}`);
    const chatRef = ref(db, `chats/${selectedChat.id}`);

    const messageData = {
      senderId: character.id,
      content: newMessage.trim(),
      timestamp: serverTimestamp(),
      read: false,
    };

    try {
      await push(messagesRef, messageData);

      // Actualizar info del chat
      const otherParticipantId = selectedChat.participants.find((p) => p !== character.id);
      if (otherParticipantId) {
        await push(chatRef, {
          lastMessage: newMessage.trim(),
          lastMessageTime: Date.now(),
          [`unreadCount/${otherParticipantId}`]: (selectedChat.unreadCount?.[otherParticipantId] || 0) + 1,
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getOtherParticipantName = (chat: Chat) => {
    const otherParticipant = chat.participants.find((p) => p !== character?.id);
    return chat.participantNames?.[otherParticipant || ''] || 'Usuario desconocido';
  };

  const getOtherParticipantAvatar = (chat: Chat) => {
    const otherParticipant = chat.participants.find((p) => p !== character?.id);
    return chat.participantAvatars?.[otherParticipant || ''] || '';
  };

  if (!character) return null;

  return (
    <>
      {/* Botón flotante */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setIsOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg relative"
            size="lg"
          >
            <MessageSquare className="h-6 w-6" />
            {unreadTotal > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </Badge>
            )}
          </Button>
        </div>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className={`w-80 shadow-xl transition-all duration-200 ${isMinimized ? 'h-14' : 'h-96'}`}>
            <CardHeader className="p-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {selectedChat ? getOtherParticipantName(selectedChat) : 'Mensajes'}
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            {!isMinimized && (
              <CardContent className="p-0 h-80 flex flex-col">
                {!selectedChat ? (
                  /* Lista de chats */
                  <ScrollArea className="flex-1 p-3">
                    {chats.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No hay conversaciones</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {chats.map((chat) => (
                          <div
                            key={chat.id}
                            className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-muted"
                            onClick={() => setSelectedChat(chat)}
                          >
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={getOtherParticipantAvatar(chat)} />
                              <AvatarFallback>{getOtherParticipantName(chat).charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{getOtherParticipantName(chat)}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {chat.lastMessage || 'Sin mensajes'}
                              </p>
                            </div>
                            {chat.unreadCount?.[character.id] > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {chat.unreadCount[character.id]}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                ) : (
                  /* Vista de mensajes */
                  <>
                    <div className="p-2 border-b">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedChat(null)} className="text-xs">
                        ← Volver a chats
                      </Button>
                    </div>

                    <ScrollArea className="flex-1 p-3">
                      <div className="space-y-3">
                        {messages.map((message) => (
                          <div key={message.id} className={`flex ${message.senderId === character.id ? 'justify-end' : 'justify-start'}`}>
                            <div
                              className={`max-w-[70%] rounded-lg p-2 text-sm ${
                                message.senderId === character.id
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p>{message.content}</p>
                              <p className="text-xs mt-1 opacity-70">{formatTime(message.timestamp)}</p>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    <div className="p-3 border-t">
                      <div className="flex gap-2">
                        <Input
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Escribe un mensaje..."
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          className="text-sm"
                        />
                        <Button size="sm" onClick={sendMessage}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
