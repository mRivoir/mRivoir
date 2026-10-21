/* ============================================================
   SISTEMA - main.js
   Interacciones del sitio

  El JS maneja loader, indicadores de scroll, 
  parallax y los módulos interactivos.
   ============================================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* LOADER */
  const loader = document.getElementById('loader');
  window.addEventListener('load', () => {
    setTimeout(() => loader.classList.add('out'), reduceMotion ? 0 : 1400);
  });
  // si 'load' tarda (fuentes, red lenta), no bloquear el sitio
  setTimeout(() => loader.classList.add('out'), 5000);

  /* EYEBROW: efecto máquina de escribir */
  const eyeEl = document.getElementById('eyebrow-text');
  if (eyeEl && !reduceMotion) {
    const txt = eyeEl.textContent;
    eyeEl.textContent = '';
    let i = 0;
    const type = () => {
      if (i < txt.length) {
        eyeEl.textContent += txt[i++];
        setTimeout(type, 26);
      }
    };
    setTimeout(type, 1700);
  }

  /* "A" CICLO DE SISTEMA -
     Mientras el hero está en viewport, la última "A" del título cicla por
     una serie de glifos. Al salir del viewport se pausa; al volver continúa
     el ciclo desde donde quedó. */
  const swapEl = document.getElementById('z1-swap');
  const swapGlyph = swapEl && swapEl.querySelector('.z1-swap-g');
  if (swapEl && swapGlyph && !reduceMotion && 'IntersectionObserver' in window) {
    const CYCLE = [
      { t: 'A' },                  // letra original (display)
      { t: 'ʌ' },
      { t: '△' },
      { t: 'ɑ' },
      { t: 'A', serif: true },     // "A" con la tipografía serif
    ];
    const STEP_MS = 500;   // velocidad del ciclo
    let ci = 0;
    let timer = null;

    const render = () => {
      const f = CYCLE[ci];
      swapGlyph.textContent = f.t;                       // el glifo va en el hijo absoluto
      swapEl.classList.toggle('z1-swap-serif', !!f.serif);
      // Re-disparar la animación de cambio
      swapGlyph.classList.remove('is-swapping');
      void swapGlyph.offsetWidth;
      swapGlyph.classList.add('is-swapping');
    };

    const startCycle = () => {
      if (timer) return;
      timer = setInterval(() => {
        ci = (ci + 1) % CYCLE.length;
        render();
      }, STEP_MS);
    };
    const stopCycle = () => { clearInterval(timer); timer = null; };

    new IntersectionObserver(([e]) => {
      if (e.isIntersecting) startCycle(); else stopCycle();
    }, { threshold: 0.1 }).observe(swapEl);
  }

  /* NAV */
  const nav = document.getElementById('nav');

  /* La barra superior se oculta mientras la esfera de navegación (#z1-orb)
     está a la vista. Aparece al scrollear, cuando la esfera deja de verse. 
     Solo se activa con JS:
     sin JS la barra permanece visible. */
  const orb = document.getElementById('z1-orb');
  if (nav && orb && 'IntersectionObserver' in window) {
    nav.classList.add('nav-auto');
    new IntersectionObserver(([entry]) => {
      nav.classList.toggle('revealed', !entry.isIntersecting);
    }, { threshold: 0 }).observe(orb);
  }

  /* ===========================================================
     INDICADORES DE SCROLL (barra de progreso + zona actual)
    
     Actualiza la barra lateral, las etiquetas de zona y la etiqueta
     de zona del nav, más un parallax sutil.

     Zonas como % del scroll total:
       0–18%   SISTEMA       18–38%  ORIGEN     38–56% HERRAMIENTAS
       56–80%  DISCIPLINAS   80–100% OBRAS
  ============================================================== */

  const ZONE_NAMES = ['// manifiesto', '// origen', '// herramientas', '// disciplinas', '// obras'];
  const ZONE_PCT = [0, 0.18, 0.38, 0.56, 0.80];

  const progressFill = document.getElementById('progress-fill');
  const navState = document.getElementById('nav-state');
  const progLabels = document.querySelectorAll('.progress-labels span');
  const zmNum = document.querySelector('.zm-num');
  const secNums = document.querySelectorAll('.sec-num');
  const cierreWord = document.querySelector('.zc-bg-word');

  const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

  function getScrollProgress() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    return docH > 0 ? clamp(window.scrollY / docH, 0, 1) : 0;
  }

  function getCurrentZone(p) {
    for (let i = ZONE_PCT.length - 1; i >= 0; i--) {
      if (p >= ZONE_PCT[i]) return i;
    }
    return 0;
  }

  function update() {
    const p = getScrollProgress();
    const zone = getCurrentZone(p);

    nav.classList.toggle('scrolled', window.scrollY > 60);

    if (progressFill) progressFill.style.height = (p * 100) + '%';
    progLabels.forEach((lbl, i) => lbl.classList.toggle('active', i === zone));
    if (navState) navState.textContent = ZONE_NAMES[zone];

    /* Parallax sutil (omitido si el sistema pide menos movimiento) */
    if (!reduceMotion) {
      if (zmNum) {
        const rect = zmNum.parentElement.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          /*Limitador de movimiento para que no sea exagerado */
          const off = clamp((window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.18, -8, 48);
          zmNum.style.transform = `translateY(${off}px)`;
        }
      }
      /* Mismo parallax para los números de las demás secciones, acotado al
         espacio reservado (padding de .sec-title-row) */
      secNums.forEach(el => {
        const rect = el.parentElement.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const off = clamp((window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.18, -26, 26);
          el.style.transform = `translateY(${off}px)`;
        }
      });
      if (cierreWord) {
        const rect = cierreWord.parentElement.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          const off = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * 0.06;
          cierreWord.style.transform = `translate(-50%, calc(-50% + ${off}px))`;
        }
      }
    }
  }

  // Throttle con requestAnimationFrame: una actualización por frame para no enlentecer el scroll.
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => { update(); ticking = false; });
    }
  }, { passive: true });
  window.addEventListener('resize', update, { passive: true });
  update();

  /* SCROLL REVEAL -
     Los elementos con clase .reveal se animan al entrar en viewport.
     La clase .reveal se agrega desde JS: sin JS no hay nada oculto. */
  if ('IntersectionObserver' in window && !reduceMotion) {
    const targets = document.querySelectorAll(
      '.zt-item, .zmf-node, .disc, .z5-card, .z1-manifesto, .z1-why, .z2-geomap, .z2-route, .z-viz-stage'
    );

    targets.forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = ((i % 4) * 60) + 'ms';
    });

    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.08 });

    targets.forEach(el => obs.observe(el));
  }

  /* TIPOGRAFÍAS CAMBIANTES -
     Cada título muta a serif al pasar el mouse por encima,
     letra por letra (cascada), y vuelve a su estilo original al salir.
     Se envuelve cada carácter en un .char con su índice (--i) la
     animación y los tiempos los maneja el CSS. */
  function wrapChars(el) {
    let idx = 0;
    (function walk(node) {
      Array.from(node.childNodes).forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            if (ch.trim() === '') {
              frag.appendChild(document.createTextNode(ch));
            } else {
              const s = document.createElement('span');
              s.className = 'char';
              s.textContent = ch;
              s.style.setProperty('--i', idx++);
              frag.appendChild(s);
            }
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(el);
  }

  document.querySelectorAll('.morph-title, .morph-label').forEach(el => {
    wrapChars(el);
    el.addEventListener('mouseenter', () => el.classList.add('morphed'));
    el.addEventListener('mouseleave', () => el.classList.remove('morphed'));
  });

  /* EASTER EGG (fútbol) */
  const SOCCER_ICON = '<img class="sport-ico" src="iconos/futbol.svg" alt="" aria-hidden="true" />';

  document.querySelectorAll('.zt-item').forEach(item => {
    const chips = item.querySelectorAll('.zt-chips span');
    const isFootball = Array.from(chips).some(c => c.textContent.includes('Fútbol'));
    if (!isFootball) return;

    item.style.cursor = 'pointer';
    let fired = false;
    item.addEventListener('click', () => {
      if (fired) return;
      fired = true;
      if (!reduceMotion) explode(item);
      const ttl = item.querySelector('.zt-title');
      if (ttl) {
        const orig = ttl.textContent;
        ttl.innerHTML = SOCCER_ICON + ' CAMPEÓN DEPARTAMENTAL INVICTO — ARTIGAS FC';
        ttl.style.color = 'var(--accent)';
        setTimeout(() => {
          ttl.textContent = orig;
          ttl.style.color = '';
          fired = false;
        }, 3000);
      }
    });
  });

  function explode(origin) {
    const rect = origin.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 44; i++) {
      const part = document.createElement('div');
      const sz = Math.random() * 8 + 3;
      Object.assign(part.style, {
        position: 'fixed', left: cx + 'px', top: cy + 'px',
        width: sz + 'px', height: sz + 'px',
        background: ['var(--accent)', '#f0ede8', '#3a3a38'][Math.floor(Math.random() * 3)],
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
        pointerEvents: 'none', zIndex: '9000',
        transform: 'translate(-50%,-50%)',
        transition: `transform ${0.6 + Math.random() * 0.8}s cubic-bezier(0,0,0.2,1), opacity ${0.5 + Math.random() * 0.5}s ease`
      });
      document.body.appendChild(part);
      const angle = Math.random() * Math.PI * 2;
      const dist = 80 + Math.random() * 180;
      requestAnimationFrame(() => {
        part.style.transform = `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist - 80}px)) rotate(${Math.random() * 400}deg)`;
        part.style.opacity = '0';
      });
      setTimeout(() => part.remove(), 1600);
    }
  }

  /* SMOOTH SCROLL en anclas */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) {
        e.preventDefault();
        t.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
      }
    });
  });

})();

