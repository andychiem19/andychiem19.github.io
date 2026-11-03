import { ArrowUpRight, Code, Download, Mail, UserRound } from "lucide-react";
import { Suspense } from "react";
import { links, projectById, projects, type Project, type ProjectId, type Topic } from "../data/content";
import { diagrams } from "./Diagrams";
import { Writeup } from "./Writeup";

type Ask = (t: Topic) => void;

export function Status({ status }: { status: Project["status"] }) {
  return (
    <span className={status === "done" ? "status done" : "status"}>
      <span className="dot" aria-hidden="true" />
      {status === "done" ? "Complete" : "In progress"}
    </span>
  );
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="tags">
      {items.map((c) => (
        <li key={c}>{c}</li>
      ))}
    </ul>
  );
}

function ProjectsAnswer({ onAsk }: { onAsk: Ask }) {
  return (
    <>
      <p>
        {"Here's what I've been building. Three came out of my co-op at Woodward McCoach; swiftGreeks is a personal project that's still in progress. Pick one to see its interactive block diagram."}
      </p>
      <ul className="project-list">
        {projects.map((p) => (
          <li key={p.id}>
            <button type="button" className="project-card" onClick={() => onAsk(`project:${p.id}`)}>
              <span className="project-card-head">
                <strong>{p.title}</strong>
                <Status status={p.status} />
              </span>
              <span className="project-card-sub">{p.subtitle}</span>
              <span className="project-card-meta">
                {p.org} · {p.timeline}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

const projectIntro: Record<ProjectId, string> = {
  ethernet:
    "I built a Python and cocotb verification environment for the Versal DCMAC, the 100G Ethernet MAC. A Scapy generator produces frames, a virtual PCS/PMA does the 100GBASE-R encoding, and a cocotb interface drives the lanes into the MAC in simulation.",
  serdes:
    "A proprietary chip-to-chip protocol was failing between Versal GTM and GTYP transceivers. I traced it to a bit-order incompatibility across the cross-connected serial links and fixed it before release, which unblocked 4x28G communication.",
  axi: "A performance monitor on an AXI-Lite snapshot interface passed in simulation but read wrong on hardware. Probing it with a Vivado ILA exposed an off-by-one error; fixing it took measured bandwidth from 70% to 100% of expected.",
  swiftgreeks:
    "swiftGreeks streams live market data from Python over Ethernet into a Zybo Z7, where a fixed-point CORDIC core computes Black-Scholes Greeks and sends them back. Delta lands in 210 ns with deterministic latency (63 cycles at 300MHz).",
};

function ProjectAnswer({ id }: { id: ProjectId }) {
  const p = projectById(id);
  const Diagram = diagrams[id];
  return (
    <>
      <h2 className="answer-title">{p.title}</h2>
      <p>{projectIntro[id]}</p>
      <Diagram />
      <dl className="spec">
        <dt>Organization</dt>
        <dd>{p.org}</dd>
        <dt>Timeline</dt>
        <dd>{p.timeline}</dd>
        <dt>Status</dt>
        <dd>
          <Status status={p.status} />
        </dd>
      </dl>
      <Chips items={p.chips} />
      {!p.writeup && (
        <p>
          <a className="cta" href={p.link.href} target="_blank" rel="noopener">
            {p.link.label}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        </p>
      )}
    </>
  );
}

function WriteupAnswer({ id }: { id: ProjectId }) {
  const p = projectById(id);
  return (
    <>
      <h2 className="answer-title">{p.title}</h2>
      <Suspense fallback={<p className="aside">Loading the writeup...</p>}>
        <Writeup id={id} />
      </Suspense>
      <p>
        <a className="cta" href={p.link.href}>
          {p.link.label}
          <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </p>
    </>
  );
}

function ExperienceAnswer({ onAsk }: { onAsk: Ask }) {
  return (
    <div className="role">
      <div className="role-head">
        <div>
          <h2 className="answer-title">FPGA Development Engineer Co-op</h2>
          <p className="role-org">Woodward McCoach Inc.</p>
        </div>
        <span className="role-dates">Mar 2026 – Aug 2026</span>
      </div>
      <ul className="bullets">
        <li>Validated high-speed serial interfaces and worked on production telecommunications hardware.</li>
        <li>
          Developed 100G Ethernet verification software in Python and cocotb, intended for open-source release.{" "}
          <button type="button" className="inline-link" onClick={() => onAsk("project:ethernet")}>
            See project
          </button>
        </li>
        <li>
          Root-caused a bit-order bug in a GTM-to-GTYP chip-to-chip protocol, unblocking 4x28G links.{" "}
          <button type="button" className="inline-link" onClick={() => onAsk("project:serdes")}>
            See project
          </button>
        </li>
        <li>
          Debugged an AXI-Lite performance monitor with Vivado ILAs, raising measured bandwidth from 70% to 100%.{" "}
          <button type="button" className="inline-link" onClick={() => onAsk("project:axi")}>
            See project
          </button>
        </li>
      </ul>
      <Chips items={["SystemVerilog", "Python", "cocotb", "Vivado", "Versal"]} />
    </div>
  );
}

function EducationAnswer() {
  return (
    <>
      <div className="role">
        <div className="role-head">
          <div>
            <h2 className="answer-title">Cornell University</h2>
            <p className="role-org">Duffield College of Engineering · Electrical and Computer Engineering</p>
          </div>
          <span className="role-dates">{"Class of '29"}</span>
        </div>
        <p>
          {"I'm a sophomore focused on FPGA/ASIC engineering and applications. My project and research work has centered on implementing and optimizing complex math in hardware, from CORDIC-based options pricing to Ising-model optimization."}
        </p>
      </div>
      <Chips items={["Digital design", "FPGA", "ASIC", "Fixed-point math"]} />
    </>
  );
}

function AboutAnswer() {
  return (
    <>
      <p>
        {"I'm looking to apply and deepen my digital design fundamentals through internship and project team opportunities in "}
        <strong>ASIC design</strong> (design verification, RTL) and <strong>FPGA development</strong>.
      </p>
      <p>
        {"I'm a sophomore in Electrical and Computer Engineering at Cornell, and I recently finished a co-op at Woodward McCoach, where I validated high-speed serial interfaces, worked on production telecom hardware, and built 100G Ethernet verification software."}
      </p>
      <p className="aside">{"Mostly: debugging AXI interfaces and craving functional coverage."}</p>
    </>
  );
}

function ContactAnswer() {
  const items = [
    { href: links.email, label: "Email", detail: "andy.chiem19@gmail.com", Icon: Mail },
    { href: links.linkedin, label: "LinkedIn", detail: "in/andychiem2006", Icon: UserRound, external: true },
    { href: links.github, label: "GitHub", detail: "andychiem19", Icon: Code, external: true },
    { href: links.pdf, label: "Portfolio PDF", detail: "Printable version", Icon: Download, download: true },
  ];
  return (
    <>
      <p>{"The fastest way to reach me is email. I'm happy to talk about internships, project teams, or anything RTL."}</p>
      <ul className="contact-list">
        {items.map(({ href, label, detail, Icon, external, download }) => (
          <li key={label}>
            <a href={href} {...(external ? { target: "_blank", rel: "noopener" } : {})} {...(download ? { download: true } : {})}>
              <Icon size={18} aria-hidden="true" />
              <span>
                <strong>{label}</strong>
                <span>{detail}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function UnknownAnswer() {
  return (
    <p>
      {"I only have pre-written answers, so I might not have one for that. Try asking about my projects, experience, education, or how to get in touch."}
    </p>
  );
}

export function Answer({ topic, onAsk }: { topic: Topic; onAsk: Ask }) {
  if (topic.startsWith("project:")) return <ProjectAnswer id={topic.slice(8) as ProjectId} />;
  if (topic.startsWith("writeup:")) return <WriteupAnswer id={topic.slice(8) as ProjectId} />;
  switch (topic) {
    case "projects":
      return <ProjectsAnswer onAsk={onAsk} />;
    case "experience":
      return <ExperienceAnswer onAsk={onAsk} />;
    case "education":
      return <EducationAnswer />;
    case "about":
      return <AboutAnswer />;
    case "contact":
      return <ContactAnswer />;
    default:
      return <UnknownAnswer />;
  }
}
