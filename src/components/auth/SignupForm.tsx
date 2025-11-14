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
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useRecaptcha();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = signupFormSchema.safeParse({ fullName, email, password, confirmPassword });
    
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
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

      // Execute and verify reCAPTCHA
      const recaptchaToken = await executeRecaptcha('signup');
      if (recaptchaToken) {
        const { supabase } = await import('@/integrations/supabase/client');
        const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('verify-recaptcha', {
          body: { token: recaptchaToken, action: 'signup' }
        });

        if (verifyError || !verifyResult?.valid) {
          toast.error('Security verification failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      const { error } = await signUp(result.data.email, result.data.password, result.data.fullName);

      if (error) {
        toast.error(error.message || "Failed to create account");
      } else {
        toast.success("Account created! Please check your email.");
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
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="John Doe"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          className="focus-ring"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="parent@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="focus-ring"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput
          id="password"
          placeholder="••••••••"
          value={password}
          maxLength={128}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="focus-ring"
        />
        <PasswordStrengthMeter password={password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <PasswordInput
          id="confirmPassword"
          maxLength={128}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className="focus-ring"
        />
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
