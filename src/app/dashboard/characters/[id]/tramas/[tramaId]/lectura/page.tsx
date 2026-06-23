'use client';


import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../../../../components/ui/card';
import { Button } from '../../../../../../../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../../../components/ui/avatar';
import { Badge } from '../../../../../../../components/ui/badge';
import { ScrollArea } from '../../../../../../../components/ui/scroll-area';
import { 
  BookOpen, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Eye, 
  Clock,
  User,
  Calendar,
  FileText
} from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../../../../../../lib/firebase';
import { useCharacter } from '../../../layout';
import Link from 'next/link';
import Image from 'next/image';

interface Chapter {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: string;
  order: number;
  wordCount: number;
}

interface Trama {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar?: string;
  };
  chapters: Chapter[];
  totalWordCount: number;
  lastUpdated: string;
  visibility: 'public' | 'friends' | 'private';
}

export default function TramaLecturaPage() {
  const params = useParams();
  const router = useRouter();
  const { character } = useCharacter();
  const tramaId = Array.isArray(params.tramaId) ? params.tramaId[0] : params.tramaId;
  
  const [trama, setTrama] = useState<Trama | null>(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!tramaId) return;

    const tramaRef = ref(db, `tramas/${tramaId}`);
    const unsubscribe = onValue(tramaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Cargar capítulos y ordenarlos
        const chaptersData = data.chapters || {};
        const chapters = Object.entries(chaptersData)
          .map(([id, chapter]: [string, any]) => ({
            id,
            ...chapter,
            wordCount: chapter.content ? chapter.content.split(' ').length : 0
          }))
          .sort((a, b) => a.order - b.order);

        const totalWordCount = chapters.reduce((total, chapter) => total + chapter.wordCount, 0);

        setTrama({
          id: tramaId,
          ...data,
          chapters,
          totalWordCount,
        });
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [tramaId]);

  const handleDownloadEPUB = async () => {
    if (!trama) return;
    
    // Simular descarga EPUB (en producción se implementaría la generación real)
    const content = trama.chapters
      .map(chapter => `# ${chapter.title}\n\n${chapter.content}\n\n---\nAutor: ${chapter.authorName}\nFecha: ${new Date(chapter.createdAt).toLocaleDateString()}\n\n`)
      .join('\n');
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trama.name}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando trama...</div>
      </div>
    );
  }

  if (!trama) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-bold mb-2">Trama no encontrada</h2>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const currentChapterData = trama.chapters[currentChapter];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar con lista de capítulos */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-border`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Capítulos</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSidebarOpen(false)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Información de la trama */}
          <Card>
            <CardContent className="p-4">
              {trama.coverImage && (
                <Image 
                  src={trama.coverImage} 
                  alt={trama.name}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              <h3 className="font-bold text-sm mb-2">{trama.name}</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  {trama.author.name}
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  {trama.totalWordCount.toLocaleString()} palabras
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3" />
                  {trama.chapters.length} capítulos
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(trama.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de capítulos */}
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {trama.chapters.map((chapter, index) => (
                <div 
                  key={chapter.id}
                  className="cursor-pointer transition-colors"
                  onClick={() => setCurrentChapter(index)}
                >
                  <Card className={`${currentChapter === index ? 'bg-primary/10 border-primary' : 'hover:bg-muted'}`}>
                    <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="text-xs font-bold text-muted-foreground min-w-[2rem]">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{chapter.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={chapter.authorAvatar} />
                            <AvatarFallback className="text-xs">
                              {chapter.authorName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {chapter.authorName}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-muted-foreground">
                            {chapter.wordCount} palabras
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(chapter.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Botón de descarga */}
          <Button 
            onClick={handleDownloadEPUB}
            className="w-full"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar EPUB
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header de navegación */}
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {!sidebarOpen && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSidebarOpen(true)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
              <Link href={`/dashboard/characters/${character.id}/tramas`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Volver a Tramas
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentChapter + 1} / {trama.chapters.length}
              </Badge>
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentChapter === 0}
                  onClick={() => setCurrentChapter(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentChapter === trama.chapters.length - 1}
                  onClick={() => setCurrentChapter(prev => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido del capítulo */}
        <ScrollArea className="flex-1 p-6">
          {currentChapterData ? (
            <div className="max-w-4xl mx-auto space-y-6">
              {/* Header del capítulo */}
              <div className="text-center space-y-4 pb-6 border-b border-border">
                <Badge variant="outline" className="text-xs">
                  Capítulo {currentChapter + 1}
                </Badge>
                <h1 className="text-3xl font-bold">{currentChapterData.title}</h1>
                
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={currentChapterData.authorAvatar} />
                      <AvatarFallback className="text-xs">
                        {currentChapterData.authorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span>{currentChapterData.authorName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(currentChapterData.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{currentChapterData.wordCount} palabras</span>
                  </div>
                </div>
              </div>

              {/* Contenido del capítulo */}
              <div className="prose prose-lg max-w-none dark:prose-invert">
                <div className="whitespace-pre-wrap leading-relaxed">
                  {currentChapterData.content}
                </div>
              </div>

              {/* Navegación del capítulo */}
              <div className="flex items-center justify-between pt-8 border-t border-border">
                <Button
                  variant="outline"
                  disabled={currentChapter === 0}
                  onClick={() => setCurrentChapter(prev => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Capítulo Anterior
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {currentChapter + 1} de {trama.chapters.length}
                </span>
                
                <Button
                  variant="outline"
                  disabled={currentChapter === trama.chapters.length - 1}
                  onClick={() => setCurrentChapter(prev => prev + 1)}
                >
                  Siguiente Capítulo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <h3 className="text-lg font-medium mb-2">No hay capítulos disponibles</h3>
              <p className="text-muted-foreground">Esta trama aún no tiene capítulos.</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
