// src/app/dashboard/characters/[id]/components/FriendRequestMenu.tsx
'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '../../../../../components/ui/avatar';
import { Button } from '../../../../../components/ui/button';
import { Loader2 } from 'lucide-react';

interface FriendRequest {
  id: string; // ✅ Cambiado de fromId a id
  fromId: string;
  avatarUrl: string;
  charName: string;
  charUsername: string;
}

interface FriendRequestMenuProps {
  requests: FriendRequest[] | null; // ✅ Acepta null
  onAccept: (requestId: string) => Promise<void>; // ✅ Ahora es async
  onReject: (requestId: string) => Promise<void>;
}

export function FriendRequestMenu({ requests, onAccept, onReject }: FriendRequestMenuProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // ✅ Manejar null/undefined
  if (!requests || requests.length === 0) return null;

  const handleAccept = async (requestId: string) => {
    setLoadingId(requestId);
    try {
      await onAccept(requestId);
    } catch (error) {
      console.error('Error accepting request:', error);
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setLoadingId(requestId);
    try {
      await onReject(requestId);
    } catch (error) {
      console.error('Error rejecting request:', error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
      <div className="p-4 border-b border-border">
        <p className="text-sm font-medium">Solicitudes de amistad</p>
      </div>
      <div className="p-2 space-y-2">
        {requests.map((req) => {
          const isLoading = loadingId === req.id;
          
          return (
            <div key={req.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={req.avatarUrl} />
                  <AvatarFallback>{req.charName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{req.charName}</p>
                  <p className="text-xs text-muted-foreground">@{req.charUsername}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="default"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAccept(req.id);
                  }}
                  aria-label={`Aceptar solicitud de ${req.charName}`}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aceptar'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReject(req.id);
                  }}
                  aria-label={`Rechazar solicitud de ${req.charName}`}
                >
                  Rechazar
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}