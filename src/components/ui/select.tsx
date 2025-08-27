// src/components/ui/select.tsx
import React, { createContext, useContext, useState } from 'react';

const SelectContext = createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

type SelectProps = {
  children: React.ReactNode;
  value?: string;
  onValueChange: (value: string) => void;
};

const Select = ({ children, value, onValueChange }: SelectProps) => {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      {children}
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const context = useContext(SelectContext);
  if (!context) return null;
  const display = context.value || placeholder;
  return <span>{display}</span>;
};

const SelectContent = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-lg ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const SelectItem = ({ children, value, ...props }: { children: React.ReactNode; value: string }) => {
  const context = useContext(SelectContext);
  if (!context) return null;

  const handleClick = () => {
    context.onValueChange(value);
  };

  return (
    <div
      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
      onClick={handleClick}
      {...props}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };