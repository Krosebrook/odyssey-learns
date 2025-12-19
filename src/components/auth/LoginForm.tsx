import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/FormField";
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
    
    const validation = loginSchema.safeParse({ email, password });
    
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
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
        const recaptchaToken = await executeRecaptcha("login");
        if (recaptchaToken) {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: verifyResult } = await supabase.functions.invoke("verify-recaptcha", {
            body: { token: recaptchaToken, action: "login" }
          });
          
          if (verifyResult?.suspicious) {
            console.warn("reCAPTCHA flagged suspicious activity:", verifyResult);
          }
        }
      } catch (verifyError) {
        console.warn("reCAPTCHA verification skipped:", verifyError);
      }

      const { error } = await signIn(validation.data.email, validation.data.password);

      if (error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md" noValidate>
      <FormField
        id="login-email"
        label="Email"
        type="email"
        placeholder="parent@example.com"
        value={email}
        onChange={(value) => {
          setEmail(value);
          setErrors((prev) => ({ ...prev, email: undefined }));
        }}
        error={errors.email}
        autoComplete="email"
      />

      <FormField
        id="login-password"
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(value) => {
          setPassword(value);
          setErrors((prev) => ({ ...prev, password: undefined }));
        }}
        error={errors.password}
        maxLength={128}
        autoComplete="current-password"
        labelExtra={
          <Link 
            to="/reset-password" 
            className="text-sm text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          >
            Forgot password?
          </Link>
        }
      />

      <Button type="submit" className="w-full hover-scale" disabled={loading}>
        {loading ? <LoadingSpinner size="sm" /> : "Sign In"}
      </Button>
    </form>
  );
};
