'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen, Users, Eye, MessageSquare } from 'lucide-react';
import { usePublicCharacter } from '../layout';
import { ref, onValue, push, get, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { Story } from '@/lib/types';

export default function PublicTramasPage() {
  const { character, currentUserCharacter, isFriend } = usePublicCharacter();
  
  const [tramas, setTramas] = useState<Story[]>([]);
  const [tramaResponses, setTramaResponses] = useState<Record<string, Story[]>>({});
  const [responseTexts, setResponseTexts] = useState<Record<string, string>>({});
  const [scrollTarget, setScrollTarget] = useState<string | null>(null);

  // Cargar tramas
  useEffect(() => {
    if (!character?.id) return;
    const tramasRef = ref(db, `characters/${character.id}/tramas`);
    const unsubscribe = onValue(tramasRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const tramasArray = Object.entries(data)
          .map(([key, value]: [string, unknown]) => ({ ...(value as Story), id: key }))
          .filter((trama: Story) => {
            // ✅ Ahora `trama` tiene tipo
            if (trama.visibility === 'public') return true;
            if (trama.visibility === 'friends' && isFriend) return true;
            if (trama.visibility === 'private' && currentUserCharacter && trama.collaborators?.includes(currentUserCharacter.id)) return true;
            return false;
          })
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        setTramas(tramasArray as Story[]); // ✅ Forzamos el tipo
      } else {
        setTramas([]);
      }
    });
    return () => unsubscribe();
  }, [character?.id, isFriend, currentUserCharacter]);

  // Cargar respuestas para cada trama
  useEffect(() => {
    if (!character?.id) return;
    
    tramas.forEach(trama => {
      const responsesRef = ref(db, `characters/${character.id}/tramas/${trama.id}/responses`);
      const unsubscribe = onValue(responsesRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const responsesArray = Object.entries(data)
            .map(([key, value]: [string, unknown]) => ({ ...(value as Story), id: key }))
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
          setTramaResponses(prev => ({ ...prev, [trama.id]: responsesArray as Story[] }));
        } else {
          setTramaResponses(prev => ({ ...prev, [trama.id]: [] }));
        }
      });

      // ✅ Importante: devuelve la función de limpieza
      return () => unsubscribe();
    });
  }, [tramas, character?.id]);

  // Scroll automático
  useEffect(() => {
    if (scrollTarget) {
      const element = document.getElementById(`trama-${scrollTarget}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.3)';
        setTimeout(() => {
          element.style.boxShadow = '';
        }, 2000);
      }
      setScrollTarget(null);
    }
  }, [scrollTarget]);

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Eye className="h-3 w-3" />;
      case 'friends': return <Users className="h-3 w-3" />;
      case 'private': return <BookOpen className="h-3 w-3" />;
      default: return <Eye className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'finished': return 'bg-green-100 text-green-700';
      case 'in-progress': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'finished': return 'Finalizada';
      case 'in-progress': return 'En proceso';
      default: return 'Pendiente';
    }
  };

  // Función para agregar respuestas a las tramas
  const handleAddResponse = async (tramaId: string) => {
    if (!responseTexts[tramaId]?.trim() || !currentUserCharacter) return;

    const newResponse = {
      author: {
        id: currentUserCharacter.id,
        name: currentUserCharacter.name,
        username: currentUserCharacter.username,
        avatarUrl: currentUserCharacter.avatarUrl,
      },
      content: responseTexts[tramaId].trim(),
      time: new Date().toISOString(),
    };

    try {
      // Guardar la respuesta en Firebase
      const responsesRef = ref(db, `characters/${character!.id}/tramas/${tramaId}/responses`);
      await push(responsesRef, newResponse);
      
      // Agregar al usuario como colaborador si no lo es ya
      const tramaRef = ref(db, `characters/${character!.id}/tramas/${tramaId}`);
      const tramaSnapshot = await get(tramaRef);
      const tramaData = tramaSnapshot.val();
      
      if (tramaData) {
        // Inicializar colaboradores si no existen
        const currentCollaborators = tramaData.collaborators || [];
        
        if (!currentCollaborators.includes(currentUserCharacter.id)) {
          const updatedCollaborators = [...currentCollaborators, currentUserCharacter.id];
          await update(tramaRef, { 
            collaborators: updatedCollaborators,
            participants: updatedCollaborators.length
          });
          
          // ✅ NUEVO: También crear una referencia en las tramas del usuario que responde
          if (character!.id !== currentUserCharacter.id) {
            const userTramaRef = ref(db, `characters/${currentUserCharacter.id}/tramas/${tramaId}`);
            await update(userTramaRef, {
              ...tramaData,
              collaborators: updatedCollaborators,
              participants: updatedCollaborators.length,
              isCollaboration: true // Marcamos que es una colaboración
            });
          }
        }
      }
      
      // Limpiar el campo de texto
      setResponseTexts(prev => ({ ...prev, [tramaId]: '' }));
    } catch (error) {
      console.error('Error al guardar la respuesta:', error);
    }
  };

  return (
    <div className="flex gap-6 h-screen overflow-hidden">
      {/* Menú lateral */}
      <div className="w-80 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tramas de {character?.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-2">
                {tramas.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Sin tramas visibles
                  </p>
                ) : (
                  tramas.map((trama) => (
                    <div
                      key={trama.id}
                      className="p-3 rounded-lg border hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => setScrollTarget(trama.id)}
                    >
                      <div className="flex items-start gap-2 mb-2">
                        {getVisibilityIcon(trama.visibility)}
                        <h4 className="font-medium text-sm leading-tight flex-1">{trama.name}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusColor(trama.status)}`}>
                          {getStatusText(trama.status)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(trama.time).toLocaleDateString()}
                        </span>
                      </div>

                      {tramaResponses[trama.id]?.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {tramaResponses[trama.id].length} respuesta{tramaResponses[trama.id].length !== 1 ? 's' : ''}
                          {tramaResponses[trama.id].length >= 10 && (
                            <span className="ml-2 text-primary font-medium">• Capítulos disponibles</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 space-y-6 overflow-y-auto pr-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Tramas de {character?.name}</h2>
          <div className="text-sm text-muted-foreground">
            {tramas.length} trama{tramas.length !== 1 ? 's' : ''} visible{tramas.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Tramas */}
        <div className="space-y-6">
          {tramas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-muted-foreground">
                  Para ver las tramas de este personaje, envíele una solicitud de amistad.
                </p>
              </CardContent>
            </Card>
          ) : (
            tramas.map((trama) => (
              <Card key={trama.id} className="hover:shadow-md transition">
                <CardContent className="pt-6">
                  <div id={`trama-${trama.id}`}>
                    {/* Título y metadatos */}
                    <div className="flex items-start justify-between mb-3">
                      <h2 className="text-2xl font-bold flex-1">{trama.name}</h2>
                      <div className="flex items-center gap-2">
                        {getVisibilityIcon(trama.visibility)}
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(trama.status)}`}>
                          {getStatusText(trama.status)}
                        </span>
                      </div>
                    </div>
                    
                    {/* Información del autor y fecha */}
                    <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
                      <span>Por: <span className="font-medium">{trama.author.name}</span></span>
                      <span>•</span>
                      <span>{new Date(trama.time).toLocaleString()}</span>
                      {trama.participants > 1 && (
                        <>
                          <span>•</span>
                          <span>{trama.participants} participante{trama.participants !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                    
                    {/* Contenido */}
                    <div className="mb-4 max-w-none">
                      <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                        {trama.content}
                      </p>
                    </div>

                    {/* Respuestas cronológicas */}
                    {tramaResponses[trama.id]?.length > 0 && (
                      <div className="border-t pt-4 mt-4">
                        <h3 className="font-medium text-sm mb-3 text-muted-foreground">
                          Continuación de la historia ({tramaResponses[trama.id].length} respuesta{tramaResponses[trama.id].length !== 1 ? 's' : ''})
                        </h3>
                        <div className="space-y-4">
                          {tramaResponses[trama.id].map((response) => (
                            <div key={response.id} className="bg-muted/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
                                <span className="font-medium">{response.author.name}</span>
                                <span>•</span>
                                <span>{new Date(response.time).toLocaleString()}</span>
                              </div>
                              <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                                {response.content}
                              </p>
                            </div>
                          ))}
                        </div>
                        
                        {tramaResponses[trama.id].length >= 10 && (
                          <div className="mt-4 p-3 bg-primary/10 rounded-lg text-center">
                            <p className="text-sm text-primary font-medium">
                              Esta trama tiene suficientes respuestas para ser vista como capítulos
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Campo de respuesta - Solo visible si el usuario tiene permisos */}
                    {currentUserCharacter && (() => {
                      // Función para verificar si el usuario puede responder a esta trama
                      const canRespond = () => {
                        if (!trama.responseConfig) return true; // Si no hay configuración, permite respuestas
                        
                        switch (trama.responseConfig) {
                          case 'anyone':
                            return true;
                          case 'friends':
                            // Verificar si es el autor o si son amigos
                            return trama.author?.username === currentUserCharacter.username || 
                                   (trama.author?.id && currentUserCharacter.friends && trama.author.id in currentUserCharacter.friends);
                          case 'collaborators':
                            // Solo el autor y colaboradores específicos pueden responder
                            return trama.author?.username === currentUserCharacter.username || 
                                   trama.collaborators?.includes(currentUserCharacter.id);
                          default:
                            return true;
                        }
                      };

                      const userCanRespond = canRespond();

                      if (!userCanRespond) {
                        return (
                          <div className="border-t pt-4 mt-4">
                            <div className="text-center py-4 text-muted-foreground">
                              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm">
                                {trama.responseConfig === 'friends' 
                                  ? 'Solo los amigos del autor pueden continuar esta historia'
                                  : 'Solo los colaboradores invitados pueden continuar esta historia'
                                }
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="border-t pt-4 mt-4">
                          <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground">
                              Continúa la historia:
                            </label>
                            <Textarea
                              value={responseTexts[trama.id] || ''}
                              onChange={(e) => setResponseTexts(prev => ({ 
                                ...prev, 
                                [trama.id]: e.target.value 
                              }))}
                              placeholder="Escribe cómo continúa la historia... Mantén la coherencia narrativa y el orden cronológico."
                              className="min-h-[120px] text-base leading-relaxed w-full resize-none"
                            />
                            <div className="flex justify-end">
                              <Button 
                                size="sm" 
                                onClick={() => handleAddResponse(trama.id)}
                                disabled={!responseTexts[trama.id]?.trim()}
                              >
                                <MessageSquare className="h-4 w-4 mr-2" />
                                Continuar Historia
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                    
                    {/* Información de configuración */}
                    <div className="flex items-center justify-between pt-4 border-t text-xs text-muted-foreground mt-4">
                      <span>
                        Visibilidad: {trama.visibility === 'public' ? 'Pública' : 
                                      trama.visibility === 'friends' ? 'Solo amigos' : 'Privada'}
                      </span>
                      <span>
                        Respuestas: {trama.responseConfig === 'anyone' ? 'Cualquiera' : 
                                    trama.responseConfig === 'friends' ? 'Solo amigos' : 'Solo colaboradores'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}