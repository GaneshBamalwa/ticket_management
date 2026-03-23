import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative z-10 mt-16 border-t border-card-border bg-background/90">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            Customer Support Management System &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6">
            <Link
              href="/about"
              className="text-sm text-muted transition-colors hover:text-primary"
            >
              About Us
            </Link>
            <Link
              href="/"
              className="text-sm text-muted transition-colors hover:text-primary"
            >
              Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
