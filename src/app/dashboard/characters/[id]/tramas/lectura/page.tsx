'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCharacter } from '../../layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Download, BookOpen } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { db } from '@/lib/firebase';
import Link from 'next/link';

export default function TramaLecturaPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { character } = useCharacter();
  
  const characterIdFromUrl = Array.isArray(params.id) ? params.id[0] : params.id;
  const tramaId = searchParams.get('tramaId');

  const [trama, setTrama] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos de la trama y respuestas
  useEffect(() => {
    if (!characterIdFromUrl || !tramaId) {
      setLoading(false);
      return;
    }

    const tramaRef = ref(db, `characters/${characterIdFromUrl}/tramas/${tramaId}`);
    const responsesRef = ref(db, `characters/${characterIdFromUrl}/tramas/${tramaId}/responses`);

    const unsubscribeTrama = onValue(tramaRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setTrama({ id: tramaId, ...data });
      } else {
        setTrama(null);
      }
    });

    const unsubscribeResponses = onValue(responsesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
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
  }, [characterIdFromUrl, tramaId]);

  // Función de descarga como EPUB/Texto
  const handleDownload = async () => {
    if (!trama) return;

    // Crear contenido continuo como libro
    let content = `${trama.name}\n\n`;
    content += `Por: ${trama.author?.name || 'Autor desconocido'}\n\n`;
    content += `${trama.content}\n\n`;

    responses.forEach((response: any) => {
      // Verificar si es marcado como nuevo capítulo
      if (response.isChapter) {
        content += `\n--- CAPÍTULO ---\n\n`;
      }
      
      content += `\n${response.author?.name || 'Anónimo'}:\n\n`;
      content += `${response.content}\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${trama.name.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Cargando historia...</div>
      </div>
    );
  }

  if (!trama) {
    return (
      <div className="text-center p-6 h-screen flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold mb-2">Historia no encontrada</h2>
        <p className="text-muted-foreground mb-4 text-sm">La historia no existe o no tienes permiso para verla.</p>
        <Link href={`/dashboard/characters/${characterIdFromUrl}/tramas`}>
          <Button className="w-full sm:w-auto">Volver a tramas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header con botón de volver - Responsivo */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href={`/dashboard/characters/${characterIdFromUrl}/tramas`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <Button onClick={handleDownload} variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            Descargar
          </Button>
        </div>

        {/* Vista de libro - Optimizada para móvil */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="text-center pb-6 sm:pb-8">
            <div className="flex justify-center mb-4">
              <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight">
              {trama.name}
            </CardTitle>
            <div className="text-base sm:text-lg text-muted-foreground mt-2">
              Por {trama.author?.name || 'Autor desconocido'}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-3">
              {new Date(trama.time).toLocaleDateString()}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6 sm:space-y-8 pb-8 sm:pb-12">
            {/* Contenido de la trama original - Responsivo */}
            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap leading-relaxed">
                {trama.content}
              </div>
            </div>

            {/* Respuestas como narrativa continua - Responsivo */}
            {responses.length > 0 && (
              <div className="space-y-6 sm:space-y-8">
                {responses.map((response: any, index) => (
                  <div key={response.id} className="space-y-3 sm:space-y-4">
                    {/* Indicador de nuevo capítulo si está marcado */}
                    {response.isChapter && (
                      <div className="text-center my-6 sm:my-8">
                        <div className="inline-block px-3 py-1 sm:px-4 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium">
                          Capítulo {responses.filter((r: any, i: number) => r.isChapter && i <= index).length}
                        </div>
                      </div>
                    )}
                    
                    {/* Contenido de la respuesta - Mejorado para móvil */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                          <AvatarImage src={response.author?.avatarUrl} />
                          <AvatarFallback className="text-[8px] sm:text-xs">
                            {response.author?.name?.charAt(0) || 'A'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{response.author?.name || 'Anónimo'}</span>
                          <span className="text-xs">{new Date(response.time).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert ml-0 sm:ml-8">
                        <div className="whitespace-pre-wrap leading-relaxed">
                          {response.content}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Fin de la historia */}
            {responses.length > 0 && (
              <div className="text-center pt-6 sm:pt-8 border-t">
                <div className="inline-block px-4 py-2 sm:px-6 sm:py-3 bg-muted rounded-full">
                  <span className="text-muted-foreground text-sm sm:text-base">Fin de la historia</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
