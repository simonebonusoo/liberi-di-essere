import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'navbar' | 'cta';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary:
    'btn-luxury-primary bg-brand-700 text-white hover:bg-brand-800 focus-visible:ring-brand-500 shadow-sm',
  secondary:
    'btn-luxury-secondary bg-accent-500 text-brand-900 hover:bg-accent-600 focus-visible:ring-accent-500 shadow-sm',
  outline:
    'btn-luxury-outline border border-brand-300 text-brand-800 bg-white hover:bg-brand-50 focus-visible:ring-brand-400',
  ghost: 'btn-luxury-ghost text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-400',
  danger: 'btn-luxury-danger bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm',
  navbar: 'btn-luxury-navbar text-brand-700 hover:bg-brand-100 focus-visible:ring-brand-400',
  cta: 'btn-luxury-cta bg-gradient-to-r from-accent-500 via-accent-400 to-accent-500 text-brand-950 shadow-soft focus-visible:ring-accent-500',
};

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-4 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, fullWidth, className, children, disabled, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex min-h-10 items-center justify-center font-semibold transition duration-200 ease-out',
        'btn-luxury relative isolate overflow-hidden hover:-translate-y-px active:translate-y-0 active:scale-[0.985]',
        '[&_svg]:shrink-0 [&_svg]:transition-transform [&_svg]:duration-200 hover:[&_svg]:translate-x-0.5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
