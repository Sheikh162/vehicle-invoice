import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Button } from "./ui/button";

export function Navbar() {
  return (
    <header className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-8">
        <Link href="/">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">
              AutoAudit
            </span>
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="default" size="sm">Sign In</Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">Dashboard</Button>
            </Link>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}