// src/app/dashboard/characters/[id]/messages/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Send, MoreVertical, MessageSquare, ArrowLeft, Trash2 } from 'lucide-react';
import { ref, onValue, push, serverTimestamp, set, remove } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useCharacter } from '../layout';

interface Character {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
}

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
  const chatParam = searchParams.get('chat');

  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Función para eliminar chat
  const handleDeleteChat = async (chatId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) return;
    
    try {
      await remove(ref(db, `chats/${chatId}`));
      await remove(ref(db, `chatMessages/${chatId}`));
      
      // Si es el chat seleccionado, deseleccionarlo
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
        setShowMobileChat(false);
      }
    } catch (error) {
      console.error('Error al eliminar chat:', error);
    }
  };

  // Cargar chats
  useEffect(() => {
    if (!character) return;

    const chatsRef = ref(db, 'chats');
    const unsubscribe = onValue(chatsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const userChats = Object.entries(data)
          .filter(([, chat]) => {
            const typedChat = chat as Chat;
            return (
              typedChat.participants &&
              typedChat.participants.includes(character.id) &&
              typedChat.participants.length === 2
            );
          })
          .map(([id, chat]) => ({
            ...chat as Chat,
            id,
          }))
          .filter((chat, index, self) => {
            const otherId = chat.participants.find((p: string) => p !== character.id);
            return index === self.findIndex((c) => {
              const cOtherId = c.participants.find((p: string) => p !== character.id);
              return cOtherId === otherId;
            });
          })
          .sort((a, b) => b.lastMessageTime - a.lastMessageTime);

        setChats(userChats);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [character]);

  // Cargar mensajes del chat seleccionado
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    const messagesRef = ref(db, `chatMessages/${selectedChat.id}`);
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const msgs = Object.entries(data)
          .map(([id, msg]) => ({ 
            id, 
            ...(msg as Omit<Message, 'id'>)
          }))
          .sort((a, b) => a.timestamp - b.timestamp);
        setMessages(msgs);
      } else {
        setMessages([]);
      }
    });

    return unsubscribe;
  }, [selectedChat]);

  // Marcar como leído
  useEffect(() => {
    if (!selectedChat || !character) return;

    const unreadRef = ref(db, `chats/${selectedChat.id}/unreadCount/${character.id}`);
    set(unreadRef, 0).catch(console.error);
  }, [selectedChat, character]);

  const handleStartChat = useCallback(async (otherChar: Character) => {
    if (!character) return;

    const existingChat = chats.find(chat =>
      chat.participants.includes(otherChar.id) && chat.participants.includes(character.id)
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      return;
    }

    try {
      const newChatData = {
        participants: [character.id, otherChar.id],
        participantNames: {
          [character.id]: character.name,
          [otherChar.id]: otherChar.name,
        },
        participantAvatars: {
          [character.id]: character.avatarUrl || '',
          [otherChar.id]: otherChar.avatarUrl || '',
        },
        participantUsernames: {
          [character.id]: character.username,
          [otherChar.id]: otherChar.username,
        },
        lastMessage: '',
        lastMessageTime: Date.now(),
        unreadCount: {
          [character.id]: 0,
          [otherChar.id]: 0,
        },
        createdAt: serverTimestamp(),
      };

      const chatsRef = ref(db, 'chats');
      const newChatRef = await push(chatsRef, newChatData);
      const newChat = {
        id: newChatRef.key!,
        ...newChatData,
      };

      setChats(prev => [newChat, ...prev]);
      setSelectedChat(newChat);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  }, [character, chats]);

  // Seleccionar chat por parámetro - MOVIDO DESPUÉS DE handleStartChat
  useEffect(() => {
    if (!chatParam || !character || !allCharacters) return;

    const existingChat = chats.find(chat =>
      chat.participants.includes(chatParam) && chat.participants.includes(character.id)
    );

    if (existingChat) {
      setSelectedChat(existingChat);
      return;
    }

    const targetChar = allCharacters.find((c: Character) => c.id === chatParam);
    if (targetChar) {
      handleStartChat(targetChar);
    }
  }, [chatParam, character, allCharacters, chats, handleStartChat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !character) return;

    try {
      const messageData = {
        senderId: character.id,
        content: newMessage.trim(),
        timestamp: serverTimestamp(),
        read: false,
      };

      const messagesRef = ref(db, `chatMessages/${selectedChat.id}`);
      await push(messagesRef, messageData);

      const otherId = selectedChat.participants.find(id => id !== character.id);
      if (otherId) {
        const lastMessageRef = ref(db, `chats/${selectedChat.id}/lastMessage`);
        const lastMessageTimeRef = ref(db, `chats/${selectedChat.id}/lastMessageTime`);
        const unreadCountRef = ref(db, `chats/${selectedChat.id}/unreadCount/${otherId}`);

        await set(lastMessageRef, newMessage.trim());
        await set(lastMessageTimeRef, Date.now());
        await set(unreadCountRef, (selectedChat.unreadCount[otherId] || 0) + 1);
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
      avatarUrl: chat.participantAvatars[otherId!],
    };
  };

  const filteredChars = allCharacters.filter(
    (char: Character) =>
      char.id !== character?.id &&
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
    <div className="flex h-[calc(100vh-12rem)]">
      {/* Vista móvil - Lista de chats o chat individual */}
      <div className="flex-1 lg:hidden">
        {!selectedChat || !showMobileChat ? (
          // Lista de chats en móvil
          <div className="h-full flex flex-col">
            <div className="p-4 border-b bg-background">
              <h2 className="text-xl font-bold mb-4">Conversaciones</h2>
              <Input
                placeholder="Buscar personajes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-sm"
              />
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2">
                <p className="text-xs text-muted-foreground px-2 mb-2">Chats</p>
                {chats.map((chat) => {
                  const other = getOtherParticipant(chat);
                  const unreadCount = chat.unreadCount?.[character?.id || ''] || 0;

                  return (
                    <div
                      key={chat.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded cursor-pointer relative group"
                      onClick={() => {
                        setSelectedChat(chat);
                        setShowMobileChat(true);
                      }}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={other.avatarUrl} alt={other.name} />
                        <AvatarFallback className="text-sm font-bold">
                          {other.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium truncate">
                            {other.name}
                          </span>
                          {unreadCount > 0 && (
                            <Badge variant="destructive" className="text-xs ml-2">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {chat.lastMessage || 'Iniciar conversación'}
                        </p>
                      </div>
                      
                      {/* Dropdown para eliminar chat */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => handleDeleteChat(chat.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar conversación
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}

                {searchQuery.trim() && (
                  <>
                    <p className="text-xs text-muted-foreground px-2 mb-2 mt-4">Buscar personajes</p>
                    {filteredChars.slice(0, 5).map((char: Character) => (
                      <div
                        key={char.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-100 rounded cursor-pointer"
                        onClick={() => handleStartChat(char)}
                      >
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={char.avatarUrl} alt={char.name} />
                          <AvatarFallback className="text-sm font-bold">
                            {char.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{char.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{char.username}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          // Vista del chat individual en móvil
          <div className="h-full flex flex-col">
            {/* Header del chat con botón de retroceso */}
            <div className="p-4 border-b bg-background flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowMobileChat(false)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="w-8 h-8">
                <AvatarImage src={getOtherParticipant(selectedChat).avatarUrl} />
                <AvatarFallback className="text-sm">
                  {getOtherParticipant(selectedChat).name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Link 
                  href={`/characters/${getOtherParticipant(selectedChat).id}`}
                  className="font-medium text-sm hover:text-primary transition-colors"
                >
                  {getOtherParticipant(selectedChat).name}
                </Link>
                <p className="text-xs text-muted-foreground">@{getOtherParticipant(selectedChat).username}</p>
              </div>
            </div>
            
            {/* Mensajes */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === character?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        message.senderId === character?.id
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            {/* Input de mensaje */}
            <div className="p-4 border-t bg-background">
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
            </div>
          </div>
        )}
      </div>

      {/* Vista desktop - Sidebar + Chat */}
      <div className="hidden lg:flex lg:w-80 border-r flex-col bg-gray-50">
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
            <p className="text-xs text-muted-foreground px-2 mb-2">Chats</p>
            {chats.map((chat) => {
              const other = getOtherParticipant(chat);
              const unreadCount = chat.unreadCount?.[character?.id || ''] || 0;

              return (
                <div
                  key={chat.id}
                  className={`flex items-center gap-3 p-2 rounded cursor-pointer relative group ${
                    selectedChat?.id === chat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setSelectedChat(chat)}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={other.avatarUrl} alt={other.name} />
                    <AvatarFallback className="text-sm font-bold">
                      {other.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium truncate">
                        {other.name}
                      </span>
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
                  
                  {/* Dropdown para eliminar chat */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => handleDeleteChat(chat.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar conversación
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })}

            {searchQuery.trim() && (
              <>
                <p className="text-xs text-muted-foreground px-2 mb-2 mt-4">Buscar personajes</p>
                {filteredChars.slice(0, 5).map((char: Character) => (
                  <div
                    key={char.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded cursor-pointer"
                    onClick={() => handleStartChat(char)}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={char.avatarUrl} alt={char.name} />
                      <AvatarFallback className="text-sm font-bold">
                        {char.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <Link 
                        href={`/characters/${char.id}`}
                        className="text-sm font-medium hover:text-primary transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {char.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">@{char.username}</p>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area — ¡ESTA ES LA PARTE QUE ARREGLÉ! */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <Card className="flex flex-col h-full">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={getOtherParticipant(selectedChat).avatarUrl} />
                    <AvatarFallback className="text-sm font-bold">
                      {getOtherParticipant(selectedChat).name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link 
                      href={`/characters/${getOtherParticipant(selectedChat).id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {getOtherParticipant(selectedChat).name}
                    </Link>
                    <p className="text-sm text-muted-foreground">@{getOtherParticipant(selectedChat).username}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            {/* ✅ CONTENEDOR DE MENSAJES CON SCROLL FIJO */}
            <CardContent className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.senderId === character?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.senderId === character?.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            {/* ✅ BARRA DE ENTRADA FIJA — SIEMPRE VISIBLE */}
            <div className="p-4 border-t bg-background">
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
            </div>
          </Card>
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
