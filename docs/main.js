const raiz = document.documentElement;
raiz.classList.add('js');

/* La grilla: botón, tecla G y memoria entre páginas */
const boton = document.querySelector('.ver-grilla');
const CLAVE = 'grilla';

function mostrarGrilla(si) {
  raiz.classList.toggle('con-grilla', si);
  boton?.setAttribute('aria-pressed', String(si));
  try { localStorage.setItem(CLAVE, si ? '1' : '0'); } catch {}
}

try { if (localStorage.getItem(CLAVE) === '1') mostrarGrilla(true); } catch {}
boton?.addEventListener('click', () => mostrarGrilla(!raiz.classList.contains('con-grilla')));
addEventListener('keydown', (e) => {
  if (e.key.toLowerCase() !== 'g' || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.target.closest('input, textarea, [contenteditable]')) return;
  mostrarGrilla(!raiz.classList.contains('con-grilla'));
});

/* Entrada de los elementos al hacer scroll */
const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const aparecen = document.querySelectorAll('.aparece');
if (quieto || !('IntersectionObserver' in window)) {
  aparecen.forEach((el) => el.classList.add('visto'));
} else {
  const ojo = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      e.target.classList.add('visto');
      ojo.unobserve(e.target);
    }
  }, { rootMargin: '0px 0px -8% 0px' });
  aparecen.forEach((el) => ojo.observe(el));
}

/* En el inicio, el video arranca al pasar por encima */
for (const caja of document.querySelectorAll('.fig-video')) {
  const video = caja.querySelector('video');
  const obra = caja.closest('.obra');
  if (!video || quieto) continue;
  const prender = () => { video.play().then(() => caja.classList.add('sonando')).catch(() => {}); };
  const apagar = () => { caja.classList.remove('sonando'); video.pause(); };
  obra.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') prender(); });
  obra.addEventListener('pointerleave', apagar);
  obra.addEventListener('focusin', prender);
  obra.addEventListener('focusout', apagar);
}

/* Cuenta una reproducción del video del caso (una vez por visita) */
for (const video of document.querySelectorAll('video[data-evento]')) {
  video.addEventListener('play', () => {
    window.goatcounter?.count?.({ path: video.dataset.evento, title: video.dataset.evento, event: true });
  }, { once: true });
}
