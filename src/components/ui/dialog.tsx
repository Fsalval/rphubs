// src/components/ui/dialog.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './button';

type DialogProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => onOpenChange(false)}
      />
      {/* Content */}
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        {children}
      </div>
    </>
  );
};

const DialogTrigger = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  return (
    <div onClick={onClick} className="cursor-pointer">
      {children}
    </div>
  );
};

const DialogContent = ({ 
  children, 
  className = ''
}: { 
  children: React.ReactNode; 
  className?: string;
}) => {
  return (
    <div 
      className={`
        bg-background border rounded-lg shadow-lg max-h-[90vh] overflow-y-auto
        w-full max-w-lg mx-auto relative p-6
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

const DialogHeader = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <div className={`mb-6 ${className}`}>
      {children}
    </div>
  );
};

const DialogTitle = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <h2 className={`text-lg font-semibold leading-none tracking-tight ${className}`}>
      {children}
    </h2>
  );
};

const DialogDescription = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string; 
}) => {
  return (
    <p className={`text-sm text-muted-foreground mt-2 ${className}`}>
      {children}
    </p>
  );
};

const DialogFooter = ({ children }: { children: React.ReactNode }) => {
  return <div className="mt-4 flex justify-end gap-2">{children}</div>;
};

const DialogClose = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
};
