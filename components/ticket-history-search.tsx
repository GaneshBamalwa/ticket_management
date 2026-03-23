"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Search, Inbox, MessageSquare, Bell } from "lucide-react";

interface Ticket {
  Ticket_ID: number;
  Subject: string;
  Status: string;
  Priority: string;
  FollowUpCount: number;
}

export function TicketHistorySearch() {
  const [email, setEmail] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/tickets/search?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      setTickets(data.tickets || []);
      setSearched(true);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-accent/25 bg-accent/15 text-accent">
          <Clock className="h-4 w-4" />
        </div>
        <CardTitle>Your Ticket History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Search Form */}
        <div className="mb-6 border-b border-card-border pb-6">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
            <Search className="mr-1.5 inline h-3 w-3" />
            Track Your Ticket
          </p>
          <form onSubmit={handleSearch} className="flex gap-3">
            <Input
              type="email"
              placeholder="Enter your registered email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* Ticket List */}
        {searched ? (
          tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => (
                <div
                  key={ticket.Ticket_ID}
                  className="group rounded-xl border border-card-border bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.05]"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <div>
                      <span className="text-xs text-muted">#{ticket.Ticket_ID}</span>
                      <h4 className="mt-0.5 font-semibold text-white">
                        {ticket.Subject}
                      </h4>
                    </div>
                    <Badge
                      variant={ticket.Status === "Open" ? "open" : "resolved"}
                    >
                      {ticket.Status}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge
                      variant={
                        ticket.Priority === "High"
                          ? "high"
                          : ticket.Priority === "Medium"
                          ? "medium"
                          : "low"
                      }
                    >
                      {ticket.Priority}
                    </Badge>
                    <Link
                      href={`/ticket/${ticket.Ticket_ID}`}
                      className="flex items-center gap-1.5 rounded-lg border border-card-border bg-card px-3 py-1 text-xs text-white/70 transition-colors hover:bg-card-hover hover:text-white"
                    >
                      <MessageSquare className="h-3 w-3" />
                      Chat
                    </Link>
                    {ticket.Status === "Open" && (
                      <button className="flex items-center gap-1.5 rounded-lg border border-warning/25 bg-warning/10 px-3 py-1 text-xs text-yellow-300 transition-colors hover:bg-warning/20">
                        <Bell className="h-3 w-3" />
                        Follow Up
                        {ticket.FollowUpCount > 0 && ` (${ticket.FollowUpCount})`}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState message="No tickets found for this email." />
          )
        ) : (
          <EmptyState message="Search your email to view tickets." />
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-card-border bg-white/[0.03] text-muted">
        <Inbox className="h-6 w-6" />
      </div>
      <p className="text-sm text-muted">{message}</p>
    </div>
  );
}
