// src/app/dashboard/characters/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, ThumbsUp, Frown, Laugh, Heart, Eye, Users } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCharacter } from './layout';
import { sanitize } from '@/lib/sanitize';
import { ref, push, set , onValue } from 'firebase/database';
import { db } from '@/lib/firebase';

export default function CharacterProfilePage() {
  const { character, isOwner } = useCharacter();
  const [posts, setPosts] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends'>('public');

  useEffect(() => {
    if (!character?.id) return;

    const postsRef = ref(db, `characters/${character.id}/posts`);
    
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convertir objeto en array y agregar el ID
        const postsArray = Object.entries(data)
          .map(([key, value]: [string, any]) => ({
            ...value,
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

  // Editar post
  const handleEditPost = () => {
    setPosts(posts.map(p => p.id === editingPost ? { ...p, content: sanitize(editContent) } : p));
    setEditingPost(null);
  };

  // Eliminar post
  const handleDeletePost = (id: string) => {
    setPosts(posts.filter(p => p.id !== id));
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

          {/* Enlaces sociales */}
          <Card>
            <CardHeader>
              <CardTitle>Enlaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {character.socialLinks?.length > 0 ? (
                character.socialLinks.map((link: any, i: number) => (
                  <div key={i}>
                    <p className="text-sm text-muted-foreground">{link.name}</p>
                    <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline block text-sm">
                      {link.username || link.url}
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
          <Tabs defaultValue="public-wall" className="w-full">
            <TabsList className="flex justify-center gap-8 border-b border-border pb-2 w-full">
              <TabsTrigger value="feed">Feed</TabsTrigger>
              <TabsTrigger value="public-wall">Mi Muro</TabsTrigger>
            </TabsList>

            {/* Muro Público */}
            <TabsContent value="public-wall" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex gap-4 items-start">
                    <Avatar>
                      <AvatarImage src={character.avatarUrl} />
                      <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="¿Qué está pensando tu personaje?"
                      className="flex-1 bg-background border-border focus-visible:ring-1"
                      rows={3}
                    />
                  </div>
                </CardHeader>
                <div className="px-6 pb-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Select value={postVisibility} onValueChange={(value: 'public' | 'friends') => setPostVisibility(value)}>
                      <SelectTrigger className="w-32">
                        <div className="flex items-center gap-2">
                          {postVisibility === 'public' ? <Eye className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                          <span className="text-xs">{postVisibility === 'public' ? 'Público' : 'Amigos'}</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span>Público</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="friends">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            <span>Amigos</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handlePost}>Publicar</Button>
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
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem onClick={() => { setEditingPost(post.id); setEditContent(post.content); }}>
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleChangePostVisibility(post.id, post.visibility === 'public' ? 'friends' : 'public')}>
                                {post.visibility === 'public' ? 'Hacer privado para amigos' : 'Hacer público'}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onSelect={(e) => e.preventDefault()}
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
              <Card>
                <CardHeader>
                  <CardTitle>Feed de Amigos</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Aquí verás las publicaciones de tus amigos.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}