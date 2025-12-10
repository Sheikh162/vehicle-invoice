"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { FieldError } from "react-hook-form"

interface DatePickerFieldProps {
    label: string;
    date: any//Date | undefined;
    setDate: (date: Date | undefined) => void;
    error?: any//FieldError;
    required?: boolean;
    className?: string;
}

export function DatePickerField({ label, date, setDate, error, required = false, className = '' }: DatePickerFieldProps) {
  return (
    <div className={cn("grid w-full max-w-sm items-center gap-1.5", className)}>
        <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ''}>{label}</Label>
        <Popover>
        <PopoverTrigger asChild>
            <Button
            variant={"outline"}
            className={cn(
                "w-[280px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
            )}
            >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                captionLayout="dropdown"
            />
        </PopoverContent>
        </Popover>
        {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  )
}
