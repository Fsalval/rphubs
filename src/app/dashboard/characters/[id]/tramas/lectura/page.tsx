// src/app/dashboard/characters/[id]/tramas/lectura/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation'; // Importar useSearchParams
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCharacter } from '../../../layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  Clock,
  User,
  Calendar,
  FileText,
  Bookmark,
  Heart,
  BookmarkCheck, // Icono para marcado
  HeartOff,      // Icono para quitar favorito
  Menu,
  X
} from 'lucide-react';
import { ref, onValue, set, remove } from 'firebase/database';
import { db, auth } from '@/lib/firebase'; // Asegúrate de importar auth
import { useCharacter } from '../../../layout';
import Link from 'next/link';
import Image from 'next/image';

// Definir tipos básicos (aunque se usen 'any' en gran parte, estos ayudan un poco)
interface Author {
  id?: string;
  name: string;
  username?: string;
  avatarUrl?: string;
}

interface ChapterOrResponse {
  id: string;
  title: string;
  content: string;
  author: Author;
  createdAt: string; // ISO string
  order: number;
  wordCount: number;
  isOriginal?: boolean; // Propiedad personalizada para distinguir
}

interface TramaBase {
  id: string;
  name: string;
  content: string;
  imageUrl?: string;
  author: Author;
  time: string; // ISO string
  visibility: 'public' | 'friends' | 'private';
  // ... otras propiedades de trama que puedas necesitar
}

