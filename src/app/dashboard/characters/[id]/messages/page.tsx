// src/app/dashboard/characters/[id]/messages/page.tsx
'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '../../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../components/ui/card';
import { Input } from '../../../../../components/ui/input';
import { ScrollArea } from '../../../../../components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../components/ui/avatar';
import { Badge } from '../../../../../components/ui/badge';
import { Send, UserPlus, Phone, Video, MoreVertical, MessageSquare } from 'lucide-react';
import { ref, onValue, push, serverTimestamp, get, off } from 'firebase/database';
import { db } from '../../../../../lib/firebase';
import { useCharacter } from '../layout';

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
  unreadCount: { [key: string]: number };
}

export default function MessagesPage() {
  const { character, allCharacters } = useCharacter();
  const searchParams = useSearchParams();
  const chatParam = searchParams.get('chat'); // Para acceso directo a chat específico
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!character) return;
    loadChats();
    
    return () => {
      // Cleanup listeners
      off(ref(db, `chats`));
    };
  }, [character]);

  useEffect(() => {
    // Si hay un parámetro chat, buscar y seleccionar ese chat automáticamente
    if (chatParam && chats.length > 0) {
      const targetChat = chats.find(chat => 
        chat.participants.includes(chatParam) && 
        chat.participants.includes(character.id)
      );
      if (targetChat) {
        setSelectedChat(targetChat);
      } else {
        // Si no existe el chat, crear uno nuevo con ese personaje
        const targetCharacter = allCharacters.find((char: any) => char.id === chatParam);
        if (targetCharacter) {
          handleStartChat(targetCharacter);
        }
      }
    }
  }, [chatParam, chats, allCharacters, character]);

  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      markAsRead(selectedChat.id);
    }
  }, [selectedChat]);

  const loadChats = async () => {
    if (!character) return;

    const chatsRef = ref(db, 'chats');
    onValue(chatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const chatsData = snapshot.val();
        const userChats = Object.entries(chatsData)
          .filter(([chatId, chat]: [string, any]) => 
            chat.participants && chat.participants.includes(character.id)
          )
          .map(([chatId, chat]: [string, any]) => ({
            id: chatId,
            ...chat
          }))
          .sort((a: any, b: any) => (b.lastMessageTime || 0) - (a.lastMessageTime || 0));
        
        setChats(userChats);
      }
      setLoading(false);
    });
  };

  const loadMessages = (chatId: string) => {
    const messagesRef = ref(db, `chatMessages/${chatId}`);
    onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        const messagesList = Object.entries(messagesData)
          .map(([messageId, message]: [string, any]) => ({
            id: messageId,
            ...message
          }))
          .sort((a: any, b: any) => a.timestamp - b.timestamp);
        
        setMessages(messagesList);
      } else {
        setMessages([]);
      }
    });
  };

  const markAsRead = async (chatId: string) => {
    if (!character) return;
    
    try {
      const chatRef = ref(db, `chats/${chatId}/unreadCount/${character.id}`);
      await push(chatRef, 0);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleStartChat = async (otherChar: any) => {
    if (!character) return;

    // Verificar si ya existe un chat entre estos personajes
    const existingChat = chats.find(chat => 
      chat.participants.includes(otherChar.id) && 
      chat.participants.includes(character.id)
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      return;
    }

    // Crear nuevo chat
    try {
      const newChatData = {
        participants: [character.id, otherChar.id],
        participantNames: {
          [character.id]: character.name,
          [otherChar.id]: otherChar.name
        },
        participantAvatars: {
          [character.id]: character.avatarUrl || '',
          [otherChar.id]: otherChar.avatarUrl || ''
        },
        participantUsernames: {
          [character.id]: character.username,
          [otherChar.id]: otherChar.username
        },
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: {
          [character.id]: 0,
          [otherChar.id]: 0
        },
        createdAt: serverTimestamp()
      };

      const chatsRef = ref(db, 'chats');
      const newChatRef = await push(chatsRef, newChatData);
      
      // Actualizar estado local
      const newChat = {
        id: newChatRef.key!,
        ...newChatData,
        lastMessageTime: Date.now()
      };
      
      setChats([newChat, ...chats]);
      setSelectedChat(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !character) return;

    try {
      const messageData = {
        senderId: character.id,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false
      };

      // Agregar mensaje
      const messagesRef = ref(db, `chatMessages/${selectedChat.id}`);
      await push(messagesRef, messageData);

      // Actualizar información del chat
      const otherParticipantId = selectedChat.participants.find(id => id !== character.id);
      if (otherParticipantId) {
        const chatRef = ref(db, `chats/${selectedChat.id}`);
        await push(chatRef, {
          lastMessage: newMessage.trim(),
          lastMessageTime: Date.now(),
          [`unreadCount/${otherParticipantId}`]: (selectedChat.unreadCount[otherParticipantId] || 0) + 1
        });
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getOtherParticipant = (chat: Chat) => {
    const otherId = chat.participants.find(id => id !== character?.id);
    return {
      id: otherId,
      name: chat.participantNames[otherId!],
      username: chat.participantUsernames[otherId!],
      avatarUrl: chat.participantAvatars[otherId!]
    };
  };

  const filteredChars = allCharacters.filter(
    (char: any) =>
      char.id !== character?.id && // No incluir el personaje actual
      (char.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
       char.username?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando mensajes...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-14rem)] max-h-[600px]">
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <Input
            placeholder="Buscar personajes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-sm"
          />
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-2 mb-2">Iniciar chat</p>
            {filteredChars.slice(0, 5).map((char: any) => (
              <div
                key={char.id}
                className="flex items-center gap-3 p-2 hover:bg-muted rounded cursor-pointer"
                onClick={() => handleStartChat(char)}
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={char.avatarUrl} />
                  <AvatarFallback className="text-sm font-bold">
                    {char.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{char.name}</p>
                  <p className="text-xs text-muted-foreground">@{char.username}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="p-2">
            <p className="text-xs text-muted-foreground px-2 mb-2">Chats</p>
            {chats.map((chat) => {
              const other = getOtherParticipant(chat);
              const unreadCount = chat.unreadCount?.[character?.id || ''] || 0;
              
              return (
                <div
                  key={chat.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                    selectedChat?.id === chat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={other.avatarUrl} />
                    <AvatarFallback className="text-sm font-bold">
                      {other.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{other.name}</p>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage || 'Iniciar conversación'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={getOtherParticipant(selectedChat).avatarUrl} />
                      <AvatarFallback className="text-sm font-bold">
                        {getOtherParticipant(selectedChat).name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{getOtherParticipant(selectedChat).name}</p>
                      <p className="text-sm text-muted-foreground">@{getOtherParticipant(selectedChat).username}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 mb-4 h-80">
                  <div className="space-y-4 p-2">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === character?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.senderId === character?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.senderId === character?.id 
                              ? 'text-primary-foreground/70' 
                              : 'text-muted-foreground'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Selecciona un chat</h3>
              <p className="text-sm">Elige una conversación existente o inicia una nueva.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}