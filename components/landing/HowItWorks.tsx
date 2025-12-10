import { Card } from "@/components/ui/card";
import { Upload, ScanSearch, MessageSquare } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Upload Invoice",
    description: "Take a photo of your service bill or upload the PDF directly to the dashboard.",
    icon: <Upload className="h-10 w-10 text-primary" />,
  },
  {
    step: "02",
    title: "AI Analysis",
    description: "Our AI reads every line item, identifying parts, labor, and taxes automatically.",
    icon: <ScanSearch className="h-10 w-10 text-primary" />,
  },
  {
    step: "03",
    title: "Verify & Chat",
    description: "Ask questions like 'Is this oil price fair?' or 'Should this be under warranty?'",
    icon: <MessageSquare className="h-10 w-10 text-primary" />,
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-7xl py-12 md:py-24 px-4">
      <div className="mb-16 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">
          How It Works
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          From photo to savings in three simple steps.
        </p>
      </div>
      
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {steps.map((item, index) => (
          <div key={item.step} className="relative flex flex-col items-center text-center">
            {/* Connector Line (Desktop Only) */}
            {index !== steps.length - 1 && (
              <div className="hidden md:block absolute top-12 left-1/2 w-full h-[2px] bg-border -z-10" />
            )}
            
            <div className="flex h-24 w-24 items-center justify-center rounded-full border bg-background shadow-lg mb-6 z-10">
              {item.icon}
            </div>
            
            <div className="space-y-2 max-w-xs">
              <span className="font-mono text-sm text-primary font-bold">Step {item.step}</span>
              <h3 className="text-xl font-bold">{item.title}</h3>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}