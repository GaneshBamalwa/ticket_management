"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  ArrowLeft,
  Home,
  Info,
  User,
  Shield,
  Headset,
  Lock,
} from "lucide-react";

interface Ticket {
  Ticket_ID: number;
  Subject: string;
  Description: string;
  Status: string;
  Priority: string;
  Rating: number | null;
}

interface Message {
  Message_ID: number;
  Ticket_ID: number;
  Sender_Role: string;
  Message_Text: string;
  Timestamp: string;
}

interface ConversationViewProps {
  ticket: Ticket;
  messages: Message[];
}

export function ConversationView({ ticket, messages: initialMessages }: ConversationViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tickets/${ticket.Ticket_ID}/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: newMessage, senderRole: "Customer" }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      day: "numeric",
      month: "short",
    });
  }

  function getRoleIcon(role: string) {
    switch (role) {
      case "Customer":
        return <User className="h-3 w-3" />;
      case "Administrator":
        return <Shield className="h-3 w-3" />;
      default:
        return <Headset className="h-3 w-3" />;
    }
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-card-border bg-primary/5 px-6 py-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted">
            Ticket #{ticket.Ticket_ID}
          </span>
          <h2 className="mt-1 font-[family-name:var(--font-syne)] font-bold text-white">
            {ticket.Subject}
          </h2>
        </div>
        <Badge variant={ticket.Status === "Open" ? "open" : "resolved"}>
          {ticket.Status}
        </Badge>
      </div>

      {/* Chat Box */}
      <div
        ref={chatRef}
        className="flex h-[460px] flex-col gap-3 overflow-y-auto bg-background/40 p-6"
      >
        {/* Issue Description */}
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-cyan-200">
          <strong className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            Issue:
          </strong>{" "}
          {ticket.Description}
        </div>

        {/* Messages */}
        {messages.map((msg) => (
          <div
            key={msg.Message_ID}
            className={`flex ${
              msg.Sender_Role === "Customer" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[78%] rounded-2xl p-4 ${
                msg.Sender_Role === "Customer"
                  ? "bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/25"
                  : "bg-white/5 border border-card-border"
              }`}
            >
              <span
                className={`mb-1.5 flex items-center gap-1.5 text-xs uppercase tracking-wide ${
                  msg.Sender_Role === "Customer"
                    ? "text-primary/70"
                    : "text-muted"
                }`}
              >
                {getRoleIcon(msg.Sender_Role)}
                {msg.Sender_Role === "Customer"
                  ? "Customer"
                  : msg.Sender_Role === "Administrator"
                  ? "Admin"
                  : msg.Sender_Role}
              </span>
              <p className="leading-relaxed text-foreground">{msg.Message_Text}</p>
              <span className="mt-2 block text-right text-xs text-white/25">
                {formatTime(msg.Timestamp)}
              </span>
            </div>
          </div>
        ))}

        {/* Closed Indicator */}
        {ticket.Status === "Resolved" && (
          <div className="py-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-lg border border-card-border bg-white/5 px-4 py-2 text-xs text-muted">
              <Lock className="h-3 w-3" />
              Conversation Closed
            </span>
          </div>
        )}
      </div>

      {/* Reply Box */}
      <div className="border-t border-card-border bg-background/60 p-5">
        {ticket.Status === "Open" ? (
          <form onSubmit={handleSendMessage} className="flex gap-3 items-end">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your reply..."
              rows={2}
              className="flex-1 resize-none"
            />
            <Button type="submit" disabled={isSubmitting || !newMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        ) : (
          <p className="flex items-center justify-center gap-2 text-sm font-semibold text-red-300">
            <Lock className="h-4 w-4" />
            Ticket Resolved - Chat Disabled
          </p>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between border-t border-card-border px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-muted transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Link href="/">
          <Button variant="ghost" size="sm">
            <Home className="h-4 w-4" />
            Home
          </Button>
        </Link>
      </div>
    </Card>
  );
}
