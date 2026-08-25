import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getOptionalAppContext, requireUser } from "@/lib/app-context";

export default async function OnboardingPage() {
  const user = await requireUser();
  const context = await getOptionalAppContext();
  if (context) redirect("/app");
  const name = String(
    user.user_metadata.full_name ??
      user.user_metadata.name ??
      user.email?.split("@")[0] ??
      "there",
  ).split(" ")[0];
  return <OnboardingForm firstName={name} />;
}
