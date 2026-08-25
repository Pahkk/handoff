"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  Send,
} from "lucide-react";
import { showAppToast } from "@/lib/client-toast";

type Prompt = { category: string; text: string };
type Message = {
  id: string;
  role: "user" | "opryn";
  text: string;
  headline?: string;
  steps?: string[];
  importantNote?: string;
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

export function AskOpryn({
  hasKnowledge,
  prompts,
  initialQuestion,
}: {
  hasKnowledge: boolean;
  prompts: Prompt[];
  initialQuestion: string;
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [promptPage, setPromptPage] = useState(0);
  const [promptAnimation, setPromptAnimation] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pages = Math.max(1, Math.ceil(prompts.length / 4));
  const visiblePrompts = Array.from({ length: 4 }, (_, index) =>
    prompts.length
      ? prompts[(promptPage * 4 + index) % prompts.length]
      : undefined,
  ).filter((prompt): prompt is Prompt => Boolean(prompt));

  useEffect(() => {
    if (pages <= 1) return;
    const interval = window.setInterval(() => {
      setPromptPage((current) => (current + 1) % pages);
      setPromptAnimation((current) => current + 1);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [pages]);

  async function ask(event?: FormEvent, prompt?: string) {
    event?.preventDefault();
    const value = (prompt ?? question).trim();
    if (!value || loading) return;
    setQuestion("");
    setMessages((current) => [
      ...current,
      { id: crypto.randomUUID(), role: "user", text: value },
    ]);
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
              headline: body.headline,
              text: body.answer,
              steps: body.steps,
              importantNote: body.importantNote,
              type: "answer",
              questionId: body.questionId,
              sources: body.sources,
            }
          : {
              id: crypto.randomUUID(),
              role: "opryn",
              text: "I couldn't find enough approved company knowledge to answer safely.",
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
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  async function escalate(id: string) {
    const response = await fetch(`/api/questions/${id}/escalate`, {
      method: "POST",
    });
    if (!response.ok) return;
    showAppToast(
      "Question sent to the owner!",
      "You’ll get an answer here after they respond.",
    );
    setMessages((current) =>
      current.map((message) =>
        message.questionId === id ? { ...message, sent: true } : message,
      ),
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-180px)] max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#dfe5ed] bg-white shadow-[0_18px_50px_rgba(24,39,75,.06)]">
      <div className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#fbfcfe_0%,#fff_28%)] p-4 sm:p-7">
        {!messages.length ? (
          <div className="flex min-h-[500px] flex-col items-center justify-center text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-[#3158d8] text-white shadow-[0_14px_35px_rgba(49,88,216,.25)]">
              <BookOpen className="size-6" />
            </span>
            <p className="mt-5 text-[11px] font-bold uppercase tracking-[.12em] text-[#3158d8]">
              Your company knowledge
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-.035em] sm:text-3xl">
              What do you need to know?
            </h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#718095]">
              Ask about a process, decision, approval, role, exception, or what
              to learn next. Opryn answers from approved knowledge and shows the
              source.
            </p>
            {hasKnowledge ? (
              <div className="mt-8 w-full max-w-3xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-left text-xs font-semibold text-[#718095]">
                    Questions picked for your company
                  </p>
                  <div className="flex gap-1" aria-label="Question set">
                    {Array.from({ length: pages }, (_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setPromptPage(index);
                          setPromptAnimation((current) => current + 1);
                        }}
                        aria-label={`Show question set ${index + 1}`}
                        className={`h-1.5 rounded-full transition-all ${index === promptPage ? "w-5 bg-[#3158d8]" : "w-1.5 bg-[#ccd3de]"}`}
                      />
                    ))}
                  </div>
                </div>
                <div
                  key={promptAnimation}
                  className="grid animate-[prompt-swap_.45s_ease-out] gap-2 sm:grid-cols-2"
                >
                  {visiblePrompts.map((prompt) => (
                    <button
                      key={`${prompt.category}-${prompt.text}`}
                      onClick={() => void ask(undefined, prompt.text)}
                      className="group rounded-xl border border-[#e0e5ec] bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#9aace4] hover:bg-[#f7f9ff] hover:shadow-sm"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[.09em] text-[#8290a4]">
                        {prompt.category}
                      </span>
                      <span className="mt-1.5 flex items-start justify-between gap-3 text-sm font-medium leading-5 text-[#3f4d63]">
                        {prompt.text}
                        <ChevronRight className="mt-0.5 size-4 shrink-0 text-[#9ba6b5] transition group-hover:translate-x-0.5 group-hover:text-[#3158d8]" />
                      </span>
                    </button>
                  ))}
                </div>
                {pages > 1 ? (
                  <p className="mt-3 text-[10px] text-[#9aa3b0]">
                    New ideas appear every 5 seconds.
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="mt-7 rounded-xl border border-[#eddfbd] bg-[#fffaf0] p-4 text-sm text-[#81631e]">
                <strong>Opryn needs some company knowledge first.</strong>
                <br />
                Add or approve a process before employees start asking
                questions.
              </div>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-4xl space-y-7">
            {messages.map((message) =>
              message.role === "user" ? (
                <div
                  key={message.id}
                  className="ml-auto max-w-[86%] rounded-2xl rounded-br-md bg-[#3158d8] px-4 py-3 text-sm leading-6 text-white shadow-[0_8px_20px_rgba(49,88,216,.16)]"
                >
                  {message.text}
                </div>
              ) : (
                <AnswerCard
                  key={message.id}
                  message={message}
                  onEscalate={escalate}
                />
              ),
            )}
            {loading ? (
              <div className="flex items-center gap-3 rounded-xl border border-[#e4e8ee] bg-[#fafbfd] p-4 text-sm text-[#718095]">
                <span className="grid size-8 place-items-center rounded-lg bg-[#edf2ff] text-[#3158d8]">
                  <LoaderCircle className="size-4 animate-spin" />
                </span>
                <div>
                  <p className="font-medium text-[#48566c]">
                    Checking company knowledge
                  </p>
                  <p className="mt-0.5 text-xs">
                    Finding the most relevant approved sources…
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
      <form
        onSubmit={(event) => void ask(event)}
        className="border-t border-[#e2e7ed] bg-white p-3 sm:p-4"
      >
        <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-xl border border-[#cfd7e2] bg-white p-2 shadow-[0_4px_18px_rgba(24,39,75,.04)] focus-within:border-[#718ee7] focus-within:ring-4 focus-within:ring-[#3158d8]/10">
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
            placeholder="Ask about a process, policy, role, or decision…"
            className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none"
          />
          <button
            disabled={!question.trim() || loading}
            aria-label="Ask Opryn"
            className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#3158d8] text-white transition hover:bg-[#2446b8] disabled:bg-[#c5ccda]"
          >
            <ArrowUp className="size-4" />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-[#909aa8]">
          Opryn only answers from approved company knowledge. If it is not
          documented, Opryn asks instead of guessing.
        </p>
      </form>
    </div>
  );
}

function AnswerCard({
  message,
  onEscalate,
}: {
  message: Message;
  onEscalate: (id: string) => Promise<void>;
}) {
  const unknown = message.type === "unknown";
  return (
    <div className="max-w-[94%]">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-[#3158d8]">
        <span className="grid size-7 place-items-center rounded-lg bg-[#3158d8] text-[11px] font-bold text-white">
          O
        </span>
        Opryn
        {!unknown && message.type === "answer" ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#eaf7f1] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[.07em] text-[#177257]">
            <CheckCircle2 className="size-3" /> Approved sources
          </span>
        ) : null}
      </div>
      <article
        className={`overflow-hidden rounded-2xl rounded-tl-md border ${unknown ? "border-[#ead9ae] bg-[#fffdf7]" : "border-[#dfe5ed] bg-white shadow-[0_10px_30px_rgba(24,39,75,.05)]"}`}
      >
        <div className="p-5 sm:p-6">
          {unknown ? (
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff4d8] text-[#9a681b]">
                <CircleAlert className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold text-[#263348]">
                  I don&apos;t know this yet.
                </h3>
                <p className="mt-1 text-sm leading-6 text-[#6a7484]">
                  {message.text}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[10px] font-bold uppercase tracking-[.1em] text-[#3158d8]">
                Company answer
              </p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-.02em] text-[#263348]">
                {message.headline || "Here’s what your company knowledge says"}
              </h3>
              <p className="mt-3 text-sm leading-6 text-[#56647a]">
                {message.text}
              </p>
              {message.steps?.length ? (
                <div className="mt-5 rounded-xl bg-[#f7f9fc] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[.09em] text-[#758195]">
                    What to do
                  </p>
                  <ol className="mt-3 space-y-3">
                    {message.steps.map((step, index) => (
                      <li
                        key={`${step}-${index}`}
                        className="grid grid-cols-[24px_1fr] gap-2.5 text-sm leading-5 text-[#56647a]"
                      >
                        <span className="grid size-6 place-items-center rounded-lg bg-white text-[10px] font-bold text-[#3158d8] shadow-sm">
                          {index + 1}
                        </span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              ) : null}
              {message.importantNote ? (
                <div className="mt-4 flex gap-3 rounded-xl border border-[#eadfbe] bg-[#fffaf0] p-4">
                  <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#9a681b]" />
                  <div>
                    <p className="text-xs font-semibold text-[#72511b]">
                      Important
                    </p>
                    <p className="mt-1 text-sm leading-5 text-[#74613e]">
                      {message.importantNote}
                    </p>
                  </div>
                </div>
              ) : null}
            </>
          )}
          {unknown && message.canEscalate ? (
            <button
              disabled={message.sent}
              onClick={() => void onEscalate(message.questionId!)}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#3158d8] px-3.5 py-2 text-xs font-semibold text-white disabled:bg-[#7b8dcc]"
            >
              {message.sent ? "Sent to owner" : "Ask Owner"}
              <Send className="size-3.5" />
            </button>
          ) : null}
        </div>
        {message.sources?.length ? (
          <div className="border-t border-[#e1e6ed] bg-[#fafbfd] px-5 py-4 sm:px-6">
            <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[.1em] text-[#758195]">
              <BookOpen className="size-3.5" /> Sources used
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {message.sources.map((source) =>
                source.href ? (
                  <Link
                    key={source.id}
                    href={source.href}
                    className="group rounded-lg border border-[#e1e6ed] bg-white px-3 py-2.5 text-xs font-semibold text-[#3158d8] hover:border-[#aab9e8]"
                  >
                    <span className="flex items-center justify-between gap-2">
                      {source.label}
                      <ChevronRight className="size-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                ) : (
                  <span
                    key={source.id}
                    className="rounded-lg border border-[#e1e6ed] bg-white px-3 py-2.5 text-xs font-semibold text-[#3158d8]"
                  >
                    {source.label}
                  </span>
                ),
              )}
            </div>
          </div>
        ) : null}
      </article>
    </div>
  );
}
