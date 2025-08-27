// src/app/dashboard/characters/[id]/components/VisibilitySelector.tsx
'use client';

import { useState } from 'react';

export function VisibilitySelector({ value, onChange }) {
    return (
        <div className="flex gap-2 mt-2 text-sm">
        <span>Visibilidad:</span>
        <div className="flex gap-2">
            <label className="flex items-center">
            <input
                type="radio"
                value="public"
                checked={value === 'public'}
                onChange={() => onChange('public')}
                className="mr-1"
            />
            Público
            </label>
            <label className="flex items-center">
            <input
                type="radio"
                value="friends"
                checked={value === 'friends'}
                onChange={() => onChange('friends')}
                className="mr-1"
            />
            Amigos
            </label>
            <label className="flex items-center">
            <input
                type="radio"
                value="private"
                checked={value === 'private'}
                onChange={() => onChange('private')}
                className="mr-1"
            />
            Privado
            </label>
        </div>
        </div>
    );
}