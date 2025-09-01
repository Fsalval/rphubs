// src/app/dashboard/characters/[id]/tramas/[tramaId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import Textarea from '@/components/ui/textarea';
import { Plus, ArrowLeft, BookOpen, Edit3, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useCharacter } from '../../layout';
import { ref, onValue, push, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Character, Story } from '@/lib/types';
import { sanitize } from '@/lib/sanitize';
import Link from 'next/link';

export default function TramaDetailPage() {
  const { id, tramaId } = useParams();
  const { character, isOwner } = useCharacter();
  
  const [trama, setTrama] = useState<Story | null>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterContent, setNewChapterContent] = useState('');
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>({});
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  // Cargar trama
  useEffect(() => {
    if (!id || !tramaId) return;
    const tramaRef = ref(db, `characters/${id}/tramas/${tramaId}`);
    const unsubscribe = onValue(tramaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTrama({ id: tramaId, ...data });
      }
    });
    return () => unsubscribe();
  }, [id, tramaId]);

  // Cargar capítulos
  useEffect(() => {
    if (!id || !tramaId) return;
    const chaptersRef = ref(db, `characters/${id}/tramas/${tramaId}/chapters`);
    const unsubscribe = onValue(chaptersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const chaptersArray = Object.entries(data)
          .map(([key, value]: any) => ({ ...value, id: key }))
          .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
        setChapters(chaptersArray);
      } else {
        setChapters([]);
      }
    });
    return () => unsubscribe();
  }, [id, tramaId]);

  // Scroll automático
  useEffect(() => {
    if (scrollTarget) {
      const element = document.getElementById(`chapter-${scrollTarget}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
        setTimeout(() => {
          element.style.boxShadow = '';
        }, 2000);
      }
      setScrollTarget(null);
    }
  }, [scrollTarget, chapters]);

  // Agregar capítulo
  const handleAddChapter = async () => {
    if (!newChapterTitle.trim() || !newChapterContent.trim()) return;

    const newChapter = {
      title: sanitize(newChapterTitle),
      content: sanitize(newChapterContent),
      author: {
        name: character.name,
        username: character.username,
        avatarUrl: character.avatarUrl
      },
      time: new Date().toISOString(),
      chapterNumber: chapters.length + 1
    };

    try {
      const chaptersRef = ref(db, `characters/${id}/tramas/${tramaId}/chapters`);
      await push(chaptersRef, newChapter);
      
      setNewChapterTitle('');
      setNewChapterContent('');
      setShowNewChapter(false);
    } catch (error) {
      console.error('Error al agregar capítulo:', error);
    }
  };

  // Editar capítulo
  const handleEditChapter = async (chapterId: string) => {
    if (!editingData.title?.trim() || !editingData.content?.trim()) return;
    
    try {
      const chapterRef = ref(db, `characters/${id}/tramas/${tramaId}/chapters/${chapterId}`);
      await update(chapterRef, {
        title: sanitize(editingData.title),
        content: sanitize(editingData.content)
      });
      setEditingChapter(null);
      setEditingData({});
    } catch (error) {
      console.error('Error al editar capítulo:', error);
    }
  };

  if (!trama) {
    return <div>Cargando trama...</div>;
  }

  return (
    <div className="flex gap-6 h-screen overflow-hidden">
      {/* Menú lateral - Capítulos */}
      <div className="w-80 flex-shrink-0">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <Link href={`/dashboard/characters/${id}/tramas`}>
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver a Tramas
                </Button>
              </Link>
            </div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Capítulos
            </CardTitle>
            <p className="text-sm text-muted-foreground">{trama.name}</p>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {/* Capítulo original (la trama inicial) */}
                <div
                  className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors bg-primary/5"
                  onClick={() => setScrollTarget('original')}
                >
                  <h4 className="font-medium text-sm leading-tight mb-1">
                    Capítulo Original
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {new Date(trama.time).toLocaleDateString()}
                  </p>
                </div>

                {/* Capítulos adicionales */}
                {chapters.map((chapter, index) => (
                  <div
                    key={chapter.id}
                    className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => setScrollTarget(chapter.id)}
                  >
                    <h4 className="font-medium text-sm leading-tight mb-1">
                      Cap. {chapter.chapterNumber}: {chapter.title}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Por: {chapter.author.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(chapter.time).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                {/* Botón agregar capítulo */}
                {isOwner && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewChapter(true)}
                    className="w-full mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Capítulo
                  </Button>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-4">
        {/* Formulario nuevo capítulo */}
        {showNewChapter && isOwner && (
          <Card>
            <CardHeader>
              <CardTitle>Nuevo Capítulo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título del capítulo</label>
                <Input
                  value={newChapterTitle}
                  onChange={(e) => setNewChapterTitle(sanitize(e.target.value))}
                  placeholder="Ej: El despertar"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Contenido</label>
                <Textarea
                  value={newChapterContent}
                  onChange={(e) => setNewChapterContent(sanitize(e.target.value))}
                  placeholder="Escribe el contenido del capítulo..."
                  className="min-h-[200px] mt-1 w-full resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddChapter}>Publicar Capítulo</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNewChapter(false);
                    setNewChapterTitle('');
                    setNewChapterContent('');
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Capítulo original */}
        <Card>
          <CardContent className="pt-6">
            <div id="chapter-original">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{trama.name}</h1>
                <p className="text-sm text-muted-foreground">
                  Capítulo Original • Por: {trama.author.name} • {new Date(trama.time).toLocaleString()}
                </p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                {trama.content}
              </p>
            </div>
            </div>
          </CardContent>
        </Card>

        {/* Capítulos */}
        {chapters.map((chapter) => (
          <Card key={chapter.id}>
            <CardContent className="pt-6">
              <div id={`chapter-${chapter.id}`}>
              {editingChapter === chapter.id ? (
                // Modo edición
                <div className="space-y-4">
                  <Input
                    value={editingData.title || chapter.title}
                    onChange={(e) => setEditingData((prev: any) => ({ ...prev, title: e.target.value }))}
                    className="text-xl font-bold"
                  />
                  <Textarea
                    value={editingData.content || chapter.content}
                    onChange={(e) => setEditingData((prev: any) => ({ ...prev, content: e.target.value }))}
                    className="min-h-[200px] w-full resize-none"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => handleEditChapter(chapter.id)}>Guardar</Button>
                    <Button variant="outline" onClick={() => {
                      setEditingChapter(null);
                      setEditingData({});
                    }}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                // Modo vista
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        Capítulo {chapter.chapterNumber}: {chapter.title}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Por: {chapter.author.name} • {new Date(chapter.time).toLocaleString()}
                      </p>
                    </div>
                    
                    {isOwner && chapter.author.username === character.username && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingChapter(chapter.id);
                            setEditingData({
                              title: chapter.title,
                              content: chapter.content
                            });
                          }}>
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar Capítulo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                      {chapter.content}
                    </p>
                  </div>
                </>
              )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
