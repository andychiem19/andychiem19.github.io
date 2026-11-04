// Home page opens on the title card: ignore restored scroll positions and leftover #section links,
// except a project deep link (#projects/<slug>, e.g. a writeup's "Back to projects"), which opens that project
const deepLink = location.hash.startsWith("#projects/") ? location.hash.slice(10) : null;
if (document.querySelector(".panel")) {
  history.scrollRestoration = "manual";
  const target = () => (deepLink ? document.getElementById("projects").offsetTop : 0);
  if (!deepLink && location.hash) history.replaceState(null, "", location.pathname + location.search);
  scrollTo(0, target());
  addEventListener("load", () => scrollTo(0, target()));
}

// Pixel build-in: cover each block with cells, clear them in a diagonal ripple on enter
const CELL = 10;
const DURATION = 500;

function cover(el) {
  cancelAnimationFrame(el._raf);
  const c = el._px;
  c.width = el.offsetWidth;
  c.height = el.offsetHeight;
  const ctx = c.getContext("2d");
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--package");  // read live: the theme can change
  ctx.fillRect(0, 0, c.width, c.height);
}

// after a theme switch, repaint whatever cells are still covering in the new background
function recolor(el) {
  const ctx = el._px.getContext("2d");
  ctx.globalCompositeOperation = "source-in";
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--package");
  ctx.fillRect(0, 0, el._px.width, el._px.height);
  ctx.globalCompositeOperation = "source-over";
}

function build(el) {
  cover(el);
  const ctx = el._px.getContext("2d");
  const cols = Math.ceil(el._px.width / CELL);
  const rows = Math.ceil(el._px.height / CELL);
  const cells = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) cells.push([c, r, c + r + Math.random() * 8]);
  cells.sort((a, b) => a[2] - b[2]);

  let i = 0;
  const start = performance.now();
  const step = (t) => {
    const n = Math.min(cells.length, Math.ceil((cells.length * (t - start)) / DURATION));
    for (; i < n; i++) ctx.clearRect(cells[i][0] * CELL, cells[i][1] * CELL, CELL, CELL);
    if (i < cells.length) el._raf = requestAnimationFrame(step);
  };
  el._raf = requestAnimationFrame(step);
}

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  // Build in once 25% is visible; cover again only after fully leaving the screen
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const el = e.target;
      if (e.intersectionRatio >= 0.25 && !el._shown) { el._shown = true; build(el); }
      else if (!e.isIntersecting && el._shown) { el._shown = false; cover(el); }
    });
  }, { threshold: [0, 0.25] });
  document.querySelectorAll(".reveal").forEach((el) => {
    el._px = el.appendChild(document.createElement("canvas"));
    el._px.className = "px";
    cover(el);
    revealObserver.observe(el);
  });
}

// Theme: follows the system until picked with the toggle; the pick is remembered (each page applies it before first paint)
const toggle = document.querySelector(".theme-toggle");
const isDark = () => document.documentElement.dataset.theme === "dark";
const label = () => toggle && (toggle.textContent = isDark() ? "Light" : "Dark");
matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  try { if (localStorage.getItem("theme")) return; } catch (err) {}
  document.documentElement.dataset.theme = e.matches ? "dark" : "light";
  label();
  document.querySelectorAll(".reveal").forEach((el) => el._px && recolor(el));
});
if (toggle) {
  label();
  toggle.addEventListener("click", () => {
    const theme = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem("theme", theme); } catch (e) {}
    label();
    document.querySelectorAll(".reveal").forEach((el) => el._px && recolor(el));
  });
}

