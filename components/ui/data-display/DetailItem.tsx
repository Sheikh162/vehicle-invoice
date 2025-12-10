// src/components/ui/data-display/DetailItem.tsx
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DetailItemProps {
    label: string;
    value?: any;
    className?: string;
}

export function DetailItem({ label, value, className }: DetailItemProps) {
    // Determine the display value, providing a fallback for empty, null, or undefined values.
    const displayValue = Array.isArray(value) 
      ? value.join(', ') 
      : value?.toString() || '—';

    // Don't render the component at all if there's no meaningful value to display.
    if (!value || (Array.isArray(value) && value.length === 0)) {
        return null;
    }
    
    return (
        <div className={cn("flex flex-col gap-1", className)}>
            <Label className="text-sm font-medium text-muted-foreground">{label}</Label>
            <p className="text-sm break-words text-foreground">{displayValue}</p>
        </div>
    )
}
