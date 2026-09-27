
const DATOS_PAGO = {
  pagoMovil: {
    banco: 'Banesco', telefono: '0412-8048173',
    cedula: 'V-12345678', titular: 'Chipilines Venezuela'
  },
  transferencia: {
    banco: 'Banesco', cuenta: '0134-XXXX-XX-XXXXXXXXXX',
    titular: 'Chipilines Venezuela', rif: 'J-XXXXXXXX-X'
  },
  zelle: { email: 'pagos@chipilines.com', titular: 'Chipilines Venezuela' },
  binance: { email: 'pagos@chipilines.com', red: 'TRC20 (USDT)' },
  paypal: { email: 'pagos@chipilines.com' },
  efectivo: { nota: 'Coordinar punto de encuentro en Los Palos Grandes, Caracas.' }
};

function fmt(n) { return '$' + Number(n || 0).toFixed(2); }

function obtenerPedidoDeURL() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get('d');
  if (!encoded) return null;

  if (typeof LZString !== 'undefined' && LZString.decompressFromEncodedURIComponent) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(encoded);
      if (json) {
        const obj = JSON.parse(json);
        if (obj.i && obj.c) {
          return {
            id: obj.i, fecha: obj.f,
            cliente: { nombre: obj.c.n, cedula: obj.c.d, telefono: obj.c.t, evento: obj.c.e, notas: obj.c.o },
            items: (obj.it || []).map(x => ({ nombre: x.n, cantidad: x.c, precioUnitario: x.p })),
            total: obj.tt, estado: obj.es
          };
        }
        if (obj.cliente) return obj;
      }
    } catch(e) {}
  }

  try { return JSON.parse(decodeURIComponent(escape(atob(encoded)))); }
  catch(e) { console.error('Error decoding factura', e); }
  return null;
}

function renderFactura() {
  const cont = document.getElementById('factura-contenido');
  const pedido = obtenerPedidoDeURL();

  if (!pedido) {
    cont.innerHTML = `
      <div class="text-center py-20">
        <p class="text-6xl mb-4">~</p>
        <p class="text-xl font-bold mb-2">Factura no encontrada</p>
        <p class="text-sm text-gray-500 mb-6">El enlace puede estar roto o haber expirado.</p>
        <a href="index.html" class="btn-primary inline-block font-bold px-6 py-3 rounded-full">Volver al inicio</a>
      </div>`;
    return;
  }

  const fecha = new Date(pedido.fecha).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
  const total = pedido.total || (pedido.items || []).reduce((s, i) => s + (Number(i.precioUnitario) || 0) * i.cantidad, 0);

  const itemsHTML = (pedido.items || []).map(i => {
    const sub = (Number(i.precioUnitario) || 0) * i.cantidad;
    return `
      <div class="factura-item py-4 flex items-start justify-between gap-4">
        <div class="flex-1 min-w-0">
          <p class="font-bold text-sm">${i.nombre}</p>
          <p class="text-xs text-gray-400 mt-0.5">${i.cantidad} x ${fmt(i.precioUnitario)}</p>
        </div>
        <p class="font-bold text-sm">${fmt(sub)}</p>
      </div>`;
  }).join('');

  cont.innerHTML = `
    <div id="factura-captura" class="factura-card p-6 md:p-10" style="background: #ffffff;">
      <div class="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-rosa to-cielo flex items-center justify-center">
            <span class="font-display text-white text-xl">C</span>
          </div>
          <div>
            <p class="font-display text-2xl text-tinta">Chipilines</p>
            <p class="text-[10px] uppercase tracking-[0.25em] text-gray-400">Venezuela</p>
          </div>
        </div>
        <div class="text-right">
          <p class="font-bold text-lg">FACTURA</p>
          <p class="text-xs text-gray-400">${pedido.id}</p>
          <p class="text-xs text-gray-400">${fecha}</p>
        </div>
      </div>

      <div class="bg-crema rounded-2xl p-5 mb-6">
        <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Cliente</p>
        <p class="font-bold">${pedido.cliente.nombre}</p>
        <p class="text-sm text-gray-500">C.I. ${pedido.cliente.cedula}</p>
        <p class="text-sm text-gray-500">${pedido.cliente.telefono}</p>
        ${pedido.cliente.evento ? '<p class="text-xs text-gray-400 mt-2">Fecha del evento: ' + pedido.cliente.evento + '</p>' : ''}
      </div>

      <div class="mb-6">
        <p class="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Productos</p>
        ${itemsHTML}
      </div>

      <div class="border-t-2 border-dashed border-gray-200 pt-5 mb-8">
        <div class="flex items-center justify-between">
          <p class="font-bold text-lg">Total a pagar</p>
          <p class="font-display text-4xl text-tinta">${fmt(total)}</p>
        </div>
        ${pedido.cliente.notas ? '<p class="text-xs text-gray-500 italic mt-3">"' + pedido.cliente.notas + '"</p>' : ''}
      </div>

      <div class="grid sm:grid-cols-2 gap-3 mb-3 no-capture">
        <button onclick="descargarImagen()" class="btn-ghost font-bold py-3 rounded-full inline-flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3"/></svg>
          Descargar imagen
        </button>
        <button onclick="descargarPDF()" class="btn-ghost font-bold py-3 rounded-full inline-flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
          Descargar PDF
        </button>
      </div>
    </div>

    <div id="acciones-factura" class="grid sm:grid-cols-2 gap-3 mt-6">
      <button onclick="aceptarFactura()" class="btn-wsp font-bold py-4 rounded-full inline-flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
        Si, quiero proceder
      </button>
      <button onclick="rechazarFactura()" class="btn-ghost font-bold py-4 rounded-full inline-flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
        No, gracias
      </button>
    </div>

    <div id="zona-pagos" class="hidden mt-8"></div>`;

  // Guardar en localStorage
  try {
    const pedidos = JSON.parse(localStorage.getItem('chipilines_pedidos') || '[]');
    const idx = pedidos.findIndex(p => p.id === pedido.id);
    if (idx >= 0) pedidos[idx] = pedido;
    else pedidos.unshift(pedido);
    localStorage.setItem('chipilines_pedidos', JSON.stringify(pedidos));
  } catch(e) {}

  // Auto-descarga si viene ?dl=img o ?dl=pdf
  const dl = new URLSearchParams(window.location.search).get('dl');
  if (dl === 'img') setTimeout(() => descargarImagen(true), 700);
  if (dl === 'pdf') setTimeout(() => descargarPDF(true), 700);
}

