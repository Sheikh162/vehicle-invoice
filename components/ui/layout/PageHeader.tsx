
// src/components/ui/layout/PageHeader.tsx
import { Button } from "@/components/ui/button";

interface PageHeaderProps {
    title: string;
    actionText?: string;
    onActionClick?: () => void;
}

export function PageHeader({ title, actionText, onActionClick }: PageHeaderProps) {
    return (
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">{title}</h1>
            {actionText && onActionClick && (
                <Button onClick={onActionClick}>{actionText}</Button>
            )}
        </div>
    )
}