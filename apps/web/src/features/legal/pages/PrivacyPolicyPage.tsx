import LegalPageShell, { type LegalSection } from "../components/LegalPageShell";

const sections: LegalSection[] = [
  {
    title: "Information We Collect",
    paragraphs: [
      "We collect account and profile data that is required to operate OpenCollab, including your name, email address, username, and authentication metadata when you sign in with GitHub.",
      "We also collect contribution data, issue and pull request metadata, platform usage analytics, and technical diagnostics to keep the service stable and to improve recommendations."
    ],
    bullets: [
      "Account data: username, display name, email, avatar URL, and role.",
      "Repository and contribution data: issues, pull requests, labels, statuses, and timestamps.",
      "Usage and device data: browser type, IP address, request logs, and in-app interaction events."
    ]
  },
  {
    title: "How We Use Your Data",
    paragraphs: [
      "We use your data to authenticate your account, provide issue discovery and PR tracking features, personalize your dashboard, and support moderation workflows.",
      "We may use aggregate and de-identified usage patterns to improve matching quality, reliability, performance, and safety of the platform."
    ]
  },
  {
    title: "Cookies And Similar Technologies",
    paragraphs: [
      "OpenCollab uses essential cookies and local storage to maintain session state, remember settings, and protect your account.",
      "We may also use analytics technologies to understand product usage trends. You can control cookies through your browser settings, but disabling essential cookies can affect core functionality."
    ]
  },
  {
    title: "When We Share Data",
    paragraphs: [
      "We do not sell your personal information. We only share data with service providers and infrastructure partners that help us run OpenCollab, and only when necessary.",
      "We may also disclose information when required by law, to enforce our terms, or to protect users, communities, and platform integrity."
    ]
  },
  {
    title: "Data Retention",
    paragraphs: [
      "We keep personal data for as long as needed to provide the service, comply with legal obligations, resolve disputes, and enforce agreements.",
      "When account data is no longer needed, we delete or de-identify it according to internal retention schedules and security procedures."
    ]
  },
  {
    title: "Your Rights And Choices",
    paragraphs: [
      "Depending on your location, you may have rights to access, correct, export, delete, or restrict processing of your personal data.",
      "You can request account or data actions by contacting us. We may verify your identity before processing requests."
    ],
    bullets: [
      "Review and update profile information from your account settings.",
      "Request deletion or export of your account data.",
      "Opt out of non-essential product communications."
    ]
  },
  {
    title: "Security",
    paragraphs: [
      "We implement administrative, technical, and organizational safeguards to protect personal data, including encryption in transit and access controls.",
      "No internet service can be guaranteed to be fully secure, but we continuously monitor and improve our security posture."
    ]
  },
  {
    title: "Policy Updates",
    paragraphs: [
      "We may update this Privacy Policy from time to time. If updates are material, we will post a prominent notice in the app or by other reasonable means.",
      "Your continued use of OpenCollab after updates become effective means you accept the revised policy."
    ]
  },
  {
    title: "Contact",
    paragraphs: [
      "For privacy-related questions or requests, contact OpenCollab at privacy@opencollab.dev."
    ]
  }
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPageShell
      currentPath="privacy"
      title="Privacy Policy"
      subtitle="This Privacy Policy explains what information OpenCollab collects, how we use it, and the controls available to you when using our platform."
      lastUpdated="April 10, 2026"
      sections={sections}
    />
  );
}