// src/app/dashboard/characters/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';
import { MoreHorizontal, ThumbsUp, Frown, Laugh, Heart, Eye, Users, Menu } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCharacter } from './layout';
import { sanitize } from '@/lib/sanitize';
import { ref, push, set , onValue , remove, get } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Character, Post } from '@/lib/types';

// Tipos locales para el feed
interface FeedPost extends Post {
  type: 'post';
  characterId: string;
  characterName: string;
  characterUsername: string;
  characterAvatar: string;
}

interface FeedTrama {
  id: string;
  type: 'trama';
  name: string;
  content: string;
  time: string;
  visibility: 'public' | 'friends' | 'private';
  characterId: string;
  characterName: string;
  characterUsername: string;
  characterAvatar: string;
  tramaId: string;
  tramaName: string;
  tramaDescription?: string;
}

// Tipo para las tramas en la base de datos
interface TramaFromDB {
  id: string;
  name: string;
  content: string;
  description?: string;
  visibility: 'public' | 'friends' | 'private';
  authorId: string;
  authorCharName?: string;
  authorCharHandle?: string;
  authorCharAvatarUrl?: string;
  responses?: Record<string, {
    content: string;
    createdAt: string;
    author?: {
      id: string;
      name: string;
      username: string;
      avatarUrl: string;
    };
  }>;
}

type FeedItem = FeedPost | FeedTrama;

// Helper functions
const isPost = (item: FeedItem): item is FeedPost => item.type === 'post';

