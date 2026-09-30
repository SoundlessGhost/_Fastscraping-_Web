import Image from "next/image";
import Link from "next/link";
import AnimatedNumber from "@/components/AnimatedNumber";
import RotatingWord from "@/components/RotatingWord";
import AboutReveal from "@/components/AboutReveal";
import "../styles/about.css";
import type { Metadata } from "next";
import { withShareCard } from "@/lib/seo";

export const metadata: Metadata = withShareCard({
  title: "About",
  description:
    "Fastscraping is a fully managed web scraping service for data teams, AI companies, and enterprises. Three engineers, 100M+ records a month, live pipelines in 5+ countries.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "About · Fastscraping",
    description:
      "Three engineers. 100M+ records a month. Live pipelines in 5+ countries. Hard-source reliability is the job.",
    url: "/about",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About · Fastscraping",
    description: "Three engineers. 100M+ records a month. 5+ countries.",
  },
});

const MAIL = "mailto:khalid@fastscraping.com";

export default function AboutPage() {
  return (
    <>
      <AboutReveal />

      {/* ===================== HERO ===================== */}
      <section className="ab-hero" data-screen-label="01 About hero">
        <div className="container">
          <span className="eyebrow">About Fastscraping</span>

          <div className="ab-hero-top">
            <h1 className="ab-h1">
              We make <RotatingWord />
              <br />
              easy to get.
            </h1>
            <p className="ab-hero-sub">
              A fully managed web scraping service for data teams, AI companies
              and enterprises. We run the proxies, the browsers and the fixes
              when sites change. You get clean, structured data, on schedule.
            </p>
          </div>

          <div className="ab-stats" data-reveal>
            <div className="ab-stat">
              <div className="ab-stat-v">
                <AnimatedNumber to={100} />
                <span className="ab-unit">M+</span>
              </div>
              <div className="ab-stat-l">records processed every month</div>
            </div>
            <div className="ab-stat">
              <div className="ab-stat-v">
                <AnimatedNumber to={5} />
                <span className="ab-unit">+</span>
              </div>
              <div className="ab-stat-l">countries with live pipelines</div>
            </div>
            <div className="ab-stat">
              <div className="ab-stat-v">
                <AnimatedNumber to={24} />
                <span className="ab-unit">+</span>
              </div>
              <div className="ab-stat-l">months with our longest client</div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* ===================== MISSION ===================== */}
        <section className="ab-sec" data-screen-label="02 Mission">
          <div className="ab-mission-grid" data-reveal>
            <h2 className="ab-h2">
              The quiet data layer behind{" "}
              <em>data-first companies.</em>
            </h2>
            <div>
              <p className="ab-lead">
                Every company should be able to get the web data it needs
                without building infrastructure, managing proxy pools, or
                chasing sites that keep changing. We carry that complexity, so
                our clients spend their time on what the data tells them.
              </p>
              <div className="ab-quote">
                <span className="mk">&ldquo;</span>
                Your web scraping team on demand.
              </div>
            </div>
          </div>

          <div className="ab-promises">
            <article className="ab-promise" data-reveal data-delay="0">
              <div className="n">01</div>
              <div className="t">A silent backend vendor.</div>
              <p>
                We work behind your brand, white-label by default. Your clients
                never need to know we exist.
              </p>
            </article>
            <article className="ab-promise" data-reveal data-delay="110">
              <div className="n">02</div>
              <div className="t">Infrastructure that scales.</div>
              <p>
                From one source today to fifty next year, on the same stack. No
                re-architecture.
              </p>
            </article>
            <article className="ab-promise" data-reveal data-delay="220">
              <div className="n">03</div>
              <div className="t">Hard sources are the job.</div>
              <p>
                Not an afterthought, never &ldquo;best effort&rdquo;. It&apos;s
                the skill we built the company around.
              </p>
            </article>
          </div>
        </section>

        {/* ===================== TEAM ===================== */}
        <section className="ab-sec" id="team" data-screen-label="03 Team">
          <div className="ab-head" data-reveal>
            <div>
              <span className="eyebrow">Our team</span>
              <h2 className="ab-h2" style={{ marginTop: 12 }}>
                Three engineers, <em>the output of thirty.</em>
              </h2>
            </div>
            <p className="ab-head-note">
              Battle-tested engineers, small and senior on purpose. Anything
              that can be automated, is.
            </p>
          </div>

          {/* Founder */}
          <div className="ab-founder" data-reveal>
            <div className="ab-photo">
              <Image
                src="/team/shawon.jpg"
                alt="Md Khalid Mahmud Shawon — Founder & CEO"
                fill
                sizes="(min-width: 960px) 40vw, 100vw"
                style={{ objectFit: "cover", objectPosition: "center 25%" }}
                priority
              />
            </div>

            <div className="ab-card">
              <div className="ab-role">Founder &amp; CEO</div>
              <h3 className="ab-name">
                Md Khalid <em>Mahmud</em> Shawon
              </h3>
              <div className="ab-subrole">Enterprise web scraping expert</div>
              <p className="ab-bio">
                Specializing in <strong>enterprise web scraping</strong>, data
                pipeline engineering and LinkedIn data solutions. Built
                Fastscraping to solve the extraction problems other vendors
                couldn&apos;t: Cloudflare-protected sources, LinkedIn pipelines
                at scale, and silent white-label partnerships for agencies.
              </p>

              <div className="ab-facts">
                <div className="ab-fact">
                  <span className="k">Specialty</span>
                  <span className="v">
                    Hard-source reliability · Cloudflare, DataDome, PerimeterX
                  </span>
                </div>
                <div className="ab-fact">
                  <span className="k">Built</span>
                  <span className="v">Fastscraping</span>
                </div>
                <div className="ab-fact">
                  <span className="k">Based in</span>
                  <span className="v">Sirajganj, Rajshahi · Bangladesh</span>
                </div>
                <div className="ab-fact">
                  <span className="k">Entity</span>
                  <span className="v">Fast Scraping LLC · Wyoming, USA</span>
                </div>
                <div className="ab-fact">
                  <span className="k">Reach</span>
                  <span className="v">
                    <a href={MAIL}>khalid@fastscraping.com</a>
                  </span>
                </div>
              </div>

              <div className="ab-founder-links">
                <a
                  href="https://linkedin.com/in/md-khalid-mahmud-shawon"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
                  </svg>
                  LinkedIn
                </a>
                <a
                  href="https://upwork.com/freelancers/khalidalsaba"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  Upwork profile
                </a>
                <a href={MAIL} className="btn btn-primary">
                  Contact Khalid <span className="arrow">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* Members */}
          <div className="ab-members">
            <article className="ab-member" data-reveal data-delay="0">
              <div className="ab-member-photo">
                <Image
                  src="/team/kashru.png"
                  alt="Kashru Bin Hadi Sumon — CTO"
                  fill
                  sizes="120px"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="ab-member-body">
                <div className="ab-role">CTO</div>
                <h3 className="ab-member-name">Kashru Bin Hadi Sumon</h3>
                <div className="ab-member-title">Data pipeline architect</div>
                <p>
                  Leads technical architecture and infrastructure decisions.
                  Expert in scalable data pipelines and distributed systems.
                </p>
                <div className="ab-tags">
                  <span>Distributed systems</span>
                  <span>Pipelines</span>
                  <span>Infra</span>
                </div>
              </div>
            </article>

            <article className="ab-member" data-reveal data-delay="110">
              <div className="ab-member-photo">
                <Image
                  src="/team/rejwan.png"
                  alt="MD Rejwan Habib — Head of Collection Reliability"
                  fill
                  sizes="120px"
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="ab-member-body">
                <div className="ab-role">Head of Collection Reliability</div>
                <h3 className="ab-member-name">MD Rejwan Habib</h3>
                <div className="ab-member-title">Reliability research lead</div>
                <p>
                  Keeps collection stable on sources protected by Cloudflare,
                  DataDome, PerimeterX and Akamai. Builds our browser-rendering
                  stack.
                </p>
                <div className="ab-tags">
                  <span>Cloudflare</span>
                  <span>DataDome</span>
                  <span>Browser rendering</span>
                </div>
              </div>
            </article>
          </div>

          <p className="ab-hiring" data-reveal>
            We work in small teams of high-leverage engineers, never armies of
            operators. Open seats:{" "}
            <a href={MAIL}>we&apos;re hiring senior scraping engineers →</a>
          </p>
        </section>

        {/* ===================== VALUES ===================== */}
        <section className="ab-sec" data-screen-label="04 Values">
          <h2 className="ab-h2" data-reveal>
            What we stand for.
          </h2>
          <div className="ab-values-grid">
            <article className="ab-value" data-reveal data-delay="0">
              <div className="rn">I</div>
              <div className="t">Reliability first</div>
              <p>
                Clients run production pipelines on us, not experiments.
                Everything runs 24/7.
              </p>
            </article>
            <article className="ab-value" data-reveal data-delay="110">
              <div className="rn">II</div>
              <div className="t">Technical depth</div>
              <p>
                The sources that stall other vendors are the ones we keep
                flowing.
              </p>
            </article>
            <article className="ab-value" data-reveal data-delay="220">
              <div className="rn">III</div>
              <div className="t">Client success</div>
              <p>
                Long partnerships over one-off projects. Average tenure is past
                24 months.
              </p>
            </article>
            <article className="ab-value" data-reveal data-delay="330">
              <div className="rn">IV</div>
              <div className="t">Transparency</div>
              <p>
                Clear pricing, honest timelines, direct answers. No
                &ldquo;we&apos;ll circle back.&rdquo;
              </p>
            </article>
          </div>
        </section>

        {/* ===================== JOURNEY ===================== */}
        <section className="ab-sec" data-screen-label="05 Journey">
          <h2 className="ab-h2" data-reveal>
            From one hard scraper <em>to five countries.</em>
          </h2>

          <div className="ab-journey" data-journey>
            <div className="ab-journey-base" />
            <div className="ab-journey-line" data-journey-line />
            <div className="ab-journey-grid">
              <div className="ab-milestone" data-reveal data-delay="0">
                <span className="dot" />
                <div className="yr">2023</div>
                <div className="tag">The start</div>
                <div className="t">One scraper nobody else could build.</div>
                <p>
                  Khalid starts Fastscraping. The first job: a source other
                  vendors had given up on.
                </p>
              </div>
              <div className="ab-milestone" data-reveal data-delay="110">
                <span className="dot" />
                <div className="yr">2024</div>
                <div className="tag">Enterprise</div>
                <div className="t">Ficstar signs on.</div>
                <p>
                  Ticketing pipelines for StubHub, SeatGeek and more. Still
                  running, still ours.
                </p>
              </div>
              <div className="ab-milestone" data-reveal data-delay="220">
                <span className="dot" />
                <div className="yr">2024</div>
                <div className="tag">Scale</div>
                <div className="t">100M records processed.</div>
                <p>
                  Past 100 million LinkedIn profiles, without a single account
                  ban.
                </p>
              </div>
              <div className="ab-milestone" data-reveal data-delay="330">
                <span className="dot" />
                <div className="yr">2025</div>
                <div className="tag">Switzerland</div>
                <div className="t">Real estate for TheDataHive.</div>
                <p>
                  ImmoScout24, Homegate and more. Multi-source, daily,
                  white-label.
                </p>
              </div>
              <div className="ab-milestone current" data-reveal data-delay="440">
                <span className="dot" />
                <div className="yr">2026</div>
                <div className="tag">Today</div>
                <div className="t">Five countries, zero downtime.</div>
                <p>
                  Live pipelines in CH, US, CA, DE, UK and BD. Still three
                  engineers.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ===================== WORK WITH US ===================== */}
      <section className="ab-cta-wrap" id="contact" data-screen-label="06 Contact">
        <div className="container">
          <div className="ab-cta" data-reveal>
            <div>
              <span className="eyebrow">Work with us</span>
              <h2 className="ab-h2" style={{ marginTop: 12 }}>
                Tell us about your <em>data problem.</em>
              </h2>
              <p className="ab-cta-lead">
                What you need scraped, and how often. You&apos;ll get a free
                sample in 48–72 hours, and an honest answer on whether
                we&apos;re the right fit.
              </p>
              <div className="ab-cta-tags">
                <span>48–72h sample</span>
                <span>30-min call</span>
                <span>White-label friendly</span>
              </div>
              <div className="ab-cta-actions">
                <Link href="/contact" className="btn btn-primary">
                  Book a call <span className="arrow">→</span>
                </Link>
                <Link href="/contact" className="btn btn-ghost">
                  Send a brief
                </Link>
              </div>
            </div>

            <div className="ab-direct">
              <div className="ab-direct-top">
                <div className="ab-direct-avatar">
                  <Image
                    src="/team/shawon.jpg"
                    alt="Md Khalid Mahmud Shawon"
                    fill
                    sizes="48px"
                    style={{ objectFit: "cover", objectPosition: "center 25%" }}
                  />
                </div>
                <div>
                  <div className="ab-direct-label">Direct line</div>
                  <div className="ab-direct-name">Md Khalid Mahmud Shawon</div>
                  <div className="ab-direct-sub">
                    Founder · Web data engineering
                  </div>
                </div>
              </div>
              <div className="ab-direct-row">
                <span className="k">Email</span>
                <span className="v">khalid@fastscraping.com</span>
              </div>
              <div className="ab-direct-row">
                <span className="k">Response</span>
                <span className="v">Under 24 hours</span>
              </div>
              <div className="ab-direct-row">
                <span className="k">First call</span>
                <span className="v">30 min, no slides</span>
              </div>
              <div className="ab-direct-row">
                <span className="k">Sample</span>
                <span className="v">48–72 hours</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
