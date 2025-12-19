import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { FormField } from "@/components/auth/FormField";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Mail, CheckCircle } from "lucide-react";
import { checkServerRateLimit, RATE_LIMITS } from "@/lib/rateLimiter";

const ResetPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const rateLimit = await checkServerRateLimit(
        RATE_LIMITS.PASSWORD_RESET.endpoint,
        RATE_LIMITS.PASSWORD_RESET.maxRequests,
        RATE_LIMITS.PASSWORD_RESET.windowMinutes
      );

      if (!rateLimit.allowed) {
        toast.error(
          `Too many reset attempts. Please wait ${Math.ceil((rateLimit.retryAfter || 0) / 60)} minutes.`,
          { duration: 8000 }
        );
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (error) {
        if (error.message?.toLowerCase().includes("rate limit") || 
            error.message?.toLowerCase().includes("too many requests")) {
          toast.error(
            "Too many reset attempts. Please wait 1 hour before trying again.",
            { duration: 8000 }
          );
        } else if (error.message?.toLowerCase().includes("email") && 
                   error.message?.toLowerCase().includes("not found")) {
          // Don't reveal if email exists (security best practice)
          setEmailSent(true);
          toast.success("If that email is registered, you'll receive a reset link.");
        } else {
          toast.error(error.message || "Failed to send reset email");
        }
      } else {
        setEmailSent(true);
        toast.success("Password reset email sent! Check your inbox.");
      }
    } catch (error) {
      console.error("Password reset error:", error);
      toast.error("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-4">
        <BackButton to="/login" />

        <Card className="elevated-card">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                {emailSent ? (
                  <CheckCircle className="h-7 w-7 text-success" />
                ) : (
                  <Mail className="h-7 w-7 text-primary" />
                )}
              </div>
            </div>
            <CardTitle>Reset Your Password</CardTitle>
            <CardDescription>
              {emailSent
                ? "We've sent you a password reset link"
                : "Enter your email address and we'll send you a reset link"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  Check your email for a link to reset your password. If it doesn't 
                  appear within a few minutes, check your spam folder.
                </p>
                <Button 
                  onClick={() => setEmailSent(false)} 
                  variant="outline" 
                  className="w-full"
                >
                  Try a different email
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormField
                  id="reset-email"
                  label="Email Address"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={setEmail}
                  required
                  autoComplete="email"
                />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <LoadingSpinner size="sm" /> : "Send Reset Link"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