function aceptarFactura() {
  const pedido = obtenerPedidoDeURL();
  if (!pedido) return;

  try {
    const pedidos = JSON.parse(localStorage.getItem('chipilines_pedidos') || '[]');
    const idx = pedidos.findIndex(p => p.id === pedido.id);
    if (idx >= 0) { pedidos[idx].estado = 'aceptado'; localStorage.setItem('chipilines_pedidos', JSON.stringify(pedidos)); }
  } catch(e) {}

  const acciones = document.getElementById('acciones-factura');
  if (acciones) acciones.style.display = 'none';

  mostrarPagos();
  const zona = document.getElementById('zona-pagos');
  if (zona) {
    zona.classList.remove('hidden');
    setTimeout(() => zona.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }
}

function mostrarPagos() {
  const cont = document.getElementById('zona-pagos');
  if (!cont) return;
  const p = DATOS_PAGO;

  const metodos = [
    { id: 'pagoMovil',     titulo: 'Pago Movil',          subtitulo: 'Inmediato',         color: 'bg-rosa/20',   inicial: 'PM' },
    { id: 'transferencia', titulo: 'Transferencia',       subtitulo: 'Nacional',          color: 'bg-cielo/30',  inicial: 'TB' },
    { id: 'zelle',         titulo: 'Zelle',               subtitulo: 'USD',               color: 'bg-purple-100',inicial: 'ZL' },
    { id: 'binance',       titulo: 'Binance USDT',        subtitulo: 'Cripto',            color: 'bg-yellow-100',inicial: 'BN' },
    { id: 'paypal',        titulo: 'PayPal',              subtitulo: 'Internacional',     color: 'bg-blue-100',  inicial: 'PP' },
    { id: 'efectivo',      titulo: 'Efectivo',            subtitulo: 'Bs / Divisas',      color: 'bg-green-100', inicial: 'EF' }
  ];

  const cardsHTML = metodos.map(m => `
    <div class="metodo-pago bg-white rounded-2xl p-5 shadow-sm" onclick="mostrarDetalle('${m.id}')">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl ${m.color} flex items-center justify-center text-sm font-bold text-tinta">${m.inicial}</div>
        <div><p class="font-bold text-sm">${m.titulo}</p><p class="text-xs text-gray-400">${m.subtitulo}</p></div>
      </div>
    </div>`).join('');

  cont.innerHTML = `
    <div class="bg-gradient-to-br from-rosa/15 to-cielo/15 rounded-3xl p-6 md:p-8">
      <div class="text-center mb-6">
        <p class="font-script text-3xl text-rosa mb-1">Ya casi</p>
        <h2 class="font-display text-3xl text-tinta">Elige tu metodo de pago</h2>
        <p class="text-sm text-gray-500 mt-2">Selecciona una opcion y envia tu comprobante por WhatsApp.</p>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">${cardsHTML}</div>

      <div id="detalle-pago" class="hidden mt-6"></div>

      <div class="mt-6 text-center">
        <a id="wsp-comprobante" href="#" target="_blank" class="btn-wsp inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
          Enviar comprobante por WhatsApp
        </a>
      </div>
    </div>`;

  const ped = obtenerPedidoDeURL();
  if (ped) {
    const tel = '584128048173';
    const msg = encodeURIComponent('Hola! Soy ' + ped.cliente.nombre + '. Acepte la factura ' + ped.id + ' por un total de ' + fmt(ped.total) + '. Adjunto mi comprobante de pago.');
    const wsp = document.getElementById('wsp-comprobante');
    if (wsp) wsp.href = 'https://wa.me/' + tel + '?text=' + msg;
  }
}

function mostrarDetalle(metodo) {
  const cont = document.getElementById('detalle-pago');
  const d = DATOS_PAGO[metodo];
  if (!d || !cont) return;

  const titulos = {
    pagoMovil: 'Pago Movil', transferencia: 'Transferencia bancaria',
    zelle: 'Zelle', binance: 'Binance USDT', paypal: 'PayPal', efectivo: 'Efectivo'
  };

  let html = '<div class="bg-white rounded-2xl p-6 shadow-sm">';
  html += '<p class="font-bold text-sm mb-4 uppercase tracking-wider text-gray-400">Datos para ' + (titulos[metodo] || metodo) + '</p>';
  html += '<div class="space-y-3">';

  Object.keys(d).forEach(k => {
    const label = k.charAt(0).toUpperCase() + k.slice(1);
    const val = String(d[k]);
    const safeVal = val.replace(/'/g, "\\'");
    html += '<div class="flex items-start justify-between gap-3 text-sm">';
    html += '<span class="text-gray-500 capitalize">' + label + '</span>';
    html += '<span class="font-semibold text-right flex items-center justify-end">' + val;
    html += '<button class="copy-btn text-[10px] font-bold bg-crema px-2 py-1 rounded-full ml-2" onclick="copiarTexto(\'' + safeVal + '\', this)">Copiar</button>';
    html += '</span></div>';
  });

  html += '</div></div>';
  cont.innerHTML = html;
  cont.classList.remove('hidden');
}

function copiarTexto(texto, btn) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(() => {
      const orig = btn.textContent;
      btn.textContent = 'Copiado';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }
}

function rechazarFactura() {
  if (!confirm('Seguro que no deseas continuar? Tu cotizacion sera cancelada.')) return;

  const pedido = obtenerPedidoDeURL();
  if (pedido) {
    try {
      const pedidos = JSON.parse(localStorage.getItem('chipilines_pedidos') || '[]');
      const filtrados = pedidos.filter(p => p.id !== pedido.id);
      localStorage.setItem('chipilines_pedidos', JSON.stringify(filtrados));
    } catch(e) {}
  }

  const cont = document.getElementById('factura-contenido');
  cont.innerHTML = `
    <div class="factura-card p-10 text-center">
      <div class="w-20 h-20 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
      </div>
      <h2 class="font-display text-3xl text-tinta mb-3">Cotizacion cancelada</h2>
      <p class="text-gray-500 mb-8 max-w-md mx-auto">Lamentamos que no hayas podido continuar. Si cambias de opinion, puedes contactarnos por WhatsApp o volver a cotizar cuando quieras.</p>
      <a href="catalogo.html" class="btn-primary inline-block font-bold px-7 py-3.5 rounded-full">Volver al catalogo</a>
    </div>`;
}

function mostrarPagos() {
  const cont = document.getElementById('zona-pagos');
  const p = DATOS_PAGO;

  const copiar = (texto) => `<button class="copy-btn text-[10px] font-bold bg-crema px-2 py-1 rounded-full ml-2" onclick="copiarTexto('${texto.replace(/'/g, "\\'")}', this)">Copiar</button>`;

  cont.innerHTML = `
    <div class="bg-gradient-to-br from-rosa/15 to-cielo/15 rounded-3xl p-6 md:p-8">
      <div class="text-center mb-6">
        <p class="font-script text-3xl text-rosa mb-1">Ya casi</p>
        <h2 class="font-display text-3xl text-tinta">Elige tu metodo de pago</h2>
        <p class="text-sm text-gray-500 mt-2">Selecciona una opcion y envia tu comprobante por WhatsApp.</p>
      </div>

      <div class="grid sm:grid-cols-2 gap-4">
        <!-- Pago Movil -->
        <div class="metodo-pago bg-white rounded-2xl p-5 shadow-sm" onclick="mostrarDetalle('pagoMovil')">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 rounded-xl bg-rosa/20 flex items-center justify-center text-lg">PM</div>
            <div><p class="font-bold text-sm">Pago Movil</p><p class="text-xs text-gray-400">Inmediato</p></div>
          </div>
        </div>

        <!-- Transferencia -->
        <div class="metodo-pago bg-white rounded-2xl p-5 shadow-sm" onclick="mostrarDetalle('transferencia')">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 rounded-xl bg-cielo/30 flex items-center justify-center text-lg">TB</div>
            <div><p class="font-bold text-sm">Transferencia bancaria</p><p class="text-xs text-gray-400">Nacional</p></div>
          </div>
        </div>

        <!-- Zelle -->
        <div class="metodo-pago bg-white rounded-2xl p-5 shadow-sm" onclick="mostrarDetalle('zelle')">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 rounded-xl bg-purple-100 flex items-center justify-center text-lg">ZL</div>
            <div><p class="font-bold text-sm">Zelle</p><p class="text-xs text-gray-400">USD</p></div>
          </div>
        </div>

        <!-- Binance -->
        <div class="metodo-pago bg-white rounded-2xl p-5 shadow-sm" onclick="mostrarDetalle('binance')">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 rounded-xl bg-yellow-100 flex items-center justify-center text-lg">BN</div>
            <div><p class="font-bold text-sm">Binance USDT</p><p class="text-xs text-gray-400">Cripto</p></div>
          </div>
        </div>

        <!-- PayPal -->
        <div class="metodo-pago bg-white rounded-2xl p-5 shadow-sm" onclick="mostrarDetalle('paypal')">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center text-lg">PP</div>
            <div><p class="font-bold text-sm">PayPal</p><p class="text-xs text-gray-400">Internacional</p></div>
          </div>
        </div>

        <!-- Efectivo -->
        <div class="metodo-pago bg-white rounded-2xl p-5 shadow-sm" onclick="mostrarDetalle('efectivo')">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center text-lg">EF</div>
            <div><p class="font-bold text-sm">Efectivo</p><p class="text-xs text-gray-400">Bs / Divisas</p></div>
          </div>
        </div>
      </div>

      <div id="detalle-pago" class="hidden mt-6"></div>

      <div class="mt-6 text-center">
        <a id="wsp-comprobante" href="#" target="_blank" class="btn-wsp inline-flex items-center gap-2 font-bold px-6 py-3 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.464 3.488"/></svg>
          Enviar comprobante por WhatsApp
        </a>
      </div>
    </div>`;

  const pedido = obtenerPedidoDeURL();
  if (pedido) {
    const tel = '584128048173';
    const msg = encodeURIComponent('Hola! Soy ' + pedido.cliente.nombre + '. Acepte la factura ' + pedido.id + ' por un total de ' + fmt(pedido.total) + '. Adjunto mi comprobante de pago.');
    document.getElementById('wsp-comprobante').href = 'https://wa.me/' + tel + '?text=' + msg;
  }
}

function mostrarDetalle(metodo) {
  const cont = document.getElementById('detalle-pago');
  const d = DATOS_PAGO[metodo];
  if (!d) return;

  let html = '<div class="bg-white rounded-2xl p-6 shadow-sm">';
  html += '<p class="font-bold text-sm mb-4 uppercase tracking-wider text-gray-400">Datos para ' + metodo.replace(/([A-Z])/g, ' $1').trim() + '</p>';
  html += '<div class="space-y-3">';

  Object.keys(d).forEach(k => {
    const label = k.charAt(0).toUpperCase() + k.slice(1);
    const val = d[k];
    html += `
      <div class="flex items-start justify-between gap-3 text-sm">
        <span class="text-gray-500 capitalize">${label}</span>
        <span class="font-semibold text-right flex items-center">${val}<button class="copy-btn text-[10px] font-bold bg-crema px-2 py-1 rounded-full ml-2" onclick="copiarTexto('${String(val).replace(/'/g, "\\'")}', this)">Copiar</button></span>
      </div>`;
  });

  html += '</div></div>';
  cont.innerHTML = html;
  cont.classList.remove('hidden');
}

function copiarTexto(texto, btn) {
  navigator.clipboard.writeText(texto).then(() => {
    const original = btn.textContent;
    btn.textContent = 'Copiado';
    setTimeout(() => { btn.textContent = original; }, 1500);
  });
}

/* ---------- Captura y descarga de factura ---------- */
async function capturarFactura() {
  const el = document.getElementById('factura-captura');
  document.querySelectorAll('.no-capture').forEach(b => b.style.visibility = 'hidden');
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false
  });
  document.querySelectorAll('.no-capture').forEach(b => b.style.visibility = 'visible');
  return canvas;
}

