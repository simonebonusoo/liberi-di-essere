import type { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  padded?: boolean;
  hover?: boolean;
  as?: 'div' | 'button';
}

export function Card({ children, padded = true, hover, className, as = 'div', ...rest }: CardProps) {
  const Component = as;
  return (
    <Component
      {...(as === 'button' ? { type: 'button' } : {})}
      className={clsx(
        'rounded-2xl border border-brand-100 bg-white shadow-card',
        padded && 'p-5 sm:p-6',
        hover && 'transition duration-300 ease-out hover:-translate-y-1 hover:shadow-soft',
        as === 'button' && 'w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2',
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}
