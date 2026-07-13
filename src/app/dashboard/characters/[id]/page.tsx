// src/app/dashboard/characters/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Textarea } from '../../../../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../components/ui/avatar';
import { Badge } from '../../../../components/ui/badge';
import { MoreHorizontal, ThumbsUp, Frown, Laugh, Heart, Eye, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '../../../../components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { useCharacter } from '../../../../context/CharacterContext';
import { sanitize } from '../../../../lib/sanitize';
import { ref, push, set, onValue, remove, get } from 'firebase/database';
import { db } from '../../../../lib/firebase';

export default function CharacterProfilePage() {
  const { character, isOwner } = useCharacter();
  const [posts, setPosts] = useState<any[]>([]);
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends'>('friends');
  const [friends, setFriends] = useState<string[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);

  // Cargar posts propios
  useEffect(() => {
    if (!character?.id) return;

    const postsRef = ref(db, `characters/${character.id}/posts`);
    
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data)
          .map(([key, value]: [string, any]) => ({
            ...value,
            id: key
          }))
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
    }, (error) => {
      console.error("Error al leer posts:", error);
    });

    return () => unsubscribe();
  }, [character?.id]);

  // ✅ NUEVO: Cargar lista de amigos
  useEffect(() => {
    if (!character?.id) return;

    const friendsRef = ref(db, `characters/${character.id}/friends`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFriends(Object.keys(data));
      } else {
        setFriends([]);
      }
    });

    return () => unsubscribe();
  }, [character?.id]);

  // ✅ NUEVO: Cargar feed de amigos cuando cambien los amigos
  useEffect(() => {
    if (!character?.id || friends.length === 0) {
      setFeedPosts([]);
      return;
    }

    const loadFeed = async () => {
      setLoadingFeed(true);
      try {
        const allFeedPosts: any[] = [];

        for (const friendId of friends) {
          // Obtener datos del amigo
          const friendSnap = await get(ref(db, `characters/${friendId}`));
          if (!friendSnap.exists()) continue;
          
          const friendData = friendSnap.val();

          // Obtener posts del amigo
          const friendPostsRef = ref(db, `characters/${friendId}/posts`);
          const friendPostsSnap = await get(friendPostsRef);
          
          if (friendPostsSnap.exists()) {
            const friendPostsData = friendPostsSnap.val();
            Object.entries(friendPostsData).forEach(([postId, postData]: [string, any]) => {
              // Solo mostrar posts públicos o de amigos
              if (postData.visibility === 'public' || postData.visibility === 'friends') {
                allFeedPosts.push({
                  ...postData,
                  id: postId,
                  charName: friendData.name,
                  charHandle: friendData.username,
                  avatarUrl: friendData.avatarUrl,
                  friendId: friendId
                });
              }
            });
          }
        }

        // Ordenar por fecha (más recientes primero)
        allFeedPosts.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setFeedPosts(allFeedPosts);
      } catch (error) {
        console.error('Error cargando feed:', error);
      } finally {
        setLoadingFeed(false);
      }
    };

    loadFeed();
  }, [character?.id, friends]);

  // Publicar post
  const handlePost = async () => {
    if (!content.trim() || !character) return;
    const cleanContent = sanitize(content);
    
    try {
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

  const handleChangePostVisibility = async (postId: string, newVisibility: 'public' | 'friends') => {
    try {
      const postRef = ref(db, `characters/${character.id}/posts/${postId}/visibility`);
      await set(postRef, newVisibility);
      
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, visibility: newVisibility }
          : p
      ));
    } catch (error) {
      console.error('Error al cambiar visibilidad:', error);
    }
  };

  const handleReaction = async (postId: string, reactionType: 'likes' | 'hearts' | 'heartbreaks' | 'laughs') => {
    try {
      const postRef = ref(db, `characters/${character.id}/posts/${postId}/${reactionType}`);
      const currentPost = posts.find(p => p.id === postId);
      if (!currentPost) return;

      const newCount = (currentPost[reactionType] || 0) + 1;
      await set(postRef, newCount);

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
        {/* Barra lateral */}
        <div className="md:col-span-4 lg:col-span-3 space-y-6">
          {/* About Me */}
          <Card>
            <CardHeader>
              <CardTitle>About me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                {character.biography || character.profile || 'No hay perfil definido.'}
              </p>
              
              {/* Etiquetas */}
              {character.tags?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Etiquetas</p>
                  <div className="flex flex-wrap gap-2">
                    {character.tags.map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Enlaces */}
          <Card>
            <CardHeader>
              <CardTitle>Enlaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {character.enlaces?.length > 0 ? (
                character.enlaces.map((enlace: string, i: number) => (
                  <div key={i} className="p-2 border rounded">
                    <a 
                      href={enlace} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline block text-sm"
                    >
                      {enlace}
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
          <Tabs defaultValue="public-wall">
            <TabsList className="flex justify-center gap-8 border-b border-border pb-2 w-full">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="public-wall">Mi Muro</TabsTrigger>
            </TabsList>

            {/* ✅ NUEVO: Feed de Amigos */}
            <TabsContent value="feed">
              {loadingFeed ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">Cargando feed...</p>
                  </CardContent>
                </Card>
              ) : friends.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-2">No tienes amigos aún</p>
                    <p className="text-sm text-muted-foreground">
                      Agrega amigos para ver sus publicaciones en tu feed.
                    </p>
                  </CardContent>
                </Card>
              ) : feedPosts.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">No hay publicaciones de tus amigos.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {feedPosts.map((post) => (
                    <Card key={`${post.friendId}-${post.id}`}>
                      <CardHeader>
                        <div className="flex gap-4">
                          <Link href={`/characters/${post.friendId}`}>
                            <Avatar className="cursor-pointer hover:opacity-80 transition">
                              <AvatarImage src={post.avatarUrl} />
                              <AvatarFallback>{post.charName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <div className="flex-1">
                            <div className="flex items-baseline gap-2">
                              <Link href={`/characters/${post.friendId}`} className="font-bold hover:underline">
                                {post.charName}
                              </Link>
                              <p className="text-sm text-muted-foreground">@{post.charHandle}</p>
                              <p className="text-sm text-muted-foreground">&middot;</p>
                              <p className="text-sm text-muted-foreground">{new Date(post.time).toLocaleString()}</p>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {post.visibility === 'public' ? <Eye className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                                <span>{post.visibility === 'public' ? 'Público' : 'Amigos'}</span>
                              </div>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: post.content }} />
                          </div>
                        </div>
                      </CardHeader>
                      <div className="px-6 pb-6 flex justify-around text-muted-foreground border-t pt-2 mt-4">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4" /> {post.likes || 0}
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" /> {post.hearts || 0}
                        </div>
                        <div className="flex items-center gap-2">
                          <Frown className="h-4 w-4" /> {post.heartbreaks || 0}
                        </div>
                        <div className="flex items-center gap-2">
                          <Laugh className="h-4 w-4" /> {post.laughs || 0}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

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
                            <p className="font-bold">{post.charName}</p>
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
          </Tabs>
        </div>
      </div>
    </div>
  );
}