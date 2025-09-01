import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const DropdownMenuContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
} | null>(null);

const useDropdownMenuContext = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) throw new Error('DropdownMenu components must be used within DropdownMenu');
  return context;
};

const DropdownMenu = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div ref={ref} className="relative inline-block">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
};

const DropdownMenuTrigger = ({ children, asChild = false }: { children: React.ReactNode; asChild?: boolean }) => {
  const { open, setOpen } = useDropdownMenuContext();

  const clone = asChild && React.isValidElement(children)
    ? React.cloneElement(children, {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onClick: (e: React.MouseEvent) => {
          setOpen(!open);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (children.props as any).onClick?.(e);
        },
      } as any)
    : null;

  return asChild ? (
    clone
  ) : (
    <div onClick={() => setOpen(!open)}>{children}</div>
  );
};

const DropdownMenuContent = ({ 
  children, 
  align = 'end', 
  className = '' 
}: { 
  children: React.ReactNode; 
  align?: 'start' | 'center' | 'end'; 
  className?: string;
}) => {
  const { open } = useDropdownMenuContext();
  if (!open) return null;

  const alignment = {
    start: 'left-0',
    center: 'left-1/2 transform -translate-x-1/2',
    end: 'right-0',
  }[align];

  return (
    <div
      className={`absolute z-50 mt-2 w-48 rounded-md bg-white shadow-lg border ${alignment} ${className}`}
    >
      {children}
    </div>
  );
};

const DropdownMenuItem = ({ 
  children, 
  onClick, 
  className = '' 
}: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  className?: string;
}) => {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer ${className}`}
    >
      {children}
    </div>
  );
};

const DropdownMenuSeparator = ({ className = '' }: { className?: string }) => {
  return <div className={`h-px bg-gray-200 my-1 ${className}`}></div>;
};

const DropdownMenuLabel = ({ 
  children, 
  className = '' 
}: { 
  children: React.ReactNode; 
  className?: string;
}) => {
  return (
    <div className={`px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider ${className}`}>
      {children}
    </div>
  );
};

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};