export default function CharacterProfilePage() {
  const { character, isOwner, allCharacters } = useCharacter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends'>('friends');
  const [activeTab, setActiveTab] = useState<'feed' | 'public-wall'>('feed');

  useEffect(() => {
    if (!character?.id) return;

    const postsRef = ref(db, `characters/${character.id}/posts`);
    
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convertir objeto en array y agregar el ID
        const postsArray = Object.entries(data)
          .map(([key, value]) => ({
            ...value as Post,
            id: key // asegura que el ID esté presente
          }))
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()); // nuevos primero
        
        setPosts(postsArray);
      } else {
        setPosts([]); // si no hay posts
      }
    }, (error) => {
      console.error("Error al leer posts:", error);
    });

    return () => unsubscribe();
  }, [character?.id]);

  // Publicar post
  const handlePost = async () => {
    if (!content.trim() || !character) return;
    const cleanContent = sanitize(content);
    
    try {
      // Guardar en Firebase
      const postsRef = ref(db, `characters/${character.id}/posts`);
      const newPostRef = push(postsRef);
      
      const newPost = {
        id: newPostRef.key,
        charName: character.name,
        charHandle: character.username,
        avatarUrl: character.avatarUrl,
        time: new Date().toISOString(),
        content: cleanContent,
        visibility: postVisibility,
        likes: 0,
        hearts: 0,
        heartbreaks: 0,
        laughs: 0,
        characterId: character.id,
        type: 'post'
      };

      await set(newPostRef, newPost);

      // Actualizar estado local
      setPosts([newPost, ...posts]);
      setContent('');
    } catch (error) {
      console.error('Error al guardar post:', error);
      alert('Error al publicar. Intenta de nuevo.');
    }
  };

  const handleEditPost = async () => {
    if (!editingPost || !editContent.trim()) return;

    const cleanContent = sanitize(editContent);
    
    try {
      const postRef = ref(db, `characters/${character.id}/posts/${editingPost}/content`);
      await set(postRef, cleanContent);

      setPosts(posts.map(p => 
        p.id === editingPost 
          ? { ...p, content: cleanContent }
          : p
      ));
      setEditingPost(null);
    } catch (error) {
      console.error('Error al editar el post:', error);
      alert('No se pudo guardar la edición.');
    }
  };

  const handleDeletePost = async (id: string) => {
    try {
      await remove(ref(db, `characters/${character.id}/posts/${id}`));
      setPosts(posts.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error al eliminar el post:', error);
      alert('No se pudo eliminar el post.');
    }
  };

  // Función para cambiar visibilidad de un post
  const handleChangePostVisibility = async (postId: string, newVisibility: 'public' | 'friends') => {
    try {
      const postRef = ref(db, `characters/${character.id}/posts/${postId}/visibility`);
      await set(postRef, newVisibility);
      
      // Actualizar estado local
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, visibility: newVisibility }
          : p
      ));
    } catch (error) {
      console.error('Error al cambiar visibilidad:', error);
    }
  };

  // Función para manejar reacciones
  const handleReaction = async (postId: string, reactionType: 'likes' | 'hearts' | 'heartbreaks' | 'laughs') => {
    try {
      const postRef = ref(db, `characters/${character.id}/posts/${postId}/${reactionType}`);
      const currentPost = posts.find(p => p.id === postId);
      if (!currentPost) return;

      const newCount = (currentPost[reactionType] || 0) + 1;
      await set(postRef, newCount);

      // Actualizar estado local
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, [reactionType]: newCount }
          : p
      ));
    } catch (error) {
      console.error('Error al actualizar reacción:', error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-8 md:grid-cols-12">
        {/* Barra lateral - Visible en desktop, oculta en móvil */}
        <div className="hidden md:block md:col-span-4 lg:col-span-3 space-y-6">
          {/* About Me */}
          <Card>
            <CardHeader>
              <CardTitle>About me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                {character?.biography || character?.profile || 'No hay perfil definido.'}
              </p>              
            </CardContent>
          </Card>
          
          {/* Etiquetas */}
          <Card>
            <CardHeader>
              <CardTitle>Etiquetas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4"> 
              <div className="flex flex-wrap gap-2">
                {character?.tags?.length > 0 ? (
                  character.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No hay etiquetas definidas.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enlaces sociales */}
          <Card>
            <CardHeader>
              <CardTitle>Enlaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {character?.socialLinks?.length > 0 ? (
                character.socialLinks.map((link: { name: string; url: string }, i: number) => (
                  <div key={i}>
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block text-sm"
                    >
                      {link.name}
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No hay enlaces definidos.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Contenido principal */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          {/* Header con botón sidebar y tabs alineados */}
          <div className="flex items-center justify-between">
            {/* Botón para abrir sidebar en móvil */}
            <div className="md:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Menu className="h-4 w-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
                  <SheetHeader>
                    <SheetTitle>Perfil de {character?.name}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <SidebarContent character={character} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Tabs alineados con el botón del menú - Solo móvil */}
            <div className="flex-1 flex justify-center md:hidden">
              <div className="flex gap-8">
                <button 
                  onClick={() => setActiveTab('feed')}
                  className={`text-sm font-medium border-b-2 pb-2 ${
                    activeTab === 'feed' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent hover:border-primary text-muted-foreground'
                  }`}
                >
                  Feed
                </button>
                <button 
                  onClick={() => setActiveTab('public-wall')}
                  className={`text-sm font-medium border-b-2 pb-2 ${
                    activeTab === 'public-wall' 
                      ? 'border-primary text-primary' 
                      : 'border-transparent hover:border-primary text-muted-foreground'
                  }`}
                >
                  Mi Muro
                </button>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'feed' | 'public-wall')}>
            {/* Tabs originales - Solo desktop */}
            <div className="hidden md:block">
              <TabsList className="flex justify-center gap-8 border-b border-border pb-2 w-full">
                <TabsTrigger value="feed">Feed</TabsTrigger>
                <TabsTrigger value="public-wall">Mi Muro</TabsTrigger>
              </TabsList>
            </div>

            {/* Muro Público */}
            <TabsContent value="public-wall">
              <Card>
                <CardHeader>
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src={character.avatarUrl} />
                      <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <p className="font-bold">{character.name}</p>
                        <p className="text-sm text-muted-foreground">@{character.username}</p>
                        <p className="text-sm text-muted-foreground">&middot;</p>
                        <p className="text-sm text-muted-foreground">ahora</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          {postVisibility === 'public' ? <Eye className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          <span>{postVisibility === 'public' ? 'Público' : 'Amigos'}</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="¿Qué está pensando tu personaje?"
                          className="flex-1 bg-background border-border focus-visible:ring-1 min-h-16"
                          rows={3}
                        />
                      </div>
                    </div>
                    {/* Menú de tres puntos */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setPostVisibility(postVisibility === 'friends' ? 'public' : 'friends')}>
                          {postVisibility === 'friends' ? 'Hacer público' : 'Volver a solo amigos'}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <div className="px-6 pb-6 flex items-center justify-between border-t pt-4">
                  <div></div>
                  <Button 
                    onClick={handlePost} 
                    disabled={!content.trim()}
                  >
                    Publicar
                  </Button>
                </div>
              </Card>

              {posts.length === 0 ? (
                <p className="text-muted-foreground">No hay publicaciones aún.</p>
              ) : (
                posts.map((post) => (
                  <Card key={post.id}>
                    <CardHeader>
                      <div className="flex gap-4">
                        <Avatar>
                          <AvatarImage src={post.avatarUrl} />
                          <AvatarFallback>{post.charName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2">
                            <Link 
                              href={`/characters/${post.characterId || character.id}`}
                              className="font-bold hover:text-primary transition-colors"
                            >
                              {post.charName}
                            </Link>
                            <p className="text-sm text-muted-foreground">{post.charHandle}</p>
                            <p className="text-sm text-muted-foreground">&middot;</p>
                            <p className="text-sm text-muted-foreground">{new Date(post.time).toLocaleString()}</p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              {post.visibility === 'public' ? <Eye className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                              <span>{post.visibility === 'public' ? 'Público' : 'Amigos'}</span>
                            </div>
                          </div>
                          {editingPost === post.id ? (
                            <div className="space-y-2 mt-2">
                              <Textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={4} />
                              <div className="flex gap-2">
                                <Button size="sm" onClick={handleEditPost}>Guardar</Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingPost(null)}>Cancelar</Button>
                              </div>
                            </div>
                          ) : (
                            <p className="mt-2" dangerouslySetInnerHTML={{ __html: post.content }} />
                          )}
                        </div>
                        {isOwner && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingPost(post.id); setEditContent(post.content); }}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangePostVisibility(post.id, post.visibility === 'public' ? 'friends' : 'public')}>
                                {post.visibility === 'public' ? 'Hacer privado para amigos' : 'Hacer público'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </CardHeader>
                    <div className="px-6 pb-6 flex justify-around text-muted-foreground border-t pt-2 mt-4">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-2 hover:text-blue-500" 
                        onClick={() => handleReaction(post.id, 'likes')}
                      >
                        <ThumbsUp className="h-4 w-4" /> {post.likes || 0}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-2 hover:text-red-500"
                        onClick={() => handleReaction(post.id, 'hearts')}
                      >
                        <Heart className="h-4 w-4" /> {post.hearts || 0}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-2 hover:text-orange-500"
                        onClick={() => handleReaction(post.id, 'heartbreaks')}
                      >
                        <Frown className="h-4 w-4" /> {post.heartbreaks || 0}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="flex items-center gap-2 hover:text-yellow-500"
                        onClick={() => handleReaction(post.id, 'laughs')}
                      >
                        <Laugh className="h-4 w-4" /> {post.laughs || 0}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Feed de Amigos */}
            <TabsContent value="feed">
              <div className="space-y-6">
                {/* Aquí se mostrará el feed con posts propios, de amigos y tramas nuevas */}
                <FeedContent character={character} allCharacters={allCharacters} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

// Componente para el Feed
function FeedContent({ character, allCharacters }: { character: Character, allCharacters: Record<string, Character> }) {
  const [friends, setFriends] = useState<string[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Función para manejar reacciones en el feed
  const handleFeedReaction = async (item: FeedItem, reactionType: 'likes' | 'hearts' | 'heartbreaks' | 'laughs') => {
    if (item.type !== 'post') return; // Solo posts tienen reacciones

    try {
      const currentCount = item[reactionType] || 0;
      const newCount = currentCount + 1;
      
      await set(ref(db, `characters/${item.characterId}/posts/${item.id.replace(/^(own-post-|friend-post-.*-)/, '')}/${reactionType}`), newCount);

      // Actualizar estado local
      setFeedItems(feedItems.map(feedItem => 
        feedItem.id === item.id 
          ? { ...feedItem, [reactionType]: newCount }
          : feedItem
      ));
    } catch (error) {
      console.error('Error al actualizar reacción en feed:', error);
    }
  };

  // Obtener amigos
  useEffect(() => {
    if (!character?.id) return;

    const friendsRef = ref(db, `characters/${character.id}/friends`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setFriends(Object.keys(data).filter((id) => data[id] === true));
    });

    return () => unsubscribe();
  }, [character?.id]);

  // Cargar el feed: posts propios + amigos + tramas nuevas
  useEffect(() => {
    if (!character?.id) return;

    const loadFeed = async () => {
      setLoading(true);
      try {
        const items: FeedItem[] = [];

        // 1. Tus propios posts
        const ownPostsRef = ref(db, `characters/${character.id}/posts`);
        const ownPostsSnap = await get(ownPostsRef);
        if (ownPostsSnap.exists()) {
          const postsData = ownPostsSnap.val();
          Object.entries(postsData).forEach(([postId, post]) => {
            const postData = post as Post;
            items.push({
              ...postData,
              id: `own-post-${postId}`,
              type: 'post' as const,
              characterName: character.name,
              characterUsername: character.username,
              characterAvatar: character.avatarUrl,
              characterId: character.id,
            } as FeedPost);
          });
        }

        // 2. Posts de amigos
        for (const friendId of friends) {
          const friend = Object.values(allCharacters).find((c: Character) => c.id === friendId);
          if (!friend) continue;

          const friendPostsRef = ref(db, `characters/${friendId}/posts`);
          const friendPostsSnap = await get(friendPostsRef);
          if (friendPostsSnap.exists()) {
            const postsData = friendPostsSnap.val();
            Object.entries(postsData).forEach(([postId, post]) => {
              const postData = post as Post;
              if (postData.visibility === 'public' || (postData.visibility === 'friends' && friends.includes(friendId))) {
                items.push({
                  ...postData,
                  id: `friend-post-${friendId}-${postId}`,
                  type: 'post' as const,
                  characterName: friend.name,
                  characterUsername: friend.username,
                  characterAvatar: friend.avatarUrl,
                  characterId: friendId,
                } as FeedPost);
              }
            });
          }
        }

        // 3. Tramas nuevas (respuestas recientes)
        const tramasRef = ref(db, 'tramas');
        const tramasSnap = await get(tramasRef);
        if (tramasSnap.exists()) {
          const tramasData = tramasSnap.val();
          Object.entries(tramasData).forEach(([tramaId, trama]) => {
            const tramaData = trama as TramaFromDB;
            const authorId = tramaData.authorId;
            const isOwnTrama = authorId === character.id;
            const isFriendTrama = friends.includes(authorId);
            const isParticipant = tramaData.responses && Object.values(tramaData.responses).some((response) => response.author?.id === character.id);

            if (
              (tramaData.visibility === 'public') ||
              (tramaData.visibility === 'friends' && (isOwnTrama || isFriendTrama)) ||
              (tramaData.visibility === 'private' && isOwnTrama) ||
              isParticipant
            ) {
              // Obtener la respuesta más reciente
              const responses = Object.entries(tramaData.responses || {})
                .map(([responseId, response]) => ({
                  ...response,
                  id: responseId
                }))
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

              const latestResponse = responses[0];

              if (latestResponse && latestResponse.createdAt) {
                // Buscar información del autor de la respuesta
                const responseAuthor = Object.values(allCharacters).find((c: Character) => c.id === latestResponse.author?.id);
                
                if (responseAuthor) {
                  items.push({
                    id: `trama-${tramaId}-response-${latestResponse.id}`,
                    type: 'trama' as const,
                    name: tramaData.name,
                    content: `📖 Nueva respuesta en "${tramaData.name}"\n\n${latestResponse.content.substring(0, 150)}...`,
                    time: latestResponse.createdAt,
                    visibility: tramaData.visibility,
                    characterName: responseAuthor.name,
                    characterUsername: responseAuthor.username,
                    characterAvatar: responseAuthor.avatarUrl,
                    characterId: responseAuthor.id,
                    tramaId,
                    tramaName: tramaData.name,
                    tramaDescription: tramaData.description,
                  } as FeedTrama);
                }
              }
            }
          });
        }

        // Ordenar por fecha (más reciente primero)
        items.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setFeedItems(items);
      } catch (error) {
        console.error('Error al cargar el feed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [character, friends, allCharacters]);

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const postDate = new Date(dateString);
    const diffInMs = now.getTime() - postDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays}d`;
    if (diffInHours > 0) return `${diffInHours}h`;
    return 'ahora';
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p>Cargando feed...</p>
        </CardContent>
      </Card>
    );
  }

  if (feedItems.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-10">
          <p className="text-muted-foreground">No hay publicaciones para mostrar en tu feed.</p>
          <p className="text-sm text-muted-foreground mt-2">Agrega amigos para ver sus publicaciones aquí.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {feedItems.map((item) => (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src={item.characterAvatar} />
                <AvatarFallback>{item.characterName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <Link 
                    href={`/characters/${item.characterId}`}
                    className="font-bold hover:text-primary transition-colors"
                  >
                    {item.characterName}
                  </Link>
                  <p className="text-sm text-muted-foreground">@{item.characterUsername}</p>
                  <p className="text-sm text-muted-foreground">&middot;</p>
                  <p className="text-sm text-muted-foreground">{getTimeAgo(String(item.time))}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {item.visibility === 'public' ? <Eye className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                    <span>{item.visibility === 'public' ? 'Público' : 'Amigos'}</span>
                  </div>
                </div>
                <div className="mt-2">
                  {item.type === 'trama' ? (
                    <div className="space-y-3">
                      <p className="whitespace-pre-wrap">{item.content}</p>
                      <Link href={`/dashboard/characters/${item.characterId}/tramas/${item.tramaId}`}>
                        <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border">
                          <h3 className="font-bold text-sm">{item.tramaName}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {item.tramaDescription}
                          </p>
                        </Card>
                      </Link>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: item.content }} />
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          {isPost(item) && (
            <div className="px-6 pb-6 flex justify-around text-muted-foreground border-t pt-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 hover:text-blue-500"
                onClick={() => handleFeedReaction(item, 'likes')}
              >
                <ThumbsUp className="h-4 w-4" /> {item.likes || 0}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 hover:text-red-500"
                onClick={() => handleFeedReaction(item, 'hearts')}
              >
                <Heart className="h-4 w-4" /> {item.hearts || 0}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 hover:text-orange-500"
                onClick={() => handleFeedReaction(item, 'heartbreaks')}
              >
                <Frown className="h-4 w-4" /> {item.heartbreaks || 0}
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2 hover:text-yellow-500"
                onClick={() => handleFeedReaction(item, 'laughs')}
              >
                <Laugh className="h-4 w-4" /> {item.laughs || 0}
              </Button>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// Componente para el contenido del sidebar
function SidebarContent({ character }: { character: Character }) {
  return (
    <div className="space-y-6">
      {/* About Me */}
      <Card>
        <CardHeader>
          <CardTitle>About me</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
            {character?.biography || character?.profile || 'No hay perfil definido.'}
          </p>              
        </CardContent>
      </Card>
      
      {/* Etiquetas */}
      <Card>
        <CardHeader>
          <CardTitle>Etiquetas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4"> 
          <div className="flex flex-wrap gap-2">
            {character?.tags && character.tags.length > 0 ? (
              character.tags.map((tag: string, i: number) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No hay etiquetas definidas.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enlaces sociales */}
      <Card>
        <CardHeader>
          <CardTitle>Enlaces</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {character?.socialLinks && character.socialLinks.length > 0 ? (
            character.socialLinks.map((link: { name: string; url: string }, i: number) => (
              <div key={i}>
                <a 
                  href={link.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline block text-sm"
                >
                  {link.name}
                </a>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No hay enlaces definidos.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}