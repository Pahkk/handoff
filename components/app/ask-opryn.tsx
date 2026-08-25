"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { ArrowUp, BookOpen, LoaderCircle, Send, Sparkles } from "lucide-react";
type Message = {
  id: string;
  role: "user" | "opryn";
  text: string;
  type?: "answer" | "unknown";
  questionId?: string;
  canEscalate?: boolean;
  sent?: boolean;
  sources?: Array<{
    id: string;
    label: string;
    href: string | null;
    content: string;
  }>;
};
const prompts = [
  "How do I create a new customer?",
  "Can I give someone a discount?",
  "What should I do if an invoice is overdue?",
  "Who approves refunds?",
];
export function AskOpryn({ hasKnowledge }: { hasKnowledge: boolean }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  async function ask(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const value = (prompt ?? question).trim();
    if (!value || loading) return;
    setQuestion("");
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      text: value,
    };
    setMessages((current) => [...current, userMessage]);
    setLoading(true);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ question: value }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Opryn could not answer.");
      setMessages((current) => [
        ...current,
        body.type === "answer"
          ? {
              id: crypto.randomUUID(),
              role: "opryn",
              text: body.answer,
              type: "answer",
              questionId: body.questionId,
              sources: body.sources,
            }
          : {
              id: crypto.randomUUID(),
              role: "opryn",
              text: "I couldn't find an approved company policy that answers this question.",
              type: "unknown",
              questionId: body.questionId,
              canEscalate: body.canEscalate,
            },
      ]);
    } catch (caught) {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "opryn",
          text:
            caught instanceof Error ? caught.message : "Something went wrong.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }
  async function escalate(id: string) {
    const response = await fetch(`/api/questions/${id}/escalate`, {
      method: "POST",
    });
    if (!response.ok) return;
    setMessages((current) =>
      current.map((message) =>
        message.questionId === id ? { ...message, sent: true } : message,
      ),
    );
  }
  return (
    <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-[#dfe5ed] bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 sm:p-7">
        {!messages.length ? (
          <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
            <span className="grid size-12 place-items-center rounded-2xl bg-[#3158d8] text-white shadow-[0_12px_30px_rgba(49,88,216,.22)]">
              <Sparkles className="size-5" />
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-.035em]">
              Ask anything about how your company works.
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#718095]">
              Opryn answers from approved company knowledge and shows where the
              answer came from.
            </p>
            {hasKnowledge ? (
              <div className="mt-7 grid w-full max-w-xl gap-2 sm:grid-cols-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void ask(undefined, prompt)}
                    className="rounded-xl border border-[#e0e5ec] p-3 text-left text-sm text-[#516075] hover:border-[#9aace4] hover:bg-[#f7f9ff]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-7 rounded-xl bg-[#fff8e9] p-4 text-sm text-[#81631e]">
                <strong>Opryn needs some company knowledge first.</strong>
                <br />
                Add or approve a process before employees start asking
                questions.
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((message) =>
              message.role === "user" ? (
                <div
                  key={message.id}
                  className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#3158d8] px-4 py-3 text-sm leading-6 text-white"
                >
                  {message.text}
                </div>
              ) : (
                <div key={message.id} className="max-w-[92%]">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#3158d8]">
                    <span className="grid size-6 place-items-center rounded-lg bg-[#edf2ff]">
                      O
                    </span>
                    Opryn
                  </div>
                  <div
                    className={`rounded-2xl rounded-tl-md border p-4 text-sm leading-6 ${message.type === "unknown" ? "border-[#ead9ae] bg-[#fffdf7]" : "border-[#e0e5ec] bg-[#fafbfd]"}`}
                  >
                    {message.type === "unknown" ? (
                      <h3 className="mb-1 font-semibold text-[#263348]">
                        I don&apos;t know this yet.
                      </h3>
                    ) : null}
                    <p>{message.text}</p>
                    {message.sources?.length ? (
                      <div className="mt-4 border-t border-[#e1e6ed] pt-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[.1em] text-[#758195]">
                          <BookOpen className="size-3.5" />
                          Sources
                        </p>
                        {message.sources.map((source) =>
                          source.href ? (
                            <Link
                              key={source.id}
                              href={source.href}
                              className="block rounded-lg px-2 py-1.5 text-xs font-semibold text-[#3158d8] hover:bg-[#edf2ff]"
                            >
                              {source.label}
                            </Link>
                          ) : (
                            <span
                              key={source.id}
                              className="block px-2 py-1.5 text-xs font-semibold text-[#3158d8]"
                            >
                              {source.label}
                            </span>
                          ),
                        )}
                      </div>
                    ) : null}
                    {message.type === "unknown" && message.canEscalate ? (
                      <button
                        disabled={message.sent}
                        onClick={() => void escalate(message.questionId!)}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#3158d8] px-3.5 py-2 text-xs font-semibold text-white disabled:bg-[#7b8dcc]"
                      >
                        {message.sent ? "Sent to owner" : "Ask Owner"}
                        <Send className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ),
            )}
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-[#718095]">
                <LoaderCircle className="size-4 animate-spin" />
                Searching approved company knowledge…
              </div>
            ) : null}
          </div>
        )}
      </div>
      <form
        onSubmit={(event) => void ask(event)}
        className="border-t border-[#e2e7ed] bg-white p-3 sm:p-4"
      >
        <div className="flex items-end gap-2 rounded-xl border border-[#cfd7e2] bg-white p-2 focus-within:border-[#718ee7] focus-within:ring-4 focus-within:ring-[#3158d8]/10">
          <textarea
            ref={inputRef}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void ask();
              }
            }}
            rows={1}
            placeholder="Ask Opryn…"
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          />
          <button
            disabled={!question.trim() || loading}
            aria-label="Ask Opryn"
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#3158d8] text-white disabled:bg-[#c5ccda]"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[#909aa8]">
          Opryn only answers from approved company knowledge.
        </p>
      </form>
    </div>
  );
}
