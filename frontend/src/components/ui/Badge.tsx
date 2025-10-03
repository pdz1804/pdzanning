import React from 'react';
import { cn, getPriorityColor, getStatusColor, getPriorityLabel } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'priority' | 'status' | 'default' | 'outline';
  value?: string;
  children?: React.ReactNode;
}

export function Badge({ 
  variant = 'default', 
  value, 
  className, 
  children, 
  ...props 
}: BadgeProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'priority':
        return getPriorityColor(value);
      case 'status':
        return getStatusColor(value || '');
      case 'outline':
        return 'border-gray-300 text-gray-700 bg-transparent';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
        getVariantClasses(),
        className
      )}
      {...props}
    >
      {children ?? (variant === 'priority' && value ? getPriorityLabel(value) : null)}
    </span>
  );
}

