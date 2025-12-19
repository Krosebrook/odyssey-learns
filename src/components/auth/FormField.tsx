import { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  id: string;
  label: string;
  type?: "text" | "email" | "password";
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  required?: boolean;
  labelExtra?: ReactNode;
  children?: ReactNode;
  autoComplete?: string;
}

/**
 * Reusable form field with label, input, and error handling
 * Supports text, email, and password types with proper accessibility
 */
export const FormField = ({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled,
  maxLength,
  required,
  labelExtra,
  children,
  autoComplete,
}: FormFieldProps) => {
  const errorId = `${id}-error`;
  const InputComponent = type === "password" ? PasswordInput : Input;

  return (
    <div className="space-y-2">
      <div className={cn("flex items-center", labelExtra ? "justify-between" : "")}>
        <Label htmlFor={id}>{label}</Label>
        {labelExtra}
      </div>
      
      <InputComponent
        id={id}
        name={id}
        type={type === "password" ? undefined : type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        maxLength={maxLength}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={error ? errorId : undefined}
        className="focus-ring"
      />
      
      {error && (
        <p id={errorId} className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      
      {children}
    </div>
  );
};
