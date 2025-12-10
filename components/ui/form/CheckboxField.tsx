
// src/components/ui/form/CheckboxField.tsx
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

interface CheckboxFieldProps {
  label: string;
  name: string;
  // Note: Checkbox with react-hook-form is best used with <Controller>
  // So we adjust props slightly.
  checked: any;
  onCheckedChange: (checked: any) => void;
  error?: any/* FieldError */;
  className?: string;
}

export function CheckboxField({ 
  label, 
  name, 
  checked,
  onCheckedChange,
  error,
  className = ''
}: CheckboxFieldProps) {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <Checkbox 
        id={name} 
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
      <Label htmlFor={name} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
        {label}
      </Label>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}
