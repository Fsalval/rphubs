// src/app/dashboard/characters/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, ThumbsUp, Frown, Laugh } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
        visibility: 'public',
        likes: 0,
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
              <TabsTrigger value="public-wall">Muro Público</TabsTrigger>
              <TabsTrigger value="private-wall">Muro Privado</TabsTrigger>
              <TabsTrigger value="feed">Feed de Amigos</TabsTrigger>
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
                <div className="px-6 pb-6">
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
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-primary">
                        <ThumbsUp className="h-4 w-4" /> {post.likes || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-primary">
                        <Frown className="h-4 w-4" /> {post.heartbreaks || 0}
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-primary">
                        <Laugh className="h-4 w-4" /> {post.laughs || 0}
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </TabsContent>

            {/* Muro Privado */}
            <TabsContent value="private-wall">
              <Card>
                <CardHeader>
                  <CardTitle>Taller de Escritura</CardTitle>
                  <p className="text-muted-foreground pt-1">
                    Aquí puedes guardar borradores, escenas que no deseas compartir, reflexiones del personaje o ideas en desarrollo. Solo tú puedes ver esto.
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Funcionalidad de borradores en desarrollo.</p>
                </CardContent>
              </Card>
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