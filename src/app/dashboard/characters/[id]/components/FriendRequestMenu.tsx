// src/app/dashboard/characters/[id]/components/FriendRequestMenu.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '../../../../../components/ui/avatar';
import { Button } from '../../../../../components/ui/button';

interface FriendRequest {
  fromId: string;
  avatarUrl: string;
  charName: string;
  charUsername: string;
}

interface FriendRequestMenuProps {
  requests: FriendRequest[];
  onAccept: (requestId: string) => void;
  onReject: (requestId: string) => void;
}

export function FriendRequestMenu({ requests, onAccept, onReject }: FriendRequestMenuProps) {
    if (requests.length === 0) return null;

    return (
        <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
        <div className="p-4 border-b border-border">
            <p className="text-sm font-medium">Solicitudes de amistad</p>
        </div>
        <div className="p-2 space-y-2">
            {requests.map((req) => (
            <div key={req.fromId} className="flex items-center justify-between p-2 hover:bg-muted rounded">
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
                    onClick={(e) => {
                    e.stopPropagation();
                    onAccept(req.fromId);
                    }}
                >
                    Aceptar
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                    e.stopPropagation();
                    onReject(req.fromId);
                    }}
                >
                    Rechazar
                </Button>
                </div>
            </div>
            ))}
        </div>
        </div>
    );
}