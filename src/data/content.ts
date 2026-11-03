export type ProjectId = "ethernet" | "serdes" | "axi" | "swiftgreeks";
export type Topic =
  | "about"
  | "projects"
  | "experience"
  | "education"
  | "contact"
  | "unknown"
  | `project:${ProjectId}`
  | `writeup:${ProjectId}`;

export type Project = {
  id: ProjectId;
  /** legacy anchor (writeups link back to index.html#project-N) */
  hash: string;
  title: string;
  short: string;
  subtitle: string;
  org: string;
  status: "done" | "progress";
  timeline: string;
  chips: string[];
  /** standalone writeup page under /writeups, shared with the inline version */
  writeup?: string;
  link: { href: string; label: string };
};

export const projects: Project[] = [
  {
    id: "ethernet",
    hash: "project-1",
    title: "100G Ethernet Verification",
    short: "100G Ethernet verification",
    subtitle:
      "Verification environment for 100G Ethernet built in Python and cocotb, intended for open-source release.",
    org: "Woodward McCoach Inc.",
    status: "done",
    timeline: "Mar 2026 – Aug 2026",
    chips: ["Python", "cocotb", "Ethernet"],
    writeup: "ethernet-verification.html",
    link: { href: "/writeups/ethernet-verification.html", label: "Open as a page" },
  },
  {
    id: "serdes",
    hash: "project-2",
    title: "GTM-to-GTYP SerDes Protocol Debug",
    short: "GTM-to-GTYP SerDes debug",
    subtitle:
      "Diagnosed and resolved a critical error in a proprietary chip-to-chip communication protocol before release, unblocking 4x28G high-speed serial communication between Versal GTM and GTYP transceivers.",
    org: "Woodward McCoach Inc.",
    status: "done",
    timeline: "Apr 2026 – Aug 2026",
    chips: ["SystemVerilog", "High-speed serial"],
    writeup: "serdes-debug.html",
    link: { href: "/writeups/serdes-debug.html", label: "Open as a page" },
  },
  {
    id: "axi",
    hash: "project-3",
    title: "Debugging an AXI-Lite Performance Monitor",
    short: "AXI-Lite performance monitor",
    subtitle:
      "Resolved differing behavior in simulation and hardware using Vivado ILAs; increased bandwidth measurements from 70% to 100% of expected.",
    org: "Woodward McCoach Inc.",
    status: "done",
    timeline: "Mar 2026 – Aug 2026",
    chips: ["Vivado", "ILAs", "SystemVerilog"],
    writeup: "axi-lite-monitor.html",
    link: { href: "/writeups/axi-lite-monitor.html", label: "Open as a page" },
  },
  {
    id: "swiftgreeks",
    hash: "project-4",
    title: "swiftGreeks: Options Pricing Accelerator",
    short: "swiftGreeks options accelerator",
    subtitle:
      "Project exploring systems design and Ethernet infrastructure, using a fixed-point CORDIC engine for real-time Delta calculation. Achieved delta computation in 210 ns deterministic latency (63 cycles at 300MHz).",
    org: "Personal project",
    status: "progress",
    timeline: "June 2026 – present",
    chips: ["Python", "Systems design", "Ethernet", "SystemVerilog"],
    link: { href: "https://github.com/andychiem19/swift-greeks", label: "View on GitHub" },
  },
];

export const projectById = (id: ProjectId) => projects.find((p) => p.id === id)!;
const projectOf = (t: Topic) => projectById(t.slice(t.indexOf(":") + 1) as ProjectId);

const basePrompts = {
  about: "Tell me about yourself",
  projects: "Show me your projects",
  experience: "Where have you worked?",
  education: "Tell me about your education",
  contact: "How can I reach you?",
  unknown: "...",
};

const projectPrompts: Record<ProjectId, string> = {
  ethernet: "Walk me through the 100G Ethernet verification",
  serdes: "How did you debug the GTM-to-GTYP SerDes link?",
  axi: "What was wrong with the AXI-Lite performance monitor?",
  swiftgreeks: "Tell me about swiftGreeks",
};

/** The question shown in the user bubble when a topic is asked from a suggestion */
export function promptFor(t: Topic): string {
  if (t.startsWith("project:")) return projectPrompts[projectOf(t).id];
  if (t.startsWith("writeup:")) return "Show me the full writeup";
  return basePrompts[t as keyof typeof basePrompts] ?? t;
}

export const starterSuggestions: { topic: Topic; label: string }[] = [
  { topic: "projects", label: "Show me your projects" },
  { topic: "experience", label: "Where have you worked?" },
  { topic: "about", label: "What are you looking for?" },
  { topic: "contact", label: "How can I reach you?" },
];

