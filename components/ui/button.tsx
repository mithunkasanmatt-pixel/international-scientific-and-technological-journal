'use client';

import * as React from 'react';
import { motion } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', disabled, ...props }, ref) => {
    // Base classes
    let baseClass = 'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none cursor-pointer';
    
    // Variant classes
    const variants = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs',
      destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-xs',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    // Size classes
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 rounded-md px-3',
      lg: 'h-11 rounded-lg px-8',
      icon: 'h-10 w-10',
    };

    const combinedClasses = `${baseClass} ${variants[variant]} ${sizes[size]} ${className}`;

    return (
      <motion.button
        whileTap={disabled ? undefined : { scale: 0.98 }}
        ref={ref}
        disabled={disabled}
        className={combinedClasses}
        {...(props as any)}
      />
    );
  }
);
Button.displayName = 'Button';
