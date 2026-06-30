// Cierre de sesión automático por inactividad.
//
// Registra el momento de la última actividad del usuario (mouse, teclado,
// scroll, touch) en localStorage. Si pasa más de IDLE_LIMIT_MS sin actividad,
// se cierra la sesión. Como el timestamp persiste en localStorage, también
// cubre el caso de cerrar el navegador y volver a abrirlo: si ya expiró el
// tiempo, la sesión NO se restaura (ver main.jsx -> isSessionExpired).

// Tiempo máximo de inactividad antes de cerrar sesión. Ajustable.
export const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutos

const STORAGE_KEY = 'experia:last-activity';
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

const now = () => Date.now();

// Guarda el instante de la última actividad.
export function markActivity() {
  try { localStorage.setItem(STORAGE_KEY, String(now())); } catch { /* storage no disponible */ }
}

// Limpia el registro (al cerrar sesión).
export function clearIdleActivity() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* noop */ }
}

// ¿La sesión guardada lleva inactiva más del límite? Se llama al restaurar
// sesión en el arranque para evitar reabrir una sesión vieja automáticamente.
export function isSessionExpired() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false; // sin registro previo: no bloquear (sesión nueva o legado)
    const last = Number(raw);
    if (!Number.isFinite(last)) return false;
    return now() - last > IDLE_LIMIT_MS;
  } catch {
    return false;
  }
}

// Inicia la vigilancia de inactividad. Llama a onTimeout() cuando se supera
// el límite. Devuelve una función de limpieza para detener la vigilancia.
export function startIdleWatch(onTimeout) {
  markActivity();

  let timer = null;

  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(check, IDLE_LIMIT_MS + 1000);
  };

  const check = () => {
    if (isSessionExpired()) {
      stop();
      onTimeout();
    } else {
      schedule(); // aún hay actividad reciente (p. ej. desde otra pestaña): reprogramar
    }
  };

  const onActivity = () => {
    markActivity();
    schedule();
  };

  // Al volver a la pestaña, verificar de inmediato (pudo expirar en segundo plano).
  const onVisibility = () => { if (document.visibilityState === 'visible') check(); };

  ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, onActivity, { passive: true }));
  document.addEventListener('visibilitychange', onVisibility);
  schedule();

  function stop() {
    if (timer) clearTimeout(timer);
    timer = null;
    ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, onActivity));
    document.removeEventListener('visibilitychange', onVisibility);
  }

  return stop;
}
