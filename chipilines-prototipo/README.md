# Chipilines Venezuela - Prototipo Web v2

Flujo completo: Catalogo -> Carrito -> WhatsApp -> Admin asigna precios
-> Factura -> Cliente acepta/rechaza -> Metodos de pago venezolanos.

## Estructura

  chipilines-prototipo/
  |- index.html      -> Inicio
  |- catalogo.html   -> Catalogo con filtros
  |- carrito.html    -> Carrito de cotizacion
  |- admin.html      -> Panel admin (password: chipilines2024)
  |- factura.html    -> Vista de factura para el cliente
  |- css/style.css
  |- js/app.js
  |- js/admin.js
  |- js/factura.js

## Flujo completo
1. Cliente agrega productos y va a carrito.html
2. Llena datos -> Envia cotizacion (abre WhatsApp al 04128048173)
3. Admin entra a admin.html (password: chipilines2024)
4. Admin asigna precio a cada producto -> Guardar precios
5. Admin click 'Generar factura y contactar' -> abre WhatsApp al cliente
   con el link a factura.html?d=...
6. Cliente abre la factura, ve el total
7. Cliente click 'Si, quiero proceder' -> aparecen metodos de pago
   O 'No, gracias' -> se elimina el pedido
8. Cliente elige metodo y envia comprobante por WhatsApp

## Metodos de pago incluidos (Venezuela)
- Pago Movil (Banesco)
- Transferencia bancaria (Banesco)
- Zelle
- Binance USDT (TRC20)
- PayPal
- Efectivo (Bs / Divisas)

## Editar datos de pago
Abre js/admin.js y js/factura.js, busca la constante DATOS_PAGO y cambia
los valores por los reales de Chipilines.

## Numero de WhatsApp configurado
04128048173 (formato internacional: 584128048173)
Se cambia en js/app.js -> CONFIG.whatsapp

---
Hecho para Chipilines Venezuela.