/* ============================================================
   HISTOGRAMA RADIAL DE HERRAMIENTAS - sección "Herramientas"
   Una barra por herramienta aprendida. El color de cada barra es un
   matiz del verde consola según dónde se aprendió (ORT, BIOS, autodidacta,
   UDE) ver SOURCES. El largo sale del nivel de cada herramienta (TOOLS.val).
   ============================================================ */
(function () {
  'use strict';

  const svg = document.getElementById('viz-chart');
  if (!svg) return;

  const NS = 'http://www.w3.org/2000/svg';

  /* ---- Orígenes: cada uno con su matiz de verde consola ----
     El color de cada barra sale de acá según dónde se aprendió la herramienta. */
  const SOURCES = {
    ort:  { label: 'ORT',          color: '#00FF8F', desde: '2020' },
    bios: { label: 'BIOS',         color: '#C2FF1A', desde: '2022' },
    auto: { label: 'Autodidacta',  color: '#00FFE1', desde: '2022' },
    ude:  { label: 'UDE',          color: '#00FF41', desde: '2024' }
  };

  /* Descripción para el campo Área del detalle. */
  const AREA_DESC = {
    'Programación': 'La lógica del sistema: estructura, datos y comportamiento.',
    'Diseño':       'La forma que comunica: composición, tipografía y color.',
    'Audiovisual':  'Imagen en movimiento: montaje, ritmo y postproducción.',
    '3D':           'Volumen y materia: modelado, materiales y render.'
  };

  /* ---- Herramientas (una por barra) ordenadas según el recorrido
     programación - diseño. 'val' (0–100) es el nivel y define el largo
     de la barra ---- */
  const TOOLS = [
    {
      name: 'Visual Studio Code', src: 'ort', val: 90,
      cat: 'Editor de código', area: 'Programación',
      nota: 'Mi editor principal para desarrollo web. Liviano y extensible: acá escribo casi todo el HTML, CSS y JavaScript de mis proyectos.',
      nivelDesc: 'Casi automático: es donde paso la mayor parte del tiempo programando.',
      origenDesc: 'Lo adopté cursando Analista Programador en ORT y quedó como mi editor de cabecera.',
      posDesc: 'El centro de mi flujo de trabajo web.'
    },
    {
      name: 'Android Studio', src: 'ort', val: 60,
      cat: 'IDE móvil', area: 'Programación',
      nota: 'Entorno para desarrollo de aplicaciones Android. Lo usé para entender el ciclo de vida de una app y armar prototipos móviles.',
      nivelDesc: 'Intermedio: lo manejo para proyectos puntuales, no a diario.',
      origenDesc: 'Lo exploré en ORT, metiéndome en el desarrollo de apps móviles.',
      posDesc: 'La rama que uso cuando el proyecto es para celular.'
    },
    {
      name: 'MySQL', src: 'ort', val: 72,
      cat: 'Base de datos', area: 'Programación',
      nota: 'Bases de datos relacionales: modelado de tablas, consultas SQL y la conexión con el back-end de las aplicaciones.',
      nivelDesc: 'Sólido en consultas y modelado; cómodo trabajando el back-end.',
      origenDesc: 'Bases de datos fue de lo que más me enganchó en ORT.',
      posDesc: 'La capa de datos detrás de las aplicaciones que armo.'
    },
    {
      name: 'NetBeans', src: 'ort', val: 55,
      cat: 'IDE Java', area: 'Programación',
      nota: 'Donde di mis primeros pasos programando en Java, durante la formación como analista programador.',
      nivelDesc: 'Básico: lo justo para haber aprendido a programar en Java.',
      origenDesc: 'Mi primer entorno serio de programación, en ORT.',
      posDesc: 'El punto de partida del código; hoy casi no lo uso.'
    },
    {
      name: 'Illustrator', src: 'bios', val: 93,
      cat: 'Diseño vectorial', area: 'Diseño',
      nota: 'Ilustración y gráfica vectorial: logotipos, iconografía y piezas que escalan a cualquier tamaño sin perder nitidez. Es la herramienta que mejor domino de toda la suite.',
      nivelDesc: 'Mi terreno más firme: la que mejor domino de todas.',
      origenDesc: 'La aprendí en BIOS y no la solté nunca más.',
      posDesc: 'Con la que más resuelvo, en el pico del histograma.'
    },
    {
      name: 'Photoshop', src: 'bios', val: 80,
      cat: 'Edición de imagen', area: 'Diseño',
      nota: 'Retoque, composición y tratamiento de imagen. La uso para preparar y ajustar el material visual antes de llevarlo a la pieza final.',
      nivelDesc: 'Muy cómodo: retoque y composición sin fricción.',
      origenDesc: 'Parte de mi paso por BIOS, en diseño digital.',
      posDesc: 'El taller donde preparo cada imagen antes de usarla.'
    },
    {
      name: 'Premiere', src: 'bios', val: 86,
      cat: 'Edición de video', area: 'Audiovisual',
      nota: 'Montaje y edición de video: cortes, ritmo y narrativa para piezas audiovisuales de comunicación.',
      nivelDesc: 'Alto: edito con criterio de ritmo y narrativa.',
      origenDesc: 'Lo trabajé en BIOS, en la parte audiovisual.',
      posDesc: 'Mi herramienta principal cuando la pieza es en video.'
    },
    {
      name: 'After Effects', src: 'bios', val: 72,
      cat: 'Motion graphics', area: 'Audiovisual',
      nota: 'Animación y postproducción: motion graphics, títulos y efectos para darle movimiento a la gráfica.',
      nivelDesc: 'Bueno: motion y postproducción para darle vida a la gráfica.',
      origenDesc: 'Complemento audiovisual que sumé en BIOS.',
      posDesc: 'Donde el diseño quieto empieza a moverse.'
    },
    {
      name: 'Blender', src: 'auto', val: 68,
      cat: 'Modelado 3D', area: '3D',
      nota: 'Modelado, materiales y render 3D. Lo aprendí por mi cuenta, explorando desde objetos simples hasta escenas completas.',
      nivelDesc: 'Autodidacta: firme en lo esencial y siempre aprendiendo más.',
      origenDesc: 'Lo aprendí solo, a pura curiosidad.',
      posDesc: 'Mi puerta de entrada al 3D.'
    },
    {
      name: 'InDesign', src: 'ude', val: 78,
      cat: 'Editorial', area: 'Diseño',
      nota: 'Maquetación y diseño editorial: sistemas de grilla, tipografía y documentos de varias páginas.',
      nivelDesc: 'Cómodo con grillas, tipografía y documentos largos.',
      origenDesc: 'Lo incorporé en la licenciatura, en UDE.',
      posDesc: 'La herramienta para todo lo editorial y de varias páginas.'
    },
    {
      name: '3D Max', src: 'ude', val: 58,
      cat: 'Modelado 3D', area: '3D',
      nota: 'Modelado y render 3D orientado a producto y espacios, trabajado durante la licenciatura.',
      nivelDesc: 'En desarrollo: lo justo para modelar y renderizar.',
      origenDesc: 'Lo vi en la licenciatura (UDE), enfocado a producto.',
      posDesc: 'Mi mirada más técnica al 3D.'
    }
  ];

  const N = TOOLS.length;        // cantidad de barras (una por herramienta)
  const R0 = 92;                 // radio interior (base de las barras)
  const MAXLEN = 150;            // largo máximo de una barra
  const RG = R0 + MAXLEN + 14;   // radio de spokes/ticks (anillo exterior)
  const THICK = 11;              // grosor de cada barra
  const STEP = 360 / N;          // separación angular

  document.getElementById('viz-nbars').textContent = N;

  /* Largo de cada barra normalizado 0–1 según el nivel de la herramienta */
  const data = TOOLS.map(t => Math.min(1, Math.max(.12, t.val / 100)));

  /* Relaciona cada matiz con su origen */
  const legendEl = document.getElementById('viz-legend');
  if (legendEl) {
    legendEl.innerHTML = Object.values(SOURCES).map(s =>
      `<span class="z-viz-leg"><i style="background:${s.color};box-shadow:0 0 7px ${s.color}"></i>${s.label}</span>`
    ).join('');
  }

  /* Helpers: crea nodos SVG y pasa de coordenadas polares a cartesianas */
  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };
  const polar = (r, deg) => {
    const a = (deg - 90) * Math.PI / 180;   // 0° arriba - sentido horario
    return [r * Math.cos(a), r * Math.sin(a)];
  };

  const gSpokes = document.getElementById('viz-spokes');
  const gTicks = document.getElementById('viz-ticks');
  const gBars = document.getElementById('viz-bars');
  const hudI = document.getElementById('viz-hudI');
  const hudV = document.getElementById('viz-hudV');
  const layout = document.getElementById('viz-layout');
  const panel = document.getElementById('viz-panel');
  const barEls = [];                                  // referencias a cada <g class="bar">
  let selected = null;                                // índice de la barra activa (o null)

  /* Escribe el lector central (HUD) con i=null queda en su estado vacío.
     Muestra el nombre de la herramienta y su nivel, con el matiz del origen. */
  function setHud(i) {
    if (i === null) {
      hudI.textContent = '—'; hudV.textContent = '··';
      hudV.style.fill = '';                   // vuelve al acento por CSS
      return;
    }
    const t = TOOLS[i];
    hudI.textContent = t.name;
    hudV.textContent = t.val;
    hudV.style.fill = SOURCES[t.src].color;   // el valor toma el matiz del origen
  }

  for (let i = 0; i < N; i++) {
    const ang = i * STEP;

    /* Línea guía radial (spoke) */
    const [sx, sy] = polar(R0, ang);
    const [ex, ey] = polar(RG, ang);
    gSpokes.appendChild(el('line', { x1: sx, y1: sy, x2: ex, y2: ey, class: 'spoke' }));

    /* Marca exterior (tick) */
    const [tx, ty] = polar(RG, ang);
    const [tx2, ty2] = polar(RG + 7, ang);
    gTicks.appendChild(el('line', { x1: tx, y1: ty, x2: tx2, y2: ty2, class: 'tick' }));

    /* Barra: rect rotado, en hover escala desde su base y muestra el valor en el HUD */
    const len = 24 + data[i] * MAXLEN;
    const bar = el('g', { class: 'bar', transform: `rotate(${ang})` });
    bar.style.setProperty('--bar', SOURCES[TOOLS[i].src].color);   // matiz según origen
    const rect = el('rect', {
      x: -THICK / 2, y: -(R0 + len), width: THICK, height: len, rx: THICK / 2, class: 'bar-rect'
    });
    bar.appendChild(rect);
    bar.addEventListener('mouseenter', () => setHud(i));   // el hover cambia el HUD temporalmente
    bar.addEventListener('mouseleave', () => setHud(selected));   // al salir, vuelve a la seleccionada (o al vacío)
    bar.addEventListener('click', () => toggleDetail(i));
    barEls.push(bar);
    gBars.appendChild(bar);
  }

  /* ---- Interacción de detalle ----
     Click en una barra - reorganiza la sección y muestra el panel.
     Click en la misma barra activa, o en cerrar/Escape) */
  function toggleDetail(i) {
    if (selected === i && layout && layout.classList.contains('is-detail')) closeDetail();
    else openDetail(i);
  }

  function openDetail(i) {
    if (!layout || !panel) return;
    selected = i;
    barEls.forEach((b, k) => b.classList.toggle('is-selected', k === i));

    const idx = String(i + 1).padStart(2, '0');
    const val = TOOLS[i].val;
    setHud(i);   // bloquea el HUD en la barra seleccionada

    // Rebuild del contenido, al recrear los nodos su animación de entrada se reinicia.
    panel.innerHTML = panelMarkup(detailFor(i), idx, val);
    const closeBtn = panel.querySelector('#viz-close');
    if (closeBtn) closeBtn.addEventListener('click', closeDetail);

    layout.classList.add('is-detail');
  }

  function closeDetail() {
    if (!layout) return;
    selected = null;
    barEls.forEach(b => b.classList.remove('is-selected'));
    layout.classList.remove('is-detail');
    setHud(null);
  }

  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDetail(); });

  /* Si la sección sale del viewport, el detalle se cierra y vuelve a cerrarse (gráfico centrado, sin barra seleccionada). */
  const section = document.getElementById('visual');
  if (section && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) closeDetail();
    }, { threshold: 0 }).observe(section);
  }

  /* Detalle de una herramienta para el panel lateral. Se arma desde TOOLS y SOURCES */
  function detailFor(i) {
    const t = TOOLS[i];
    const s = SOURCES[t.src];
    return {
      titulo: t.name,
      categoria: t.src === 'auto' ? s.label : 'aprendida en ' + s.label,
      color: s.color,
      filas: [
        { k: 'Tipo', v: t.cat || '—', desc: t.nota },
        { k: 'Área', v: t.area || '—', desc: AREA_DESC[t.area] },
        { k: 'Nivel', v: t.val + ' / 100', desc: t.nivelDesc },
        { k: 'Origen', v: s.label + ' · ' + (s.desde || '—'), desc: t.origenDesc },
        { k: 'Posición', v: String(i + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0'), desc: t.posDesc }
      ]
    };
  }

  /* Plantilla del panel. Cada parte lleva un delay (viz-anim)
     para que los datos entren escalonados. */
  function panelMarkup(det, idx, val) {
    const filas = det.filas.map((f, k) => {
      const desc = f.desc ? `<dd class="z-viz-d-fdesc">${f.desc}</dd>` : '';
      return `<div class="z-viz-d-item viz-anim" style="animation-delay:${300 + k * 70}ms">` +
        `<dt>${f.k}</dt><dd>${f.v}</dd>${desc}</div>`;
    }).join('');
    const col = det.color || 'var(--accent)';
    return (
      `<button class="z-viz-d-close viz-anim" type="button" id="viz-close" aria-label="Cerrar" style="animation-delay:0ms">✕ cerrar</button>` +
      `<div class="z-viz-d-eyebrow viz-anim" style="animation-delay:60ms">// herramienta ${idx}</div>` +
      `<h3 class="z-viz-d-title viz-anim" style="animation-delay:120ms">${det.titulo}</h3>` +
      `<div class="z-viz-d-value viz-anim" style="animation-delay:180ms;color:${col}">${val}<span>/ 100</span></div>` +
      `<div class="z-viz-d-cat viz-anim" style="animation-delay:220ms">${det.categoria}</div>` +
      `<div class="z-viz-d-divider viz-anim" style="animation-delay:260ms"></div>` +
      `<dl class="z-viz-d-list">${filas}</dl>`
    );
  }
})();