// Skills read as a SystemVerilog assign: assign skills = {python, cocotb, ethernet};
// (names become identifiers; inside a writeup's spec table the row already names it, so just the concatenation)
document.querySelectorAll(".chips").forEach((ul) => {
  ul.querySelectorAll("li").forEach((li) => (li.textContent = li.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")));
  const tok = (html) => Object.assign(document.createElement("li"), { className: "sv", innerHTML: html, ariaHidden: "true" });
  const named = !ul.closest(".spec");
  if (!named) {  // spec table: inline text, so drop the source whitespace and let long names break after an underscore
    [...ul.childNodes].forEach((n) => n.nodeType === 3 && n.remove());
    ul.querySelectorAll("li").forEach((li) => (li.innerHTML = li.textContent.replace(/_/g, "_<wbr>")));
  }
  ul.prepend(tok(named ? '<b class="kw">assign</b> <span class="id">skills</span> = {' : "{"));
  ul.append(tok(named ? "};" : "}"));
});

// Organization reads as an assign too, paired above skills: assign org = wmi; [logo] with the timeline's signal name
// and logo (a personal project has none, so it's left floating)
document.querySelectorAll(".proj .org").forEach((p) => {
  const status = p.querySelector(".status"), name = p.textContent.replace("Organization:", "").replace(status?.textContent || "", "").trim();
  const lbl = p.dataset.sig && [...document.querySelectorAll(".tl-lbl")].find((l) => l.textContent.trim() === p.dataset.sig);
  p.innerHTML = '<b class="kw">assign</b> <span class="id">org</span>    = ' + (lbl
    ? `<span class="nm"></span>; <img src="${lbl.querySelector("img").getAttribute("src")}" alt="">`
    : "'z; <span class=\"cmt\">// personal project</span>");
  if (lbl) { p.querySelector(".nm").textContent = p.dataset.sig; p.title = name; }
  if (status) p.append(" ", status);  // print only
  p.setAttribute("aria-label", "Organization: " + name);
});

// Project links are output port flags named after the signal: eth_100g.writeup, swift_greeks.github
document.querySelectorAll(".proj .links a").forEach((a) => {
  const sig = a.closest(".proj").querySelector(".cap-head span").textContent;
  a.setAttribute("aria-label", a.textContent);
  a.textContent = `${sig}.${/github/i.test(a.textContent) ? "github" : "writeup"}`;
});

// RUN: run the capture like a simulator. Sim time advances a clock tick at a time, the traces redraw behind the
// "now" line, and the log prints each line whole at its moment in sim time (the lines come from the <pre> in index.html)
const run = document.querySelector(".run"), simlog = document.getElementById("simlog");
if (run && simlog) {
  const wave = document.querySelector(".wave"), trig = document.querySelector(".cap-bar .trig");
  const lines = simlog.textContent.trim().split("\n").map((l) => l.trim());
  const kind = (l) => (l.startsWith("$") ? "cmd" : l.startsWith("**") ? "pass" : "msg");
  const line = (l) => Object.assign(document.createElement("span"), { className: kind(l), textContent: l });
  const print = (n) => { while (simlog.children.length < n) simlog.append(line(lines[simlog.children.length])); };
  const clock = Object.assign(document.createElement("span"), { className: "simtime", hidden: true });
  const front = Object.assign(document.createElement("span"), { className: "simfront" });
  front.setAttribute("aria-hidden", "true");
  trig.after(clock);
  const TICK = 24, NS = 10;  // px per clock (the ruler tick), ns per clock
  // a real sim runs in uneven bursts: 1-3 clocks per step, irregular gaps, the odd longer stall
  const gap = () => (Math.random() < 0.12 ? 350 + Math.random() * 300 : 70 + Math.random() * 150);
  const hold = (l) => 250 + l.length * 10;  // the sim halts while a log line prints, long enough to read it
  const instant = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let timer;
  const status = (s) => { trig.textContent = s; trig.classList.toggle("running", s === "Running"); };
  const stop = () => {
    clearTimeout(timer);
    front.remove();
    simlog.hidden = clock.hidden = true;
    status("Triggered");
    run.textContent = "▶ Run";
    run.setAttribute("aria-expanded", "false");
  };
  const start = () => {
    clearTimeout(timer);
    simlog.replaceChildren();
    simlog.hidden = clock.hidden = false;
    run.textContent = "■ Stop";
    run.setAttribute("aria-expanded", "true");
    const x0 = wave.querySelector(".ruler").offsetLeft, ticks = Math.ceil((wave.clientWidth - x0) / TICK);
    const finish = () => { front.remove(); print(lines.length); clock.textContent = `Now: ${ticks * NS} ns`; status("Finished"); };
    if (instant) return finish();
    let t = 0;
    status("Running");
    clock.textContent = "Now: 0 ns";
    front.style.left = x0 + "px";
    wave.append(front);
    print(1);  // the command line
    const step = () => {
      // messages are spread over the run (the result lands at the end); print one at a time, holding the sim each time
      const n = simlog.children.length;
      if (n < 1 + Math.floor((t / ticks) * (lines.length - 1))) {
        print(n + 1);
        return (timer = setTimeout(step, hold(lines[n])));
      }
      if (t >= ticks) return finish();
      t = Math.min(ticks, t + 1 + Math.floor(Math.random() * 3));
      front.style.left = x0 + t * TICK + "px";
      clock.textContent = `Now: ${t * NS} ns`;
      timer = setTimeout(step, gap());
    };
    timer = setTimeout(step, gap());
  };
  run.addEventListener("click", () => (simlog.hidden ? start() : stop()));
}

// Writeups: build the signal nav from the section headings (one signal per <h2>)
const heads = [...document.querySelectorAll(".doc-body h2")];
if (heads.length && !document.querySelector(".signals")) {
  const nav = document.createElement("nav");
  nav.className = "signals";
  nav.setAttribute("aria-label", "Sections");
  heads.forEach((h) => {
    const name = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    h.id ||= name;
    const a = document.createElement("a");
    a.href = "#" + h.id;
    a.setAttribute("aria-label", h.textContent.trim());
    a.innerHTML = "<span></span><i></i>";
    a.firstChild.textContent = name;
    nav.append(a);
  });
  nav.insertAdjacentHTML("beforeend", '<b class="scrub" aria-hidden="true"></b>');
  document.body.prepend(nav);
}

// Signal nav: one slot per section (home: the panels; writeups: the h2 sections). The cursor moves across the
// strip with scroll (section i owns slot i), and the section under the middle of the screen drives its signal high.
const pins = document.querySelectorAll(".signals a");
const signals = document.querySelector(".signals");
if (signals) {
  pins.forEach((a, i) => a.style.setProperty("--i", i));
  signals.style.setProperty("--n", pins.length);
  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const spans = () => {
    const panels = [...document.querySelectorAll(".panel")];
    if (panels.length) return panels.map((p) => [top(p), top(p) + p.offsetHeight]);
    return heads.map((h, i) => [top(h), i + 1 < heads.length ? top(heads[i + 1]) : document.documentElement.scrollHeight]);
  };
  let queued = false;
  const track = () => {
    queued = false;
    const s = spans(), y = scrollY + innerHeight / 2;
    let i = s.findIndex(([, end]) => y < end);
    if (i < 0) i = s.length - 1;
    const f = Math.max(0, Math.min(1, (y - s[i][0]) / (s[i][1] - s[i][0])));
    signals.style.setProperty("--x", (i + f) / s.length);
    pins.forEach((p, j) => p.classList.toggle("active", j === i));
  };
  addEventListener("scroll", () => queued || (queued = requestAnimationFrame(track)), { passive: true });
  addEventListener("resize", track);
  addEventListener("load", track);
  track();
}

// Detented scrolling (desktop): wheel input presses against a detent, then clicks to the next panel
const detent =
  document.querySelector(".panel") &&
  matchMedia("(pointer: fine) and (min-width: 801px)").matches &&
  !matchMedia("(prefers-reduced-motion: reduce)").matches;

if (detent) {
  const THRESHOLD = 150;  // px of wheel travel to actuate
  const RESIST = 0.12;    // how much the page gives before actuating
  const MAX_NUDGE = 18;
  const GLIDE = 700;      // ms to travel between panels

  const panels = [...document.querySelectorAll(".panel")];
  const main = document.querySelector("main");
  document.documentElement.classList.add("detent");

  let acc = 0, nudge = 0, animating = false, locked = false, lastWheel = 0, quiet;

  const ease = (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);

  const setNudge = (px, transition) => {
    nudge = px;
    main.style.transition = transition || "none";
    main.style.transform = px ? `translateY(${-px}px)` : "";
  };

  const currentIndex = () => {
    const y = scrollY + innerHeight / 2;
    const i = panels.findIndex((p) => y >= p.offsetTop && y < p.offsetTop + p.offsetHeight);
    return i < 0 ? panels.length - 1 : i;
  };

  function goTo(i) {
    i = Math.max(0, Math.min(panels.length - 1, i));
    const from = scrollY, to = panels[i].offsetTop, n0 = nudge, start = performance.now();
    animating = locked = true;
    acc = 0;
    const step = (t) => {
      const k = Math.min(1, (t - start) / GLIDE), e = ease(k);
      scrollTo(0, from + (to - from) * e);
      setNudge(n0 * (1 - e));
      if (k < 1) requestAnimationFrame(step);
      else animating = false;
    };
    requestAnimationFrame(step);
  }

  addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    const now = performance.now(), gap = now - lastWheel;
    lastWheel = now;

    // Let a panel taller than the screen scroll natively until its edge
    const p = panels[currentIndex()];
    const inside = dy > 0
      ? scrollY + innerHeight < p.offsetTop + p.offsetHeight - 2
      : scrollY > p.offsetTop + 2;
    if (inside && !animating) return;

    e.preventDefault();
    // Swallow trackpad momentum from the gesture that just actuated
    if (animating || (locked && gap < 150)) return;
    locked = false;

    if (Math.sign(dy) !== Math.sign(acc)) acc = 0;
    acc += dy;
    setNudge(Math.sign(acc) * Math.min(Math.abs(acc) * RESIST, MAX_NUDGE), "transform 0.1s ease-out");

    clearTimeout(quiet);
    quiet = setTimeout(() => {
      if (animating) return;
      acc = 0;
      setNudge(0, "transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)");  // spring back
    }, 300);

    if (Math.abs(acc) >= THRESHOLD) goTo(currentIndex() + Math.sign(acc));
  }, { passive: false });

  addEventListener("keydown", (e) => {
    const step = { ArrowDown: 1, PageDown: 1, " ": 1, ArrowUp: -1, PageUp: -1 }[e.key];
    const jump = { Home: 0, End: panels.length - 1 }[e.key];
    if (step === undefined && jump === undefined) return;
    e.preventDefault();
    if (!animating) goTo(jump ?? currentIndex() + (e.shiftKey && e.key === " " ? -1 : step));
  });

  pins.forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    goTo(panels.indexOf(document.querySelector(a.getAttribute("href"))));
  }));
}

