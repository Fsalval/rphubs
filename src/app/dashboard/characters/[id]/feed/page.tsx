'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, Share2, MoreHorizontal, Filter, Search, Users, Globe, Calendar, Send } from 'lucide-react';
import { useCharacter } from '../layout';
import { sanitize } from '@/lib/sanitize';
import { ref, get, push, set, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

interface Post {
  id: string;
  content: string;
  time: string;
  visibility: 'public' | 'friends' | 'private';
  characterName: string;
  characterUsername: string;
  characterAvatar?: string;
  characterId: string;
  type: 'post' | 'trama' | 'update';
  tags?: string[];
  reactions?: { [userId: string]: string };
  comments?: number;
  shares?: number;
}

interface FilterOptions {
  searchTerm: string;
  postType: 'all' | 'post' | 'trama' | 'update';
  timeFilter: 'all' | 'today' | 'week' | 'month';
  friendsOnly: boolean;
}

export default function FeedPage() {
  const { character, allCharacters } = useCharacter();

  const [friends, setFriends] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends' | 'private'>('friends');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    searchTerm: '',
    postType: 'all',
    timeFilter: 'all',
    friendsOnly: true
  });

  // Obtener amigos del personaje
  useEffect(() => {
    if (!character?.id) {
      setFriends([]);
      return;
    }
    
    const friendsRef = ref(db, `characters/${character.id}/friends`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const friendsData = snapshot.val();
        const friendIds = Object.keys(friendsData).filter(id => friendsData[id] === true);
        setFriends(friendIds);
      } else {
        setFriends([]);
      }
    });

    return () => unsubscribe();
  }, [character]);

  // Cargar posts del feed
  useEffect(() => {
    if (!character?.id) {
      setPosts([]);
      setLoading(false);
      return;
    }

    loadFeedPosts();
  }, [character, friends, allCharacters]);

  // Aplicar filtros
  useEffect(() => {
    applyFilters();
  }, [posts, filters]);

  const loadFeedPosts = async () => {
    setLoading(true);
    try {
      const allPosts: Post[] = [];

      // Incluir posts propios
      const ownPostsSnapshot = await get(ref(db, `characters/${character.id}/posts`));
      if (ownPostsSnapshot.exists()) {
        const postsData = ownPostsSnapshot.val();
        
        Object.entries(postsData).forEach(([postId, post]: [string, any]) => {
          allPosts.push({
            id: postId,
            ...post,
            characterName: character.name,
            characterUsername: character.username,
            characterAvatar: character.avatarUrl,
            characterId: character.id,
            type: post.type || 'post'
          });
        });
      }

      // Cargar posts y tramas de amigos
      if (friends.length > 0) {
        for (const friendId of friends) {
          // Cargar posts del amigo
          const postsRef = ref(db, `characters/${friendId}/posts`);
          const snapshot = await get(postsRef);
          
          if (snapshot.exists()) {
            const postsData = snapshot.val();
            const friendCharacter = allCharacters.find((char: any) => char.id === friendId);

            Object.entries(postsData).forEach(([postId, post]: [string, any]) => {
              if (post.visibility === 'public' || post.visibility === 'friends') {
                allPosts.push({
                  id: postId,
                  ...post,
                  characterName: friendCharacter?.name || 'Usuario',
                  characterUsername: friendCharacter?.username || 'user',
                  characterAvatar: friendCharacter?.avatarUrl,
                  characterId: friendId,
                  type: post.type || 'post'
                });
              }
            });
          }

          // Cargar tramas públicas del amigo
          const tramasRef = ref(db, `characters/${friendId}/tramas`);
          const tramasSnapshot = await get(tramasRef);
          
          if (tramasSnapshot.exists()) {
            const tramasData = tramasSnapshot.val();
            const friendCharacter = allCharacters.find((char: any) => char.id === friendId);
            
            Object.entries(tramasData).forEach(([tramaId, trama]: [string, any]) => {
              if (trama.visibility === 'public' || 
                  (trama.visibility === 'friends' && friends.includes(friendId))) {
                
                allPosts.push({
                  id: `trama-${tramaId}`,
                  content: `Nueva trama: "${trama.name}"\n${trama.content || ''}`,
                  time: trama.time || new Date().toISOString(),
                  visibility: trama.visibility,
                  characterName: friendCharacter?.name || 'Usuario',
                  characterUsername: friendCharacter?.username || 'user',
                  characterAvatar: friendCharacter?.avatarUrl,
                  characterId: friendId,
                  type: 'trama',
                  tags: trama.tags || []
                });
              }
            });
          }
        }
      }

      // Ordenar por fecha (más reciente primero)
      allPosts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      setPosts(allPosts);
    } catch (error) {
      console.error('Error loading feed posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...posts];

    // Filtro por término de búsqueda
    if (filters.searchTerm) {
      filtered = filtered.filter(post => 
        post.content.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        post.characterName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        post.tags?.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    }

    // Filtro por tipo de post
    if (filters.postType !== 'all') {
      filtered = filtered.filter(post => post.type === filters.postType);
    }

    // Filtro por tiempo
    if (filters.timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.timeFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(post => new Date(post.time) >= filterDate);
    }

    setFilteredPosts(filtered);
  };

  const handleReaction = async (postId: string, reaction: string) => {
    if (!character?.id) return;

    try {
      console.log(`Reacting to post ${postId} with ${reaction}`);
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  // Función para enviar nuevo post
  const handleSubmitPost = async () => {
    if (!character?.id || !newPost.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const postsRef = ref(db, `characters/${character.id}/posts`);
      const newPostRef = push(postsRef);
      
      const postData = {
        id: newPostRef.key,
        content: sanitize(newPost.trim()),
        time: new Date().toISOString(),
        visibility: postVisibility,
        characterName: character.name,
        characterUsername: character.username,
        characterAvatar: character.avatarUrl,
        characterId: character.id,
        type: 'post',
        reactions: {},
        comments: 0,
        shares: 0
      };

      await set(newPostRef, postData);
      
      // Limpiar el formulario
      setNewPost('');
      
      // Recargar posts
      loadFeedPosts(); // ✅ Llamada directa
    } catch (error) {
      console.error('Error al enviar post:', error);
      alert('Error al enviar post. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace unos segundos';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    return postTime.toLocaleDateString();
  };

  const handleChangePostVisibility = async (postId: string, newVisibility: 'public' | 'friends' | 'private') => {
    try {
      const postRef = ref(db, `characters/${character.id}/posts/${postId}`);
      await set(postRef, {
        ...posts.find(p => p.id === postId),
        visibility: newVisibility
      });
      
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, visibility: newVisibility } : post
      ));
      
      setEditingPostId(null);
    } catch (error) {
      console.error('Error cambiando visibilidad:', error);
      alert('Error al cambiar visibilidad');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando feed...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y filtros */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Feed de Amigos
          </h2>
          <Badge variant="secondary">
            {filteredPosts.length} publicaciones
          </Badge>
        </div>

        {/* Barra de búsqueda y filtros */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en el feed..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, postType: 'all' }))}>
                Todos los tipos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, postType: 'post' }))}>
                Solo posts
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, postType: 'trama' }))}>
                Solo tramas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, postType: 'update' }))}>
                Solo actualizaciones
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Tiempo
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, timeFilter: 'all' }))}>
                Todo el tiempo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, timeFilter: 'today' }))}>
                Hoy
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, timeFilter: 'week' }))}>
                Esta semana
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilters(prev => ({ ...prev, timeFilter: 'month' }))}>
                Este mes
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Área de escritura de posts */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 pb-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={character?.avatarUrl} />
            <AvatarFallback>{character?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="¿Qué está pensando tu personaje?"
              className="resize-none border-0 p-0 text-base"
              rows={3}
            />
          </div>
        </CardHeader>
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  {postVisibility === 'public' ? (
                    <>
                      <Globe className="h-4 w-4 mr-2" />
                      Público
                    </>
                  ) : postVisibility === 'friends' ? (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Amigos
                    </>
                  ) : (
                    <>
                      <Users className="h-4 w-4 mr-2" />
                      Privado
                    </>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setPostVisibility('public')}>
                  <Globe className="h-4 w-4 mr-2" />
                  Público
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPostVisibility('friends')}>
                  <Users className="h-4 w-4 mr-2" />
                  Amigos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPostVisibility('private')}>
                  <Users className="h-4 w-4 mr-2" />
                  Privado
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              onClick={handleSubmitPost}
              disabled={!newPost.trim() || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Publicando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Publicar
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Feed de posts */}
      {filteredPosts.length === 0 ? (
        <Card className="text-center py-8">
          <CardContent>
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay publicaciones</h3>
            <p className="text-muted-foreground">
              {filters.searchTerm || filters.postType !== 'all' || filters.timeFilter !== 'all'
                ? 'No se encontraron publicaciones con los filtros aplicados.'
                : 'Tus amigos aún no han publicado nada.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-start gap-4 pb-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={post.characterAvatar} />
                  <AvatarFallback>{post.characterName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold truncate">{post.characterName}</p>
                    <p className="text-sm text-muted-foreground">@{post.characterUsername}</p>
                    <Badge variant={post.type === 'trama' ? 'default' : 'secondary'} className="text-xs">
                      {post.type === 'trama' ? 'Trama' : post.type === 'update' ? 'Actualización' : 'Post'}
                    </Badge>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        post.visibility === 'public' ? 'text-blue-600' : 
                        post.visibility === 'friends' ? 'text-green-600' : 
                        'text-orange-600'
                      }`}
                    >
                      {post.visibility === 'public' ? '🌍 Público' : 
                       post.visibility === 'friends' ? '👥 Amigos' : 
                       '🔒 Privado'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{getTimeAgo(post.time)}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {post.characterId === character.id && (
                      <DropdownMenuItem 
                        onClick={() => setEditingPostId(editingPostId === post.id ? null : post.id)}
                      >
                        Cambiar visibilidad
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>Reportar</DropdownMenuItem>
                    <DropdownMenuItem>Ocultar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="pt-0">
                <div
                  className="whitespace-pre-line leading-relaxed mb-4"
                  dangerouslySetInnerHTML={{ __html: sanitize(post.content) }}
                />
                
                {post.tags && post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Panel de cambio de visibilidad */}
                {editingPostId === post.id && post.characterId === character.id && (
                  <div className="bg-muted p-3 rounded-lg mb-4">
                    <p className="text-sm font-medium mb-2">Cambiar visibilidad:</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={post.visibility === 'public' ? 'default' : 'outline'}
                        onClick={() => handleChangePostVisibility(post.id, 'public')}
                        className="flex items-center gap-1"
                      >
                        <Globe className="h-3 w-3" />
                        Público
                      </Button>
                      <Button
                        size="sm"
                        variant={post.visibility === 'friends' ? 'default' : 'outline'}
                        onClick={() => handleChangePostVisibility(post.id, 'friends')}
                        className="flex items-center gap-1"
                      >
                        <Users className="h-3 w-3" />
                        Amigos
                      </Button>
                      <Button
                        size="sm"
                        variant={post.visibility === 'private' ? 'default' : 'outline'}
                        onClick={() => handleChangePostVisibility(post.id, 'private')}
                        className="flex items-center gap-1"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Privado
                      </Button>
                    </div>
                  </div>
                )}

                {/* Acciones del post */}
                <div className="flex items-center gap-4 pt-3 border-t">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-red-500"
                    onClick={() => handleReaction(post.id, 'like')}
                  >
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">{post.reactions ? Object.keys(post.reactions).length : 0}</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-blue-500"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">{post.comments || 0}</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center gap-2 text-muted-foreground hover:text-green-500"
                  >
                    <Share2 className="h-4 w-4" />
                    <span className="text-sm">{post.shares || 0}</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}