/* ============================================================
   ESFERA DE NAVEGACIÓN - capa del hero (zona 1) de SISTEMA
   - Dos capas que rotan.
   - Capa exterior: nodos navegables (saltan a cada sección).
   - Acento y fuentes desde CSS.
   Requiere three.js que debe cargarse en el HTML antes que main.js
   ============================================================ */
(function () {
  "use strict";

  function start() {
    const container = document.getElementById("z1-orb");
    if (!container || typeof THREE === "undefined") return;

    /* ---- Config: los nodos apuntan a las secciones reales ---- */
    const SECTIONS = [
      { id: "sistema", label: "Sistema" },
      { id: "origen", label: "Origen" },
      { id: "visual", label: "Herramientas" },
      { id: "disciplinas", label: "Disciplinas" },
      { id: "obras", label: "Obras" }
    ];

    const CONFIG = {
      radius: 2.0,
      fillerPoints: 42,
      neighbors: 3,
      autoRotate: 0.0016,
      starCount: 420,
      speckCount: 260
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---- Colores del sitio ---- */
    const cs = getComputedStyle(document.documentElement);
    // El acento es un color sólido (--accent). Se parsea una vez de ahí
    // sacamos los canales RGB que necesitan el canvas y THREE.Color
    const accentCol = new THREE.Color((cs.getPropertyValue("--accent") || "#00ff41").trim() || "#00ff41");
    const AR = Math.round(accentCol.r * 255), AG = Math.round(accentCol.g * 255), AB = Math.round(accentCol.b * 255);
    const COL = {
      line: new THREE.Color((cs.getPropertyValue("--fg") || "#f0ede8").trim() || "#f0ede8"),
      dot: new THREE.Color((cs.getPropertyValue("--gris") || "#6a6a65").trim() || "#6a6a65"),
      accent: accentCol
    };

    /* ---- Escena ---- */
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0, 6.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.appendChild(renderer.domElement);

    const world = new THREE.Group();
    const stars = new THREE.Group();
    scene.add(stars);
    scene.add(world);

    /* ---- Puntos sobre la esfera (Fibonacci) ---- */
    function fibonacciSphere(n, radius, jitter) {
      const pts = [];
      const phi = Math.PI * (3 - Math.sqrt(5));
      for (let i = 0; i < n; i++) {
        const y = 1 - (i / (n - 1)) * 2;
        const r = Math.sqrt(Math.max(0, 1 - y * y));
        const t = phi * i;
        const v = new THREE.Vector3(Math.cos(t) * r, y, Math.sin(t) * r);
        if (jitter) {
          v.x += (Math.random() - 0.5) * jitter;
          v.y += (Math.random() - 0.5) * jitter;
          v.z += (Math.random() - 0.5) * jitter;
          v.normalize();
        }
        pts.push(v.multiplyScalar(radius));
      }
      return pts;
    }

    const navPositions = fibonacciSphere(SECTIONS.length, CONFIG.radius, 0);
    const fillerPositions = fibonacciSphere(CONFIG.fillerPoints, CONFIG.radius, 0.18);
    const allPoints = navPositions.concat(fillerPositions);

    /* ---- Conectar cada punto con sus vecinos ---- */
    function buildEdges(points, k) {
      const seen = new Set();
      const seg = [];
      for (let i = 0; i < points.length; i++) {
        const d = [];
        for (let j = 0; j < points.length; j++) {
          if (i === j) continue;
          d.push([j, points[i].distanceToSquared(points[j])]);
        }
        d.sort((a, b) => a[1] - b[1]);
        for (let n = 0; n < k && n < d.length; n++) {
          const j = d[n][0];
          const key = i < j ? i + "_" + j : j + "_" + i;
          if (seen.has(key)) continue;
          seen.add(key);
          const a = points[i], b = points[j];
          seg.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
      return new Float32Array(seg);
    }

    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.BufferAttribute(buildEdges(allPoints, CONFIG.neighbors), 3));
    world.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({
      color: COL.line, transparent: true, opacity: 0.16
    })));

    /* ---- Puntos estructurales ---- */
    const dotGeo = new THREE.BufferGeometry();
    dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(
      allPoints.flatMap(p => [p.x, p.y, p.z]), 3));
    world.add(new THREE.Points(dotGeo, new THREE.PointsMaterial({
      color: COL.dot, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.85
    })));

    /* ---- Cuerpo interior ---- */
    world.add(new THREE.Mesh(
      new THREE.SphereGeometry(CONFIG.radius * 0.92, 48, 48),
      new THREE.MeshBasicMaterial({ color: 0x0a0a0f, transparent: true, opacity: 0.45, depthWrite: false })
    ));
    const speckPts = fibonacciSphere(CONFIG.speckCount, CONFIG.radius * 0.9, 0.5);
    const speckGeo = new THREE.BufferGeometry();
    speckGeo.setAttribute("position", new THREE.Float32BufferAttribute(
      speckPts.flatMap(p => [p.x, p.y, p.z]), 3));
    world.add(new THREE.Points(speckGeo, new THREE.PointsMaterial({
      color: COL.line, size: 0.015, sizeAttenuation: true, transparent: true, opacity: 0.5
    })));

    /* ---- Estrellas de fondo ---- */
    function randomDir() {
      const u = Math.random() * 2 - 1;
      const t = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - u * u);
      return new THREE.Vector3(r * Math.cos(t), u, r * Math.sin(t));
    }
    const starPos = [];
    for (let i = 0; i < CONFIG.starCount; i++) {
      // Radio mayor que la distancia de la cámara (z=6.4) así
      // ninguna pasa entre la cámara y la esfera
      const v = randomDir().multiplyScalar(10 + Math.random() * 8);
      starPos.push(v.x, v.y, v.z);
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPos, 3));
    stars.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
      color: 0xffffff, size: 0.035, sizeAttenuation: true, transparent: true, opacity: 0.4
    })));

    /* ---- Canvas (textura compartida, con el acento del sitio) ---- */
    function glowTexture() {
      const s = 64, c = document.createElement("canvas"); c.width = c.height = s;
      const g = c.getContext("2d");
      const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      grd.addColorStop(0, `rgba(${Math.min(AR + 150, 255)}, ${Math.min(AG, 255)}, ${Math.min(AB + 120, 255)}, 0.95)`);
      grd.addColorStop(0.35, `rgba(${AR}, ${AG}, ${AB}, 0.45)`);
      grd.addColorStop(1, `rgba(${AR}, ${AG}, ${AB}, 0)`);
      g.fillStyle = grd; g.fillRect(0, 0, s, s);
      return new THREE.CanvasTexture(c);
    }
    const glowTex = glowTexture();

    /* ---- Nodos de navegación ---- */
    const navNodes = [];
    SECTIONS.forEach((sec, i) => {
      const pos = navPositions[i];
      const group = new THREE.Group();
      group.position.copy(pos);

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.012, 10, 10),
        new THREE.MeshBasicMaterial({ color: COL.accent })
      );
      const GLOW = 0.09;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({
        map: glowTex, color: 0xffffff, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.85
      }));
      glow.scale.setScalar(GLOW);

      const hit = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hit.userData.section = sec;

      group.add(glow); group.add(dot); group.add(hit);
      world.add(group);

      const label = document.createElement("div");
      label.className = "orb-label";
      label.textContent = sec.label;
      container.appendChild(label);

      const node = { group, dot, glow, hit, label, section: sec, base: 0.012, glowBase: GLOW, target: 1, scale: 1 };

      // La etiqueta también captura el click y resalta el nodo al pasar el mouse
      label.addEventListener("click", () => navigateTo(sec));
      label.addEventListener("pointerenter", () => setHover(node));
      label.addEventListener("pointerleave", () => { if (hovered === node) setHover(null); });

      navNodes.push(node);
    });

    /* ---- Segunda capa interior ---- */
    const inner = new THREE.Group();
    scene.add(inner);
    (function buildInner() {
      const r = CONFIG.radius * 0.52;
      const nodes = fibonacciSphere(5, r, 0);
      const structure = fibonacciSphere(22, r, 0.16);
      const pts = nodes.concat(structure);

      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.BufferAttribute(buildEdges(pts, 3), 3));
      inner.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({
        color: COL.line, transparent: true, opacity: 0.13, depthWrite: false
      })));

      const dg = new THREE.BufferGeometry();
      dg.setAttribute("position", new THREE.Float32BufferAttribute(pts.flatMap(p => [p.x, p.y, p.z]), 3));
      inner.add(new THREE.Points(dg, new THREE.PointsMaterial({
        color: COL.dot, size: 0.022, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false
      })));

      nodes.forEach(p => {
        const grp = new THREE.Group();
        grp.position.copy(p);
        const d = new THREE.Mesh(
          new THREE.SphereGeometry(0.01, 8, 8),
          new THREE.MeshBasicMaterial({ color: COL.accent, depthWrite: false })
        );
        const gl = new THREE.Sprite(new THREE.SpriteMaterial({
          map: glowTex, color: 0xffffff, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.7
        }));
        gl.scale.setScalar(0.07);
        grp.add(gl); grp.add(d);
        inner.add(grp);
      });
    })();

    /* ---- Interacción ---- */
    let dragging = false, moved = 0, lastX = 0, lastY = 0;
    let velX = 0, velY = 0;
    const damping = 0.93;
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let hovered = null;
    const hitMeshes = navNodes.map(n => n.hit);
    const el = renderer.domElement;

    function setPointer(e) {
      const r = el.getBoundingClientRect();
      pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      pointer.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    }
    function setHover(node) {
      if (node === hovered) return;
      if (hovered) hovered.label.classList.remove("is-hover");
      hovered = node;
      if (hovered) hovered.label.classList.add("is-hover");
    }
    function hoverTest() {
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hitMeshes, false)[0];
      setHover(hit ? navNodes.find(n => n.hit === hit.object) : null);
    }
    function clampTilt() {
      const lim = Math.PI * 0.42;
      world.rotation.x = Math.max(-lim, Math.min(lim, world.rotation.x));
    }

    el.addEventListener("pointerdown", e => {
      dragging = true; moved = 0;
      lastX = e.clientX; lastY = e.clientY;
      if (el.setPointerCapture && e.pointerId != null) el.setPointerCapture(e.pointerId);
    });
    el.addEventListener("pointermove", e => {           // hover (solo sobre el canvas)
      if (dragging) return;
      setPointer(e); hoverTest();
    });
    window.addEventListener("pointermove", e => {       // arrastre (puede salir del canvas)
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      moved += Math.abs(dx) + Math.abs(dy);
      velY = dx * 0.005; velX = dy * 0.005;
      world.rotation.y += velY; world.rotation.x += velX;
      clampTilt();
    });
    window.addEventListener("pointerup", () => { dragging = false; });
    el.addEventListener("click", e => {
      if (moved > 6) return;                            // arrastre
      setPointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hitMeshes, false)[0];
      if (hit) navigateTo(hit.object.userData.section);
    });

    function navigateTo(section) {
      const target = document.getElementById(section.id);
      if (target) target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
      else window.location.hash = "#" + section.id;
    }

    /* ---- Proyección de etiquetas ---- */
    const tmp = new THREE.Vector3();
    let W = 0, H = 0;
    function updateLabels() {
      for (const n of navNodes) {
        tmp.copy(n.group.position);
        world.localToWorld(tmp);
        const front = tmp.z > -0.2;
        tmp.project(camera);
        const x = (tmp.x * 0.5 + 0.5) * W;
        const y = (-tmp.y * 0.5 + 0.5) * H;
        const isHover = (n === hovered);
        n.label.style.transform =
          `translate(-50%,-50%) translate(${x.toFixed(1)}px, ${(y - 18).toFixed(1)}px)`;
        n.label.style.opacity = isHover ? 1 : (front ? 0.85 : 0.12);
        n.label.style.pointerEvents = front ? "auto" : "none";   // las de atrás no capturan
        n.target = isHover ? 1.9 : 1;
      }
    }

    /* ---- Pausa el render cuando el hero no está visible ---- */
    let visible = true;
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.01 })
        .observe(container);
    }

    function animate() {
      requestAnimationFrame(animate);
      if (!visible) return;

      if (!dragging) {
        if (Math.abs(velY) > 0.0002 || Math.abs(velX) > 0.0002) {
          world.rotation.y += velY; world.rotation.x += velX;
          velX *= damping; velY *= damping;
          clampTilt();
        } else if (!reduceMotion) {
          world.rotation.y += CONFIG.autoRotate;
        }
      }
      stars.rotation.y += 0.0003;

      inner.rotation.x = world.rotation.x;
      inner.rotation.y = -world.rotation.y;

      for (const n of navNodes) {
        n.scale += (n.target - n.scale) * 0.15;
        n.dot.scale.setScalar(n.scale);
        n.glow.scale.setScalar(n.glowBase * n.scale);
      }

      updateLabels();
      renderer.render(scene, camera);
    }

    /* ---- Responsive ---- */
    function resize() {
      W = container.clientWidth; H = container.clientHeight;
      if (!W || !H) return;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.position.z = W < 420 ? 7.4 : 6.4;
      camera.updateProjectionMatrix();
    }
    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(container);
    window.addEventListener("resize", resize);
    resize();

    world.rotation.x = 0.25;
    animate();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();

