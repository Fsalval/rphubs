'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, Heart, Frown, Laugh, Calendar } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { usePublicCharacter } from './layout';
import { Post } from '@/lib/types';

export default function PublicCharacterPage() {
  const { character, isFriend } = usePublicCharacter();
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    if (!character?.id) return;

    const postsRef = ref(db, `characters/${character.id}/posts`);
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data)
          .map(([key, value]: [string, unknown]) => ({ ...(value as Post), id: key }))
          .filter((post: Post) => {
            // Mostrar posts públicos siempre, posts de amigos solo si son amigos
            return post.visibility === 'public' || (isFriend && post.visibility === 'friends');
          })
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        
        setPosts(postsArray);
      } else {
        setPosts([]);
      }
    });

    return () => unsubscribe();
  }, [character?.id, isFriend]);

  if (!character) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="space-y-6 lg:space-y-8">
          {/* Encabezado del perfil - Responsivo */}
          <Card className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 lg:gap-6">
                <Avatar className="w-20 h-20 lg:w-24 lg:h-24 border-4 border-background shadow-lg">
                  <AvatarImage src={character.avatarUrl} />
                  <AvatarFallback className="text-xl lg:text-2xl">
                    {character.name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-bold break-words">
                    {character.name}
                  </h1>
                  <p className="text-muted-foreground text-lg lg:text-xl">
                    @{character.username}
                  </p>
                  {(character.age || character.species || character.nationality) && (
                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                      {character.age && (
                        <Badge variant="secondary">{character.age} años</Badge>
                      )}
                      {character.species && (
                        <Badge variant="secondary">{character.species}</Badge>
                      )}
                      {character.nationality && (
                        <Badge variant="secondary">{character.nationality}</Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-6 lg:gap-8 lg:grid-cols-12">
            {/* Barra lateral */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-6">
              {/* About Me */}
              <Card>
                <CardHeader>
                  <CardTitle>About me</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground whitespace-pre-line break-words">
                    {character.biography || character.profile || 'No hay perfil definido.'}
                  </div>
                  
                  {/* Etiquetas */}
                  {Array.isArray(character.tags) && character.tags.length > 0 && (
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
                  {Array.isArray(character.socialLinks) && character.socialLinks.length > 0 ? (
                    character.socialLinks.map((link, i) => (
                      <div key={i} className="break-all">
                        <p className="text-sm text-muted-foreground">{link.name}</p>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline block text-sm break-all"
                        >
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

            {/* Área principal - Posts */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="break-words">Posts de {character.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {!isFriend && (
                    <div className="text-center text-muted-foreground py-4 mb-4 border-b border-dashed">
                      <p className="text-sm">
                        Solo puedes ver los posts públicos. Hazte amigo para ver todo el contenido.
                      </p>
                    </div>
                  )}
                  
                  {posts.length === 0 ? (
                    <div className="text-center text-muted-foreground py-12">
                      <p className="text-base">
                        {isFriend ? 'Este personaje no ha publicado nada aún.' : 'No hay posts públicos disponibles.'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {posts.map((post: Post) => (
                        <Card key={post.id} className="border border-border/50">
                          <CardContent className="p-4 lg:p-6">
                            <div className="flex items-start gap-3">
                              <Avatar className="w-10 h-10 lg:w-12 lg:h-12 shrink-0">
                                <AvatarImage src={post.avatarUrl} />
                                <AvatarFallback>{post.charName?.charAt(0) || '?'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-3">
                                  <h4 className="font-semibold break-words">{post.charName}</h4>
                                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                    <span className="break-all">@{post.charHandle}</span>
                                    <span className="hidden sm:inline">•</span>
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3 shrink-0" />
                                      <span className="whitespace-nowrap">
                                        {new Date(post.time).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div 
                                  className="text-sm lg:text-base whitespace-pre-line break-words" 
                                  dangerouslySetInnerHTML={{ __html: post.content }} 
                                />
                              </div>
                            </div>
                            
                            {/* Reacciones - Solo visualización para visitantes */}
                            <div className="flex justify-around text-muted-foreground border-t pt-3 mt-4 text-sm">
                              <div className="flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4 shrink-0" /> 
                                <span>{post.likes || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 shrink-0" /> 
                                <span>{post.hearts || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Frown className="h-4 w-4 shrink-0" /> 
                                <span>{post.heartbreaks || 0}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Laugh className="h-4 w-4 shrink-0" /> 
                                <span>{post.laughs || 0}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
