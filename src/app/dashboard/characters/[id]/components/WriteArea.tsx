// src/app/dashboard/characters/[id]/components/WriteArea.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';

export function WriteArea({ character, value, onChange, onSubmit, placeholder = "¿Qué está pensando tu personaje?" }) {
    return (
        <Card>
        <CardHeader className="flex flex-row items-start gap-4 pb-2">
            <Avatar>
            <AvatarImage src={character.avatarUrl} />
            <AvatarFallback>{character.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-background border-border focus-visible:ring-1"
                rows={3}
            />
            </div>
        </CardHeader>
        <div className="px-6 pb-6">
            <Button onClick={onSubmit}>Publicar</Button>
        </div>
        </Card>
    );
}