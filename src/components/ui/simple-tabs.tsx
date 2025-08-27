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
              onClick: () => setActiveTab(child.props.value),
            });
          }
          return null;
        })}
      </SimpleTabs.List>

      <div className="mt-6">
        {React.Children.map(children, (child) => {
          if (!React.isValidElement(child)) return null;
          if (child.type === SimpleTabs.Content) {
            if (child.props.value === activeTab || child.props.forceMount) {
              return <div>{child.props.children}</div>;
            }
            return null;
          }
          return null;
        })}
      </div>
    </div>
  );
};

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
  // Este componente no renderiza nada por sí solo
  return null;
};

export { SimpleTabs };