// Block diagrams: hover, focus or tap a block to see what it does in a tooltip next to it
const hideTips = [];
document.querySelectorAll(".diagram-box").forEach((box) => {
  box.querySelector(".diagram-info")?.remove();
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  box.append(tip);
  const blocks = box.querySelectorAll("[data-info]");
  const show = (el) => {
    blocks.forEach((b) => b.classList.toggle("active", b === el));
    if (!el) return (tip.hidden = true);
    const name = document.createElement("strong");
    name.textContent = el.dataset.name || el.textContent.replace(/\s+/g, " ").trim();
    tip.replaceChildren(name, el.dataset.info);
    tip.hidden = false;
    // Centered on the block, kept inside the box; above it unless there's no room
    const b = box.getBoundingClientRect(), r = el.getBoundingClientRect(), t = tip.getBoundingClientRect();
    const cx = r.left + r.width / 2 - b.left;
    const x = Math.max(8, Math.min(cx - t.width / 2, b.width - t.width - 8));
    const above = r.top - b.top - t.height - 12;
    const below = above < 4;
    tip.style.left = x + "px";
    tip.style.top = (below ? r.bottom - b.top + 12 : above) + "px";
    tip.classList.toggle("below", below);
    tip.style.setProperty("--arrow-x", Math.max(12, Math.min(cx - x, t.width - 12)) + "px");
  };
  blocks.forEach((el) => {
    el.tabIndex = 0;
    el.addEventListener("mouseenter", () => show(el));
    el.addEventListener("focus", () => show(el));
    el.addEventListener("click", (e) => { e.stopPropagation(); show(el); });
  });
  box.addEventListener("mouseleave", () => show(null));
  hideTips.push(() => show(null));

  // Print and the PDF can't hover, so list every description under the diagram (shown only in print)
  const details = document.createElement("dl");
  details.className = "diagram-details";
  blocks.forEach((el) => {
    const dt = document.createElement("dt");
    dt.textContent = el.dataset.name || el.textContent.replace(/\s+/g, " ").trim();
    const dd = document.createElement("dd");
    dd.textContent = el.dataset.info;
    details.append(dt, dd);
  });
  box.append(details);
});
document.addEventListener("click", () => hideTips.forEach((hide) => hide()));
document.addEventListener("keydown", (e) => e.key === "Escape" && hideTips.forEach((hide) => hide()));

