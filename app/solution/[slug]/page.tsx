import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ApiExample from "@/components/ApiExample";
import { withShareCard } from "@/lib/seo";

/* Three focused solution pages, one per item in the Solutions mega-menu.
   Same paper template, content driven by this map. */

type UseCase = { title: string; desc: string; tags: string[] };
type Step = { title: string; desc: string };

type Solution = {
  slug: string;
  eyebrow: string;
  title: React.ReactNode;
  lead: string;
  chips: string[];
  primary: { label: string; href: string };
  showCode?: boolean;
  useHead: React.ReactNode;
  useIntro: string;
  useCases: UseCase[];
  stepsIntro: string;
  steps: Step[];
  sourcesEyebrow: string;
  sourcesHead: React.ReactNode;
  sourcesIntro: string;
  sources: string[];
  ctaHead: React.ReactNode;
  ctaBody: string;
  metaTitle: string;
  metaDesc: string;
};

const SOLUTIONS: Record<string, Solution> = {
  "custom-data-pipelines": {
    slug: "custom-data-pipelines",
    eyebrow: "Solution",
    title: (
      <>
        A managed pipeline, <em>delivered on your schedule.</em>
      </>
    ),
    lead: "We build, run and monitor the whole pipeline end to end — collection, quality checks and delivery — so clean data lands where you need it, when you need it. No infrastructure on your side.",
    chips: ["99%+ delivery SLA", "Daily / weekly / monthly", "API · SFTP · S3 delivery"],
    primary: { label: "Book a call", href: "/contact" },
    useHead: (
      <>
        We own the pipeline, <em>end to end.</em>
      </>
    ),
    useIntro:
      "Not one-off scripts — managed infrastructure for data that feeds the business.",
    useCases: [
      {
        title: "Scheduled delivery",
        desc: "Recurring runs — daily, weekly or monthly — delivered to your API, an SFTP drop or S3.",
        tags: ["scheduled", "API / SFTP / S3", "any format"],
      },
      {
        title: "Quality & monitoring",
        desc: "Automated quality checks and health alerts, and we adapt the moment a source changes.",
        tags: ["QA checks", "alerts", "auto-adapt"],
      },
      {
        title: "White-label & silent",
        desc: "We run invisibly behind your brand — your clients never need to know we exist.",
        tags: ["white-label", "discreet", "B2B partner"],
      },
    ],
    stepsIntro: "From scope to a feed you can rely on, with one team owning all of it.",
    steps: [
      { title: "Scope the pipeline", desc: "We agree the sources, fields, schedule and delivery format." },
      { title: "We build & run it", desc: "We own collection, retries, quality checks and monitoring." },
      { title: "Data lands on time", desc: "Clean records delivered on schedule, with alerts if anything slips." },
    ],
    sourcesEyebrow: "In production",
    sourcesHead: (
      <>
        Feeds we run <em>every day.</em>
      </>
    ),
    sourcesIntro:
      "Across e-commerce, real estate, ticketing and jobs — and whatever target your project needs.",
    sources: ["Real estate", "Ticketing", "Jobs", "E-commerce", "Travel / fares", "+ your target"],
    ctaHead: (
      <>
        Tell us your target <em>and cadence.</em>
      </>
    ),
    ctaBody:
      "Send us the sources, the fields and how often you need them. We'll scope the pipeline and send a free sample where we can run one.",
    metaTitle: "Custom data pipelines",
    metaDesc:
      "A fully managed data pipeline — collection, quality checks and scheduled delivery to your API, SFTP or S3 — built and run by us, white-label.",
  },
};

const ICONS = [
  // trending / price
  <svg key="0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m7 14 4-4 4 4 5-6" />
  </svg>,
  // endpoints / code
  <svg key="1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="8 5 3 12 8 19" />
    <polyline points="16 5 21 12 16 19" />
  </svg>,
  // reliability / shield-check
  <svg key="2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2 4 6v6c0 5 3.4 8.5 8 10 4.6-1.5 8-5 8-10V6l-8-4Z" />
    <path d="m9 12 2 2 4-4" />
  </svg>,
];

export function generateStaticParams() {
  return Object.keys(SOLUTIONS).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = SOLUTIONS[slug];
  if (!s) return { title: "Solution" };
  return withShareCard({
    title: s.metaTitle,
    description: s.metaDesc,
    alternates: { canonical: `/solution/${s.slug}` },
    openGraph: {
      title: `${s.metaTitle} · Fastscraping`,
      description: s.metaDesc,
      url: `/solution/${s.slug}`,
      type: "website",
    },
  });
}

