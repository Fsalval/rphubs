'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, ThumbsUp, Frown, Laugh } from 'lucide-react';
import { sanitize } from '@/lib/sanitize';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Post } from '@/lib/types'; 

type PostCardProps = {
    post: Post;
    isOwner: boolean;
    onEdit?: (id: string, content: string) => void;
    onDelete?: (id: string) => void;
    likes?: number;
    heartbreaks?: number;
    laughs?: number;
};

export function PostCard({
    post,
    isOwner,
    onEdit,
    onDelete,
    likes = 0,
    heartbreaks = 0,
    laughs = 0,
}: PostCardProps) {
    const [editing, setEditing] = useState(false);
    const [content, setContent] = useState(post.content);

    return (
        <div className="border rounded-lg overflow-hidden">
        <div className="p-4 bg-background">
            <div className="flex gap-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={post.avatarUrl} />
                <AvatarFallback>{post.charName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
                <p className="font-bold">{post.charName}</p>
                <p>{post.charHandle}</p>
                <p>&middot;</p>
                <p>{new Date(post.time).toLocaleString()}</p>
                </div>

                {editing ? (
                <div className="space-y-2 mt-2">
                    <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} />
                    <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => {
                        onEdit?.(post.id, content);
                        setEditing(false);
                        }}
                    >
                        Guardar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
                        Cancelar
                    </Button>
                    </div>
                </div>
                ) : (
                <p
                    className="mt-2"
                    dangerouslySetInnerHTML={{ __html: sanitize(content) }}
                />
                )}
            </div>

            {isOwner && !editing && (
                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setEditing(true)}>Editar</DropdownMenuItem>
                    <DropdownMenuItem
                    className="text-destructive"
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => onDelete?.(post.id)}
                    >
                    Eliminar
                    </DropdownMenuItem>
                </DropdownMenuContent>
                </DropdownMenu>
            )}
            </div>
        </div>

        <div className="px-4 py-2 flex justify-around text-muted-foreground border-t bg-background">
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-primary">
            <ThumbsUp className="h-4 w-4" /> {likes}
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-primary">
            <Frown className="h-4 w-4" /> {heartbreaks}
            </Button>
            <Button variant="ghost" size="sm" className="flex items-center gap-2 hover:text-primary">
            <Laugh className="h-4 w-4" /> {laughs}
            </Button>
        </div>
        </div>
    );
}