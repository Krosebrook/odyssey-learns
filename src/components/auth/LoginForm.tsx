import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { loginSchema } from "@/lib/schemas/auth";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { checkServerRateLimit, RATE_LIMITS } from "@/lib/rateLimiter";

export const LoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn } = useAuth();
  const { executeRecaptcha } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate input with Zod
    const validation = loginSchema.safeParse({ email, password });
    
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === 'email') fieldErrors.email = err.message;
        if (err.path[0] === 'password') fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Check rate limit before attempting login
      const rateLimit = await checkServerRateLimit(
        RATE_LIMITS.LOGIN.endpoint,
        RATE_LIMITS.LOGIN.maxRequests,
        RATE_LIMITS.LOGIN.windowMinutes
      );

      if (!rateLimit.allowed) {
        toast.error(
          `Too many login attempts. Please wait ${Math.ceil((rateLimit.retryAfter || 0) / 60)} minutes.`,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }

      // Execute reCAPTCHA (graceful - never blocks login)
      try {
        const recaptchaToken = await executeRecaptcha('login');
        if (recaptchaToken) {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: verifyResult } = await supabase.functions.invoke('verify-recaptcha', {
            body: { token: recaptchaToken, action: 'login' }
          });
          
          if (verifyResult?.suspicious) {
            console.warn('reCAPTCHA flagged suspicious activity:', verifyResult);
            // Continue with login but activity is logged
          }
        }
      } catch (verifyError) {
        console.warn('reCAPTCHA verification skipped:', verifyError);
        // Continue with login - reCAPTCHA should never block auth
      }

      const { error } = await signIn(validation.data.email, validation.data.password);

      if (error) {
        // Generic error message to prevent user enumeration
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        // Navigation is handled by Auth page via useEffect watching user state
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="parent@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="focus-ring"
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <Link to="/reset-password" className="text-sm text-primary hover:underline">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          placeholder="••••••••"
          value={password}
          maxLength={128}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "password-error" : undefined}
          className="focus-ring"
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full hover-scale"
        disabled={loading}
      >
        {loading ? <LoadingSpinner size="sm" /> : "Sign In"}
      </Button>
    </form>
  );
};