export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = SOLUTIONS[slug];
  if (!s) notFound();

  const check = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );

  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="block" style={{ paddingBottom: 0 }}>
        <div className="container">
          <span className="eyebrow">{s.eyebrow}</span>
          <h1 className="display" style={{ marginTop: 16, maxWidth: "16ch" }}>
            {s.title}
          </h1>
          <p
            style={{
              marginTop: 18,
              fontSize: 17,
              lineHeight: 1.65,
              color: "var(--muted)",
              maxWidth: "56ch",
            }}
          >
            {s.lead}
          </p>
          <div className="hero-bullets" style={{ marginTop: 26 }}>
            {s.chips.map((c) => (
              <span key={c}>
                {check}
                {c}
              </span>
            ))}
          </div>
          <div className="hero-cta" style={{ marginTop: 28 }}>
            <Link href={s.primary.href} className="btn btn-primary">
              {s.primary.label}
              <span className="arrow">→</span>
            </Link>
            <Link href="/contact" className="btn btn-ghost">
              Talk to us
            </Link>
          </div>
        </div>
      </section>

      {/* ===================== WHAT YOU CAN DO ===================== */}
      <section className="block">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">What you can do</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                {s.useHead}
              </h2>
            </div>
            <p>{s.useIntro}</p>
          </div>
          <div className="diff-grid">
            {s.useCases.map((u, i) => (
              <article className="diff-card" key={u.title}>
                <div className="icon">{ICONS[i % ICONS.length]}</div>
                <h3>{u.title}</h3>
                <p>{u.desc}</p>
                <div className="tags">
                  {u.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== HOW IT WORKS ===================== */}
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">How it works</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                Live in <em>three steps.</em>
              </h2>
            </div>
            <p>{s.stepsIntro}</p>
          </div>
          <div className="home-sol">
            {s.steps.map((st, i) => (
              <article className="sol" key={st.title}>
                <div className="n">0{i + 1}</div>
                <h3>{st.title}</h3>
                <p>{st.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CODE (web-data-apis) ===================== */}
      {s.showCode ? (
        <section className="block" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Call it</span>
                <h2 className="display" style={{ marginTop: 18 }}>
                  With <em>your key.</em>
                </h2>
              </div>
              <p>
                One endpoint, one header, structured JSON back. No proxies, no
                browsers, no CAPTCHA handling on your side.
              </p>
            </div>
            <ApiExample />
          </div>
        </section>
      ) : null}

      {/* ===================== SOURCES ===================== */}
      <section className="block" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">{s.sourcesEyebrow}</span>
              <h2 className="display" style={{ marginTop: 18 }}>
                {s.sourcesHead}
              </h2>
            </div>
            <p>{s.sourcesIntro}</p>
          </div>
          <div className="geo-regions">
            {s.sources.map((src) => (
              <span className="geo-chip" key={src}>
                {src}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="block" style={{ paddingTop: 0 }} id="contact">
        <div className="container">
          <div className="cta">
            <div>
              <span className="eyebrow">Get started</span>
              <h2 style={{ marginTop: 18 }}>{s.ctaHead}</h2>
              <p>{s.ctaBody}</p>
              <div className="hero-bullets" style={{ marginTop: 28 }}>
                <span>{check}Reply within one business day</span>
                <span>{check}Free sample where we can run one</span>
                <span>{check}No commitment</span>
              </div>
            </div>

            <div className="cta-card">
              <div className="label">Next step</div>
              <div className="actions" style={{ marginTop: 4 }}>
                <Link href={s.primary.href} className="btn btn-accent">
                  {s.primary.label}
                </Link>
                <Link href="/contact" className="btn btn-ghost">
                  Contact us
                </Link>
              </div>
              <div className="meta-row" style={{ marginTop: 18 }}>
                <span className="k">Email</span>
                <span className="v" style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
                  khalid@fastscraping.com
                </span>
              </div>
              <div className="meta-row">
                <span className="k">Response time</span>
                <span className="v">&lt; 24 hours</span>
              </div>
              <div className="meta-row">
                <span className="k">Sample data</span>
                <span className="v">Within 48–72 hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