/* ============================================================
   ORIGEN - bloques clickeables + línea animada
   Cada bloque (#z2-route) ilumina su bloque y dispara la animación
   verde que recorre los nodos del mini-mapa (#geo-trail) según una
   lógica de tramos:
     1·MVD - Montevideo a Carmelo
     2·CRM - Carmelo a Montevideo
     3·MVD - Montevideo a Carmelo
     4·COL - loop continuo Carmelo - Colonia
   El recorrido solo corre con el mapa en viewport, al salir se detiene
   y queda en pausa hasta que se vuelva a interactuar con los bloques.
   ============================================================ */
(function () {
  'use strict';

  const blocks = Array.from(document.querySelectorAll('.z2-rblock'));
  const trail = document.getElementById('geo-trail');
  const stage = document.getElementById('z2-geomap-stage');
  if (!blocks.length || !trail) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nodos: deben coincidir con .geo-route del SVG. crm/col/mvd son nodos
     principales; sq1/sq2 son los secundarios (cuadrados) que se encienden
     con la animación. */
  const NODES = {
    crm: [6, 6],
    sq1: [18, 13],
    col: [23, 29],
    sq2: [57, 23],
    mvd: [93, 42]
  };

  /* Elementos DOM de los nodos secundarios (por clave de nodo). */
  const SEC = {
    sq1: document.getElementById('geo-sec-1'),
    sq2: document.getElementById('geo-sec-2')
  };

  /* Cada tramo es una secuencia de nodos que la animación recorre */
  const LEGS = {
    'mvd-crm': ['mvd', 'sq2', 'col', 'sq1', 'crm'],
    'crm-mvd': ['crm', 'sq1', 'col', 'sq2', 'mvd'],
    'crm-col': ['crm', 'sq1', 'col'],
    'col-crm': ['col', 'sq1', 'crm']
  };

  /* Mapa bloque (data-route) - tramos a recorrer + si es loop continuo.
     Los bloques 1–3 repiten su recorrido siempre del mismo inicio al mismo
     final (un solo tramo en bucle). El 4 (Colonia) hace ambos recorridos. */
  const ROUTES = {
    '1': { legs: ['mvd-crm'], loop: true },
    '2': { legs: ['crm-mvd'], loop: true },
    '3': { legs: ['mvd-crm'], loop: true },
    '4': { legs: ['crm-col', 'col-crm'], loop: true }
  };

  const DUR = 1700;   // ms que tarda la animación en recorrer un tramo
  const HEAD = 22;    // largo la animación (en unidades del viewBox)

  const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const pathD = pts => 'M' + pts.map(p => p.join(',')).join(' L');
  const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

  let raf = null;
  let active = null;     // { legs, loop, idx, start, len, secMarks } del recorrido en curso
  let pending = null;    // bloque clickeado mientras corre otra animación, no se solapa ni se corta
  let visible = true;

  /* Apaga todos los nodos secundarios. */
  function clearSec() {
    Object.values(SEC).forEach(el => el && el.classList.remove('is-lit'));
  }

  /* Carga la geometría de un tramo, prepara el dash de la animación y calcula la
     distancia a la que queda cada nodo secundario del tramo. */
  function setLeg(name) {
    clearSec();
    const keys = LEGS[name];
    const pts = keys.map(k => NODES[k]);
    trail.setAttribute('d', pathD(pts));

    let cum = 0;
    active.secMarks = [];
    for (let i = 0; i < pts.length; i++) {
      if (i > 0) cum += dist(pts[i - 1], pts[i]);
      if (SEC[keys[i]]) active.secMarks.push({ el: SEC[keys[i]], d: cum });
    }
    active.len = cum;
    // dash = animación (HEAD) + hueco mayor que todo el tramo - una sola animación visible
    trail.style.strokeDasharray = HEAD + ' ' + (active.len + HEAD + 4);
    // Offset en posición de arranque (animación en el inicio): evita pintar un
    // frame con el offset del tramo anterior al cambiar de geometría (flash).
    trail.style.strokeDashoffset = HEAD;
  }

  /* Enciende los secundarios que el cuerpo de la animación cubre en este frame. */
  function paintSec(head) {
    if (!active.secMarks) return;
    active.secMarks.forEach(m => {
      m.el.classList.toggle('is-lit', m.d <= head && m.d >= head - HEAD);
    });
  }

  function clearTrail() {
    trail.removeAttribute('d');           // sin geometría - línea invisible
    trail.style.strokeDasharray = '';
    trail.style.strokeDashoffset = '';
    clearSec();
  }

  function stop() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    active = null;
  }

  function frame(now) {
    if (!active) return;
    if (!active.start) active.start = now;

    let p = (now - active.start) / DUR;

    if (p >= 1) {
      // Si hay otra animación en queue y el recorrido actual ya terminó su tramo
      // recién ahora arranca la nueva animación.
      if (pending) {
        const next = pending;
        pending = null;
        play(next);   // el iluminado ya se hizo en el click
        return;
      }
      const last = active.idx >= active.legs.length - 1;
      if (active.loop || !last) {
        active.idx = (active.idx + 1) % active.legs.length;
        active.start = now;
        setLeg(active.legs[active.idx]);
        p = 0;
      } else {
        // recorrido de un solo paso, la animación sale por el final y se detiene
        trail.style.strokeDashoffset = -active.len;
        clearSec();
        stop();
        return;
      }
    }

    const e = easeInOut(Math.min(1, p));
    const head = e * (active.len + HEAD);   // posición del frente de la animación
    trail.style.strokeDashoffset = HEAD - head;
    paintSec(head);
    raf = requestAnimationFrame(frame);
  }

  function play(routeKey) {
    stop();
    const r = ROUTES[routeKey];
    if (!r) return;
    active = { legs: r.legs, loop: r.loop, idx: 0, start: 0, len: 0, secMarks: [] };
    setLeg(r.legs[0]);

    if (reduceMotion) {
      // sin movimiento: se dibuja el primer tramo completo y se encienden sus
      // secundarios de forma estática
      trail.style.strokeDasharray = 'none';
      trail.style.strokeDashoffset = 0;
      active.secMarks.forEach(m => m.el.classList.add('is-lit'));
      active = null;
      return;
    }
    if (visible) raf = requestAnimationFrame(frame);
  }

  /* Resalta el bloque (feedback inmediato del click). */
  function selectBlock(key) {
    blocks.forEach(x => x.classList.toggle('is-active', x.dataset.route === key));
  }

  blocks.forEach(b => {
    b.addEventListener('click', () => {
      selectBlock(b.dataset.route);   // iluminado instantáneo siempre
      // La animación del mapa espera si ya hay una corriendo, el nuevo
      // recorrido queda en espera y arranca cuando el actual termine su tramo.
      if (raf) pending = b.dataset.route;
      else play(b.dataset.route);
    });
  });

  /* Pausa por viewport: si el mapa deja de verse, se detiene la animación
     y se borra la línea. Vuelve a correr solo al click. */
  if (stage && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) {
        pending = null;
        stop();
        clearTrail();
      }
    }, { threshold: 0.01 }).observe(stage);
  }
})();

