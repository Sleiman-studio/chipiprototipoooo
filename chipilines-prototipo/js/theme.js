/* =========================================================
   THEME - Colores, fuentes y logo dinamicos
   ========================================================= */

const THEME_DEFAULT = {
  colores: {
    rosa: '#E8B4C8',
    rosaClaro: '#FBE4EC',
    cielo: '#A8D8EA',
    cieloClaro: '#E4F4FA',
    oro: '#D4AF37',
    tinta: '#2D2A32',
    crema: '#FDF8F5'
  },
  fuentes: {
    cuerpo: 'Quicksand',
    titulo: 'Pacifico'
  },
  logo: {
    tipo: 'texto',          // 'texto' o 'imagen'
    texto: 'Chipilines',
    subtexto: 'Venezuela',
    imagen: ''              // dataURL si es imagen
  }
};

const FUENTES_DISPONIBLES_CUERPO = [
  { id: 'Quicksand',   label: 'Quicksand (redondeada)' },
  { id: 'Poppins',     label: 'Poppins (moderna)' },
  { id: 'Inter',       label: 'Inter (limpia)' },
  { id: 'Nunito',      label: 'Nunito (suave)' },
  { id: 'Montserrat',  label: 'Montserrat (clasica)' },
  { id: 'Open Sans',   label: 'Open Sans (neutra)' }
];

const FUENTES_DISPONIBLES_TITULO = [
  { id: 'Pacifico',        label: 'Pacifico (script clasica)' },
  { id: 'Dancing Script',  label: 'Dancing Script (elegante)' },
  { id: 'Great Vibes',     label: 'Great Vibes (fina)' },
  { id: 'Satisfy',         label: 'Satisfy (manuscrita)' },
  { id: 'Quicksand',       label: 'Quicksand (redondeada)' },
  { id: 'Poppins',         label: 'Poppins (moderna)' }
];

function getTheme() {
  const raw = localStorage.getItem('chipilines_theme');
  if (raw) { try { return Object.assign({}, THEME_DEFAULT, JSON.parse(raw)); } catch(e) {} }
  return JSON.parse(JSON.stringify(THEME_DEFAULT));
}

function saveTheme(t) {
  localStorage.setItem('chipilines_theme', JSON.stringify(t));
}

/* Aplica colores + fuentes + logo al documento actual */
function applyTheme() {
  const t = getTheme();
  const r = document.documentElement.style;

  // Colores como variables CSS
  r.setProperty('--rosa',       t.colores.rosa);
  r.setProperty('--rosa-claro', t.colores.rosaClaro);
  r.setProperty('--cielo',      t.colores.cielo);
  r.setProperty('--cielo-claro',t.colores.cieloClaro);
  r.setProperty('--oro',        t.colores.oro);
  r.setProperty('--tinta',      t.colores.tinta);
  r.setProperty('--crema',      t.colores.crema);

  // Fuentes
  const fuenteCuerpo = "'" + t.fuentes.cuerpo + "', sans-serif";
  const fuenteTitulo = "'" + t.fuentes.titulo + "', cursive";
  r.setProperty('--fuente-cuerpo', fuenteCuerpo);
  r.setProperty('--fuente-titulo', fuenteTitulo);
  document.body.style.fontFamily = fuenteCuerpo;

  // Actualizar tailwind config runtime (si existe)
  if (window.tailwind && window.tailwind.config) {
    try {
      const cfg = window.tailwind.config;
      if (cfg.theme && cfg.theme.extend && cfg.theme.extend.colors) {
        cfg.theme.extend.colors.rosa = t.colores.rosa;
        cfg.theme.extend.colors.cielo = t.colores.cielo;
        cfg.theme.extend.colors.oro = t.colores.oro;
        cfg.theme.extend.colors.tinta = t.colores.tinta;
        cfg.theme.extend.colors.crema = t.colores.crema;
      }
    } catch(e) {}
  }

  // Cargar Google Fonts si no está la fuente
  cargarFuenteGoogle(t.fuentes.cuerpo);
  cargarFuenteGoogle(t.fuentes.titulo);

  // Logo
  aplicarLogo(t.logo);
}

function cargarFuenteGoogle(nombre) {
  if (!nombre) return;
  const id = 'gf-' + nombre.replace(/\s+/g, '-');
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  const familia = nombre.replace(/\s+/g, '+');
  link.href = 'https://fonts.googleapis.com/css2?family=' + familia + ':wght@400;500;600;700&display=swap';
  document.head.appendChild(link);
}

function aplicarLogo(logo) {
  document.querySelectorAll('[data-logo-text]').forEach(el => {
    if (logo.tipo === 'texto') {
      el.innerHTML = '<span class="font-bold text-lg tracking-tight">' + (logo.texto || 'Chipilines') + '</span>' +
                     '<p class="text-[10px] uppercase tracking-[0.25em] text-gray-500">' + (logo.subtexto || '') + '</p>';
      el.style.background = 'none';
    } else if (logo.imagen) {
      el.innerHTML = '<img src="' + logo.imagen + '" alt="Logo" style="height:44px;width:auto;object-fit:contain;">';
    }
  });
  // Reemplazar el circulo "C" cuando el logo es texto (mantiene circulo)
  document.querySelectorAll('[data-logo-circle]').forEach(el => {
    if (logo.tipo === 'imagen' && logo.imagen) {
      el.style.background = 'none';
      el.style.boxShadow = 'none';
      el.innerHTML = '';
    }
  });
}

// Aplicar tan pronto como sea posible
document.addEventListener('DOMContentLoaded', applyTheme);
