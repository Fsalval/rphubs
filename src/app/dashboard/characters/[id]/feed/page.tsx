'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Globe, Heart, MessageCircle, Share2, MoreHorizontal, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
import { useCharacter } from '../layout';
import { sanitize } from '@/lib/sanitize';
import { ref, get, push, set, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Character } from '@/lib/types';

// Tipos
interface Post {
  id: string;
  content: string;
  time: string;
  visibility: 'public' | 'friends' | 'private';
  characterName: string;
  characterUsername: string;
  characterAvatar?: string;
  characterId: string;
  type: 'post' | 'trama';
  likes?: number;
  comments?: number;
  shares?: number;
  // Solo para tramas
  tramaId?: string;
  tramaName?: string;
  tramaDescription?: string;
  tramaCoverImage?: string;
}

export default function FeedPage() {
  const { character, allCharacters } = useCharacter();
  const [friends, setFriends] = useState<string[]>([]);
  const [feed, setFeed] = useState<Post[]>([]);
  const [filteredFeed, setFilteredFeed] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPost, setNewPost] = useState('');
  const [postVisibility, setPostVisibility] = useState<'public' | 'friends'>('friends');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Cargar el feed: posts propios + amigos + tramas
  useEffect(() => {
    if (!character?.id) return;

    const loadFeed = async () => {
      setLoading(true);
      try {
        const feedItems: Post[] = [];

        // 1. Tus propios posts
        const ownPostsRef = ref(db, `characters/${character.id}/posts`);
        const ownPostsSnap = await get(ownPostsRef);
        if (ownPostsSnap.exists()) {
          const postsData = ownPostsSnap.val();
          Object.entries(postsData).forEach(([postId, post]: [string, any]) => {
            if (post.type !== 'trama') {
              feedItems.push({
                id: postId,
                ...post,
                characterName: character.name,
                characterUsername: character.username,
                characterAvatar: character.avatarUrl,
                characterId: character.id,
                type: 'post',
                likes: post.likes || 0,
                comments: post.comments || 0,
                shares: post.shares || 0,
              });
            }
          });
        }

        // 2. Posts de amigos
        for (const friendId of friends) {
          const friend = allCharacters.find((c: Character) => c.id === friendId);
          if (!friend) continue;

          const friendPostsRef = ref(db, `characters/${friendId}/posts`);
          const friendPostsSnap = await get(friendPostsRef);
          if (friendPostsSnap.exists()) {
            const postsData = friendPostsSnap.val();
            Object.entries(postsData).forEach(([postId, post]: [string, any]) => {
              if (
                post.visibility === 'public' ||
                (post.visibility === 'friends' && friends.includes(friendId))
              ) {
                feedItems.push({
                  id: postId,
                  ...post,
                  characterName: friend.name,
                  characterUsername: friend.username,
                  characterAvatar: friend.avatarUrl,
                  characterId: friendId,
                  type: 'post',
                  likes: post.likes || 0,
                  comments: post.comments || 0,
                  shares: post.shares || 0,
                });
              }
            });
          }
        }

        // 3. Tramas nuevas (último capítulo publicado)
        const tramasRef = ref(db, 'tramas');
        const tramasSnap = await get(tramasRef);
        if (tramasSnap.exists()) {
          const tramasData = tramasSnap.val();
          Object.entries(tramasData).forEach(([tramaId, trama]: [string, any]) => {
            const authorId = trama.author?.id;
            const isOwnTrama = authorId === character.id;
            const isFriendTrama = friends.includes(authorId);

            if (
              (trama.visibility === 'public') ||
              (trama.visibility === 'friends' && (isOwnTrama || isFriendTrama)) ||
              (trama.visibility === 'private' && isOwnTrama)
            ) {
              // Obtener último capítulo
              const chapters = Object.values(trama.chapters || {}).sort(
                (a: any, b: any) => b.order - a.order
              );
              const latestChapter = chapters[0] as any;

              if (latestChapter) {
                feedItems.push({
                  id: `trama-${tramaId}-update`,
                  content: `📖 Nuevo capítulo: "${latestChapter.title}"\n\n${latestChapter.content.substring(0, 150)}...`,
                  time: latestChapter.createdAt || trama.lastUpdated || new Date().toISOString(),
                  visibility: trama.visibility,
                  characterName: trama.author.name,
                  characterUsername: trama.author.username,
                  characterAvatar: trama.author.avatar,
                  characterId: authorId,
                  type: 'trama',
                  tramaId,
                  tramaName: trama.name,
                  tramaDescription: trama.description,
                  tramaCoverImage: trama.coverImage,
                  likes: 0,
                  comments: 0,
                  shares: 0,
                });
              }
            }
          });
        }

        // Ordenar por fecha (más reciente primero)
        feedItems.sort(
          (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
        );
        setFeed(feedItems);
      } catch (error) {
        console.error('Error al cargar el feed:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [character, friends, allCharacters]);

  // Aplicar filtro de búsqueda
  useEffect(() => {
    if (!searchTerm) {
      setFilteredFeed(feed);
      return;
    }

    const filtered = feed.filter(
      (item) =>
        item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tramaName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFeed(filtered);
  }, [searchTerm, feed]);

  // Manejar nuevo post
  const handleSubmitPost = async () => {
    if (!newPost.trim() || !character) return;

    const cleanContent = sanitize(newPost);
    const postsRef = ref(db, `characters/${character.id}/posts`);
    const newPostRef = push(postsRef);

    const post = {
      id: newPostRef.key,
      content: cleanContent,
      time: new Date().toISOString(),
      visibility: postVisibility,
      likes: 0,
      comments: 0,
      shares: 0,
      type: 'post',
    };

    try {
      await set(newPostRef, post);
      setFeed([
        {
          ...post,
          characterName: character.name,
          characterUsername: character.username,
          characterAvatar: character.avatarUrl,
          characterId: character.id,
          type: 'post',
        },
        ...feed,
      ]);
      setNewPost('');
    } catch (error) {
      console.error('Error al publicar:', error);
      alert('No se pudo publicar. Intenta de nuevo.');
    }
  };

  // Formatear tiempo
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
      <div className="flex items-center justify-center h-64">
        <p>Cargando feed...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Búsqueda */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar en el feed..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Publicar nuevo post */}
      <Card>
        <CardHeader className="flex flex-row items-start gap-4 pb-3">
          <Avatar>
            <AvatarImage src={character?.avatarUrl} />
            <AvatarFallback>{character?.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="¿Qué está pensando tu personaje?"
              className="resize-none border-0 p-0"
              rows={3}
            />
            <div className="flex items-center justify-between mt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    {postVisibility === 'public' ? (
                      <>
                        <Globe className="h-4 w-4 mr-2" /> Público
                      </>
                    ) : (
                      <>
                        <Users className="h-4 w-4 mr-2" /> Amigos
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setPostVisibility('public')}>
                    <Globe className="h-4 w-4 mr-2" /> Público
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPostVisibility('friends')}>
                    <Users className="h-4 w-4 mr-2" /> Amigos
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleSubmitPost} disabled={!newPost.trim()}>
                Publicar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de publicaciones */}
      {filteredFeed.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-muted-foreground">No hay publicaciones para mostrar.</p>
        </Card>
      ) : (
        filteredFeed.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader className="flex flex-row gap-3 pb-2">
              <Avatar>
                <AvatarImage src={item.characterAvatar} />
                <AvatarFallback>{item.characterName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{item.characterName}</p>
                  <p className="text-sm text-muted-foreground">@{item.characterUsername}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{getTimeAgo(item.time)}</span>
                  <span>•</span>
                  {item.visibility === 'public' ? (
                    <>
                      <Globe className="h-3 w-3" /> Público
                    </>
                  ) : (
                    <>
                      <Users className="h-3 w-3" /> Amigos
                    </>
                  )}
                </div>
              </div>
              {item.characterId === character.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Editar</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </CardHeader>

            <CardContent className="pt-0 pb-3">
              {item.type === 'trama' ? (
                <div className="space-y-3">
                  <p className="whitespace-pre-wrap">{item.content}</p>
                  <Link href={`/dashboard/characters/${item.characterId}/tramas/${item.tramaId}`}>
                    <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer border">
                      {item.tramaCoverImage && (
                        <img
                          src={item.tramaCoverImage}
                          alt={item.tramaName}
                          className="w-full h-20 object-cover rounded-md mb-2"
                        />
                      )}
                      <h3 className="font-bold text-sm">{item.tramaName}</h3>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.tramaDescription}
                      </p>
                    </Card>
                  </Link>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{item.content}</p>
              )}
            </CardContent>

            <CardFooter className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Heart className="h-4 w-4" /> {item.likes}
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> {item.comments}
              </Button>
              <Button variant="ghost" size="sm" className="flex items-center gap-1">
                <Share2 className="h-4 w-4" /> {item.shares}
              </Button>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
}