export default function TramaLecturaPage() {
  // Usar useParams para obtener characterId y tramaId de la URL dinámica
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams(); // Para obtener tramaId de ?tramaId=...
  const { character } = useCharacter();
  // Obtener characterId de la ruta dinámica
  const characterIdFromUrl = Array.isArray(params.id) ? params.id[0] : params.id;
  // Obtener tramaId de los searchParams (?tramaId=...) o de la ruta si fuera /[tramaId]
  const tramaIdFromParams = searchParams.get('tramaId');
  const tramaIdFromUrl = Array.isArray(params.tramaId) ? params.tramaId[0] : params.tramaId;
  // Priorizar tramaId de searchParams
  const tramaId = tramaIdFromParams || tramaIdFromUrl;

  const [trama, setTrama] = useState<TramaBase | null>(null);
  const [responses, setResponses] = useState<any[]>([]); // Mantener como any por ahora
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  // Estados para Marcador y Favorito
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const userId = auth.currentUser?.uid; // Obtener userId del usuario autenticado

  // --- Cargar datos de la trama y respuestas ---
  useEffect(() => {
    // Validar que tenemos characterId (de la URL) y tramaId (de searchParams o URL)
    if (!characterIdFromUrl || !tramaId) {
        console.error("Faltan characterId o tramaId para cargar la trama en modo lectura.");
        setLoading(false);
        // Opcional: Redirigir a una página de error o tramas
        // router.push('/dashboard/characters'); // Ejemplo de redirección
        return;
    }

    const tramaRef = ref(db, `characters/${characterIdFromUrl}/tramas/${tramaId}`);
    const responsesRef = ref(db, `characters/${characterIdFromUrl}/tramas/${tramaId}/responses`);

    const unsubscribeTrama = onValue(tramaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Asegurarse de incluir el ID de la trama
        setTrama({ id: tramaId, ...data });
      } else {
        console.warn(`Trama con ID ${tramaId} no encontrada en character ${characterIdFromUrl}`);
        setTrama(null);
      }
    });

    const unsubscribeResponses = onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convertir objeto a array y ordenar por tiempo
        const responsesArray = Object.entries(data)
          .map(([id, value]: any) => ({ id, ...(value as object) }))
          .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
        setResponses(responsesArray);
      } else {
        setResponses([]);
      }
      setLoading(false);
    });

    return () => {
      unsubscribeTrama();
      unsubscribeResponses();
    };
  }, [characterIdFromUrl, tramaId]); // Dependencias actualizadas

  // --- Cargar estado de Marcador y Favorito ---
  useEffect(() => {
     if (!userId || !tramaId) return;

     const bookmarkRef = ref(db, `users/${userId}/bookmarks/tramas/${tramaId}`);
     const favoriteRef = ref(db, `users/${userId}/favorites/tramas/${tramaId}`);

     const unsubscribeBookmark = onValue(bookmarkRef, (snapshot) => {
         setIsBookmarked(snapshot.exists());
     });

     const unsubscribeFavorite = onValue(favoriteRef, (snapshot) => {
         setIsFavorited(snapshot.exists());
     });

     return () => {
         unsubscribeBookmark();
         unsubscribeFavorite();
     };
  }, [userId, tramaId]);

  // --- Construir lista de capítulos ---
  const chapters: ChapterOrResponse[] = useMemo(() => {
    if (!trama) return [];
    const chapterList: ChapterOrResponse[] = [];

    // Capítulo 1: Trama original
    chapterList.push({
      id: 'original',
      title: trama.name,
      content: trama.content,
      author: trama.author,
      createdAt: trama.time,
      order: 0,
      wordCount: trama.content ? trama.content.split(/\s+/).filter(Boolean).length : 0,
      isOriginal: true
    });

    // Capítulos siguientes: Respuestas
    responses.forEach((response: any, index) => {
      chapterList.push({
        id: response.id,
        title: `Respuesta de ${response.author?.name || 'Anónimo'}`,
        content: response.content,
        author: response.author,
        createdAt: response.time,
        order: index + 1,
        wordCount: response.content ? response.content.split(/\s+/).filter(Boolean).length : 0,
        isOriginal: false
      });
    });

    return chapterList;
  }, [trama, responses]);

  const currentChapterData = chapters[currentChapterIndex];
  const totalWordCount = chapters.reduce((sum, chapter) => sum + chapter.wordCount, 0);

  // --- Funciones para Marcador y Favorito ---
  const toggleBookmark = async () => {
     if (!userId || !tramaId) {
         console.warn("No se puede marcar: Usuario no autenticado o tramaId faltante");
         return;
     }
     const bookmarkRef = ref(db, `users/${userId}/bookmarks/tramas/${tramaId}`);
     if (isBookmarked) {
         await remove(bookmarkRef);
     } else {
         await set(bookmarkRef, { tramaId, addedAt: new Date().toISOString() });
     }
     // El estado se actualizará automáticamente por el listener
  };

  const toggleFavorite = async () => {
     if (!userId || !tramaId) {
         console.warn("No se puede marcar como favorito: Usuario no autenticado o tramaId faltante");
         return;
     }
     const favoriteRef = ref(db, `users/${userId}/favorites/tramas/${tramaId}`);
     if (isFavorited) {
         await remove(favoriteRef);
     } else {
         await set(favoriteRef, { tramaId, addedAt: new Date().toISOString() });
     }
     // El estado se actualizará automáticamente por el listener
  };

  // --- Función de descarga (ejemplo simple) ---
  const handleDownloadEPUB = async () => {
    if (!trama) return;

    // Crear contenido combinado: Original + Respuestas
    let content = `# ${trama.name}\n\n${trama.content}\n\n---\nAutor Original: ${trama.author.name}\nFecha: ${new Date(trama.time).toLocaleDateString()}\n\n`;

    responses.forEach((response: any) => {
      content += `\n\n## Respuesta de ${response.author.name}\n\n${response.content}\n\n---\nAutor: ${response.author.name}\nFecha: ${new Date(response.time).toLocaleDateString()}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trama.name.replace(/\s+/g, '_')}_lectura.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Navegación entre capítulos ---
  const goToPreviousChapter = () => {
    setCurrentChapterIndex(prev => Math.max(prev - 1, 0));
  };

  const goToNextChapter = () => {
    setCurrentChapterIndex(prev => Math.min(prev + 1, chapters.length - 1));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando trama...</div>
      </div>
    );
  }

  if (!trama) {
    return (
      <div className="text-center p-8 h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-2">Trama no encontrada</h2>
        <p className="text-muted-foreground mb-4">Es posible que la trama haya sido eliminada o no tengas permiso para verla.</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar con lista de capítulos */}
      {/* Versión Mobile: Sheet/Drawer */}
      {!sidebarOpen && (
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden fixed top-4 left-4 z-50"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-4 w-4" />
        </Button>
      )}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setSidebarOpen(false)}></div>
      )}
      <div className={`lg:hidden fixed top-0 left-0 h-full w-80 bg-background z-50 transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-bold">Capítulos</h2>
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-60px)] p-4">
          <div className="space-y-2">
             {/* Información de la trama en el sidebar mobile */}
             <Card className="mb-4">
               <CardContent className="p-3">
                 {trama.imageUrl && (
                   <Image
                     src={trama.imageUrl}
                     alt={trama.name}
                     width={400}
                     height={200}
                     className="w-full h-32 object-cover rounded-md mb-2"
                   />
                 )}
                 <h3 className="font-bold text-sm mb-1 truncate">{trama.name}</h3>
                 <div className="space-y-1 text-xs text-muted-foreground">
                   <div className="flex items-center gap-1">
                     <User className="h-3 w-3" />
                     <span className="truncate">{trama.author.name}</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <FileText className="h-3 w-3" />
                     <span>{totalWordCount.toLocaleString()} palabras</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <BookOpen className="h-3 w-3" />
                     <span>{chapters.length} secciones</span>
                   </div>
                   <div className="flex items-center gap-1">
                     <Calendar className="h-3 w-3" />
                     <span>{new Date(trama.time).toLocaleDateString()}</span>
                   </div>
                 </div>
               </CardContent>
             </Card>

             {/* Botones de Marcador y Favorito en sidebar mobile */}
             <div className="flex gap-2 mb-4">
                <Button
                  variant={isBookmarked ? "default" : "outline"}
                  size="sm"
                  onClick={toggleBookmark}
                  className="flex-1"
                >
                  {isBookmarked ? <BookmarkCheck className="h-4 w-4 mr-1" /> : <Bookmark className="h-4 w-4 mr-1" />}
                  {isBookmarked ? 'Marcado' : 'Marcar'}
                </Button>
                <Button
                  variant={isFavorited ? "default" : "outline"}
                  size="sm"
                  onClick={toggleFavorite}
                  className="flex-1"
                >
                  {isFavorited ? <HeartOff className="h-4 w-4 mr-1" /> : <Heart className="h-4 w-4 mr-1" />}
                  {isFavorited ? 'Favorito' : 'Favorito'}
                </Button>
              </div>

            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                  currentChapterIndex === index ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
                }`}
                onClick={() => {
                  setCurrentChapterIndex(index);
                  setSidebarOpen(false); // Cerrar sidebar en móvil al seleccionar
                }}
              >
                <div className="flex items-start gap-2">
                  <div className="text-xs font-bold text-muted-foreground min-w-[1.5rem] mt-0.5">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{chapter.title}</h4>
                    <div className="flex items-center gap-1 mt-1">
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={chapter.author?.avatarUrl} />
                        <AvatarFallback className="text-[8px]">
                          {chapter.author?.name?.charAt(0) || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-muted-foreground truncate">
                        {chapter.author?.name || 'Anónimo'}
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
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Sidebar Desktop */}
      <div className="hidden lg:block lg:w-80 flex-shrink-0 border-r border-border flex flex-col">
        <div className="p-6 space-y-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Capítulos</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden" // Solo visible en pantallas grandes si se quiere colapsar
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          {/* Información de la trama */}
          <Card>
            <CardContent className="p-4">
              {trama.imageUrl && (
                <Image
                  src={trama.imageUrl}
                  alt={trama.name}
                  width={400} // Ajusta según tu configuración de Next.js Image
                  height={200}
                  className="w-full h-32 object-cover rounded-md mb-3"
                />
              )}
              <h3 className="font-bold text-sm mb-2 truncate">{trama.name}</h3>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3" />
                  <span className="truncate">{trama.author.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3" />
                  <span>{totalWordCount.toLocaleString()} palabras</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3" />
                  <span>{chapters.length} secciones</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(trama.time).toLocaleDateString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Marcador y Favorito */}
          <div className="flex gap-2">
             <Button
               variant={isBookmarked ? "default" : "outline"}
               size="sm"
               onClick={toggleBookmark}
               className="flex-1"
             >
               {isBookmarked ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
               {isBookmarked ? 'Marcado' : 'Marcar'}
             </Button>
             <Button
               variant={isFavorited ? "default" : "outline"}
               size="sm"
               onClick={toggleFavorite}
               className="flex-1"
             >
               {isFavorited ? <HeartOff className="h-4 w-4 mr-2" /> : <Heart className="h-4 w-4 mr-2" />}
               {isFavorited ? 'Favorito' : 'Favorito'}
             </Button>
           </div>
        </div>

        {/* Lista de capítulos */}
        <ScrollArea className="flex-grow p-6 pt-0">
          <div className="space-y-2">
            {chapters.map((chapter, index) => (
              <div
                key={chapter.id}
                className={`cursor-pointer transition-colors ${
                  currentChapterIndex === index ? 'scale-[1.02]' : '' // Efecto sutil
                }`}
                onClick={() => setCurrentChapterIndex(index)}
              >
                <Card className={`${currentChapterIndex === index ? 'bg-primary/10 border-primary shadow-sm' : 'hover:bg-muted'}`}>
                  <CardContent className="p-3">
                    <div className="flex items-start gap-3">
                      <div className="text-xs font-bold text-muted-foreground min-w-[2rem] mt-0.5">
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{chapter.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Avatar className="h-4 w-4">
                            <AvatarImage src={chapter.author?.avatarUrl} />
                            <AvatarFallback className="text-xs">
                              {chapter.author?.name?.charAt(0) || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs text-muted-foreground truncate">
                            {chapter.author?.name || 'Anónimo'}
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
        <div className="p-6 pt-0">
          <Button
            onClick={handleDownloadEPUB}
            className="w-full"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Descargar Texto
          </Button>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header de navegación */}
        <div className="border-b border-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Botón para abrir sidebar en móvil */}
              {!sidebarOpen && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
              )}
              <Link href={`/dashboard/characters/${characterIdFromUrl}/tramas`}>
                <Button variant="ghost" size="sm">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Volver a Tramas
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {currentChapterIndex + 1} / {chapters.length}
              </Badge>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentChapterIndex === 0}
                  onClick={goToPreviousChapter}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={currentChapterIndex === chapters.length - 1}
                  onClick={goToNextChapter}
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
                {currentChapterData.isOriginal ? (
                  <h1 className="text-3xl font-bold">{currentChapterData.title}</h1>
                ) : (
                  <>
                    <Badge variant="outline">Respuesta</Badge>
                    <h2 className="text-2xl font-bold">{currentChapterData.title}</h2>
                  </>
                )}

                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={currentChapterData.author?.avatarUrl} />
                      <AvatarFallback className="text-xs">
                        {currentChapterData.author?.name?.charAt(0) || 'A'}
                      </AvatarFallback>
                    </Avatar>
                    <span>{currentChapterData.author?.name || 'Anónimo'}</span>
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
                  disabled={currentChapterIndex === 0}
                  onClick={goToPreviousChapter}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Capítulo Anterior
                </Button>

                <span className="text-sm text-muted-foreground">
                  {currentChapterIndex + 1} de {chapters.length}
                </span>

                <Button
                  variant="outline"
                  disabled={currentChapterIndex === chapters.length - 1}
                  onClick={goToNextChapter}
                >
                  Siguiente Capítulo
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <h3 className="text-lg font-medium mb-2">No hay contenido disponible</h3>
              <p className="text-muted-foreground">Esta trama aún no tiene contenido.</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
