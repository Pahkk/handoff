import { BusinessDiscoveryForm } from "@/components/app/business-discovery-form";
import { PageHeading } from "@/components/app/page-heading";
import { requireAdminContext } from "@/lib/app-context";

export default async function LearnBusinessPage() {
  await requireAdminContext();
  return (
    <>
      <PageHeading
        eyebrow="Teach Opryn about your business"
        title="Get a starting plan built around your work."
        description="Answer a few plain-language questions. Opryn will recommend the processes most likely to help you delegate and reduce interruptions first."
      />
      <BusinessDiscoveryForm />
    </>
  );
}
