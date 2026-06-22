// src/components/ui/alert.tsx
import React from 'react';

type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'destructive';
};

const Alert = ({ className = '', variant = 'default', ...props }: AlertProps) => {
  return (
    <div
      className={`rounded-lg border border-l-4 p-4 ${
        variant === 'destructive'
          ? 'bg-red-50 border-red-200 border-l-red-500 text-red-700'
          : 'bg-blue-50 border-blue-200 border-l-blue-500 text-blue-700'
      } ${className}`}
      {...props}
    />
  );
};

const AlertDescription = ({ children }: { children: React.ReactNode }) => {
  return <div className="text-sm">{children}</div>;
};

export { Alert, AlertDescription };