import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/FormField";
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

type FormErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export const SignupForm = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { executeRecaptcha } = useRecaptcha();

  const clearFieldError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupFormSchema.safeParse({ fullName, email, password, confirmPassword });
    
    if (!result.success) {
      const fieldErrors: FormErrors = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof FormErrors;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
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
        const recaptchaToken = await executeRecaptcha("signup");
        if (recaptchaToken) {
          const { supabase } = await import("@/integrations/supabase/client");
          const { data: verifyResult } = await supabase.functions.invoke("verify-recaptcha", {
            body: { token: recaptchaToken, action: "signup" }
          });
          
          if (verifyResult?.suspicious) {
            console.warn("reCAPTCHA flagged suspicious activity:", verifyResult);
          }
        }
      } catch (verifyError) {
        console.warn("reCAPTCHA verification skipped:", verifyError);
      }

      const { error } = await signUp(result.data.email, result.data.password, result.data.fullName);

      if (error) {
        if (error.message?.includes("already registered")) {
          toast.error("An account with this email already exists. Please login instead.");
        } else {
          toast.error(error.message || "Failed to create account");
        }
      } else {
        toast.success("Account created successfully!");
        navigate("/parent-setup");
      }
    } catch (err) {
      console.error("Signup error:", err);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md" noValidate>
      <FormField
        id="signup-fullName"
        label="Full Name"
        type="text"
        placeholder="John Doe"
        value={fullName}
        onChange={(value) => {
          setFullName(value);
          clearFieldError("fullName");
        }}
        error={errors.fullName}
        autoComplete="name"
      />

      <FormField
        id="signup-email"
        label="Email"
        type="email"
        placeholder="parent@example.com"
        value={email}
        onChange={(value) => {
          setEmail(value);
          clearFieldError("email");
        }}
        error={errors.email}
        autoComplete="email"
      />

      <FormField
        id="signup-password"
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(value) => {
          setPassword(value);
          clearFieldError("password");
        }}
        error={errors.password}
        maxLength={128}
        autoComplete="new-password"
      >
        <PasswordStrengthMeter password={password} />
      </FormField>

      <FormField
        id="signup-confirmPassword"
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        value={confirmPassword}
        onChange={(value) => {
          setConfirmPassword(value);
          clearFieldError("confirmPassword");
        }}
        error={errors.confirmPassword}
        maxLength={128}
        autoComplete="new-password"
      />

      <Button type="submit" className="w-full hover-scale" disabled={loading}>
        {loading ? <LoadingSpinner size="sm" /> : "Create Account"}
      </Button>
    </form>
  );
};
