import Link from "next/link";
import { ArrowRight, Braces, RadioTower, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/brand";

const principles = [
  {
    icon: RadioTower,
    title: "External + first-party",
    body: "Current news and content submitted by Orbit applications.",
  },
  {
    icon: Braces,
    title: "API-first",
    body: "Every meaningful platform capability begins at a versioned boundary.",
  },
  {
    icon: ShieldCheck,
    title: "Project scoped",
    body: "Multi-tenant isolation and server-to-server credentials by design.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-page">
      <header className="landing-header">
        <Brand />
        <nav className="landing-nav" aria-label="Primary navigation">
          <Link href="/developers">Developers</Link>
          <Link href="/portal">Subscriber Portal</Link>
          <Link className="landing-nav-admin" href="/admin">Admin</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="landing-intro">
          <h1 className="display">
            The intelligence and publishing network behind every Orbit application.
          </h1>
          <p className="muted">
            ONN is centralized, API-first infrastructure for collecting, normalizing,
            distributing, and measuring external news and first-party Orbit content.
          </p>
          <div className="landing-actions">
            <Link className="landing-primary-action" href="/developers">
              Explore the API <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <Link className="landing-secondary-action" href="/portal">Open portal</Link>
          </div>
          <p className="landing-status">
            <span aria-hidden="true">●</span> Ad-free · free-MVP foundation · under active development
          </p>
        </div>
        <NetworkDiagram />
      </section>

      <section className="landing-principles" aria-label="Platform principles">
        <div className="landing-principles-inner">
          {principles.map(({ icon: Icon, title, body }) => (
            <article className="landing-principle" key={title}>
              <Icon color="#38bdf8" size={21} aria-hidden="true" />
              <div>
                <h2 className="display">{title}</h2>
                <p className="muted">{body}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

function NetworkDiagram() {
  const connections = [
    [300, 250, 120, 90],
    [300, 250, 475, 100],
    [300, 250, 500, 330],
    [300, 250, 120, 390],
    [300, 250, 300, 455],
  ];
  const applications: Array<[number, number, string]> = [
    [120, 90, "Career Pivot"],
    [475, 100, "Social Encounter"],
    [500, 330, "APD"],
    [120, 390, "Orbit CRM"],
    [300, 455, "Future Apps"],
  ];

  return (
    <div className="landing-network">
      <svg viewBox="0 0 600 500" role="img" aria-labelledby="network-title network-description">
        <title id="network-title">Orbit News Network platform</title>
        <desc id="network-description">ONN connects and serves multiple current and future Orbit applications.</desc>
        {connections.map(([x1, y1, x2, y2], index) => (
          <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#31506b" strokeWidth="2" />
        ))}
        <circle cx="300" cy="250" r="69" fill="#0b1b29" />
        <text x="300" y="243" textAnchor="middle" fill="#fff" fontSize="34" fontWeight="700">ONN</text>
        <text x="300" y="271" textAnchor="middle" fill="#90a4b8" fontSize="11">PLATFORM CORE</text>
        {applications.map(([x, y, label]) => (
          <g key={label}>
            <circle cx={x} cy={y} r="43" fill="#0b1824" />
            <text x={x} y={y + 4} textAnchor="middle" fill="#cfe1ed" fontSize="11">{label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}
