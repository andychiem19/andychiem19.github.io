// Switch content on as each panel enters view
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => e.target.classList.toggle("visible", e.isIntersecting));
}, { threshold: 0.25 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

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
