const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

const topbar = $('#topbar');
const navLinks = $('#navLinks');
const menuButton = $('#menuButton');
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function updateScrollEffects() {
  const y = window.scrollY;
  topbar.classList.toggle('is-scrolled', y > 40);
  if (!prefersReducedMotion) {
    $$('.parallax-layer').forEach((layer) => {
      const rect = layer.parentElement.getBoundingClientRect();
      const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
      layer.style.setProperty('--parallax-y', `${(progress - .5) * 100}px`);
    });
  }
}

updateScrollEffects();
window.addEventListener('scroll', updateScrollEffects, { passive: true });

menuButton.addEventListener('click', () => {
  const open = navLinks.classList.toggle('is-open');
  menuButton.classList.toggle('is-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
});

$$('.nav-links a').forEach((link) => link.addEventListener('click', () => {
  navLinks.classList.remove('is-open');
  menuButton.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
}));

const soundToggle = $('.sound-toggle');
soundToggle.addEventListener('click', () => {
  const playing = soundToggle.classList.toggle('is-playing');
  soundToggle.setAttribute('aria-pressed', String(playing));
  showToast(playing ? 'Sons da natureza ativados (modo visual).' : 'Sons da natureza pausados.');
});

$$('.filter').forEach((button) => button.addEventListener('click', () => {
  $$('.filter').forEach((filter) => filter.classList.toggle('is-active', filter === button));
  const selected = button.dataset.filter;
  $$('.route-card').forEach((card) => card.classList.toggle('is-hidden', selected !== 'todos' && card.dataset.kind !== selected));
}));

const routeTrack = $('#routeTrack');
let isDragging = false;
let dragStart = 0;
let scrollStart = 0;
routeTrack.addEventListener('pointerdown', (event) => {
  isDragging = true; dragStart = event.clientX; scrollStart = routeTrack.scrollLeft;
  routeTrack.classList.add('is-dragging'); routeTrack.setPointerCapture(event.pointerId);
});
routeTrack.addEventListener('pointermove', (event) => {
  if (isDragging) routeTrack.scrollLeft = scrollStart - (event.clientX - dragStart) * 1.25;
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => routeTrack.addEventListener(type, () => {
  isDragging = false; routeTrack.classList.remove('is-dragging');
}));

$$('.tilt-card').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    if (window.innerWidth < 760 || prefersReducedMotion) return;
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - .5;
    const y = (event.clientY - rect.top) / rect.height - .5;
    card.style.transform = `perspective(800px) rotateY(${x * 4}deg) rotateX(${y * -4}deg)`;
  });
  card.addEventListener('pointerleave', () => card.style.transform = '');
});

const plannerDialog = $('#plannerDialog');
$('#openPlanner').addEventListener('click', () => plannerDialog.showModal());
$('#closePlanner').addEventListener('click', () => plannerDialog.close());
plannerDialog.addEventListener('click', (event) => { if (event.target === plannerDialog) plannerDialog.close(); });
$('#plannerForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = new FormData(event.currentTarget).get('name').trim().split(' ')[0];
  $('#formSuccess').textContent = `${name}, recebemos sua vontade de ir. Em breve a gente te chama para sonhar junto.`;
  event.currentTarget.reset();
});

let toastTimer;
function showToast(message) {
  const toast = $('#toast');
  toast.textContent = message; toast.classList.add('is-visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 3000);
}

$$('.experience-item').forEach((item) => item.addEventListener('click', () => {
  showToast(`${item.dataset.experience}: experiência selecionada para a sua viagem.`);
}));