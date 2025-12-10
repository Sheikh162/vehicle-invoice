// src/components/ui/form/SelectField.tsx
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

// Define a unique constant for the "None" option's value.
const NONE_VALUE = "__NONE__";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  label: string;
  name: string;
  options: any[];
  onValueChange: (value: string | undefined) => void; // Allow undefined for clearing the value
  defaultValue?: any;
  error?: any; 
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function SelectField({ 
  label, 
  name, 
  options, 
  onValueChange, 
  defaultValue, 
  error,
  required = false,
  className = '',
  placeholder
}: SelectFieldProps) {
  const placeholderText = placeholder || `Select ${label}...`;

  // This handler intercepts the change event.
  // If the user selects our special "None" value, we call the form's onChange with `undefined`.
  // Otherwise, we pass the selected value through.
  const handleValueChange = (value: string) => {
    if (value === NONE_VALUE) {
      onValueChange(undefined);
    } else {
      onValueChange(value);
    }
  };

  return (
    <div className={cn("grid w-full max-w-sm items-center gap-1.5", className)}>
      <Label htmlFor={name} className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ''}>
        {label}
      </Label>
      <Select onValueChange={handleValueChange} defaultValue={defaultValue}>
        <SelectTrigger id={name}>
          <SelectValue placeholder={placeholderText} />
        </SelectTrigger>
        <SelectContent>
          {!required && (
            <SelectItem value={NONE_VALUE}>
            {`Select ${label}...`}
            </SelectItem>
          )}
          
          {options.map((option) => {
            const value = typeof option === 'string' ? option : option.value;
            const displayLabel = typeof option === 'string' ? option : option.label;
            return (
              <SelectItem key={value} value={value}>
                {displayLabel}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
}