/* ============================================================
   "POR QUÉ SISTEMA" - título colapsable
   Sin JS el texto queda visible. Con JS se activa el
   colapso (.collapsible): colapsado solo se ve el título, al hacer
   click se despliega el texto abajo.
   ============================================================ */
(function () {
  'use strict';
  const why = document.querySelector('.z1-why');
  if (!why) return;
  const label = why.querySelector('.why-label');
  const text = why.querySelector('.why-text');
  if (!label || !text) return;

  /* Conector "L": SVG creado por JS (solo con colapso activo). */
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'why-conn');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('class', 'why-conn-path');
  svg.appendChild(path);
  why.appendChild(svg);

  why.classList.add('collapsible');   // habilita el colapso (arranca cerrado)

  const GAP = 8;               // margen de la "L" respecto al título y al cuadro
  const DRAW_MS = 500;         // duración del dibujado de la "L"
  let drawTimer = null, closeTimer = null, rz = null;

  /* Setea la geometría de la "L" (coords relativas a .z1-why) y devuelve su
     largo. Baja desde el centro del título hasta el centro
     vertical del cuadro y gira a la izquierda. */
  function setConnPath() {
    const wr = why.getBoundingClientRect();
    const lr = label.getBoundingClientRect();
    const br = text.getBoundingClientRect();
    const tcx = lr.left + lr.width / 2 - wr.left;   // centro horizontal del título
    const tby = lr.bottom - wr.top + GAP;           // arranca con margen debajo del título
    const bcy = br.top + br.height / 2 - wr.top;    // centro vertical del cuadro
    const brx = br.right - wr.left + GAP;           // termina con margen antes del cuadro
    path.setAttribute('d',
      `M ${tcx.toFixed(1)} ${tby.toFixed(1)} L ${tcx.toFixed(1)} ${bcy.toFixed(1)} L ${brx.toFixed(1)} ${bcy.toFixed(1)}`);
    return path.getTotalLength();
  }

  function clearTimers() {
    clearTimeout(drawTimer); clearTimeout(closeTimer);
    drawTimer = closeTimer = null;
  }

  /* Open: el cuadro toma su espacio (invisible) - se dibuja la "L" de
     principio a fin - recién ahí aparece el cuadro (.is-drawn). */
  function open() {
    clearTimers();
    why.classList.add('is-open');
    requestAnimationFrame(() => {
      const len = setConnPath();
      path.style.transition = 'none';
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = len;   // oculta el trazo
      svg.style.opacity = '1';
      path.getBoundingClientRect();         // fuerza reflow
      requestAnimationFrame(() => {
        path.style.transition = 'stroke-dashoffset ' + DRAW_MS + 'ms var(--ease)';
        path.style.strokeDashoffset = '0';  // dibuja la "L"
      });
      drawTimer = setTimeout(() => why.classList.add('is-drawn'), DRAW_MS + 40);
    });
  }

  /* Close: se desvanece el cuadro y la "L", después colapsa el espacio. */
  function close() {
    clearTimers();
    why.classList.remove('is-drawn');
    svg.style.opacity = '0';
    closeTimer = setTimeout(() => why.classList.remove('is-open'), 360);
  }

  label.addEventListener('click', () => {
    const willOpen = !why.classList.contains('is-open');
    label.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    if (willOpen) open(); else close();
  });

  /* Recalcular la "L" (ya dibujada) al redimensionar. */
  window.addEventListener('resize', () => {
    if (!why.classList.contains('is-drawn')) return;
    if (rz) return;
    rz = requestAnimationFrame(() => {
      rz = null;
      const len = setConnPath();
      path.style.transition = 'none';
      path.style.strokeDasharray = len;
      path.style.strokeDashoffset = '0';
    });
  }, { passive: true });
})();

