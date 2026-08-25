"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Copy,
  LoaderCircle,
  Mail,
  MoreHorizontal,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { showAppToast } from "@/lib/client-toast";

type Role = {
  id: string;
  name: string;
  description: string;
  processCount: number;
};
type Member = {
  id: string;
  user_id: string;
  permission_level: string;
  role_id: string | null;
  joined_at: string;
  profile: { full_name: string | null; email: string } | null;
  training: { done: number; total: number };
};
type RankedMember = Member & { rank: number };
type Invite = {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  role: { name: string } | null;
};

export function TeamManager({
  organizationName,
  roles,
  members,
  invites,
  invitedCount,
  currentUserId,
}: {
  organizationName: string;
  roles: Role[];
  members: Member[];
  invites: Invite[];
  invitedCount: number;
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteResult, setInviteResult] = useState<{
    url: string;
    delivered: boolean;
  } | null>(null);
  const [updatingMemberId, setUpdatingMemberId] = useState<string | null>(null);
  const [updatingInviteId, setUpdatingInviteId] = useState<string | null>(null);
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      members.map((member) => [member.id, member.role_id ?? ""]),
    ),
  );

  const rankedMembers = useMemo(
    () =>
      [...members]
        .sort((a, b) => {
          const access =
            accessRank(a.permission_level) - accessRank(b.permission_level);
          if (access) return access;
          return trainingPercent(b.training) - trainingPercent(a.training);
        })
        .map((member, index) => ({ ...member, rank: index + 1 })),
    [members],
  );

  async function invite(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/team/invites", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, roleId: roleId || null }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to create this invitation.");
      setInviteResult({ url: body.inviteUrl, delivered: body.delivered });
      showAppToast(
        body.delivered ? "Invitation emailed!" : "Secure invite created!",
        body.delivered
          ? `A sign-in link was sent to ${email}.`
          : "Email delivery was unavailable. Copy the secure link instead.",
      );
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to invite employee.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function update(
    memberId: string,
    nextRole: string,
    permission: string,
    change: "role" | "access",
  ) {
    const previousRole = memberRoles[memberId] ?? "";
    if (change === "role")
      setMemberRoles((current) => ({ ...current, [memberId]: nextRole }));
    setUpdatingMemberId(memberId);
    setError("");
    try {
      const response = await fetch(`/api/team/members/${memberId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          roleId: nextRole || null,
          permissionLevel: permission,
        }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to update this team member.");
      setMemberRoles((current) => ({
        ...current,
        [memberId]: body.member.role_id ?? "",
      }));
      showAppToast(
        change === "role" ? "Role saved!" : "Access updated!",
        change === "role"
          ? "This assignment will remain after refresh and controls their training."
          : "The new workspace access is active.",
      );
      router.refresh();
    } catch (caught) {
      if (change === "role")
        setMemberRoles((current) => ({
          ...current,
          [memberId]: previousRole,
        }));
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update this team member.",
      );
    } finally {
      setUpdatingMemberId(null);
    }
  }

  async function remove(id: string) {
    if (
      !confirm(
        "Remove this person from the workspace? They will lose access immediately.",
      )
    )
      return;
    const response = await fetch(`/api/team/members/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to remove this person.");
      return;
    }
    showAppToast("Team member removed", "Their workspace access is closed.");
    router.refresh();
  }

  async function resend(invite: Invite) {
    setUpdatingInviteId(invite.id);
    setError("");
    try {
      const response = await fetch("/api/team/invites", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inviteId: invite.id }),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(body.error ?? "Unable to resend invitation.");
      setInviteResult({ url: body.inviteUrl, delivered: body.delivered });
      showAppToast(
        body.delivered ? "Invitation sent again!" : "New invite link created!",
        body.delivered
          ? `A fresh sign-in link was sent to ${invite.email}.`
          : "Copy and send the fresh secure link.",
      );
      setOpen(true);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to resend invitation.",
      );
    } finally {
      setUpdatingInviteId(null);
    }
  }

  async function cancelInvite(invite: Invite) {
    if (!confirm(`Cancel the invitation for ${invite.email}?`)) return;
    setUpdatingInviteId(invite.id);
    const response = await fetch("/api/team/invites", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ inviteId: invite.id }),
    });
    setUpdatingInviteId(null);
    if (!response.ok) {
      const body = await response.json();
      setError(body.error ?? "Unable to cancel invitation.");
      return;
    }
    showAppToast(
      "Invitation canceled",
      "That secure link can no longer be used.",
    );
    router.refresh();
  }

  function startInvite() {
    setEmail("");
    setRoleId("");
    setError("");
    setInviteResult(null);
    setOpen(true);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2 text-xs text-[#667184]">
          <Legend color="bg-[#3158d8]" label="Owner / admin" />
          <Legend color="bg-[#35a27c]" label="Assigned role" />
          <Legend
            color="border border-dashed border-[#9aa6b7]"
            label="Invited"
          />
        </div>
        <button
          onClick={startInvite}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#3158d8] px-4 text-sm font-semibold text-white shadow-[0_9px_22px_rgba(49,88,216,.18)] hover:bg-[#2446b8]"
        >
          <Plus className="size-4" />
          Invite Employee
        </button>
      </div>

      {error && !open ? (
        <p
          role="alert"
          className="rounded-xl bg-[#fff0f1] p-3 text-sm text-[#a83f49]"
        >
          {error}
        </p>
      ) : null}

      <TeamTree
        organizationName={organizationName}
        roles={roles}
        members={rankedMembers}
        invites={invites}
        invitedCount={invitedCount}
      />

      <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.1em] text-[#718095]">
              Manage connections
            </p>
            <h2 className="mt-1 text-lg font-semibold">People and access</h2>
          </div>
          <span className="rounded-full bg-[#f1f4f8] px-3 py-1 text-xs font-semibold text-[#627086]">
            {members.length} active
          </span>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {rankedMembers.map((member) => {
            const name = memberName(member);
            const isOwner = member.permission_level === "owner";
            return (
              <article
                key={member.id}
                className="rounded-xl border border-[#e2e7ed] p-4"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{name}</p>
                      <span className="rounded-full bg-[#f1f4f8] px-2 py-0.5 text-[10px] font-bold text-[#6a7689]">
                        #{member.rank}
                      </span>
                    </div>
                    <p className="truncate text-xs text-[#7b8798]">
                      {member.profile?.email}
                    </p>
                  </div>
                  {member.permission_level !== "owner" &&
                  member.user_id !== currentUserId ? (
                    <button
                      onClick={() => void remove(member.id)}
                      aria-label={`Remove ${name}`}
                      className="grid size-8 place-items-center rounded-lg text-[#9a5960] hover:bg-[#fff0f1]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <label className="text-[10px] font-bold uppercase tracking-[.08em] text-[#7b8798]">
                    Job role
                    <select
                      aria-label={`Assigned role for ${name}`}
                      disabled={isOwner || updatingMemberId === member.id}
                      value={memberRoles[member.id] ?? ""}
                      onChange={(event) =>
                        void update(
                          member.id,
                          event.target.value,
                          member.permission_level,
                          "role",
                        )
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-[#cfd8e4] bg-white px-2.5 text-xs font-medium normal-case tracking-normal disabled:bg-[#f5f6f8] disabled:text-[#8993a2]"
                    >
                      <option value="">
                        {isOwner ? "Workspace owner" : "Assign a role…"}
                      </option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-[10px] font-bold uppercase tracking-[.08em] text-[#7b8798]">
                    Access
                    <select
                      disabled={isOwner || member.user_id === currentUserId}
                      value={isOwner ? "owner" : member.permission_level}
                      onChange={(event) =>
                        void update(
                          member.id,
                          memberRoles[member.id] ?? "",
                          event.target.value,
                          "access",
                        )
                      }
                      className="mt-1 h-10 w-full rounded-lg border border-[#cfd8e4] bg-white px-2.5 text-xs font-medium capitalize normal-case tracking-normal disabled:bg-[#f5f6f8]"
                    >
                      <option value="owner" disabled>
                        Owner
                      </option>
                      <option value="admin">Admin</option>
                      <option value="employee">Employee</option>
                    </select>
                  </label>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-[#7a8698]">
                  <span>
                    Training {member.training.done}/{member.training.total}
                  </span>
                  <span>·</span>
                  <span>
                    Joined {new Date(member.joined_at).toLocaleDateString()}
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {invites.length ? (
        <section className="rounded-2xl border border-[#dfe5ed] bg-white p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-[#3158d8]" />
            <h2 className="font-semibold">Pending invitations</h2>
          </div>
          <div className="mt-4 divide-y divide-[#edf0f4]">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex flex-col gap-3 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="mt-1 text-xs text-[#7b8798]">
                    {invite.role?.name ?? "Role not assigned"} · Expires{" "}
                    {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={updatingInviteId === invite.id}
                    onClick={() => void resend(invite)}
                    className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#d8dfe8] px-3 text-xs font-semibold text-[#53627a] disabled:opacity-60"
                  >
                    {updatingInviteId === invite.id ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="size-3.5" />
                    )}
                    Resend
                  </button>
                  <button
                    disabled={updatingInviteId === invite.id}
                    onClick={() => void cancelInvite(invite)}
                    className="min-h-9 rounded-lg px-3 text-xs font-semibold text-[#9a5960] hover:bg-[#fff0f1]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[#0d1729]/45 p-4 backdrop-blur-sm"
          onMouseDown={(event) =>
            event.target === event.currentTarget && setOpen(false)
          }
        >
          <form
            onSubmit={invite}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.1em] text-[#3158d8]">
                  Team invitation
                </p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Invite an employee
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="grid size-9 place-items-center rounded-lg hover:bg-[#f2f4f7]"
              >
                <X className="size-4" />
              </button>
            </div>
            {inviteResult ? (
              <div className="mt-6">
                <div className="flex items-start gap-2 rounded-xl bg-[#eaf7f1] p-3 text-sm text-[#177257]">
                  <Check className="mt-0.5 size-4 shrink-0" />
                  <span>
                    {inviteResult.delivered
                      ? "Invitation emailed. The employee can use the secure sign-in link to join."
                      : "The invitation is ready, but email delivery was unavailable."}
                  </span>
                </div>
                <p className="mt-4 text-sm leading-6 text-[#657286]">
                  You can also copy this one-time link and send it directly.
                </p>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(inviteResult.url);
                    showAppToast("Invite link copied!", "It is ready to send.");
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d5dce6] px-3 py-3 text-sm font-semibold"
                >
                  <Copy className="size-4" />
                  Copy invite link
                </button>
                <button
                  type="button"
                  onClick={startInvite}
                  className="mt-2 min-h-11 w-full rounded-xl text-sm font-semibold text-[#3158d8]"
                >
                  Invite another person
                </button>
              </div>
            ) : (
              <>
                <label className="mt-6 block text-sm font-medium">
                  Work email
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5 outline-none focus:border-[#7190ee] focus:ring-4 focus:ring-[#3158d8]/10"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium">
                  Role
                  <select
                    value={roleId}
                    onChange={(event) => setRoleId(event.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] bg-white px-3.5"
                  >
                    <option value="">Assign later</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </label>
                {error ? (
                  <p role="alert" className="mt-3 text-sm text-[#a83f49]">
                    {error}
                  </p>
                ) : null}
                <button
                  disabled={loading}
                  className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3158d8] text-sm font-semibold text-white disabled:opacity-60"
                >
                  {loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Mail className="size-4" />
                  )}
                  {loading ? "Sending…" : "Send Invitation"}
                </button>
              </>
            )}
          </form>
        </div>
      ) : null}
    </div>
  );
}

function TeamTree({
  organizationName,
  roles,
  members,
  invites,
  invitedCount,
}: {
  organizationName: string;
  roles: Role[];
  members: RankedMember[];
  invites: Invite[];
  invitedCount: number;
}) {
  const branches = [
    {
      id: "leadership",
      name: "Leadership",
      description: "Owner and workspace administrators",
      processCount: 0,
      members: members.filter((member) =>
        ["owner", "admin"].includes(member.permission_level),
      ),
      invites: [] as Invite[],
    },
    ...roles.map((role) => ({
      ...role,
      members: members.filter(
        (member) =>
          member.role_id === role.id && member.permission_level === "employee",
      ),
      invites: invites.filter((invite) => invite.role?.name === role.name),
    })),
    {
      id: "unassigned",
      name: "Role not assigned",
      description: "People waiting for a job role",
      processCount: 0,
      members: members.filter(
        (member) => member.permission_level === "employee" && !member.role_id,
      ),
      invites: invites.filter((invite) => !invite.role),
    },
  ].filter(
    (branch) =>
      branch.id === "leadership" ||
      branch.id === "unassigned" ||
      branch.members.length ||
      branch.invites.length ||
      branch.processCount,
  );

  return (
    <section className="overflow-hidden rounded-2xl border border-[#dfe5ed] bg-white shadow-sm">
      <div className="border-b border-[#e7ebf0] bg-[linear-gradient(135deg,#111d34,#172b52)] p-5 text-white sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[.12em] text-[#aebbd2]">
          Team map
        </p>
        <h2 className="mt-2 text-xl font-semibold tracking-[-.03em]">
          See who owns what—and where each person connects.
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#bdc8da]">
          Ranking follows workspace responsibility first, then completed role
          training. It updates as your team learns.
        </p>
      </div>
      <div className="overflow-x-auto p-5 sm:p-7">
        <div className="mx-auto min-w-0 max-w-[1180px] sm:min-w-[720px]">
          <div className="mx-auto w-full max-w-72 rounded-2xl border border-[#bfcdf3] bg-[#f3f6ff] p-4 text-center shadow-[0_10px_25px_rgba(49,88,216,.1)]">
            <span className="mx-auto grid size-10 place-items-center rounded-xl bg-[#3158d8] text-white">
              <UsersRound className="size-5" />
            </span>
            <p className="mt-3 font-semibold">{organizationName}</p>
            <p className="mt-1 text-xs text-[#6c7890]">
              {Math.max(0, members.length - 1)} teammates · {invitedCount}{" "}
              {invitedCount === 1 ? "invitation" : "invitations"} sent
            </p>
          </div>
          <div className="mx-auto h-8 w-px bg-[#b9c6dc]" />
          <div className="relative pt-5">
            {branches.length > 1 ? (
              <div className="absolute left-[8%] right-[8%] top-0 hidden h-px bg-[#c8d2e2] sm:block" />
            ) : null}
            <div
              className="grid grid-cols-1 items-start gap-4 sm:[grid-template-columns:repeat(var(--team-columns),minmax(210px,1fr))]"
              style={{
                ["--team-columns" as string]: branches.length,
              }}
            >
              {branches.map((branch) => (
                <div
                  key={branch.id}
                  className="relative border-l border-[#c8d2e2] pl-4 pt-4 sm:border-l-0 sm:pl-0"
                >
                  <div className="absolute left-1/2 top-[-20px] hidden h-9 w-px bg-[#c8d2e2] sm:block" />
                  <article className="relative rounded-2xl border border-[#dce3ec] bg-[#fbfcfe] p-3.5">
                    <div className="flex items-start gap-2.5">
                      <span
                        className={`grid size-8 shrink-0 place-items-center rounded-lg ${branch.id === "leadership" ? "bg-[#edf2ff] text-[#3158d8]" : "bg-[#eaf7f1] text-[#208063]"}`}
                      >
                        {branch.id === "leadership" ? (
                          <ShieldCheck className="size-4" />
                        ) : (
                          <UserRound className="size-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold">
                          {branch.name}
                        </h3>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-[#7a8698]">
                          {branch.description}
                        </p>
                      </div>
                    </div>
                    {branch.processCount ? (
                      <p className="mt-3 rounded-lg bg-white px-2.5 py-2 text-[10px] font-semibold text-[#657286]">
                        {branch.processCount} connected processes
                      </p>
                    ) : null}
                    <div className="mt-3 space-y-2 border-t border-[#e7ebf0] pt-3">
                      {branch.members.map((member) => (
                        <MemberNode key={member.id} member={member} />
                      ))}
                      {branch.invites.map((invite) => (
                        <div
                          key={invite.id}
                          className="flex items-center gap-2 rounded-xl border border-dashed border-[#b9c3d1] bg-white p-2.5"
                        >
                          <span className="grid size-7 place-items-center rounded-lg bg-[#f3f5f8] text-[#7a8698]">
                            <Mail className="size-3.5" />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-semibold">
                              {invite.email}
                            </p>
                            <p className="text-[9px] uppercase tracking-[.08em] text-[#8993a2]">
                              Invite pending
                            </p>
                          </div>
                        </div>
                      ))}
                      {!branch.members.length && !branch.invites.length ? (
                        <div className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-[10px] text-[#8a95a5]">
                          <MoreHorizontal className="size-3.5" /> No one
                          connected yet
                        </div>
                      ) : null}
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MemberNode({ member }: { member: RankedMember }) {
  const name = memberName(member);
  const percent = trainingPercent(member.training);
  return (
    <div className="rounded-xl border border-[#e1e6ed] bg-white p-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <Avatar name={name} small />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-semibold">{name}</p>
          <p className="text-[9px] capitalize text-[#7a8698]">
            {member.permission_level}
          </p>
        </div>
        <span className="rounded-full bg-[#edf2ff] px-1.5 py-0.5 text-[9px] font-bold text-[#3158d8]">
          #{member.rank}
        </span>
      </div>
      {member.training.total ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#edf0f4]">
            <div
              className="h-full rounded-full bg-[#35a27c]"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="text-[9px] font-semibold text-[#68758a]">
            {percent}%
          </span>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  return (
    <span
      className={`grid shrink-0 place-items-center rounded-xl bg-[#edf2ff] font-bold text-[#3158d8] ${small ? "size-7 text-[9px]" : "size-10 text-xs"}`}
    >
      {name
        .split(" ")
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()}
    </span>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 shadow-sm">
      <span className={`size-2 rounded-full ${color}`} /> {label}
    </span>
  );
}

function memberName(member: Member) {
  return member.profile?.full_name ?? member.profile?.email ?? "Team member";
}

function accessRank(permission: string) {
  return permission === "owner" ? 0 : permission === "admin" ? 1 : 2;
}

function trainingPercent(training: Member["training"]) {
  return training.total
    ? Math.round((training.done / training.total) * 100)
    : 0;
}
