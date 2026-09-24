// Fade/slide content in as each panel enters view
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => e.target.classList.toggle("visible", e.isIntersecting));
}, { threshold: 0.25 });
document.querySelectorAll(".reveal").forEach((el) => revealObserver.observe(el));

// Highlight the nav dot for the panel currently on screen
const dots = document.querySelectorAll(".dots a");
const panelObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    dots.forEach((d) => d.classList.toggle("active", d.getAttribute("href") === "#" + e.target.id));
  });
}, { threshold: 0.6 });
document.querySelectorAll(".panel").forEach((p) => panelObserver.observe(p));

document.getElementById("year").textContent = new Date().getFullYear();
