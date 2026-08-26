import Image from "next/image";
import { CircleHelp, Network } from "lucide-react";
import { EmptyState, PageHeading } from "@/components/app/page-heading";
import { OwnerAnswer } from "@/components/app/owner-answer";
import { KnowledgeTree } from "@/components/app/process-intelligence";
import { requireAdminContext } from "@/lib/app-context";
import { createClient } from "@/lib/supabase/server";

export default async function KnowledgeGraphPage() {
  const context = await requireAdminContext();
  const supabase = await createClient();
  const organizationId = context.organization.id;
  const [processes, chunks, assignments, roles, questions, attachments] =
    await Promise.all([
      supabase
        .from("processes")
        .select("id,title,summary")
        .eq("organization_id", organizationId)
        .eq("status", "approved")
        .order("updated_at", { ascending: false }),
      supabase
        .from("knowledge_chunks")
        .select("id,content,source_type,process_id")
        .eq("organization_id", organizationId)
        .eq("approved", true)
        .order("created_at"),
      supabase
        .from("process_role_assignments")
        .select("process_id,role_id")
        .eq("organization_id", organizationId),
      supabase
        .from("roles")
        .select("id,name")
        .eq("organization_id", organizationId),
      supabase
        .from("employee_questions")
        .select(
          "id,question,created_at,escalated,profiles!employee_questions_asked_by_fkey(full_name,email)",
        )
        .eq("organization_id", organizationId)
        .eq("status", "needs_owner")
        .order("created_at", { ascending: false }),
      supabase
        .from("question_attachments")
        .select("id,question_id,storage_path,original_name")
        .eq("organization_id", organizationId),
    ]);
  const error = [
    processes.error,
    chunks.error,
    assignments.error,
    roles.error,
    questions.error,
    attachments.error,
  ].find(Boolean);
  if (error) {
    console.error("Unable to load knowledge graph", { code: error.code });
    throw new Error("Unable to load the company knowledge graph.");
  }
  const roleNames = new Map(
    (roles.data ?? []).map((role) => [role.id, role.name]),
  );
  const gapPeople = new Map<string, string>();
  for (const question of questions.data ?? []) {
    const raw = question.profiles as unknown;
    const profile = (Array.isArray(raw) ? raw[0] : raw) as {
      full_name: string | null;
      email: string;
    } | null;
    gapPeople.set(
      question.id,
      profile?.full_name || profile?.email || "a teammate",
    );
  }
  const attachmentUrls = new Map<string, string>();
  await Promise.all(
    (attachments.data ?? []).map(async (attachment) => {
      const { data } = await supabase.storage
        .from("ask-images")
        .createSignedUrl(attachment.storage_path, 60 * 60);
      if (data?.signedUrl)
        attachmentUrls.set(attachment.question_id, data.signedUrl);
    }),
  );
  const knowledgeProcesses = [
    ...(processes.data ?? []).map((process) => ({
      ...process,
      chunks: (chunks.data ?? []).filter(
        (chunk) => chunk.process_id === process.id,
      ),
      roles: (assignments.data ?? [])
        .filter((assignment) => assignment.process_id === process.id)
        .map((assignment) => roleNames.get(assignment.role_id))
        .filter((name): name is string => Boolean(name)),
    })),
    ...((chunks.data ?? []).some((chunk) => !chunk.process_id)
      ? [
          {
            id: "owner-guidance",
            title: "Rules learned from owner answers",
            summary:
              "Reusable company knowledge captured when the owner answered a team question.",
            href: "#knowledge-gaps",
            roles: [] as string[],
            chunks: (chunks.data ?? []).filter((chunk) => !chunk.process_id),
          },
        ]
      : []),
  ];
  const gapNodes = (questions.data ?? []).map((question) => ({
    id: question.id,
    question: question.question,
    person: gapPeople.get(question.id) ?? "a teammate",
    imageUrl: attachmentUrls.get(question.id),
  }));

  return (
    <>
      <PageHeading
        eyebrow="Live company knowledge"
        title="Knowledge Graph"
        description="See how every approved process, rule, role, and owner answer connects—and where your team still needs help."
      />
      <KnowledgeTree
        organizationName={context.organization.name}
        processes={knowledgeProcesses}
        gaps={gapNodes}
      />

      <section id="knowledge-gaps" className="mt-7 scroll-mt-24">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.1em] text-[#a04e55]">
              <CircleHelp className="size-4" /> Open gaps
            </p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-.03em]">
              Teach Opryn what is missing
            </h2>
          </div>
          <p className="text-xs text-[#718095]">
            Every approved answer becomes a reusable graph node.
          </p>
        </div>
        {!questions.data?.length ? (
          <EmptyState
            icon={<Network className="size-5" />}
            title="Your graph has no open gaps."
            description="As your team asks new questions, missing knowledge will appear here and connect to the graph."
          />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {questions.data.map((question) => (
              <section
                id={`gap-${question.id}`}
                key={question.id}
                className="scroll-mt-24 rounded-2xl border border-[#e4d6d8] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#fff0f1] text-[#ae4d55]">
                    <CircleHelp className="size-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#a04e55]">
                      Needs owner answer
                    </p>
                    <h3 className="mt-2 font-semibold leading-6">
                      {question.question}
                    </h3>
                    <p className="mt-2 text-xs text-[#7a8698]">
                      Asked by {gapPeople.get(question.id)} ·{" "}
                      {new Date(question.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {attachmentUrls.get(question.id) ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-[#e3e7ed] bg-[#f7f9fc]">
                    <Image
                      src={attachmentUrls.get(question.id)!}
                      alt={`Case attached by ${gapPeople.get(question.id) ?? "a teammate"}`}
                      width={960}
                      height={720}
                      unoptimized
                      className="max-h-80 w-full object-contain"
                    />
                    <p className="border-t border-[#e3e7ed] px-3 py-2 text-[10px] font-medium text-[#718095]">
                      Photo attached by the employee
                    </p>
                  </div>
                ) : null}
                <OwnerAnswer questionId={question.id} />
              </section>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
