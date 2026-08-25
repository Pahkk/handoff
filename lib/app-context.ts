import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type PermissionLevel = "owner" | "admin" | "employee";

export type AppContext = {
  user: {
    id: string;
    email: string;
    fullName: string;
    avatarUrl: string | null;
  };
  organization: {
    id: string;
    name: string;
    industry: string;
    employeeCount: number;
  };
  membership: {
    id: string;
    permissionLevel: PermissionLevel;
    roleId: string | null;
  };
  organizations: Array<{ id: string; name: string }>;
  isAdmin: boolean;
};

export const getOptionalAppContext = cache(
  async (): Promise<AppContext | null> => {
    const supabase = await createClient();
    const { data: authData } = await supabase.auth.getUser();
    const authUser = authData.user;
    if (!authUser) return null;

    const { data: memberships, error } = await supabase
      .from("organization_members")
      .select(
        "id, organization_id, permission_level, role_id, organizations!inner(id, name, industry, employee_count)",
      )
      .eq("user_id", authUser.id);

    if (error || !memberships?.length) return null;
    const cookieStore = await cookies();
    const requestedId = cookieStore.get("opryn-organization")?.value;
    const active =
      memberships.find((item) => item.organization_id === requestedId) ??
      memberships[0];
    const rawOrganization = active.organizations as unknown;
    const organization = (
      Array.isArray(rawOrganization) ? rawOrganization[0] : rawOrganization
    ) as {
      id: string;
      name: string;
      industry: string;
      employee_count: number;
    };

    return {
      user: {
        id: authUser.id,
        email: authUser.email ?? "",
        fullName: String(
          authUser.user_metadata.full_name ??
            authUser.user_metadata.name ??
            authUser.email?.split("@")[0] ??
            "Account",
        ),
        avatarUrl:
          typeof authUser.user_metadata.avatar_url === "string"
            ? authUser.user_metadata.avatar_url
            : null,
      },
      organization: {
        id: organization.id,
        name: organization.name,
        industry: organization.industry,
        employeeCount: organization.employee_count,
      },
      membership: {
        id: active.id,
        permissionLevel: active.permission_level as PermissionLevel,
        roleId: active.role_id,
      },
      organizations: memberships.map((item) => {
        const raw = item.organizations as unknown;
        const org = (Array.isArray(raw) ? raw[0] : raw) as {
          id: string;
          name: string;
        };
        return { id: org.id, name: org.name };
      }),
      isAdmin:
        active.permission_level === "owner" ||
        active.permission_level === "admin",
    };
  },
);

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return data.user;
}

export async function requireAppContext() {
  const context = await getOptionalAppContext();
  if (!context) {
    await requireUser();
    redirect("/onboarding");
  }
  return context;
}

export async function requireAdminContext() {
  const context = await requireAppContext();
  if (!context.isAdmin) redirect("/app");
  return context;
}
