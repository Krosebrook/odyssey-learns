import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRecaptcha } from "@/hooks/useRecaptcha";
import { checkServerRateLimit, RATE_LIMITS } from "@/lib/rateLimiter";
import { z } from "zod";

const signupFormSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const SignupForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ fullName?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupFormSchema.safeParse({ fullName, email, password, confirmPassword });
    
    if (!result.success) {
      const fieldErrors: typeof errors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof typeof errors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      // Check rate limit before signup
      const rateLimit = await checkServerRateLimit(
        RATE_LIMITS.SIGNUP.endpoint,
        RATE_LIMITS.SIGNUP.maxRequests,
        RATE_LIMITS.SIGNUP.windowMinutes
      );

      if (!rateLimit.allowed) {
        toast.error(
          `Too many signup attempts. Please wait ${Math.ceil((rateLimit.retryAfter || 0) / 60)} minutes.`,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }

      // Execute reCAPTCHA (graceful - never blocks signup)
      try {
        const recaptchaToken = await executeRecaptcha('signup');
        if (recaptchaToken) {
          const { supabase } = await import('@/integrations/supabase/client');
          const { data: verifyResult } = await supabase.functions.invoke('verify-recaptcha', {
            body: { token: recaptchaToken, action: 'signup' }
          });
          
          if (verifyResult?.suspicious) {
            console.warn('reCAPTCHA flagged suspicious activity:', verifyResult);
            // Continue but activity is logged
          }
        }
      } catch (verifyError) {
        console.warn('reCAPTCHA verification skipped:', verifyError);
        // Continue with signup - reCAPTCHA should never block auth
      }

      const { error } = await signUp(result.data.email, result.data.password, result.data.fullName);

      if (error) {
        if (error.message?.includes('already registered')) {
          toast.error("An account with this email already exists. Please login instead.");
        } else {
          toast.error(error.message || "Failed to create account");
        }
      } else {
        toast.success("Account created successfully!");
        navigate('/parent-setup');
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast.error('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md" noValidate>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          aria-invalid={!!errors.fullName}
          aria-describedby={errors.fullName ? "fullName-error" : undefined}
          className="focus-ring"
        />
        {errors.fullName && (
          <p id="fullName-error" className="text-sm text-destructive" role="alert">
            {errors.fullName}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          name="email"
          type="email"
          placeholder="parent@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "signup-email-error" : undefined}
          className="focus-ring"
        />
        {errors.email && (
          <p id="signup-email-error" className="text-sm text-destructive" role="alert">
            {errors.email}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-password">Password</Label>
        <PasswordInput
          id="signup-password"
          name="password"
          placeholder="••••••••"
          value={password}
          maxLength={128}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((prev) => ({ ...prev, password: undefined }));
          }}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "signup-password-error" : undefined}
          className="focus-ring"
        />
        {errors.password && (
          <p id="signup-password-error" className="text-sm text-destructive" role="alert">
            {errors.password}
          </p>
        )}
        <PasswordStrengthMeter password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          maxLength={128}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
          className="focus-ring"
        />
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
            {errors.confirmPassword}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full hover-scale"
        disabled={loading}
      >
        {loading ? <LoadingSpinner size="sm" /> : "Create Account"}
      </Button>
    </form>
  );
};