async function descargarImagen(silencioso) {
  try {
    const canvas = await capturarFactura();
    const link = document.createElement('a');
    const ped = obtenerPedidoDeURL();
    link.download = 'Factura-Chipilines-' + (ped ? ped.id : 'factura') + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (!silencioso) mostrarToast('Imagen descargada');
  } catch(e) {
    console.error(e);
    if (!silencioso) mostrarToast('No se pudo generar la imagen', 'error');
  }
}

async function descargarPDF(silencioso) {
  try {
    const canvas = await capturarFactura();
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    const margen = 8;
    pdf.addImage(imgData, 'PNG', margen, margen, pdfWidth - margen * 2, pdfHeight - margen * 2);
    const ped = obtenerPedidoDeURL();
    pdf.save('Factura-Chipilines-' + (ped ? ped.id : 'factura') + '.pdf');
    if (!silencioso) mostrarToast('PDF descargado');
  } catch(e) {
    console.error(e);
    if (!silencioso) mostrarToast('No se pudo generar el PDF', 'error');
  }
}

function mostrarToast(msg, tipo = 'ok') {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast'; toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.background = tipo === 'error' ? '#c0392b' : '#2D2A32';
  toast.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
}

document.addEventListener('DOMContentLoaded', () => {
  renderFactura();

  // Detectar si es modo preview (el admin esta viendo la factura)
  const esPreview = new URLSearchParams(window.location.search).get('preview') === '1';
  if (esPreview) {
    // Esperar un momento para que renderFactura() pinte los elementos
    setTimeout(() => {
      // Ocultar botones de accion "Si, proceder" / "No, gracias"
      const acciones = document.getElementById('acciones-factura');
      if (acciones) acciones.style.display = 'none';

      // Ocultar zona de pagos si estuviera visible
      const zona = document.getElementById('zona-pagos');
      if (zona) zona.style.display = 'none';

      // Banda superior avisando que es preview
      const banner = document.createElement('div');
      banner.style.cssText = 'position:fixed;top:90px;left:50%;transform:translateX(-50%);z-index:9999;background:#2D2A32;color:#fff;padding:10px 22px;border-radius:999px;font-size:13px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.25);display:flex;align-items:center;gap:12px;';
      banner.innerHTML = '<span>Vista previa - El cliente veria los botones de confirmar aqui</span>' +
                        '<button onclick="this.parentElement.remove()" style="background:#E8B4C8;color:#fff;border:none;padding:4px 12px;border-radius:999px;font-size:11px;font-weight:700;cursor:pointer;">OK</button>';
      document.body.appendChild(banner);
    }, 200);
  }
});
