import { RaiseTicketForm } from "@/components/raise-ticket-form";
import { TicketHistorySearch } from "@/components/ticket-history-search";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <p className="mb-3 text-xs font-medium uppercase tracking-widest text-primary">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
          Customer Support Portal
        </p>
        <h1 className="mb-4 font-[family-name:var(--font-syne)] text-4xl font-extrabold text-white md:text-5xl text-balance">
          How can we <span className="text-primary">help you?</span>
        </h1>
        <p className="text-muted">
          Submit a ticket and our team will get back to you shortly.
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RaiseTicketForm />
        <TicketHistorySearch />
      </div>
    </div>
  );
}
