"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, LoaderCircle, Plus, Trash2, X } from "lucide-react";
import { showAppToast } from "@/lib/client-toast";
type Role = { id: string; name: string };
type Member = {
  id: string;
  user_id: string;
  permission_level: string;
  role_id: string | null;
  joined_at: string;
  profile: { full_name: string | null; email: string } | null;
  training: { done: number; total: number };
};
type Invite = {
  id: string;
  email: string;
  status: string;
  expires_at: string;
  role: { name: string } | null;
};
export function TeamManager({
  roles,
  members,
  invites,
  currentUserId,
}: {
  roles: Role[];
  members: Member[];
  invites: Invite[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  async function invite(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/team/invites", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, roleId: roleId || null }),
    });
    const body = await response.json();
    setLoading(false);
    if (!response.ok) {
      setError(body.error);
      return;
    }
    setInviteUrl(body.inviteUrl);
    showAppToast(
      "Invitation created!",
      "Copy the secure link and send it to your employee.",
    );
    router.refresh();
  }
  async function update(
    memberId: string,
    nextRole: string,
    permission: string,
  ) {
    await fetch(`/api/team/members/${memberId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        roleId: nextRole || null,
        permissionLevel: permission,
      }),
    });
    router.refresh();
  }
  async function remove(id: string) {
    if (
      !confirm(
        "Remove this person from the workspace? They will lose access immediately.",
      )
    )
      return;
    await fetch(`/api/team/members/${id}`, { method: "DELETE" });
    router.refresh();
  }
  return (
    <>
      <div className="mb-5 flex justify-end">
        <button
          onClick={() => setOpen(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#3158d8] px-4 text-sm font-semibold text-white"
        >
          <Plus className="size-4" />
          Invite Employee
        </button>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-[#dfe5ed] bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-[#e7ebf0] bg-[#fafbfd] text-[11px] uppercase tracking-[.08em] text-[#7b8798]">
            <tr>
              <th className="px-5 py-3.5">Name</th>
              <th>Role</th>
              <th>Training</th>
              <th>Access</th>
              <th>Joined</th>
              <th className="pr-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f4]">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-5 py-4">
                  <p className="font-semibold">
                    {member.profile?.full_name ??
                      member.profile?.email ??
                      "Team member"}
                  </p>
                  <p className="mt-0.5 text-xs text-[#7b8798]">
                    {member.profile?.email}
                  </p>
                </td>
                <td>
                  <select
                    disabled={member.permission_level === "owner"}
                    value={member.role_id ?? ""}
                    onChange={(e) =>
                      void update(
                        member.id,
                        e.target.value,
                        member.permission_level === "admin"
                          ? "admin"
                          : "employee",
                      )
                    }
                    className="h-9 rounded-lg border border-[#dfe5ed] bg-white px-2 text-xs"
                  >
                    <option value="">No role</option>
                    {roles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <span className="text-xs font-medium">
                    {member.training.done} of {member.training.total} complete
                  </span>
                </td>
                <td>
                  <select
                    disabled={
                      member.permission_level === "owner" ||
                      member.user_id === currentUserId
                    }
                    value={
                      member.permission_level === "owner"
                        ? "owner"
                        : member.permission_level
                    }
                    onChange={(e) =>
                      void update(
                        member.id,
                        member.role_id ?? "",
                        e.target.value,
                      )
                    }
                    className="h-9 rounded-lg border border-[#dfe5ed] bg-white px-2 text-xs capitalize"
                  >
                    <option value="owner" disabled>
                      Owner
                    </option>
                    <option value="admin">Admin</option>
                    <option value="employee">Employee</option>
                  </select>
                </td>
                <td className="text-xs text-[#7b8798]">
                  {new Date(member.joined_at).toLocaleDateString()}
                </td>
                <td className="pr-5 text-right">
                  {member.permission_level !== "owner" &&
                  member.user_id !== currentUserId ? (
                    <button
                      onClick={() => void remove(member.id)}
                      aria-label="Remove member"
                      className="grid size-8 place-items-center rounded-lg text-[#9a5960] hover:bg-[#fff0f1]"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {invites.length ? (
        <section className="mt-5 rounded-2xl border border-[#dfe5ed] bg-white p-5">
          <h2 className="font-semibold">Pending invitations</h2>
          <div className="mt-4 divide-y divide-[#edf0f4]">
            {invites.map((invite) => (
              <div
                key={invite.id}
                className="flex items-center justify-between gap-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium">{invite.email}</p>
                  <p className="mt-1 text-xs text-[#7b8798]">
                    {invite.role?.name ?? "No role"} · Expires{" "}
                    {new Date(invite.expires_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="rounded-full bg-[#fff4df] px-2.5 py-1 text-[11px] font-semibold text-[#946116]">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {open ? (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[#0d1729]/45 p-4 backdrop-blur-sm"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
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
            {inviteUrl ? (
              <div className="mt-6">
                <div className="flex items-center gap-2 rounded-xl bg-[#eaf7f1] p-3 text-sm text-[#177257]">
                  <Check className="size-4" />
                  Secure invitation created
                </div>
                <p className="mt-4 text-sm leading-6 text-[#657286]">
                  Email delivery is not connected yet. Copy this one-time link
                  and send it directly to the employee.
                </p>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(inviteUrl)}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d5dce6] px-3 py-3 text-sm font-semibold"
                >
                  <Copy className="size-4" />
                  Copy invite link
                </button>
              </div>
            ) : (
              <>
                <label className="mt-6 block text-sm font-medium">
                  Work email
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 h-11 w-full rounded-xl border border-[#d9e0e9] px-3.5"
                  />
                </label>
                <label className="mt-4 block text-sm font-medium">
                  Role
                  <select
                    value={roleId}
                    onChange={(e) => setRoleId(e.target.value)}
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
                  <p className="mt-3 text-sm text-[#a83f49]">{error}</p>
                ) : null}
                <button
                  disabled={loading}
                  className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#3158d8] text-sm font-semibold text-white"
                >
                  {loading ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  Create Invitation
                </button>
              </>
            )}
          </form>
        </div>
      ) : null}
    </>
  );
}