// Timeline: place each value by its dates, then add the ruler, the "now" cursor and the zoom window
const month = (s) => { const [y, m] = s.split("-").map(Number); return y * 12 + m - 1; };
const today = new Date();
const nowMonth = today.getFullYear() * 12 + today.getMonth() + (today.getDate() - 1) / 31;
document.querySelectorAll(".tl-capture").forEach((cap) => {
  const from = month(cap.dataset.from), span = month(cap.dataset.to) + 1 - from;
  const f = (cap._f = (m) => Math.max(0, Math.min(1, (m - from) / span)));
  cap.querySelectorAll(".val").forEach((v) => {
    v.style.setProperty("--a", f(month(v.dataset.start)));
    v.style.setProperty("--b", v.dataset.end ? f(month(v.dataset.end) + 1) : 1);
    v.classList.toggle("open", !v.dataset.end);
  });
  const ruler = document.createElement("span");
  ruler.className = "tl-ruler";
  ruler.setAttribute("aria-hidden", "true");
  const yearly = cap.dataset.unit === "year";
  for (let m = from; m < from + span; m++) {
    if (yearly && m % 12) continue;
    const tick = document.createElement("i");
    tick.style.setProperty("--f", f(m));
    tick.dataset.t = m % 12 ? "JFMAMJJASOND"[m % 12] : "'" + String(Math.floor(m / 12)).slice(2);
    ruler.append(tick);
  }
  const now = document.createElement("span");
  now.className = "tl-now";
  now.style.setProperty("--f", f(nowMonth));
  cap.prepend(ruler);
  cap.append(now);
});
const edu = document.querySelector(".tl-capture.edu"), exp = document.querySelector(".tl-capture.exp");
if (edu && exp) {
  const a = edu._f(month(exp.dataset.from)), b = edu._f(month(exp.dataset.to) + 1);
  const win = document.createElement("span");
  win.className = "tl-win";
  win.style.setProperty("--a", a);
  win.style.setProperty("--b", b);
  edu.append(win);
  const [l, r] = document.querySelectorAll(".zoom line");
  l?.setAttribute("x1", a * 100); l?.setAttribute("y1", 0); l?.setAttribute("x2", 0); l?.setAttribute("y2", 100);
  r?.setAttribute("x1", b * 100); r?.setAttribute("y1", 0); r?.setAttribute("x2", 100); r?.setAttribute("y2", 100);
}

