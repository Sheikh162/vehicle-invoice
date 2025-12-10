// src/components/ui/form/FormField.tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  name: string;
  register: UseFormRegisterReturn;
  error?: any/* FieldError */;
  type?: string;
  required?: boolean;
  className?: string;
}

export function FormField({ 
  label, 
  name, 
  register, 
  error, 
  type = "text", 
  required = false, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={cn("grid w-full max-w-sm items-center gap-1.5", className)}>
      <Label htmlFor={name} className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ''}>
        {label}
      </Label>
      <Input type={type} id={name} {...register} min={type === "number" ? "0" : undefined} // need to prevent -ve integers from being allowed
      />
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}