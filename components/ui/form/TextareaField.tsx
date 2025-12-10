// src/components/ui/form/TextareaField.tsx
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

interface TextareaFieldProps {
  label: string;
  name: string;
  register: UseFormRegisterReturn;
  error?: any;
  required?: boolean;
  className?: string;
}

export function TextareaField({ label, name, register, error, required = false, className = '' }: TextareaFieldProps) {
  return (
    <div className={cn("grid w-full gap-1.5", className)}>
      <Label htmlFor={name} className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ''}>
        {label}
      </Label>
      <Textarea id={name} {...register} />
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}


/* 
// src/components/ui/form/TextareaField.tsx
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { cn } from "@/lib/utils";

interface TextareaFieldProps {
  label: string;
  name: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  required?: boolean;
  className?: string;
}

export function TextareaField({ 
  label, 
  name, 
  register, 
  error, 
  required = false, 
  className = '' 
}: TextareaFieldProps) {
  return (
    <div className={cn("grid w-full gap-1.5", className)}>
      <Label htmlFor={name} className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ''}>
        {label}
      </Label>
      <Textarea id={name} {...register} />
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}


*/