// Timeline list view: a plain, compact list (logo, org, role, dates, where/GPA) for skimmers, behind a toggle in the
// first header. Built from the same rows as the waveform; the choice is remembered.
const tlRoot = document.querySelector(".tl");
if (tlRoot) {
  tlRoot.querySelectorAll(".tl-capture").forEach((cap) => {
    const ul = document.createElement("ul");
    ul.className = "tl-list";
    cap.querySelectorAll(".tl-row").forEach((row) => {
      const v = row.querySelector(".val"), info = v.dataset.info, cut = info.lastIndexOf(" · ");
      const field = (k) => [...row.querySelectorAll(".tl-sub dt")].find((dt) => dt.textContent === k)?.nextElementSibling.textContent;
      const li = document.createElement("li");
      li.innerHTML = '<img alt=""><span class="tl-org"></span><span class="tl-role"></span><span class="tl-meta"></span><span class="tl-when"></span>';
      li.querySelector("img").src = row.querySelector(".tl-lbl img").getAttribute("src");
      li.querySelector(".tl-org").textContent = v.dataset.name;
      li.querySelector(".tl-role").textContent = info.slice(0, cut);
      li.querySelector(".tl-when").textContent = info.slice(cut + 3);
      li.querySelector(".tl-meta").textContent = [field("where"), field("gpa") && "GPA " + field("gpa")].filter(Boolean).join(" · ");
      ul.append(li);
    });
    cap.after(ul);
  });
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "theme-toggle tl-view";
  const show = (list) => {
    tlRoot.classList.toggle("list", list);
    btn.textContent = list ? "Waves" : "List";
    btn.setAttribute("aria-label", list ? "Show the timeline as waveforms" : "Show the timeline as a plain list");
    hideTips.forEach((hide) => hide());
  };
  let saved = null;
  try { saved = localStorage.getItem("tlview"); } catch (e) {}
  show(saved === "list");
  btn.addEventListener("click", () => {
    const list = !tlRoot.classList.contains("list");
    try { localStorage.setItem("tlview", list ? "list" : "waves"); } catch (e) {}
    show(list);
  });
  tlRoot.querySelector(".cap-title").append(btn);
}

