import { ShieldCheck, Lock, UserCheck, FileText, BarChart3, Mail, Server } from "lucide-react";

// Phase 5c — Public compliance attestation page. No auth required: a
// prospective dealership's compliance officer (Brian Benstock's at Paragon,
// for example) needs to read this BEFORE they install. This page is the
// single trust signal the install conversation hinges on.
export default function Compliance() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">
        <header className="space-y-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">F&amp;I Co-Pilot Compliance Posture</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            ASURA Group, Inc. — last updated April 25, 2026. This page describes how F&amp;I Co-Pilot
            handles customer data, what regulations we comply with, and which third-party services
            touch your data. If you have questions, write{" "}
            <a className="text-primary hover:underline" href="mailto:compliance@asuragroup.com">
              compliance@asuragroup.com
            </a>
            .
          </p>
        </header>

        <Section icon={<Lock className="w-5 h-5 text-primary" />} title="Recording &amp; Consent">
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Two-party consent enforced.</span> Both
              the customer and the F&amp;I manager must explicitly tap consent before audio
              transcription begins. Each tap is logged with timestamp, IP address, and device
              fingerprint per Washington state's{" "}
              <span className="text-foreground">RCW 9.73.030</span> (the safest baseline for any US
              jurisdiction).
            </li>
            <li>
              <span className="text-foreground font-medium">Audio encrypted in transit</span> via
              TLS to Deepgram (our transcription sub-processor) and to ASURA-managed storage.
            </li>
            <li>
              <span className="text-foreground font-medium">Audio auto-deleted after 90 days</span>
              {" "}unless your dealership explicitly retains a recording for a specific deal review.
              Customers can request deletion sooner — see Customer Rights below.
            </li>
            <li>
              <span className="text-foreground font-medium">Mid-session revocation</span> is
              supported. The customer can revoke consent at any time; recording stops immediately
              and the session continues in manager-only notes mode.
            </li>
          </ul>
        </Section>

        <Section icon={<Server className="w-5 h-5 text-primary" />} title="Data Security">
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Multi-tenant isolation.</span>{" "}
              Cross-tenant data access is impossible at the query layer — every database read is
              scoped to the caller's dealership via a centralized{" "}
              <span className="text-foreground font-mono">tenancy.ts</span> enforcement module.
              Independent integration tests verify this on every commit.
            </li>
            <li>
              <span className="text-foreground font-medium">Encryption at rest</span> for customer
              PII via AES-256-GCM. Hosted on a hardened ASURA-controlled MySQL instance.
            </li>
            <li>
              <span className="text-foreground font-medium">Audit log for all access.</span> Every
              read or write of customer data writes an entry to{" "}
              <span className="text-foreground font-mono">audit_logs</span> with userId, IP, and
              resource scope. Compliance reviews can list every audit entry per customer via{" "}
              <span className="text-foreground font-mono">admin.auditTrailForCustomer</span>.
            </li>
          </ul>
        </Section>

        <Section icon={<UserCheck className="w-5 h-5 text-primary" />} title="Customer Rights">
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>
              <span className="text-foreground font-medium">Right to deletion.</span> A customer
              (or the dealership on the customer's behalf) can request data deletion. Requests are
              soft-deleted within 24 hours and hard-deleted on day 31. Cancellation is allowed
              during the 30-day window.
            </li>
            <li>
              <span className="text-foreground font-medium">Right of access.</span> A customer can
              request a copy of their data via the dealership's compliance contact. The DP can
              export the customer's data set within 5 business days.
            </li>
            <li>
              <span className="text-foreground font-medium">Right to revoke recording consent</span>
              {" "}during a live session. Audio stops immediately; prior transcript is retained
              unless deletion is also requested.
            </li>
          </ul>
        </Section>

        <Section icon={<FileText className="w-5 h-5 text-primary" />} title="Compliance With">
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>FTC Safeguards Rule (2023 update) — customer NPI handling, breach notification.</li>
            <li>
              State breach notification laws — we will notify your dealership (and direct customers
              where required) within the timelines specified by the applicable state.
            </li>
            <li>Washington two-party consent law (RCW 9.73.030) — enforced for all dealerships.</li>
            <li>Truth In Lending Act (TILA) disclosures — supported in deal review and grading.</li>
            <li>
              Equal Credit Opportunity Act (ECOA) — F&amp;I Co-Pilot does not make automated
              lending decisions; all lender submissions are routed by the F&amp;I manager.
            </li>
          </ul>
        </Section>

        <Section icon={<Server className="w-5 h-5 text-primary" />} title="Sub-processors">
          <p className="text-sm text-muted-foreground mb-2">
            These third-party services may touch customer data. We sign a Data Processing Addendum
            with each before customer data flows.
          </p>
          <table className="w-full text-xs border border-border rounded-lg overflow-hidden">
            <thead className="bg-muted/40 text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Service</th>
                <th className="px-3 py-2 text-left">Data Touched</th>
                <th className="px-3 py-2 text-left">Region</th>
              </tr>
            </thead>
            <tbody className="text-foreground">
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-medium">Deepgram</td>
                <td className="px-3 py-2 text-muted-foreground">Audio + transcripts</td>
                <td className="px-3 py-2 text-muted-foreground">United States</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-medium">Resend</td>
                <td className="px-3 py-2 text-muted-foreground">Transactional email</td>
                <td className="px-3 py-2 text-muted-foreground">United States</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-medium">ASURA-managed MySQL</td>
                <td className="px-3 py-2 text-muted-foreground">All customer + deal data</td>
                <td className="px-3 py-2 text-muted-foreground">United States (PNW)</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-medium">Cloudflare</td>
                <td className="px-3 py-2 text-muted-foreground">Web traffic only</td>
                <td className="px-3 py-2 text-muted-foreground">United States</td>
              </tr>
              <tr className="border-t border-border">
                <td className="px-3 py-2 font-medium">GitHub</td>
                <td className="px-3 py-2 text-muted-foreground">Code only — no customer data</td>
                <td className="px-3 py-2 text-muted-foreground">United States</td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section icon={<BarChart3 className="w-5 h-5 text-primary" />} title="Audit Reports Available">
          <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
            <li>SOC 2 Type 1 — in progress, expected Q3 2026.</li>
            <li>Penetration testing — annual, third-party.</li>
            <li>
              Multi-tenant isolation tests — open-source-style: every commit runs &gt;100 isolation
              tests proving cross-tenant data cannot leak.
            </li>
          </ul>
        </Section>

        <Section icon={<Mail className="w-5 h-5 text-primary" />} title="Contact">
          <p className="text-sm text-muted-foreground">
            Compliance &amp; data protection:{" "}
            <a className="text-primary hover:underline" href="mailto:compliance@asuragroup.com">
              compliance@asuragroup.com
            </a>
            <br />
            Adrian Anania, VP of Performance &amp; Operations:{" "}
            <a className="text-primary hover:underline" href="mailto:adrian@asuragroup.com">
              adrian@asuragroup.com
            </a>
          </p>
        </Section>

        <footer className="text-xs text-muted-foreground pt-6 border-t border-border">
          F&amp;I Co-Pilot is a product of ASURA Group, Inc. This page is a non-binding summary of
          our compliance posture; the operative document is your dealership's signed Data
          Processing Addendum.
        </footer>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      </div>
      <div>{children}</div>
    </section>
  );
}
