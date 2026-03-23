"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Send, CheckCircle, Mail } from "lucide-react";

export function RaiseTicketForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email"),
          subject: formData.get("subject"),
          priority: formData.get("priority"),
          description: formData.get("description"),
        }),
      });

      if (response.ok) {
        setSuccess(true);
        (e.target as HTMLFormElement).reset();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to submit ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="bg-primary/5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/20 bg-primary-dim text-primary">
          <Plus className="h-4 w-4" />
        </div>
        <CardTitle>New Support Ticket</CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-lg border border-success/20 bg-success/10 p-4 text-emerald-300">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm">Ticket submitted successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Your Email"
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            required
          />

          <Input
            label="Subject"
            id="subject"
            name="subject"
            type="text"
            placeholder="Brief summary of your issue"
            required
          />

          <Select label="Priority" id="priority" name="priority" defaultValue="Medium">
            <option value="Low">Low - Not urgent</option>
            <option value="Medium">Medium - Needs attention</option>
            <option value="High">High - Urgent</option>
          </Select>

          <Textarea
            label="Description"
            id="description"
            name="description"
            placeholder="Describe your issue in detail..."
            rows={4}
            required
          />

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            <Send className="h-4 w-4" />
            {isSubmitting ? "SUBMITTING..." : "SUBMIT TICKET"}
          </Button>
        </form>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs text-muted">
          <Mail className="h-3.5 w-3.5" />
          A confirmation will be sent to your email.
        </p>
      </CardContent>
    </Card>
  );
}
