// src/app/dashboard/characters/[id]/notificaciones/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Bell, 
  Users, 
  MessageSquare, 
  Heart, 
  BookOpen, 
  UserPlus,
  CheckCheck,
  Trash2,
  Settings,
  Filter
} from 'lucide-react';
import { ref, onValue, push, get, remove, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useCharacter } from '../layout';

interface Notification {
  id: string;
  type: 'friend_request' | 'message' | 'reaction' | 'trama_invite' | 'mention' | 'system';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  actionUrl?: string;
  metadata?: any;
}

interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar?: string;
  status: 'pending' | 'accepted' | 'rejected';
  sentAt: string;
}

export default function NotificationsPage() {
  const { character } = useCharacter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'friend_requests' | 'messages' | 'reactions'>('all');

  useEffect(() => {
    if (!character?.id) return;

    loadNotifications();
    loadFriendRequests();
  }, [character]);

  const loadNotifications = () => {
    if (!character?.id) return;

    const notificationsRef = ref(db, `notifications/${character.id}`);
    onValue(notificationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const notificationsData = snapshot.val();
        const notificationsList = Object.entries(notificationsData)
          .map(([id, notification]: [string, any]) => ({
            id,
            ...notification
          }))
          .sort((a: any, b: any) => b.timestamp - a.timestamp);
        
        setNotifications(notificationsList);
      } else {
        setNotifications([]);
      }
      setLoading(false);
    });
  };

  const loadFriendRequests = () => {
    if (!character?.id) return;

    const requestsRef = ref(db, `friendRequests/${character.id}`);
    onValue(requestsRef, (snapshot) => {
      if (snapshot.exists()) {
        const requestsData = snapshot.val();
        const requestsList = Object.entries(requestsData)
          .map(([id, request]: [string, any]) => ({
            id,
            ...request
          }))
          .filter((request: any) => request.status === 'pending')
          .sort((a: any, b: any) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
        
        setFriendRequests(requestsList);
      } else {
        setFriendRequests([]);
      }
    });
  };

  const markAsRead = async (notificationId: string) => {
    if (!character?.id) return;

    try {
      await update(ref(db, `notifications/${character.id}/${notificationId}`), {
        read: true
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!character?.id) return;

    try {
      const updates: any = {};
      notifications.forEach(notification => {
        if (!notification.read) {
          updates[`notifications/${character.id}/${notification.id}/read`] = true;
        }
      });
      
      if (Object.keys(updates).length > 0) {
        await update(ref(db), updates);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!character?.id) return;

    try {
      await remove(ref(db, `notifications/${character.id}/${notificationId}`));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleFriendRequest = async (requestId: string, action: 'accept' | 'reject') => {
    if (!character?.id) return;

    try {
      const request = friendRequests.find(req => req.id === requestId);
      if (!request) return;

      // Actualizar estado de la solicitud
      await update(ref(db, `friendRequests/${character.id}/${requestId}`), {
        status: action === 'accept' ? 'accepted' : 'rejected',
        respondedAt: new Date().toISOString()
      });

      if (action === 'accept') {
        // Agregar como amigos mutuamente
        await update(ref(db), {
          [`characters/${character.id}/friends/${request.senderId}`]: true,
          [`characters/${request.senderId}/friends/${character.id}`]: true
        });

        // Crear notificación para el solicitante
        await push(ref(db, `notifications/${request.senderId}`), {
          type: 'friend_request',
          title: 'Solicitud de amistad aceptada',
          message: `${character.name} aceptó tu solicitud de amistad`,
          timestamp: Date.now(),
          read: false,
          senderId: character.id,
          senderName: character.name,
          senderAvatar: character.avatarUrl,
          actionUrl: `/characters/${character.id}`
        });
      }

      // Remover de la lista local
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error handling friend request:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_request':
        return <UserPlus className="h-5 w-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'reaction':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'trama_invite':
        return <BookOpen className="h-5 w-5 text-purple-500" />;
      case 'mention':
        return <Bell className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInSeconds = Math.floor((now - timestamp) / 1000);

    if (diffInSeconds < 60) return 'hace unos segundos';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
    return new Date(timestamp).toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.read;
      case 'friend_requests':
        return notification.type === 'friend_request';
      case 'messages':
        return notification.type === 'message';
      case 'reactions':
        return notification.type === 'reaction';
      default:
        return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando notificaciones...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notificaciones
          </h2>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Tienes {unreadCount} notificaciones sin leer
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" onClick={markAllAsRead}>
              <CheckCheck className="h-4 w-4 mr-2" />
              Marcar todas como leídas
            </Button>
          )}
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
        <TabsList>
          <TabsTrigger value="all">
            Todas ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread">
            Sin leer ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="friend_requests">
            Amistad ({friendRequests.length})
          </TabsTrigger>
          <TabsTrigger value="messages">Mensajes</TabsTrigger>
          <TabsTrigger value="reactions">Reacciones</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {/* Solicitudes de amistad pendientes */}
          {friendRequests.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Solicitudes de Amistad Pendientes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.senderAvatar} />
                        <AvatarFallback>{request.senderName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.senderName}</p>
                        <p className="text-sm text-muted-foreground">@{request.senderUsername}</p>
                        <p className="text-xs text-muted-foreground">
                          {getTimeAgo(new Date(request.sentAt).getTime())}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleFriendRequest(request.id, 'accept')}
                      >
                        Aceptar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleFriendRequest(request.id, 'reject')}
                      >
                        Rechazar
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Lista de notificaciones */}
          {filteredNotifications.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay notificaciones</h3>
                <p className="text-muted-foreground">
                  Cuando tengas nuevas notificaciones aparecerán aquí.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {filteredNotifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`transition-all cursor-pointer hover:shadow-md ${
                    !notification.read ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {getTimeAgo(notification.timestamp)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-2 ml-4">
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread">
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <Card 
                key={notification.id} 
                className="bg-blue-50 border-blue-200 transition-all cursor-pointer hover:shadow-md"
                onClick={() => markAsRead(notification.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="friend_requests">
          {friendRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={request.senderAvatar} />
                      <AvatarFallback>{request.senderName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.senderName}</p>
                      <p className="text-sm text-muted-foreground">@{request.senderUsername}</p>
                      <p className="text-xs text-muted-foreground">
                        {getTimeAgo(new Date(request.sentAt).getTime())}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleFriendRequest(request.id, 'accept')}
                    >
                      Aceptar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleFriendRequest(request.id, 'reject')}
                    >
                      Rechazar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="messages">
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <MessageSquare className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="reactions">
          <div className="space-y-2">
            {filteredNotifications.map((notification) => (
              <Card key={notification.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Heart className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{notification.title}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {getTimeAgo(notification.timestamp)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
