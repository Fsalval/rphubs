// src/components/ui/avatar.tsx
import React from 'react';

type AvatarProps = React.HTMLAttributes<HTMLDivElement> & {
    src?: string;
    alt?: string;
    fallback?: string;
};

const Avatar = ({ src, alt, fallback, className = '', ...props }: AvatarProps) => {
    return (
        <div
        className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 overflow-hidden ${className}`}
        {...props}
        >
        {src ? (
            <Image src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
            <span className="text-sm font-medium text-gray-600">{fallback || '?'}</span>
        )}
        </div>
    );
};

const AvatarImage = ({ src, alt }: { src?: string; alt?: string }) => {
    if (!src) return null;
    return <Image src={src} alt={alt} className="h-full w-full object-cover" />;
    };

    const AvatarFallback = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => {
    return (
        <span className={`text-sm font-medium text-gray-600 ${className}`}>
        {children}
        </span>
    );
    };

export { Avatar, AvatarImage, AvatarFallback };