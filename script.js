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
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((e) => (e.isIntersecting ? build(e.target) : cover(e.target)));
  }, { threshold: 0.25 });
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

document.getElementById("year").textContent = new Date().getFullYear();
