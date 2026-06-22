'use client';
{/*# RPHubs - Actualizado: 30 ago 2025 (fuerza de build)*/}
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { usePublicCharacter } from '../layout';

export default function PublicFichaPage() {
  const { character, isFriend } = usePublicCharacter();

  // Calcular edad a partir de birthDate
  const age = character?.birthDate
    ? Math.floor((new Date().getTime() - new Date(character.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  if (!character) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Información básica - SIEMPRE VISIBLE */}
      <Card>
        <CardHeader>
          <CardTitle>Información Básica</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nombre</p>
              <p className="text-base">{character.name || 'No definido'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usuario</p>
              <p className="text-base">@{character.username || 'No definido'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Edad</p>
              <p className="text-base">
                {age !== null ? `${age} años` : 'No definida'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Género</p>
              <p className="text-base">{character.gender || 'No definido'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Nacionalidad</p>
              <p className="text-base">{character.nationality || 'No definida'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personalidad - SOLO PARA AMIGOS */}
      {isFriend && character.personalidad && (
        <Card>
          <CardHeader>
            <CardTitle>Personalidad</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed whitespace-pre-line">
              {character.personalidad}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Trama principal - SOLO PARA AMIGOS */}
      {isFriend && character.trama && (
        <Card>
          <CardHeader>
            <CardTitle>Trama Principal</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed whitespace-pre-line">
              {character.trama}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Etiquetas - PÚBLICO */}
      {Array.isArray(character.tags) && character.tags.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Etiquetas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {character.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información adicional - PÚBLICO */}
      <Card>
        <CardHeader>
          <CardTitle>Información Adicional</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Fecha de creación</p>
              <p className="text-base">
                {character.createdAt 
                  ? new Date(character.createdAt).toLocaleDateString() 
                  : 'No disponible'
                }
              </p>
            </div>
            {/* Fecha de nacimiento - SOLO PARA AMIGOS */}
            {isFriend && character.birthDate && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fecha de nacimiento</p>
                <p className="text-base">
                  {new Date(character.birthDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Mensaje para no amigos */}
      {!isFriend && (
        <Card>
          <CardHeader>
            <CardTitle>Contenido Privado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Para ver más información sobre este personaje, envíele una solicitud de amistad.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
