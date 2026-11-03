export type ProjectId = "ethernet" | "serdes" | "axi" | "swiftgreeks";
export type Topic = "about" | "projects" | "experience" | "education" | "contact" | "unknown" | `project:${ProjectId}`;

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
    link: { href: "/writeups/ethernet-verification.html", label: "Read the writeup" },
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
    chips: ["SystemVerilog", "High-speed serial communication"],
    link: { href: "/writeups/serdes-debug.html", label: "Read the writeup" },
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
    link: { href: "/writeups/axi-lite-monitor.html", label: "Read the writeup" },
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
    link: { href: "https://github.com/andychiem19/swift-greeks", label: "GitHub" },
  },
];

export const projectById = (id: ProjectId) => projects.find((p) => p.id === id)!;

/** The question shown in the user bubble when a topic is opened from a chip, the sidebar, or a link */
export const prompts: Record<Exclude<Topic, "unknown">, string> = {
  about: "What are you looking for?",
  projects: "Show me your projects",
  experience: "Where have you worked?",
  education: "Tell me about your education",
  contact: "How can I reach you?",
  "project:ethernet": "Walk me through the 100G Ethernet verification",
  "project:serdes": "How did you debug the GTM-to-GTYP SerDes link?",
  "project:axi": "What was wrong with the AXI-Lite performance monitor?",
  "project:swiftgreeks": "Tell me about swiftGreeks",
};

export const starterSuggestions: { topic: Topic; label: string }[] = [
  { topic: "projects", label: "Show me your projects" },
  { topic: "experience", label: "Where have you worked?" },
  { topic: "education", label: "Education" },
  { topic: "about", label: "What are you looking for?" },
  { topic: "contact", label: "Contact" },
];

/** Follow-up chips offered under each answer */
export const followUps: Record<Topic, Topic[]> = {
  about: ["projects", "experience", "contact"],
  projects: ["experience", "education", "contact"],
  experience: ["project:serdes", "project:axi", "project:ethernet"],
  education: ["project:swiftgreeks", "projects", "about"],
  contact: ["projects", "about"],
  unknown: ["projects", "experience", "education", "contact"],
  "project:ethernet": ["project:serdes", "experience", "projects"],
  "project:serdes": ["project:axi", "experience", "projects"],
  "project:axi": ["project:swiftgreeks", "experience", "projects"],
  "project:swiftgreeks": ["project:ethernet", "education", "contact"],
};

export const followUpLabel = (t: Topic) =>
  t.startsWith("project:") ? projectById(t.slice(8) as ProjectId).short : prompts[t as keyof typeof prompts] ?? t;

/** Topic <-> URL hash, so writeups' "Back to projects" links (index.html#project-N) still land somewhere useful */
export function topicFromHash(hash: string): Topic | null {
  const h = hash.replace(/^#/, "");
  if (!h || h === "home") return null;
  const p = projects.find((x) => x.hash === h || x.id === h);
  if (p) return `project:${p.id}`;
  if (h in prompts) return h as Topic;
  return null;
}

export function hashFromTopic(t: Topic): string {
  if (t.startsWith("project:")) return projectById(t.slice(8) as ProjectId).hash;
  return t === "unknown" ? "" : t;
}

/** Keyword routing for free-text questions typed into the composer */
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

export function routeQuestion(text: string): Topic {
  return rules.find(([re]) => re.test(text))?.[1] ?? "unknown";
}

export const links = {
  email: "mailto:andy.chiem19@gmail.com",
  github: "https://github.com/andychiem19",
  linkedin: "https://www.linkedin.com/in/andychiem2006/",
  pdf: "/portfolio.pdf",
};
