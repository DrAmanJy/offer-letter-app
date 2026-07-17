import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 font-sans">
      <header className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-zinc-800 bg-white/50 px-6 backdrop-blur-md dark:bg-zinc-950/50">
        <div className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Offer Letter App
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Go to Dashboard</Button>
          </Link>
        </nav>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl">
            Welcome to the Offer Letter Platform
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            A modern, fast, and secure way to manage and send offer letters. 
            Sign in to access your dashboard and get started.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="h-12 px-8 text-base">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
