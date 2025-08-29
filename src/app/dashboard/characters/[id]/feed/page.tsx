'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from '@/components/ui/dropdown-menu';
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

  // Obtener amigos
  useEffect(() => {
    if (!character?.id) return;

    const friendsRef = ref(db, `characters/${character.id}/friends`);
    const unsubscribe = onValue(friendsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setFriends(Object.keys(data).filter(id => data[id] === true));
      } else {
        setFriends([]);
      }
    });

    return () => unsubscribe();
  }, [character]);

  // Cargar posts al montar y cuando cambien amigos o character
  useEffect(() => {
    if (character?.id) {
      loadFeedPosts();
    }
  }, [character, friends, allCharacters]);

  // Aplicar filtros cuando cambien posts o filtros
  useEffect(() => {
    applyFilters();
  }, [posts, filters]);

  const loadFeedPosts = async () => {
    setLoading(true);
    try {
      const allPosts: Post[] = [];
    } catch (error) {
      console.error('Error loading feed posts:', error);
    }

      // Posts propios
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

      // Posts y tramas de amigos
      for (const friendId of friends) {
        const friendCharacter = allCharacters.find(c => c.id === friendId);
        if (!friendCharacter) continue;

        // Posts del amigo
        const postsRef = ref(db, `characters/${friendId}/posts`);
        const postsSnapshot = await get(postsRef);
        if (postsSnapshot.exists()) {
          const postsData = postsSnapshot.val();
          Object.entries(postsData).forEach(([postId, post]: [string, any]) => {
            if (post.visibility === 'public' || post.visibility === 'friends') {
              allPosts.push({
                id: postId,
                ...post,
                characterName: friendCharacter.name,
                characterUsername: friendCharacter.username,
                characterAvatar: friendCharacter.avatarUrl,
                characterId: friendId,
                type: post.type || 'post'
              });
            }
          });
        }

        // Tramas del amigo
        const tramasRef = ref(db, `characters/${friendId}/tramas`);
        const tramasSnapshot = await get(tramasRef);
        if (tramasSnapshot.exists()) {
          const tramasData = tramasSnapshot.val();
          Object.entries(tramasData).forEach(([tramaId, trama]: [string, any]) => {
            if (trama.visibility === 'public' || 
                (trama.visibility === 'friends' && friends.includes(friendId))) {
              allPosts.push({
                id: `trama-${tramaId}`,
                content: `Nueva trama: "${trama.name}"\n${trama.content || ''}`,
                time: trama.time || new Date().toISOString(),
                visibility: trama.visibility,
                characterName: friendCharacter.name,
                characterUsername: friendCharacter.username,
                characterAvatar: friendCharacter.avatarUrl,
                characterId: friendId,
                type: 'trama',
                tags: trama.tags || []
              });
            }
          });
        }
      }

      // Ordenar por fecha
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

    if (filters.searchTerm) {
      filtered = filtered.filter(post =>
        post.content.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        post.characterName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        post.tags?.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase()))
      );
    }

    if (filters.postType !== 'all') {
      filtered = filtered.filter(post => post.type === filters.postType);
    }

    if (filters.timeFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      switch (filters.timeFilter) {
        case 'today': filterDate.setHours(0, 0, 0, 0); break;
        case 'week': filterDate.setDate(now.getDate() - 7); break;
        case 'month': filterDate.setMonth(now.getMonth() - 1); break;
      }
      filtered = filtered.filter(post => new Date(post.time) >= filterDate);
    }

    setFilteredPosts(filtered);
  };

  const handleSubmitPost = async () => {
    if (!character?.id || !newPost.trim()) return;

    setIsSubmitting(true);
    try {
      const postsRef = ref(db, `characters/${character.id}/posts`);
      const newPostRef = push(postsRef);

      await set(newPostRef, {
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
      });

      setNewPost('');
      loadFeedPosts(); // Recargar
    } catch (error) {
      console.error('Error al enviar post:', error);
      alert('Error al enviar post');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - new Date(timestamp).getTime()) / 1000);
    if (diffInSeconds < 60) return 'hace unos segundos';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleChangePostVisibility = async (postId: string, newVisibility: 'public' | 'friends' | 'private') => {
    try {
      const postRef = ref(db, `characters/${character.id}/posts/${postId}`);
      const post = posts.find(p => p.id === postId);
      if (post) {
        await set(postRef, { ...post, visibility: newVisibility });
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, visibility: newVisibility } : p));
      }
      setEditingPostId(null);
    } catch (error) {
      console.error('Error cambiando visibilidad:', error);
      alert('Error al cambiar visibilidad');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Cargando feed...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Feed de Amigos</h2>
          <Badge variant="secondary">{filteredPosts.length} publicaciones</Badge>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar en el feed..."
              value={filters.searchTerm}
              onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
              className="pl-10"
            />
          </div>
          {/* Filtros de tipo y tiempo */}
        </div>
      </div>

      {/* Formulario de post */}
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
                  {postVisibility === 'public' ? <><Globe className="h-4 w-4 mr-2" />Público</> : <><Users className="h-4 w-4 mr-2" />Amigos</>}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setPostVisibility('public')}>
                  <Globe className="h-4 w-4 mr-2" />Público
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setPostVisibility('friends')}>
                  <Users className="h-4 w-4 mr-2" />Amigos
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleSubmitPost} disabled={!newPost.trim() || isSubmitting}>
              {isSubmitting ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Lista de posts */}
      {filteredPosts.length === 0 ? (
        <Card className="text-center py-8">No hay publicaciones</Card>
      ) : (
        filteredPosts.map((post) => (
          <Card key={post.id} className="hover:shadow-md transition-shadow">
            {/* Render de post */}
          </Card>
        ))
      )}
    </div>
  );
}