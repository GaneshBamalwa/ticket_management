import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-180px)] flex-col items-center justify-center px-4 py-16 text-center">
      <div className="mb-8">
        <h1 className="mb-2 font-[family-name:var(--font-syne)] text-8xl font-extrabold text-primary">
          404
        </h1>
        <h2 className="mb-4 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Page Not Found
        </h2>
        <p className="max-w-md text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>
      <div className="flex gap-4">
        <Link href="/">
          <Button>
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
