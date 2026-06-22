// src/components/ui/radio-group.tsx
import React from 'react';

type RadioGroupProps = React.FieldsetHTMLAttributes<HTMLFieldSetElement>;

const RadioGroup = ({ className = '', ...props }: RadioGroupProps) => {
  return <fieldset className={`grid gap-2 ${className}`} {...props} />;
};

type RadioGroupItemProps = React.InputHTMLAttributes<HTMLInputElement>;

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <input
        type="radio"
        className={`aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        ref={ref}
        {...props}
      />
    );
  }
);
RadioGroupItem.displayName = 'RadioGroupItem';

export { RadioGroup, RadioGroupItem };