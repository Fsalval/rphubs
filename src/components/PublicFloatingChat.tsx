'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, X, Minus } from 'lucide-react';
import { ref, onValue, push, serverTimestamp, set } from 'firebase/database';
import { db } from '@/lib/firebase';
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
  unreadCount?: { [key: string]: number };
}

interface PublicFloatingChatProps {
  currentUserCharacter: Character;
  targetCharacter: Character;
}

export default function PublicFloatingChat({ currentUserCharacter, targetCharacter }: PublicFloatingChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Escuchar evento para abrir chat específico
  useEffect(() => {
    const handleOpenChat = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { targetCharacterId } = customEvent.detail;
      if (targetCharacterId === targetCharacter.id) {
        setIsOpen(true);
        setIsMinimized(false);
      }
    };

    window.addEventListener('openFloatingChat', handleOpenChat);
    return () => window.removeEventListener('openFloatingChat', handleOpenChat);
  }, [targetCharacter.id]);

  // Crear o encontrar chat entre los dos personajes
  useEffect(() => {
    if (!currentUserCharacter?.id || !targetCharacter?.id) return;

    const chatsRef = ref(db, `chats`);
    const unsubscribe = onValue(chatsRef, async (snapshot) => {
      const chatsData = snapshot.val();
      let existingChat = null;

      if (chatsData) {
        // Buscar chat existente
        for (const [chatId, chatData] of Object.entries(chatsData)) {
          const chatInfo = chatData as Chat;
          if (
            chatInfo.participants?.includes(currentUserCharacter.id) &&
            chatInfo.participants?.includes(targetCharacter.id) &&
            chatInfo.participants?.length === 2
          ) {
            existingChat = {
              ...chatInfo,
              id: chatId
            };
            break;
          }
        }
      }

      if (existingChat) {
        setChat(existingChat);
      } else {
        // Crear nuevo chat
        const newChatRef = push(chatsRef);
        const newChatData = {
          participants: [currentUserCharacter.id, targetCharacter.id],
          participantNames: {
            [currentUserCharacter.id]: currentUserCharacter.name,
            [targetCharacter.id]: targetCharacter.name
          },
          participantUsernames: {
            [currentUserCharacter.id]: currentUserCharacter.username,
            [targetCharacter.id]: targetCharacter.username
          },
          participantAvatars: {
            [currentUserCharacter.id]: currentUserCharacter.avatarUrl || '',
            [targetCharacter.id]: targetCharacter.avatarUrl || ''
          },
          lastMessage: '',
          lastMessageTime: 0,
          unreadCount: {
            [currentUserCharacter.id]: 0,
            [targetCharacter.id]: 0
          }
        };

        try {
          await set(newChatRef, newChatData);
          setChat({
            ...newChatData,
            id: newChatRef.key!
          });
        } catch (error) {
          console.error('Error creating chat:', error);
        }
      }
    });

    return () => unsubscribe();
  }, [currentUserCharacter, targetCharacter]);

  // Cargar mensajes del chat
  useEffect(() => {
    if (!chat?.id) return;

    const messagesRef = ref(db, `chatMessages/${chat.id}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      const messagesData = snapshot.val();
      if (messagesData) {
        const messagesList = Object.entries(messagesData)
          .map(([id, messageData]) => {
            const message = messageData as Message;
            return {
              ...message,
              id: id
            };
          })
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });

    return () => unsubscribe();
  }, [chat]);

  // Auto scroll al final
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !chat || !currentUserCharacter) return;

    const messagesRef = ref(db, `chatMessages/${chat.id}`);

    const messageData = {
      senderId: currentUserCharacter.id,
      content: newMessage.trim(),
      timestamp: serverTimestamp(),
      read: false,
    };

    try {
      await push(messagesRef, messageData);

      // Actualizar info del chat
      const lastMessageRef = ref(db, `chats/${chat.id}/lastMessage`);
      const lastMessageTimeRef = ref(db, `chats/${chat.id}/lastMessageTime`);
      const unreadCountRef = ref(db, `chats/${chat.id}/unreadCount/${targetCharacter.id}`);

      await Promise.all([
        set(lastMessageRef, newMessage.trim()),
        set(lastMessageTimeRef, Date.now()),
        set(unreadCountRef, (chat.unreadCount?.[targetCharacter.id] || 0) + 1)
      ]);

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

  if (!currentUserCharacter || !targetCharacter) return null;

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
          </Button>
        </div>
      )}

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed inset-0 md:bottom-6 md:right-6 md:inset-auto z-50">
          <Card className={`
            w-full h-full md:w-80 md:h-96 shadow-xl transition-all duration-200 
            ${isMinimized ? 'md:h-14 h-14' : 'h-full md:h-96'}
            md:rounded-lg rounded-none
          `}>
            <CardHeader className="p-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  <Link 
                    href={`/characters/${targetCharacter.id}`}
                    className="hover:text-primary transition-colors"
                  >
                    {targetCharacter.name}
                  </Link>
                </CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 p-0 hidden md:flex"
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
              <CardContent className="p-0 flex flex-col h-[calc(100%-4rem)]">
                <ScrollArea className="flex-1 p-3">
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div key={message.id} className={`flex ${message.senderId === currentUserCharacter.id ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[70%] rounded-lg p-2 text-sm ${
                            message.senderId === currentUserCharacter.id
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

                <div className="p-3 border-t shrink-0">
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
              </CardContent>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
