import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clsx } from 'clsx';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  amount?: number;
}

export function Reveal({ children, className, delay = 0, amount = 0.2 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: amount }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [amount, visible]);

  return (
    <div
      ref={ref}
      className={clsx('reveal-luxury', visible && 'is-visible', className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
