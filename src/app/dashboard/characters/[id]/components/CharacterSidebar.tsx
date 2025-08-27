// src/app/dashboard/characters/[id]/components/CharacterSidebar.tsx
'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function CharacterSidebar({ character }) {
    return (
        <>
        <Card>
            <CardHeader>
            <CardTitle>About me</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground whitespace-pre-line line-clamp-6">
                {character.profile || 'No hay perfil definido.'}
            </p>
            <div className="flex flex-wrap gap-2">
                {character.tags?.map((tag: string) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
            </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
            <CardTitle>Enlaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
            {character.socialLinks?.length > 0 ? (
                character.socialLinks.map((link: any, i: number) => (
                <div key={i}>
                    <p className="text-sm text-muted-foreground">{link.name}</p>
                    <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline block text-sm"
                    >
                    {link.username || link.url}
                    </a>
                </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground">No hay enlaces definidos.</p>
            )}
            </CardContent>
        </Card>
        </>
    );
}