// src/components/ui/alert-dialog.tsx
import React from 'react';

type AlertDialogProps = {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

type AlertDialogTriggerProps = {
  children: React.ReactNode;
  asChild?: boolean;
};

type AlertDialogContentProps = {
  children: React.ReactNode;
};

type AlertDialogHeaderProps = {
  children: React.ReactNode;
};

type AlertDialogTitleProps = {
  children: React.ReactNode;
};

type AlertDialogDescriptionProps = {
  children: React.ReactNode;
};

type AlertDialogFooterProps = {
  children: React.ReactNode;
};

type AlertDialogActionProps = {
  children: React.ReactNode;
  onClick?: () => void;
};

type AlertDialogCancelProps = {
  children: React.ReactNode;
};

const AlertDialog = ({ children }: AlertDialogProps) => {
  return <div>{children}</div>;
};

const AlertDialogTrigger = ({ children, asChild = false }: AlertDialogTriggerProps) => {
  return <div>{children}</div>;
};

const AlertDialogContent = ({ children }: AlertDialogContentProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        {children}
      </div>
    </div>
  );
};

const AlertDialogHeader = ({ children }: AlertDialogHeaderProps) => {
  return <div className="mb-4">{children}</div>;
};

const AlertDialogTitle = ({ children }: AlertDialogTitleProps) => {
  return <h2 className="text-lg font-bold">{children}</h2>;
};

const AlertDialogDescription = ({ children }: AlertDialogDescriptionProps) => {
  return <p className="text-sm text-gray-600">{children}</p>;
};

const AlertDialogFooter = ({ children }: AlertDialogFooterProps) => {
  return <div className="flex justify-end gap-2 mt-6">{children}</div>;
};

const AlertDialogAction = ({ children, onClick }: AlertDialogActionProps) => {
  return (
    <button
      onClick={onClick}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
    >
      {children}
    </button>
  );
};

const AlertDialogCancel = ({ children }: AlertDialogCancelProps) => {
  return (
    <button
      className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 text-sm"
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};