/** Follow-up suggestions offered under the latest answer in a chat */
export function followUps(t: Topic): Topic[] {
  if (t.startsWith("project:") || t.startsWith("writeup:")) {
    const p = projectOf(t);
    const next = projects[(projects.indexOf(p) + 1) % projects.length];
    if (t.startsWith("writeup:")) return [`project:${next.id}`, "contact"];
    return [...(p.writeup ? [`writeup:${p.id}` as Topic] : []), `project:${next.id}`, "experience"];
  }
  const map: Record<string, Topic[]> = {
    about: ["projects", "experience", "contact"],
    projects: ["experience", "education", "contact"],
    experience: ["project:serdes", "project:axi", "project:ethernet"],
    education: ["project:swiftgreeks", "projects", "about"],
    contact: ["projects", "about"],
    unknown: ["projects", "experience", "education", "contact"],
  };
  return map[t] ?? [];
}

export function followUpLabel(t: Topic): string {
  if (t.startsWith("writeup:")) return "Read the full writeup";
  if (t.startsWith("project:")) return projectOf(t).short;
  return promptFor(t);
}

/** Keyword routing for free-text questions typed into the composer */
const MORE = /writeup|write-up|full story|details|deep dive|more/i;
const rules: [RegExp, Topic][] = [
  [/swift|greek|cordic|option|black.?scholes|zybo|delta/i, "project:swiftgreeks"],
  [/serdes|gtm|gtyp|transceiver|serial|28g|bit.?order/i, "project:serdes"],
  [/axi|ila|monitor|bandwidth|snapshot/i, "project:axi"],
  [/ethernet|100g|cocotb|dcmac|scapy|pcs|verif/i, "project:ethernet"],
  [/project|built|build|portfolio|work on|made/i, "projects"],
  [/work|job|intern|co-?op|experience|woodward|mccoach|company|employ/i, "experience"],
  [/school|cornell|educat|study|studies|degree|major|class|university|college|gpa|course/i, "education"],
  [/contact|email|reach|linkedin|github|resume|cv|pdf|hire/i, "contact"],
  [/about|who|yourself|looking|goal|interest|fpga|asic|rtl|hello|hi\b|hey/i, "about"],
];

/** Routes a typed question; "tell me more" inside a project chat opens that project's writeup */
export function routeQuestion(text: string, context: Topic | null): Topic {
  const hit = rules.find(([re]) => re.test(text))?.[1] ?? "unknown";
  if (MORE.test(text)) {
    const inProject = context && /^(project|writeup):/.test(context) ? context : null;
    const target = hit.startsWith("project:") ? hit : inProject;
    if (target) {
      const p = projectOf(target);
      return p.writeup ? `writeup:${p.id}` : `project:${p.id}`;
    }
  }
  return hit;
}

export const links = {
  email: "mailto:andy.chiem19@gmail.com",
  github: "https://github.com/andychiem19",
  linkedin: "https://www.linkedin.com/in/andychiem2006/",
  pdf: "/portfolio.pdf",
};

/* ---------- Chats ---------- */

export type Message = { id: number; role: "user"; text: string } | { id: number; role: "assistant"; topic: Topic };
export type Dot = "blue" | "done" | "progress";
export type Chat = { id: string; title: string; group: "projects" | "about" | "recent"; dot: Dot; messages: Message[] };

let nextMessageId = 1;
export const newMessageId = () => nextMessageId++;

/** Answers that were already on screen once; they don't replay the typing and pixel build-in */
export const seenAnswers = new Set<number>();

function seed(id: string, title: string, group: Chat["group"], dot: Dot, topic: Topic): Chat {
  const answer: Message = { id: newMessageId(), role: "assistant", topic };
  seenAnswers.add(answer.id);
  return { id, title, group, dot, messages: [{ id: newMessageId(), role: "user", text: promptFor(topic) }, answer] };
}

/** The pre-opened chats in the sidebar */
export function seedChats(): Chat[] {
  return [
    ...projects.map((p) => seed(p.hash, p.short, "projects", p.status, `project:${p.id}`)),
    seed("about", "About me", "about", "blue", "about"),
    seed("experience", "Experience", "about", "blue", "experience"),
    seed("education", "Education", "about", "blue", "education"),
    seed("contact", "Contact", "about", "blue", "contact"),
  ];
}

/** Accepts legacy anchors (#project-3) and project ids (#axi) */
export function chatIdFromHash(hash: string): string {
  const h = hash.replace(/^#/, "");
  return projects.find((p) => p.id === h)?.hash ?? h;
}
