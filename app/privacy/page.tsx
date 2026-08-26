import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocument, LegalSection } from "../../components/legal-document";

export const metadata: Metadata = {
  title: "Privacy Policy | Opryn",
  description:
    "How Opryn collects, uses, and protects information through its website, early-access program, and services.",
  alternates: { canonical: "https://www.opryn.app/privacy" },
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Privacy Policy"
      description="This policy explains what information Opryn collects, why we collect it, and the choices available to you."
    >
      <LegalSection title="1. Information we collect">
        <p>
          We collect information you provide directly, including when you
          request early access, contact us, or create an account. This may
          include your name, work email, business name, industry, team size,
          hiring plans, optional phone number, and details about work you want
          to delegate.
        </p>
        <p>
          If you sign in with Google, we receive the basic account information
          needed to authenticate you, such as your name, email address, profile
          image, and Google account identifier. Opryn does not request access to
          your Gmail, Google Drive, contacts, calendar, or files.
        </p>
        <p>
          We and our service providers may also collect limited technical
          information, such as browser type, device information, IP address,
          timestamps, authentication events, and diagnostic logs. We may process
          the audio, video, authorized call recordings, documents, instructions,
          business procedures, questions, and answers you intentionally provide.
          Payment details are handled by our payment processor rather than
          stored directly by Opryn.
        </p>
      </LegalSection>

      <LegalSection title="2. How we use information">
        <p>
          We use information to operate and secure Opryn, authenticate accounts,
          respond to early-access requests, provide requested features, improve
          the product, communicate about onboarding and service changes, prevent
          abuse, troubleshoot problems, and comply with legal obligations.
        </p>
        <p>
          Google account information is used only to create and secure your
          Opryn account and provide the sign-in experience you requested.
        </p>
      </LegalSection>

      <LegalSection title="3. Browser storage and authentication">
        <p>
          Opryn may use cookies or similar browser storage to keep you signed
          in, maintain security, remember interface state, and store a local
          copy of an early-access submission. You can clear this information
          through your browser settings, although doing so may sign you out or
          reset saved preferences.
        </p>
      </LegalSection>

      <LegalSection title="4. How information is shared">
        <p>
          We do not sell your personal information. We may share information
          with vendors that help us provide the service, including Supabase for
          authentication and data storage, Vercel for website hosting, and
          Google for account authentication. These providers process information
          on our behalf under their own contractual and security obligations.
        </p>
        <p>
          We may also disclose information when required by law, to protect
          Opryn or others from harm, in connection with a corporate transaction,
          or when you direct us to share it.
        </p>
      </LegalSection>

      <LegalSection title="5. Data retention and security">
        <p>
          We keep information for as long as reasonably necessary to provide the
          service, maintain legitimate business records, resolve disputes,
          enforce agreements, and meet legal requirements. We use reasonable
          administrative, technical, and organizational safeguards, but no
          online service can guarantee absolute security.
        </p>
      </LegalSection>

      <LegalSection title="6. Your choices">
        <p>
          You may choose not to provide optional information, clear local
          browser storage, or revoke Opryn&apos;s Google access from your Google
          Account. You may also ask to access, correct, or delete personal
          information, subject to applicable legal exceptions.
        </p>
        <p>
          To make a privacy request, use the early-access contact form on the{" "}
          <Link href="/">Opryn homepage</Link> and begin your message with
          “Privacy request.” We may need to verify your identity before
          completing a request.
        </p>
      </LegalSection>

      <LegalSection title="7. Children">
        <p>
          Opryn is a business service and is not directed to children under 13.
          We do not knowingly collect personal information from children under
          13.
        </p>
      </LegalSection>

      <LegalSection title="8. International use">
        <p>
          Your information may be processed in countries other than the country
          where you live. Those countries may have different data-protection
          laws. We use appropriate safeguards where required by applicable law.
        </p>
      </LegalSection>

      <LegalSection title="9. Changes to this policy">
        <p>
          We may update this policy as Opryn develops. We will post the revised
          policy here and update its effective date. If a change materially
          affects how we use personal information, we will provide additional
          notice when appropriate.
        </p>
      </LegalSection>

      <LegalSection title="10. Contact">
        <p>
          For questions about this policy or Opryn&apos;s privacy practices,
          submit a message through the early-access form on the{" "}
          <Link href="/">Opryn homepage</Link> and identify it as a privacy
          question.
        </p>
      </LegalSection>
    </LegalDocument>
  );
}
