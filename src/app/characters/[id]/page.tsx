'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, Heart, Frown, Laugh, Calendar } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { usePublicCharacter } from './layout';
import { Character } from '@/lib/types';

export default function PublicCharacterPage() {
  const { character, isFriend } = usePublicCharacter();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    if (!character?.id) return;

    const postsRef = ref(db, `characters/${character.id}/posts`);
    const unsubscribe = onValue(postsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const postsArray = Object.entries(data)
          .map(([key, value]: any) => ({ ...value, id: key }))
          .filter((post: any) => {
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
                character.socialLinks.map((link: SocialLink, i: number) => (
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

        {/* Área principal - Posts */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Posts de {character.name}</CardTitle>
            </CardHeader>
            <CardContent>
              {!isFriend && (
                <p className="text-center text-muted-foreground py-4 mb-4 border-b">
                  Solo puedes ver los posts públicos. Hazte amigo para ver todo el contenido.
                </p>
              )}
              
              {posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  {isFriend ? 'Este personaje no ha publicado nada aún.' : 'No hay posts públicos disponibles.'}
                </p>
              ) : (
                <div className="space-y-6">
                  {posts.map((post: any) => (
                    <Card key={post.id}>
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <Avatar>
                            <AvatarImage src={post.avatarUrl} />
                            <AvatarFallback>{post.charName?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{post.charName}</h4>
                              <span className="text-muted-foreground">@{post.charHandle}</span>
                              <span className="text-muted-foreground">•</span>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span className="text-sm">
                                  {new Date(post.time).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <p className="mt-2 whitespace-pre-line" dangerouslySetInnerHTML={{ __html: post.content }} />
                          </div>
                        </div>
                      </CardHeader>
                      
                      {/* Reacciones - Solo visualización para visitantes */}
                      <div className="px-6 pb-6 flex justify-around text-muted-foreground border-t pt-2 mt-4">
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4" /> 
                          <span>{post.likes || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4" /> 
                          <span>{post.hearts || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Frown className="h-4 w-4" /> 
                          <span>{post.heartbreaks || 0}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Laugh className="h-4 w-4" /> 
                          <span>{post.laughs || 0}</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
