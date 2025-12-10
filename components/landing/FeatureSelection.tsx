import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, ShieldCheck, FileText } from "lucide-react";

const features = [
  {
    icon: <Zap size={24} className="text-primary" />,
    title: "Instant Extraction",
    description: "Just snap a photo or upload a PDF. We extract line items, part numbers, and costs in seconds using GPT-4o.",
  },
  {
    icon: <ShieldCheck size={24} className="text-primary" />,
    title: "Warranty Guard",
    description: "We automatically flag parts that should be covered under standard manufacturer warranties based on your car's age.",
  },
  {
    icon: <FileText size={24} className="text-primary" />,
    title: "Price Benchmarking",
    description: "Compare your labor and part costs against market averages for your specific car model to spot markups.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="mx-auto w-full max-w-7xl py-12 md:py-16 px-4">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Why AutoAudit?</h2>
        <p className="mt-4 text-muted-foreground">Three ways we save you money.</p>
      </div>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
        {features.map((feature) => (
          <Card 
            key={feature.title}
            className="transition-all duration-300 hover:border-primary hover:shadow-lg hover:shadow-primary/10 bg-card/50 backdrop-blur-sm"
          >
            <CardHeader className="items-center text-center space-y-4">
              <div className="p-3 bg-background rounded-full border">{feature.icon}</div>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}