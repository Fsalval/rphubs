// src/components/ui/simple-tabs.tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

type SimpleTabsProps = {
  defaultValue?: string;
  children: React.ReactNode;
};

type SimpleTabsListProps = {
  children: React.ReactNode;
};

type SimpleTabsTriggerProps = {
  value: string;
  children: React.ReactNode;
  onClick?: () => void;
};

type SimpleTabsContentProps = {
  value: string;
  children: React.ReactNode;
  forceMount?: boolean;
};

const SimpleTabs = ({ defaultValue, children }: SimpleTabsProps) => {
  const [activeTab, setActiveTab] = useState(defaultValue || '');
  return (
    <div className="w-full">
      <SimpleTabs.List>
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          if (child.type === SimpleTabs.Trigger) {
            return React.cloneElement(child, {
              onClick: () => setActiveTab((child.props as { value: string }).value),
            } as any);
          }
          return null;
        })}
      </SimpleTabs.List>

      <div className="mt-6">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          if (child.type === SimpleTabs.Content) {
            const props = child.props as { value: string; forceMount?: boolean; children: React.ReactNode };
            if (props.value === activeTab || props.forceMount) {
              return <div>{props.children}</div>;
            }
            return null;
          }
          return null;
        })}
      </div>
    </div>
  );
};

/* eslint-disable react/display-name */
SimpleTabs.List = ({ children }: SimpleTabsListProps) => (
  <div className="grid w-full grid-cols-4 gap-4">{children}</div>
);

SimpleTabs.Trigger = ({ value, children, onClick }: SimpleTabsTriggerProps) => (
  <Button
    variant="outline"
    onClick={onClick}
    className={`w-full justify-start ${value}`}
  >
    {children}
  </Button>
);

SimpleTabs.Content = ({ value, children, forceMount }: SimpleTabsContentProps) => {
  // Este componente no renderiza nada por sí solo, se maneja en el padre
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _unused = { value, children, forceMount };
  return null;
};

export { SimpleTabs };