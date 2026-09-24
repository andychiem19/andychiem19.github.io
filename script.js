// Home page opens on the title card: ignore restored scroll positions and leftover #section
// links, except when arriving via a writeup's "Back to projects" link
if (document.querySelector(".panel")) {
  history.scrollRestoration = "manual";
  const clearHash = () => location.hash && history.replaceState(null, "", location.pathname + location.search);
  if (document.referrer.includes("/writeups/")) {
    addEventListener("load", () => setTimeout(clearHash, 0));
  } else {
    clearHash();
    scrollTo(0, 0);
    addEventListener("load", () => scrollTo(0, 0));
  }
}

// Pixel build-in: cover each block with cells, clear them in a diagonal ripple on enter
const CELL = 10;
const DURATION = 500;
const bg = getComputedStyle(document.documentElement).getPropertyValue("--package");

function cover(el) {
  cancelAnimationFrame(el._raf);
  const c = el._px;
  c.width = el.offsetWidth;
  c.height = el.offsetHeight;
  const ctx = c.getContext("2d");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, c.width, c.height);
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

// Drive the pin for the panel currently on screen high
const pins = document.querySelectorAll(".pins a");
const panelObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    pins.forEach((p) => p.classList.toggle("active", p.getAttribute("href") === "#" + e.target.id));
  });
}, { threshold: 0.6 });
document.querySelectorAll(".panel").forEach((p) => panelObserver.observe(p));

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

// Block diagrams: hover, focus or tap a block to read what it does
document.querySelectorAll(".diagram-box").forEach((box) => {
  const info = box.querySelector(".diagram-info");
  const idle = info.textContent;
  const blocks = box.querySelectorAll("[data-info]");
  const show = (el) => {
    blocks.forEach((b) => b.classList.toggle("active", b === el));
    if (!el) return (info.textContent = idle);
    const name = document.createElement("strong");
    name.textContent = (el.dataset.name || el.textContent) + ": ";
    info.replaceChildren(name, el.dataset.info);
  };
  blocks.forEach((el) => {
    el.tabIndex = 0;
    el.addEventListener("mouseenter", () => show(el));
    el.addEventListener("focus", () => show(el));
    el.addEventListener("click", () => show(el));
  });
  box.addEventListener("mouseleave", () => show(null));

  // Print and the PDF can't hover, so list every description under the diagram (shown only in print)
  const details = document.createElement("dl");
  details.className = "diagram-details";
  blocks.forEach((el) => {
    const dt = document.createElement("dt");
    dt.textContent = el.dataset.name || el.textContent.trim();
    const dd = document.createElement("dd");
    dd.textContent = el.dataset.info;
    details.append(dt, dd);
  });
  box.append(details);
});
