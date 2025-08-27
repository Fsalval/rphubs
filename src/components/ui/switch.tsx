// src/components/ui/switch.tsx
import React from 'react';

type SwitchProps = React.InputHTMLAttributes<HTMLInputElement>;

const Switch = ({ className = '', ...props }: SwitchProps) => {
  return (
    <input
      type="checkbox"
      className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent bg-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-slate-300 ${className}`}
      role="switch"
      {...props}
    />
  );
};

export { Switch };