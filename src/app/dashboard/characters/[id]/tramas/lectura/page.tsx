'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCharacter } from '../../layout';
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

  // Función de descarga mejorada
  const handleDownload = async (format: 'txt' | 'epub' = 'txt') => {
    if (!trama) return;

    if (format === 'txt') {
      // Descarga como texto plano
      let content = `${trama.name}\n\n`;
      content += `Por: ${trama.author?.name || 'Autor desconocido'}\n\n`;
      content += `${trama.content}\n\n`;

      responses.forEach((response: any) => {
        if (response.isChapter) {
          content += `\n--- CAPÍTULO ---\n\n`;
        }
        content += `\n${response.author?.name || 'Anónimo'}:\n\n`;
        content += `${response.content}\n\n`;
      });

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trama.name.replace(/\s+/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Descarga como EPUB básico
      const createEpubContent = () => {
        const title = trama.name;
        const author = trama.author?.name || 'Autor desconocido';
        
        let content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <title>${title}</title>
    <meta charset="UTF-8"/>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
        h1 { color: #333; }
        .author { color: #666; font-style: italic; }
        .response { margin: 20px 0; }
        .response-author { font-weight: bold; color: #444; }
        .chapter { text-align: center; margin: 30px 0; font-weight: bold; color: #2c5aa0; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    <p class="author">Por: ${author}</p>
    <div>${trama.content.replace(/\n/g, '<br/>')}</div>`;

        responses.forEach((response: any) => {
          if (response.isChapter) {
            content += `<div class="chapter">--- CAPÍTULO ---</div>`;
          }
          content += `<div class="response">
            <p class="response-author">${response.author?.name || 'Anónimo'}:</p>
            <p>${response.content.replace(/\n/g, '<br/>')}</p>
          </div>`;
        });

        content += `</body></html>`;
        return content;
      };

      const epubContent = createEpubContent();
      const blob = new Blob([epubContent], { type: 'application/epub+zip' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${trama.name.replace(/\s+/g, '_')}.epub`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
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
        {/* Header con opciones de descarga */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <Link href={`/dashboard/characters/${characterIdFromUrl}/tramas`} className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => handleDownload('txt')} 
              variant="outline" 
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              TXT
            </Button>
            <Button 
              onClick={() => handleDownload('epub')} 
              variant="outline" 
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4 mr-2" />
              EPUB
            </Button>
          </div>
        </div>

        {/* Vista de libro - Sin avatares */}
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
            {/* Contenido de la trama original - Sin avatares */}
            <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap leading-relaxed break-words">
                {trama.content}
              </div>
            </div>

            {/* Respuestas como narrativa continua - Solo nombres */}
            {responses.length > 0 && (
              <div className="space-y-6 sm:space-y-8">
                {responses.map((response: any, index) => (
                  <div key={response.id} className="space-y-3 sm:space-y-4">
                    {/* Indicador de nuevo capítulo */}
                    {response.isChapter && (
                      <div className="text-center my-6 sm:my-8">
                        <div className="inline-block px-3 py-1 sm:px-4 sm:py-2 bg-primary/10 text-primary rounded-full text-xs sm:text-sm font-medium">
                          Capítulo {responses.filter((r: any, i: number) => r.isChapter && i <= index).length}
                        </div>
                      </div>
                    )}
                    
                    {/* Contenido de la respuesta - Solo nombres, sin avatares */}
                    <div className="space-y-2 sm:space-y-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="text-sm font-medium">{response.author?.name || 'Anónimo'}:</span>
                        <span className="text-xs">{new Date(response.time).toLocaleDateString()}</span>
                      </div>
                      
                      <div className="prose prose-sm sm:prose-base lg:prose-lg max-w-none dark:prose-invert ml-0">
                        <div className="whitespace-pre-wrap leading-relaxed break-words">
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