// Timeline inspector: click (or Enter on) a bar for a details card, from the row's <dl class="tl-sub">. On desktop the
// card floats beside the bar inside the timeline; on phones it's a sheet pinned to the bottom of the screen. Either
// way it never adds page height, so reading it doesn't push the page toward the projects.
const tlBox = document.querySelector(".tl");
if (tlBox) {
  const card = document.createElement("section");
  card.className = "inspect";
  card.hidden = true;
  card.setAttribute("aria-live", "polite");
  card.innerHTML = '<header><img alt=""><span class="ins-sig"></span><button type="button" class="ins-close" aria-label="Close details">×</button></header>' +
    '<div class="ins-body"><h3></h3><p class="ins-info"></p><dl class="ins-fields"></dl><p class="ins-note"></p></div>';
  tlBox.append(card);
  const $ = (s) => card.querySelector(s);
  const sheet = matchMedia("(max-width: 800px)");
  let cur = null, pinned = false;
  const close = () => { card.hidden = true; cur?.classList.remove("active"); cur = null; pinned = false; };
  const place = () => {
    card.style.left = card.style.top = "";
    if (!cur || sheet.matches) return;
    const box = tlBox.getBoundingClientRect(), r = cur.getBoundingClientRect(), w = card.offsetWidth, h = card.offsetHeight;
    const left = Math.max(0, Math.min(r.left - box.left, box.width - w));
    const below = r.bottom - box.top + 8, above = r.top - box.top - h - 8;
    card.style.left = left + "px";
    card.style.top = (below + h <= box.height || above < 0 ? below : above) + "px";  // below the bar unless it would spill out
  };
  // clicks pin the card (clicking the same bar again closes it); a hover dwell opens it unpinned
  const open = (v, hover) => {
    if (cur === v) { if (hover) return; if (pinned) return close(); return (pinned = true); }
    pinned = !hover;
    cur?.classList.remove("active");
    (cur = v).classList.add("active");
    const row = v.closest(".tl-row"), lbl = row.querySelector(".tl-lbl"), sub = row.querySelector(".tl-sub");
    const fields = $(".ins-fields"), note = $(".ins-note");
    let info = v.dataset.info;
    fields.replaceChildren();
    note.textContent = "";
    sub?.querySelectorAll("dt").forEach((dt) => {
      const dd = dt.nextElementSibling, k = dt.textContent;
      if (k === "gpa") info += " · GPA " + dd.textContent;
      else if (k === "note") { if (!dd.classList.contains("todo")) note.textContent = dd.textContent; }  // unwritten notes stay hidden
      else fields.append(dt.cloneNode(true), dd.cloneNode(true));
    });
    $("img").src = lbl.querySelector("img").src;
    $(".ins-sig").textContent = "Inspect · " + lbl.textContent.trim();
    $("h3").textContent = v.dataset.name;
    $(".ins-info").textContent = info;
    fields.hidden = !fields.children.length;
    note.hidden = !note.textContent;
    card.hidden = false;
    place();
  };
  tlBox.querySelectorAll(".tl-row .val").forEach((v) => {
    v.tabIndex = 0;
    v.setAttribute("role", "button");
    v.addEventListener("click", (e) => { e.stopPropagation(); open(v); });
    v.addEventListener("keydown", (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open(v)));
  });
  // desktop: resting on a bar fills it like a progress bar, then opens it; leaving the bar and the card closes an
  // unpinned card shortly after
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const DWELL = 700;
    let dwell, linger;
    const cancel = (v) => { clearTimeout(dwell); v.classList.remove("dwell"); };
    const stay = () => clearTimeout(linger);
    const leave = () => { clearTimeout(linger); linger = setTimeout(() => cur && !pinned && close(), 300); };
    tlBox.querySelectorAll(".tl-row .val").forEach((v) => {
      v.addEventListener("mouseenter", () => {
        stay();
        if (cur === v) return;
        v.classList.add("dwell");
        dwell = setTimeout(() => { v.classList.remove("dwell"); open(v, true); }, DWELL);
      });
      v.addEventListener("mouseleave", () => { cancel(v); leave(); });
      v.addEventListener("click", () => cancel(v));  // a click wins over the hover countdown
    });
    card.addEventListener("mouseenter", stay);
    card.addEventListener("mouseleave", leave);
  }
  card.addEventListener("click", (e) => e.stopPropagation());
  $(".ins-close").addEventListener("click", close);
  document.addEventListener("click", () => cur && close());
  addEventListener("keydown", (e) => e.key === "Escape" && cur && close());
  addEventListener("resize", place);
}

