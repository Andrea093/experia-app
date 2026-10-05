// =============================================
// Aviso de versión nueva (PWA).
// El service worker se actualiza solo (registerType 'autoUpdate'), pero una
// pestaña que ya estaba abierta sigue corriendo el código viejo hasta que se
// recarga: así un tutor seguía viendo el editor anterior horas después de
// publicado el nuevo. Aquí se avisa con una barra y un botón "Recargar".
// NO recarga solo: el docente podría estar a mitad de editar una ruta.
// Sin dependencias de React: se monta directo en <body>.
// =============================================

const CHECK_EVERY_MS = 10 * 60 * 1000 // buscar versión nueva cada 10 min

const showBar = () => {
  if (document.getElementById('xp-update-bar')) return
  const bar = document.createElement('div')
  bar.id = 'xp-update-bar'
  bar.setAttribute('role', 'status')
  bar.style.cssText = [
    'position:fixed', 'left:50%', 'bottom:18px', 'transform:translateX(-50%)', 'z-index:7000',
    'display:flex', 'align-items:center', 'gap:12px', 'padding:10px 12px 10px 16px', 'border-radius:14px',
    'background:#1A1A2E', 'color:#fff', 'font:600 14px/1.3 "DM Sans",system-ui,sans-serif',
    'box-shadow:0 10px 30px rgba(0,0,0,.3)', 'max-width:calc(100vw - 32px)',
  ].join(';')
  const txt = document.createElement('span')
  txt.textContent = '✨ Hay una versión nueva de Experia.'
  const btn = document.createElement('button')
  btn.textContent = 'Recargar'
  btn.style.cssText = 'border:none;border-radius:9px;padding:8px 14px;cursor:pointer;font:800 13px "DM Sans",system-ui,sans-serif;background:#E8732C;color:#fff'
  btn.onclick = () => window.location.reload()
  const close = document.createElement('button')
  close.textContent = '✕'
  close.title = 'Más tarde'
  close.style.cssText = 'border:none;background:transparent;color:#fff;opacity:.7;cursor:pointer;font-size:14px;padding:4px'
  close.onclick = () => bar.remove()
  bar.append(txt, btn, close)
  document.body.appendChild(bar)
}

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  // Solo es "versión nueva" si ya había un service worker controlando la
  // página: en la primera visita no hay nada viejo que reemplazar.
  const hadController = !!navigator.serviceWorker.controller
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController) showBar() })
  navigator.serviceWorker.ready.then(reg => {
    setInterval(() => { reg.update().catch(() => {}) }, CHECK_EVERY_MS)
  }).catch(() => {})
}
