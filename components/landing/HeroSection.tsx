'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { ArrowRight, UploadCloud } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton } from '@clerk/nextjs';

export default function HeroSection() {
  return (
    <section className="w-full py-24 md:py-32 lg:py-40 relative overflow-hidden">
      <motion.div
        className="container mx-auto text-center px-4 relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground hover:bg-primary/80 mb-6">
          v1.0 Public Beta
        </div>
        
        <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
          Stop Overpaying for <br className="hidden sm:inline" />
          Vehicle Service
        </h1>
        
        <h2 className="max-w-[700px] mx-auto text-muted-foreground md:text-xl mt-6">
          Upload your invoice. Our AI instantly checks part prices, labor charges, and warranty validity to ensure you never get ripped off.
        </h2>
        
        <motion.div
          className="mt-10 flex justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <SignedIn>
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 h-12 px-8 text-lg">
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <Button size="lg" className="gap-2 h-12 px-8 text-lg">
                Get Started <ArrowRight className="w-4 h-4" />
              </Button>
            </SignInButton>
          </SignedOut>
          
          <Link href="#how-it-works">
            <Button variant="outline" size="lg" className="h-12 px-8 text-lg">
              How it Works
            </Button>
          </Link>
        </motion.div>
      </motion.div>
      
      {/* Abstract Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl -z-10" />
    </section>
  );
}