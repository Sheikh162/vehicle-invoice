
// src/components/ui/form/CheckboxGroupField.tsx
"use client"

import * as React from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { FieldError } from "react-hook-form"
import { cn } from "@/lib/utils"

interface CheckboxGroupFieldProps {
  label: string
  options: readonly string[]
  value: any/* string[] */
  onChange: (values: string[]) => void
  error?: any/* FieldError */
  required?: boolean
  className?: string
}

export function CheckboxGroupField({
  label,
  options,
  value = [],
  onChange,
  error,
  required = false,
  className = "",
}: CheckboxGroupFieldProps) {

  const handleCheckboxChange = (optionValue: string) => {
    const newValues = value.includes(optionValue)
      ? value.filter((v:any) => v !== optionValue)
      : [...value, optionValue]
    onChange(newValues)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label className={required ? "after:content-['*'] after:ml-0.5 after:text-destructive" : ''}>
        {label}
      </Label>
      <div className="space-y-2">
        {options.map((option) => (
          <div key={option} className="flex items-center gap-2">
            <Checkbox
              id={`${label}-${option}`}
              value={option}
              checked={value.includes(option)}
              onCheckedChange={() => handleCheckboxChange(option)}
            />
            <Label htmlFor={`${label}-${option}`} className="font-normal">
              {option}
            </Label>
          </div>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  )
}