/* ============================================================
   DISCIPLINAS - carpetas desplegables (árbol de archivos)
   Cada .disc es una carpeta; el header la abre/cierra y sus ramas
   (.disc-row) aparecen en cadena. Sin JS el árbol queda visible.
   ============================================================ */
(function () {
  'use strict';
  const tree = document.querySelector('.z3-tree');
  if (!tree) return;

  tree.classList.add('tree-js');   // habilita el colapso (arranca cerrado)

  /* Colapsa todos los sub-nodos DENTRO de scope (no el propio scope), para que
     al abrir/cerrar un contenedor sus sub-elementos vuelvan a estar cerrados. */
  function collapseNodes(scope) {
    scope.querySelectorAll('.disc-node.is-open').forEach(n => {
      n.classList.remove('is-open');
      const p = n.querySelector('.disc-parent');
      if (p) p.setAttribute('aria-expanded', 'false');
    });
  }

  /* Nivel 1 — carpetas (Código / Diseño) */
  tree.querySelectorAll('.disc').forEach(disc => {
    const head = disc.querySelector('.disc-head');
    if (!head) return;
    head.addEventListener('click', () => {
      const open = disc.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      collapseNodes(disc);   // al abrir o cerrar, los sub-elementos quedan cerrados
    });
  });

  /* Niveles anidados — elementos padre despliegan sus sub-elementos */
  tree.querySelectorAll('.disc-node').forEach(node => {
    const parent = node.querySelector('.disc-parent');
    if (!parent) return;
    parent.addEventListener('click', () => {
      const open = node.classList.toggle('is-open');
      parent.setAttribute('aria-expanded', open ? 'true' : 'false');
      collapseNodes(node);   // sus sub-nodos vuelven a cerrados
    });
  });
})();

