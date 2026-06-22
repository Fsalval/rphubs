// src/components/ui/dialog.tsx
import React from 'react';

type DialogProps = {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  return <div>{children}</div>;
};

const DialogTrigger = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div>;
};

const DialogContent = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-lg">
        {children}
      </div>
    </div>
  );
};

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="mb-4">{children}</div>;
};

const DialogTitle = ({ children }: { children: React.ReactNode }) => {
  return <h2 className="text-lg font-bold">{children}</h2>;
};

const DialogDescription = ({ children }: { children: React.ReactNode }) => {
  return <p className="text-sm text-muted-foreground">{children}</p>;
};

const DialogFooter = ({ children }: { children: React.ReactNode }) => {
  return <div className="mt-4 flex justify-end">{children}</div>;
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