// Projects mux: every <article class="proj"> is an input; sel picks which one the output track shows
const mux = document.querySelector(".mux");
if (mux) {
  const panel = mux.closest(".projects");
  const out = mux.querySelector(".mux-out");
  const arts = [...out.querySelectorAll(".proj")];
  const list = mux.querySelector(".mux-in");
  const sel = mux.querySelector(".mux-sel");
  const bits = Math.max(1, Math.ceil(Math.log2(arts.length)));
  const smooth = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cur = 0;
  const sigName = (art) => (art.querySelector(".cap-head span") || art.querySelector("h3")).textContent;

  const inputs = arts.map((art, i) => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button";
    b.className = "mux-pin" + (art.querySelector(".cap-head.wip") ? " wip" : "");
    b.innerHTML = `<span class="idx">in${i}</span><span class="nm"></span>`;
    b.querySelector(".nm").textContent = sigName(art);  // short signal name; the full title shows on hover
    b.title = art.querySelector("h3").textContent;
    b.addEventListener("click", () => select(i, true));
    li.append(b);
    list.append(li);
    return b;
  });

  // the readout (sel and the lit input) follows i; select() also moves the track and commits the choice
  let shown = -1, steering = false;
  const phone = matchMedia("(max-width: 800px)");
  // on phones the input row tracks the slides frame by frame, so the centered input moves with the swipe
  const mid = (j) => { const li = inputs[j].parentElement; return li.offsetLeft + li.offsetWidth / 2; };
  function follow() {
    if (!phone.matches) return;
    const pos = Math.min(arts.length - 1, Math.max(0, out.scrollLeft / out.clientWidth));
    const a = Math.floor(pos), b = Math.min(a + 1, arts.length - 1);
    list.scrollLeft = mid(a) + (mid(b) - mid(a)) * (pos - a) - list.clientWidth / 2;
  }
  function readout(i, force) {
    if (i === shown && !force) return;
    shown = i;
    inputs.forEach((b, j) => b.setAttribute("aria-current", j === i));
    const li = inputs[i].parentElement;  // keep the selected input in view without scrolling the page
    if (!phone.matches) list.scrollTo({ left: li.offsetLeft - (list.clientWidth - li.offsetWidth) / 2, top: li.offsetTop - (list.clientHeight - li.offsetHeight) / 2 });
    sel.textContent = `sel = ${bits}'b${i.toString(2).padStart(bits, "0")}`;
  }
  function select(i, user, instant) {
    cur = (i + arts.length) % arts.length;
    arts.forEach((a, j) => (a.inert = j !== cur));
    readout(cur, true);
    // a glide to the target shouldn't drive the readout through the projects in between
    const left = cur * out.clientWidth;
    steering = !instant && smooth && Math.abs(out.scrollLeft - left) > 1;
    out.scrollTo({ left, behavior: steering ? "smooth" : "instant" });
    follow();
    if (user) history.replaceState(null, "", "#projects/" + arts[cur].dataset.slug);
    hideTips.forEach((hide) => hide());
  }
  const layout = () => {
    const sym = mux.querySelector(".mux-sym");  // side style: the output wire leaves the mux at its middle
    mux.style.setProperty("--wire-y", sym.offsetTop + sym.offsetHeight / 2 + "px");
    // on phones, pad the input row so the first and last inputs can scroll to its center too
    const half = (li) => (phone.matches ? (list.clientWidth - li.offsetWidth) / 2 + "px" : "");
    list.style.paddingLeft = half(list.firstElementChild);
    list.style.paddingRight = half(list.lastElementChild);
    select(cur, false, true);
  };

  // a swipe or trackpad scroll on the track selects where it lands
  let settle;
  out.addEventListener("scroll", () => {
    // update live while swiping, once the track is well into another project (so a snap-back doesn't flip it)
    follow();
    const pos = out.scrollLeft / out.clientWidth;
    if (!steering && Math.abs(pos - shown) > 0.6) readout(Math.min(arts.length - 1, Math.max(0, Math.round(pos))));
    clearTimeout(settle);
    settle = setTimeout(() => {
      // a glide we started that stalled or got cut short finishes on its target instead of snapping back
      if (steering) return select(cur, false, Math.abs(out.scrollLeft - cur * out.clientWidth) <= 1);
      const i = Math.round(out.scrollLeft / out.clientWidth);
      if (i !== cur) select(i, true);
    }, 120);
  }, { passive: true });
  // a hand on the track takes over from a glide
  ["touchstart", "wheel"].forEach((t) => out.addEventListener(t, () => (steering = false), { passive: true }));

  mux.querySelector(".mux-prev").addEventListener("click", () => select(cur - 1, true));
  mux.querySelector(".mux-next").addEventListener("click", () => select(cur + 1, true));
  addEventListener("keydown", (e) => {
    if ((e.key !== "ArrowLeft" && e.key !== "ArrowRight") || e.altKey || e.ctrlKey || e.metaKey) return;
    const r = panel.getBoundingClientRect();
    if (r.top > innerHeight / 2 || r.bottom < innerHeight / 2) return;
    e.preventDefault();
    select(cur + (e.key === "ArrowRight" ? 1 : -1), true);
  });
  addEventListener("resize", layout);

  cur = Math.max(0, arts.findIndex((a) => a.dataset.slug === deepLink));
  layout();
}
