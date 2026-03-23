import { Card, CardContent } from "@/components/ui/card";
import { Code2, Users, Zap, Shield } from "lucide-react";

const developers = [
  {
    name: "Ganesh Bamalwa",
    role: "Full Stack Developer",
    initial: "G",
    gradient: "from-primary to-blue-500",
  },
  {
    name: "Rudransh Kadiveti",
    role: "Backend Developer",
    initial: "R",
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    name: "Manohar Adimalla",
    role: "Frontend Developer",
    initial: "M",
    gradient: "from-amber-400 to-orange-500",
  },
];

const features = [
  {
    icon: Zap,
    title: "Fast Response",
    description: "Our team ensures quick ticket resolution with priority-based handling.",
  },
  {
    icon: Shield,
    title: "Secure Platform",
    description: "Enterprise-grade security to protect your sensitive information.",
  },
  {
    icon: Users,
    title: "Expert Support",
    description: "Dedicated support agents ready to help you 24/7.",
  },
  {
    icon: Code2,
    title: "Modern Stack",
    description: "Built with cutting-edge technologies for the best experience.",
  },
];

export default function AboutPage() {
  return (
    <div className="w-full px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
      {/* Hero Section */}
      <div className="mb-16 text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          About Our Team
        </p>
        <h1 className="mb-4 font-[family-name:var(--font-syne)] text-4xl font-extrabold text-white md:text-5xl text-balance">
          Meet the <span className="text-primary">Developers</span>
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted">
          A passionate team of developers dedicated to building the best customer support experience.
        </p>
      </div>

      {/* Developer Cards */}
      <div className="mb-20 grid gap-8 md:grid-cols-3">
        {developers.map((dev) => (
          <Card
            key={dev.name}
            className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_0_40px_rgba(0,212,255,0.1)]"
          >
            {/* Glow effect */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-accent/10" />
            </div>
            
            <CardContent className="relative pt-10 pb-8 text-center">
              {/* Avatar */}
              <div
                className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${dev.gradient} font-[family-name:var(--font-syne)] text-3xl font-bold text-white shadow-lg`}
              >
                {dev.initial}
              </div>
              
              {/* Info */}
              <h3 className="mb-1 font-[family-name:var(--font-syne)] text-xl font-bold text-white">
                {dev.name}
              </h3>
              <p className="text-sm text-muted">{dev.role}</p>
              
              {/* Decorative line */}
              <div className="mx-auto mt-5 h-0.5 w-12 rounded-full bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Features Section */}
      <div className="mb-12 text-center">
        <h2 className="mb-3 font-[family-name:var(--font-syne)] text-2xl font-bold text-white">
          Why Choose Us?
        </h2>
        <p className="text-muted">
          Built with modern technologies and best practices.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <Card
            key={feature.title}
            className="group transition-all duration-300 hover:border-primary/20 hover:bg-card-hover"
          >
            <CardContent className="pt-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary-dim text-primary transition-all duration-300 group-hover:shadow-[0_0_20px_var(--color-primary-glow)]">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-[family-name:var(--font-syne)] font-bold text-white">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tech Stack */}
      <div className="mt-20 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-widest text-muted">
          Built With
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {["Next.js", "React", "Tailwind CSS", "TypeScript", "SQLite"].map(
            (tech) => (
              <span
                key={tech}
                className="rounded-lg border border-card-border bg-card px-4 py-2 text-sm font-medium text-foreground"
              >
                {tech}
              </span>
            )
          )}
        </div>
      </div>
      </div>
    </div>
  );
}
