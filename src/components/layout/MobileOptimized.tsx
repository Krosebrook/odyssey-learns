import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileOptimizedProps {
  children: ReactNode;
  className?: string;
}

/**
 * Wrapper component that optimizes layout for mobile devices
 */
export const MobileOptimized = ({ children, className }: MobileOptimizedProps) => {
  return (
    <div className={cn(
      // Mobile-first responsive padding
      "px-4 sm:px-6 lg:px-8",
      // Ensure touch targets are large enough (44px minimum)
      "[&_button]:min-h-[44px] [&_a]:min-h-[44px]",
      // Prevent text from being too small on mobile
      "[&_p]:text-base [&_span]:text-base",
      // Optimize for thumb navigation
      "[&_nav]:pb-safe",
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Mobile-optimized grid that collapses to single column on small screens
 */
export const MobileGrid = ({ children, className }: MobileOptimizedProps) => {
  return (
    <div className={cn(
      "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Mobile-optimized card that expands to full width on small screens
 */
export const MobileCard = ({ children, className }: MobileOptimizedProps) => {
  return (
    <div className={cn(
      "w-full p-4 sm:p-6 rounded-lg border bg-card",
      className
    )}>
      {children}
    </div>
  );
};

/**
 * Bottom navigation bar for mobile (sticky at bottom)
 */
export const MobileBottomNav = ({ children, className }: MobileOptimizedProps) => {
  return (
    <div className={cn(
      "md:hidden fixed bottom-0 left-0 right-0 z-50",
      "bg-background border-t shadow-lg",
      "pb-safe", // Safe area for devices with notches
      className
    )}>
      <div className="flex items-center justify-around h-16 px-2">
        {children}
      </div>
    </div>
  );
};
