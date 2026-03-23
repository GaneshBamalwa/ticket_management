import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard, MessageSquare, Filter, Inbox } from "lucide-react";
import { getAllTickets } from "@/lib/db";

interface Ticket {
  Ticket_ID: number;
  Subject: string;
  Description: string;
  Status: string;
  Priority: string;
  FollowUpCount: number;
  Created_Date: string;
  Agent_ID: number | null;
}

export default function DashboardPage() {
  // For demo, show all tickets (in production, this would be auth-protected)
  const tickets = getAllTickets(undefined, "Administrator") as Ticket[];

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-widest text-primary">
            <span className="mr-2 inline-block h-1 w-1 rounded-full bg-primary" />
            Staff Portal
          </p>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-extrabold text-white">
            Dashboard
          </h1>
        </div>
        <div className="flex gap-3">
          <Button variant="ghost" size="sm">
            <Filter className="h-4 w-4" />
            Filter
          </Button>
        </div>
      </div>

      {/* Tickets Table */}
      {tickets.length > 0 ? (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary-dim text-primary">
              <LayoutDashboard className="h-4 w-4" />
            </div>
            <CardTitle>All Tickets</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="px-6 py-4 text-left font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-wider text-muted">
                      ID
                    </th>
                    <th className="px-6 py-4 text-left font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-wider text-muted">
                      Subject
                    </th>
                    <th className="px-6 py-4 text-left font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-wider text-muted">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-wider text-muted">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right font-[family-name:var(--font-syne)] text-xs font-semibold uppercase tracking-wider text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-card-border/50">
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.Ticket_ID}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        ticket.FollowUpCount > 0 ? "bg-danger/5" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-sm text-muted">
                        #{ticket.Ticket_ID}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white">
                            {ticket.Subject}
                          </span>
                          {ticket.FollowUpCount > 0 && (
                            <Badge variant="high" className="text-[10px]">
                              {ticket.FollowUpCount} follow-ups
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted line-clamp-1">
                          {ticket.Description}
                        </p>
                      </td>
                      <td className="px-6 py-4">
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
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            ticket.Status === "Open" ? "open" : "resolved"
                          }
                        >
                          {ticket.Status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/ticket/${ticket.Ticket_ID}`}>
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                            Open Chat
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-card-border bg-white/[0.03] text-muted">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="mb-2 font-[family-name:var(--font-syne)] font-bold text-muted">
              No tickets found
            </h3>
            <p className="text-sm text-muted-foreground">
              Check back later or adjust your filters.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <p className="mt-4 text-sm text-muted">
        {tickets.length} ticket{tickets.length !== 1 ? "s" : ""} total
      </p>
      </div>
    </div>
  );
}
