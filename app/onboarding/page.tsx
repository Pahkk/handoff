import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getOptionalAppContext, requireUser } from "@/lib/app-context";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await requireUser();
  const context = await getOptionalAppContext();
  const requested = (await searchParams).next;
  const nextPath =
    requested?.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/app/getting-started";
  if (context) redirect(nextPath);
  const name = String(
    user.user_metadata.full_name ??
      user.user_metadata.name ??
      user.email?.split("@")[0] ??
      "there",
  ).split(" ")[0];
  return <OnboardingForm firstName={name} nextPath={nextPath} />;
}
