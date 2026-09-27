/* =========================================================
   EDITOR VISUAL EN VIVO
   Se activa con ?edit=1 en la URL.
   - Textos: contenteditable -> guarda en chipilines_home_v2
   - Imagenes: clic -> file picker -> reemplaza
   - Colores: clic -> color picker -> guarda en chipilines_theme
   ========================================================= */

(function() {
  const params = new URLSearchParams(window.location.search);
  const editMode = params.get('edit') === '1';
  if (!editMode) return;

  document.body.classList.add('edit-mode');

  // Asegurar chipilines_home_v2 con defaults
  function getHome() {
    const raw = localStorage.getItem('chipilines_home_v2');
    if (raw) { try { return JSON.parse(raw); } catch(e) {} }
    return null;
  }
  function setHome(obj) {
    localStorage.setItem('chipilines_home_v2', JSON.stringify(obj));
  }
  function getTheme() {
    const raw = localStorage.getItem('chipilines_theme');
    if (raw) { try { return JSON.parse(raw); } catch(e) {} }
    return null;
  }
  function setTheme(obj) {
    localStorage.setItem('chipilines_theme', JSON.stringify(obj));
  }

  /* ---------- Guardado en el objeto anidado ---------- */
  function setIn(obj, path, value) {
    const keys = path.split('.');
    let cur = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (/^\d+$/.test(keys[i+1])) {
        if (!Array.isArray(cur[k])) cur[k] = [];
      } else {
        if (typeof cur[k] !== 'object' || cur[k] === null) cur[k] = {};
      }
      cur = cur[k];
    }
    cur[keys[keys.length - 1]] = value;
  }

  /* ---------- Guardar campo de texto ---------- */
  function guardarTexto(key, value) {
    // Si empieza con "theme." es tema, si no es home
    if (key.indexOf('theme.') === 0) {
      const t = getTheme() || {};
      setIn(t, key.replace(/^theme\./, ''), value);
      setTheme(t);
    } else {
      const h = getHome() || {};
      setIn(h, key, value);
      setHome(h);
    }
  }

  /* ---------- Activar contenteditable en campos de texto ---------- */
  document.querySelectorAll('[data-edit-key]').forEach(el => {
    el.setAttribute('contenteditable', 'true');
    el.setAttribute('spellcheck', 'false');
    // Evitar que links dentro naveguen
    el.addEventListener('click', (e) => {
      if (el.tagName === 'A') e.preventDefault();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && el.dataset.editSingle === '1') {
        e.preventDefault();
        el.blur();
      }
      if (e.key === 'Escape') el.blur();
    });
    el.addEventListener('blur', () => {
      const key = el.dataset.editKey;
      const value = el.innerText.trim();
      if (key) guardarTexto(key, value);
    });
  });

  /* ---------- Imagenes editables ---------- */
  document.querySelectorAll('[data-edit-image]').forEach(el => {
    el.addEventListener('click', async (e) => {
      e.preventDefault();
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const dataUrl = await comprimirImagenEdit(file, 1400, 0.82);
        const key = el.dataset.editImage;
        // Guardar
        if (key.indexOf('theme.') === 0) {
          const t = getTheme() || {};
          setIn(t, key.replace(/^theme\./, ''), dataUrl);
          setTheme(t);
        } else {
          const h = getHome() || {};
          setIn(h, key, dataUrl);
          setHome(h);
        }
        // Aplicar visualmente
        if (el.tagName === 'IMG') {
          el.src = dataUrl;
        } else {
          const img = el.querySelector('img') || el;
          if (img.tagName === 'IMG') img.src = dataUrl;
          else el.style.backgroundImage = 'url(' + dataUrl + ')';
        }
        toastEdit('Imagen actualizada');
      };
      input.click();
    });
  });

  /* ---------- Colores editables ---------- */
  document.querySelectorAll('[data-edit-color]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      abrirColorPicker(el);
    });
  });

  function abrirColorPicker(el) {
    // Cerrar anteriores
    document.querySelectorAll('.color-popover').forEach(p => p.remove());
    const key = el.dataset.editColor;
    const rect = el.getBoundingClientRect();
    const pop = document.createElement('div');
    pop.className = 'color-popover';
    pop.style.top = Math.max(10, rect.bottom + 8) + 'px';
    pop.style.left = Math.min(window.innerWidth - 240, rect.left) + 'px';

    // Valor inicial
    const t = getTheme() || {};
    const keys = key.replace(/^theme\./, '').split('.');
    let cur = t;
    for (let k of keys) cur = cur && cur[k];
    const inicial = cur || '#E8B4C8';

    pop.innerHTML = `
      <p style="font-size:12px;font-weight:700;color:#4B5563;">Cambiar color: ${key.replace('theme.colores.','')}</p>
      <input type="color" value="${inicial}" id="cp-input">
      <div class="cp-actions">
        <button class="cancel" id="cp-cancel">Cancelar</button>
        <button class="apply" id="cp-apply">Aplicar</button>
      </div>`;
    document.body.appendChild(pop);

    const input = pop.querySelector('#cp-input');
    pop.querySelector('#cp-cancel').onclick = () => pop.remove();
    pop.querySelector('#cp-apply').onclick = () => {
      const val = input.value;
      const th = getTheme() || {};
      setIn(th, key.replace(/^theme\./, ''), val);
      setTheme(th);
      // Aplicar visualmente inmediato
      if (window.applyTheme) window.applyTheme();
      toastEdit('Color actualizado');
      pop.remove();
    };
  }

  /* ---------- Compresion de imagen ---------- */
  function comprimirImagenEdit(file, maxAncho, calidad) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let w = img.width, h = img.height;
          if (w > maxAncho) { h = Math.round((h * maxAncho) / w); w = maxAncho; }
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          canvas.getContext('2d').drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', calidad));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /* ---------- Toast simple ---------- */
  function toastEdit(msg) {
    let t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#2D2A32;color:#fff;padding:10px 20px;border-radius:999px;font-size:12px;font-weight:700;z-index:99999;box-shadow:0 10px 30px rgba(0,0,0,.3);';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1800);
  }

  /* ---------- Barra flotante del editor ---------- */
  const bar = document.createElement('div');
  bar.className = 'edit-bar';
  bar.innerHTML = `
    <span>Modo edicion: toca cualquier texto, imagen o color</span>
    <button onclick="window.close()">Cerrar</button>
    <button class="primary" onclick="location.href='index.html'">Guardar y salir</button>`;
  document.body.appendChild(bar);

})();