/* ============================================================
   OBRAS - carrusel de la obra seleccionada
   Al clickear una card aparece la galería debajo, al clickear otra,
   cambia automáticamente.
   ============================================================ */
(function () {
  'use strict';
  const section = document.getElementById('obras');
  if (!section) return;
  const cards = Array.from(section.querySelectorAll('.z5-card'));
  const carousel = document.getElementById('z5-carousel');
  const track = document.getElementById('z5-car-track');
  const titleEl = document.getElementById('z5-car-title');
  const countEl = document.getElementById('z5-car-count');
  if (!cards.length || !carousel || !track) return;

  const prevBtn = carousel.querySelector('.z5-car-prev');
  const nextBtn = carousel.querySelector('.z5-car-next');

  const WORKS = cards.map(card => ({
    title: (card.querySelector('.z5c-title') || {}).textContent || '',
    video: card.getAttribute('data-video') || '',    // obra con video (mp4) en vez de imágenes
    images: []
  }));

  /* Obra 01 - SISTEMA */
  if (WORKS[0]) {
    WORKS[0].images = [
      'obras/sistema-1.png',
      'obras/sistema-2.png',
      'obras/sistema-3.png',
      'obras/sistema-4.png',
      'obras/sistema-5.png'
    ];
  }

  /* Obra 02 - Rebranding FAGAR: piezas del proyecto Fagar. */
  if (WORKS[1]) {
    WORKS[1].images = [
      'obras/fagar-1.jpg',
      'obras/fagar-1-1.jpg',
      'obras/fagar-2.jpg',
      'obras/fagar-2-1.jpg',
      'obras/fagar-3.jpg',
      'obras/fagar-3-1.jpg'
    ];
  }

  /* Obra 03 - Modelado 3D: galería de renders. */
  if (WORKS[2]) {
    WORKS[2].images = [
      'obras/3d-1.png',
      'obras/3d-2.png',
      'obras/3d-3.png',
      'obras/3d-4.png'
    ];
  }

  let active = -1;
  let index = 0;
  let seen = false;   // se pone true al verse el carrusel; permite cerrarlo al salir

  const esc = s => String(s).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function render(i) {
    const w = WORKS[i];

    /* Obra con video: un único slide reproducible.
       El render se dispara desde el clic en la card, así se
       inicia la reproducción con audio. */
    if (w.video) {
      track.style.transition = 'none';
      track.innerHTML =
        `<figure class="z5-car-slide z5-car-slide--video">` +
        `<video src="${esc(w.video)}"${w.poster ? ` poster="${esc(w.poster)}"` : ''} controls playsinline preload="metadata"></video>` +
        `</figure>`;
      index = 0;
      titleEl.textContent = w.title;
      update();
      const vid = track.querySelector('video');
      if (vid) vid.play().catch(() => {});   // si el navegador lo bloquea, quedan los controles
      requestAnimationFrame(() => { track.style.transition = ''; });
      return;
    }

    track.style.transition = 'none';   // al cambiar de obra no debe "resbalar"
    track.innerHTML = w.images.map((src, k) =>
      `<figure class="z5-car-slide">` +
      `<img src="${esc(src)}" alt="${esc(w.title)} — imagen ${k + 1}">` +
      `</figure>`
    ).join('');
    index = 0;
    titleEl.textContent = w.title;
    update();
    requestAnimationFrame(() => { track.style.transition = ''; });   // restaura las flechas
  }

  function update() {
    const n = track.children.length;
    track.style.transform = `translateX(${-index * 100}%)`;
    countEl.textContent = String(index + 1).padStart(2, '0') + ' / ' + String(n).padStart(2, '0');
    const disabled = n <= 1;
    if (prevBtn) prevBtn.disabled = disabled;
    if (nextBtn) nextBtn.disabled = disabled;
  }

  function go(delta) {
    const n = track.children.length;
    if (!n) return;
    index = (index + delta + n) % n;   // recorre en bucle
    update();
  }

  function closeCarousel() {
    const vid = track.querySelector('video');
    if (vid) vid.pause();   // que no siga sonando al ocultarse
    active = -1;
    cards.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-pressed', 'false'); });
    carousel.hidden = true;
  }

  function select(i) {
    if (i === active) { closeCarousel(); return; }   // click en la card activa = cerrar
    if (active === -1) seen = false;                 // solo al abrir desde cerrado
    active = i;
    cards.forEach((c, k) => {
      c.classList.toggle('is-active', k === i);
      c.setAttribute('aria-pressed', k === i ? 'true' : 'false');
    });
    carousel.hidden = false;
    render(i);
  }

  cards.forEach((card, i) => {
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-pressed', 'false');
    card.addEventListener('click', () => select(i));
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(i); }
    });
  });

  if (prevBtn) prevBtn.addEventListener('click', () => go(-1));
  if (nextBtn) nextBtn.addEventListener('click', () => go(1));

  /* El carrusel se cierra cuando sale del viewport */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { seen = true; return; }
      if (seen && active !== -1) closeCarousel();
    }, { threshold: 0 }).observe(carousel);
  }
})();
