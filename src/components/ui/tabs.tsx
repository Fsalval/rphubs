// src/components/ui/tabs.tsx
import React, { createContext, useContext, Children } from 'react';

type TabsContextType = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextType | null>(null);

type TabsProps = {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

const Tabs = ({ children, defaultValue, value, onValueChange, className = '' }: TabsProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const selectedValue = value !== undefined ? value : internalValue;
  const handleChange = onValueChange || setInternalValue;

  return (
    <div className={className}>
      <TabsContext.Provider value={{ value: selectedValue, onValueChange: handleChange }}>
        {children}
      </TabsContext.Provider>
    </div>
  );
};

type TabsListProps = React.HTMLAttributes<HTMLDivElement>;
const TabsList = ({ className = '', children, ...props }: TabsListProps) => {
  return (
    <div
      className={`inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

type TabsTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string };
const TabsTrigger = ({ value, children, onClick, ...props }: TabsTriggerProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsTrigger must be used within Tabs');

  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      data-state={isSelected ? 'active' : 'inactive'}
      onClick={(e) => {
        onValueChange(value);
        onClick?.(e);
      }}
      className={`inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
        isSelected
          ? 'bg-background text-foreground shadow-sm'
          : 'hover:bg-muted hover:text-muted-foreground'
      }`}
      {...props}
    >
      {children}
    </button>
  );
};

type TabsContentProps = { 
  value: string; 
  children: React.ReactNode; 
  forceMount?: boolean; 
  className?: string; 
};

const TabsContent = ({ value, children, forceMount, className = '' }: TabsContentProps) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabsContent must be used within Tabs');

  const { value: selectedValue } = context;

  if (!forceMount && selectedValue !== value) {
    return null;
  }

  return <div role="tabpanel" className={className}>{children}</div>;
};

export { Tabs, TabsList, TabsTrigger, TabsContent };