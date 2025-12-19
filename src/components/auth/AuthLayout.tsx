import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

/**
 * Shared layout for authentication pages
 * Provides consistent background, centering, and responsive padding
 */
export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        {children}
      </div>
    </div>
  );
};
