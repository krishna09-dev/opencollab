import LegalPageShell, { type LegalSection } from "../components/LegalPageShell";

const sections: LegalSection[] = [
  {
    title: "Acceptance Of Terms",
    paragraphs: [
      "By creating an account or using OpenCollab, you agree to these Terms and Conditions. If you do not agree, you must not use the service.",
      "These terms apply to all users, including contributors, moderators, administrators, and visitors."
    ]
  },
  {
    title: "Eligibility And Accounts",
    paragraphs: [
      "You are responsible for maintaining the security of your account credentials and for all activities under your account.",
      "You must provide accurate information and keep it up to date. We may suspend or restrict access for fraudulent or abusive behavior."
    ]
  },
  {
    title: "Permitted Use",
    paragraphs: [
      "OpenCollab is designed to support open-source collaboration, issue discovery, and pull request workflows.",
      "You agree not to misuse the platform, disrupt operations, scrape data in violation of applicable policies, or attempt unauthorized access."
    ],
    bullets: [
      "Do not upload malicious code or harmful content.",
      "Do not impersonate others or misrepresent repository ownership.",
      "Do not abuse APIs, automations, or moderation systems."
    ]
  },
  {
    title: "User Content And Integrations",
    paragraphs: [
      "You retain ownership of content you submit, but you grant OpenCollab a limited license to host, process, and display it for platform operation.",
      "OpenCollab may interact with third-party services such as GitHub. Your use of those integrations is also subject to the third party's terms and policies."
    ]
  },
  {
    title: "Moderation And Enforcement",
    paragraphs: [
      "We may review, remove, or restrict content and accounts that violate these terms, applicable law, or community safety expectations.",
      "Enforcement actions can include warnings, feature restrictions, suspension, or account termination."
    ]
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "OpenCollab software, branding, interface design, and platform content are protected by intellectual property laws.",
      "You may not reproduce, distribute, reverse engineer, or create derivative works from protected platform assets except as permitted by law or written authorization."
    ]
  },
  {
    title: "Disclaimers",
    paragraphs: [
      "OpenCollab is provided on an as-is and as-available basis. We do not guarantee uninterrupted service, specific recommendation outcomes, or error-free operation.",
      "We are not responsible for the conduct, code, or policies of external repositories or third-party services linked through the platform."
    ]
  },
  {
    title: "Limitation Of Liability",
    paragraphs: [
      "To the maximum extent allowed by law, OpenCollab and its affiliates are not liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the service.",
      "Where liability cannot be excluded, it will be limited to the minimum amount required under applicable law."
    ]
  },
  {
    title: "Changes To These Terms",
    paragraphs: [
      "We may revise these Terms and Conditions periodically. When changes are material, we will provide reasonable notice in the application.",
      "Continued use of OpenCollab after the effective date of updated terms means you accept the revised terms."
    ]
  },
  {
    title: "Contact",
    paragraphs: [
      "For legal questions regarding these terms, contact legal@opencollab.dev."
    ]
  }
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPageShell
      currentPath="terms"
      title="Terms And Conditions"
      subtitle="These terms govern your access to and use of OpenCollab. Please read them carefully before using the platform."
      lastUpdated="April 10, 2026"
      sections={sections}
    />
  );
}