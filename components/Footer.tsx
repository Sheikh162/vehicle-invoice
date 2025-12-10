export default function Footer() {
  return (
    <footer className="border-t py-6 bg-background/50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 text-center text-sm text-muted-foreground md:px-8">
        <p>
          &copy; {new Date().getFullYear()} AutoAudit. AI-Powered Vehicle Service Verification.
        </p>
      </div>
    </footer>
  );
}