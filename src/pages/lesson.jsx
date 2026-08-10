import React from 'react'
import {
  useStore, nav, completeNode, findModule, findModuleInConfig, AREAS, BADGES, LEVELS,
  getStudentModules, nodeStatus, isBlockedByPresence, calcLevel, getActiveCourseTheme, reactCharacter, isRouteComplete,
} from '../store/store.jsx'
import ThemeCelebration from '../components/ThemeCelebration.jsx'
import {
  useMobile, LogoImg,
  HomeIc, BookIc, GameIc, FileIc, UserIc, LockIc, CheckIc, PlayIc,
  ArrowRIc, ArrowLIc, ChevRIc, StarIc, TrophyIc, ZapIc, AwardIc, BellIc,
  LogOutIc, ClockIc, XIc, PlusIc, TrashIc, EditIc, MenuIc, TargetIc,
  SettingsIc, BarIc, UsersIc, GripIc, MapIc, SchoolIc, UploadIc,
  Btn, ProgressRing, ProgressBar, AnimNum, Confetti, NotifManager,
  Modal, BadgeCard, StatChip, Stagger, PresenceGate,
} from '../components/ui.jsx'
// =============================================
// EXPERIA — Lesson Viewer
// =============================================

// Ancho/alto opcionales de imágenes y del visor de PDF: el autor escribe "640",
// "80%" o "40rem" y aquí se normaliza. Un número pelado se interpreta en px, que
// es lo que espera quien escribe "600" en el editor. Vacío → null (el llamador
// decide el valor por defecto).
const cssSize = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const s = String(v).trim();
  return /^\d+(\.\d+)?$/.test(s) ? `${s}px` : s;
};

// Divide `content` en páginas usando las secciones `{type:'pagebreak'}` como
// separador. Sin ningún salto (el caso de casi todas las lecciones publicadas
// hasta ahora) devuelve un único grupo con todo el contenido — pagination
// queda desactivada y el módulo se comporta exactamente como antes.
export const splitContentPages = (content) => {
  const pages = [[]];
  (content || []).forEach(sec => {
    if (sec.type === 'pagebreak') { pages.push([]); return; }
    pages[pages.length - 1].push(sec);
  });
  return pages;
};

// Visor de PDF incrustado. Alternativa a subir un documento largo como imagen
// gigante: el estudiante lo lee con el visor nativo del navegador (zoom, buscar,
// paginar) sin salir de la lección.
// ⚠️ En móvil NO se incrusta: iOS Safari y varios Android muestran un marco en
// blanco o solo la primera página. Ahí se ofrece la tarjeta con el botón para
// abrirlo, que es lo que sí funciona en todos.
const PdfSection = ({ section, delay }) => {
  const isMobile = useMobile();
  const [expanded, setExpanded] = React.useState(false);

  // Cerrar la vista ampliada con Escape y bloquear el scroll de la página
  // detrás mientras está abierta.
  React.useEffect(() => {
    if (!expanded) return;
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [expanded]);

  if (!section.url) return null;
  const width  = cssSize(section.width) || '100%';
  const height = cssSize(section.height) || '720px';
  const name   = section.filename || 'Documento PDF';

  // Lo decide quien arma la ruta. `undefined` = permitido, para no cambiarle el
  // comportamiento a los PDF que ya estén publicados.
  // ⚠️ Esto NO es un control de seguridad: el archivo vive en un bucket público
  // y quien tenga la URL puede bajarlo. `#toolbar=0` esconde la barra del visor
  // de Chrome/Edge (Firefox la respeta solo a medias). Es un freno para el uso
  // normal, no una protección real — para eso habría que servir el archivo con
  // URLs firmadas y de corta vida.
  const allowDownload = section.allowDownload !== false;
  const viewerSrc = allowDownload ? section.url : `${section.url}#toolbar=0&navpanes=0`;

  const OpenBtn = ({ full }) => (
    <a href={section.url} target="_blank" rel="noopener noreferrer"
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '10px 16px', borderRadius: 10, background: 'var(--orange)', color: '#fff',
        fontSize: 13.5, fontWeight: 700, textDecoration: 'none', width: full ? '100%' : 'auto' }}>
      Abrir el PDF ↗
    </a>
  );

  const ExpandBtn = () => (
    <button type="button" onClick={() => setExpanded(true)} title="Ver en grande"
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontFamily: 'var(--font)', fontSize: 12, fontWeight: 700, color: 'var(--orange)' }}>
      ⛶ Ampliar
    </button>
  );

  const Restricted = () => (
    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)' }} title="El tutor no habilitó la descarga de este material">
      🔒 Material restringido
    </span>
  );

  const Viewer = ({ h, radius }) => (
    // <object> con contenido de respaldo: si el navegador no tiene visor de PDF,
    // cae a un mensaje en vez de dejar un marco vacío.
    <object data={viewerSrc} type="application/pdf"
      style={{ display: 'block', width: '100%', height: h,
        border: '1px solid var(--border)', borderRadius: radius, background: 'var(--bg-alt)' }}>
      <div style={{ padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 13.5, color: 'var(--muted)', margin: '0 0 12px' }}>
          Tu navegador no puede mostrar el documento aquí.
        </p>
        {allowDownload && <OpenBtn />}
      </div>
    </object>
  );

  return (
    <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
      {section.title && (
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
      )}

      {isMobile ? (
        <div style={{ padding: '20px 18px', borderRadius: 14, background: 'var(--white)',
          border: '1px solid var(--border)', textAlign: 'center' }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>📕</div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', margin: '0 0 4px' }}>{name}</p>
          <p style={{ fontSize: 12.5, color: 'var(--muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
            {allowDownload
              ? 'Se abre en el visor de tu teléfono.'
              : 'Material restringido: ábrelo para leerlo, pero no lo compartas.'}
          </p>
          <OpenBtn full />
        </div>
      ) : (
        <div style={{ width, maxWidth: '100%', marginInline: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            padding: '8px 12px', borderRadius: '14px 14px 0 0', background: 'var(--bg-alt)',
            border: '1px solid var(--border)', borderBottom: 'none' }}>
            <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-sec)', flex: 1,
              minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📕 {name}
            </span>
            <ExpandBtn />
            {allowDownload ? (
              <a href={section.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 700, color: 'var(--orange)', textDecoration: 'none' }}>
                Abrir en pestaña nueva ↗
              </a>
            ) : <Restricted />}
          </div>
          <Viewer h={height} radius="0 0 14px 14px" />
        </div>
      )}

      {section.caption && (
        <p style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center', marginTop: 10 }}>{section.caption}</p>
      )}

      {/* ── Vista ampliada ── */}
      {expanded && (
        <div onClick={() => setExpanded(false)}
          // z-index 6000: por encima de los modales (5000 en ui.jsx) para que
          // "Ampliar" también funcione dentro de la vista previa del editor de
          // ruta, que renderiza la lección dentro de un modal.
          style={{ position: 'fixed', inset: 0, zIndex: 6000, background: 'rgba(0,0,0,.82)',
            display: 'flex', flexDirection: 'column', padding: 'clamp(8px, 2vh, 24px)' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', flex: 1, minWidth: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              📕 {name}
            </span>
            {allowDownload && (
              <a href={section.url} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12.5, fontWeight: 700, color: '#fff', textDecoration: 'none', opacity: .85 }}>
                Abrir en pestaña nueva ↗
              </a>
            )}
            <button type="button" onClick={() => setExpanded(false)} aria-label="Cerrar"
              style={{ background: 'rgba(255,255,255,.14)', border: 'none', cursor: 'pointer',
                color: '#fff', borderRadius: 8, padding: '6px 12px', fontFamily: 'var(--font)',
                fontSize: 12.5, fontWeight: 700 }}>
              ✕ Cerrar
            </button>
          </div>
          <div onClick={e => e.stopPropagation()} style={{ flex: 1, minHeight: 0 }}>
            <Viewer h="100%" radius="10px" />
          </div>
        </div>
      )}
    </div>
  );
};

// Tarjeta de evidencia: click para revelar contenido oculto
const RevealSection = ({ section, delay }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
      {section.title && (
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        className={`ls-reveal-trigger${open ? ' open' : ''}`}
        aria-expanded={open}
      >
        <span className="ls-reveal-icon">{open ? '🔓' : (section.icon || '🔒')}</span>
        <span className="ls-reveal-label">{open ? (section.openLabel || 'Ocultar') : (section.label || 'Revelar contenido')}</span>
        <span className="ls-reveal-arrow">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="ls-reveal-body">
          {section.items?.map((item, i) => (
            <div key={i} className="ls-reveal-item" style={{ animationDelay: `${i * 60}ms` }}>
              {item.t && <div className="ls-reveal-item-title">{item.t}</div>}
              {item.d && <div className="ls-reveal-item-desc">{item.d}</div>}
            </div>
          ))}
          {section.text && <p className="ls-reveal-text">{section.text}</p>}
        </div>
      )}
    </div>
  );
};

// Checklist de pasos marcable — estado solo en memoria (no se guarda progreso;
// se reinicia si el estudiante recarga o vuelve a la lección).
const ChecklistSection = ({ section, delay }) => {
  const [checked, setChecked] = React.useState({});
  const toggle = (i) => setChecked(c => ({ ...c, [i]: !c[i] }));
  return (
    <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
      {section.title && (
        <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: section.desc ? 8 : 16 }}>{section.title}</h3>
      )}
      {section.desc && (
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>{section.desc}</p>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {(section.items || []).map((item, i) => {
          const done = !!checked[i];
          return (
            <button key={i} onClick={() => toggle(i)} type="button"
              style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 12,
                border: `1.5px solid ${done ? 'var(--success)' : 'var(--border)'}`,
                background: done ? 'var(--success-bg)' : 'var(--white)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font)', transition: 'all .15s', width: '100%' }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${done ? 'var(--success)' : 'var(--border)'}`,
                background: done ? 'var(--success)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done && <CheckIc s={13} c="#fff" />}
              </span>
              <span style={{ fontSize: 14, color: done ? 'var(--muted)' : 'var(--dark)', fontWeight: 500,
                textDecoration: done ? 'line-through' : 'none', lineHeight: 1.5 }}>{item.t}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const LessonSection = React.memo(({ section, index }) => {
  const delay = index * 60;
  const isMobile = useMobile();

  if (section.type === 'intro') {
    return (
      <div style={{ marginBottom: 32, animation: `fadeUp .45s ${delay}ms ease both` }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--dark)', marginBottom: 14, lineHeight: 1.3 }}>
          {section.title}
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text-sec)', lineHeight: 1.8 }}>{section.text}</p>
      </div>
    );
  }

  if (section.type === 'callout') {
    return (
      <div style={{
        margin: '28px 0', padding: '20px 24px', borderRadius: 14,
        background: 'var(--purple-bg)', borderLeft: '4px solid var(--purple)',
        animation: `fadeUp .45s ${delay}ms ease both`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 20 }}>{section.icon || '💡'}</span>
          <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--purple-deep)' }}>{section.title}</h4>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7 }}>{section.text}</p>
      </div>
    );
  }

  if (section.type === 'concepts') {
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>{section.title}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {section.items.map((item, i) => (
            <div key={i} style={{
              padding: '18px 20px', borderRadius: 14, border: '1px solid var(--border)',
              background: 'var(--white)', transition: 'all .2s',
              animation: `fadeUp .4s ${delay + i * 60}ms ease both`,
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--orange-pale)'; e.currentTarget.style.boxShadow = 'var(--sh-md)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
              <h5 style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange)', marginBottom: 6 }}>{item.t}</h5>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>{item.d}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'text') {
    return (
      <div style={{ margin: '28px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
        <p style={{ fontSize: 15, color: 'var(--text-sec)', lineHeight: 1.8 }}>{section.text}</p>
      </div>
    );
  }

  if (section.type === 'video') {
    const videoId = section.url?.includes('youtube.com/watch?v=')
      ? section.url.split('v=')[1]?.split('&')[0]
      : section.url?.includes('youtu.be/')
        ? section.url.split('youtu.be/')[1]?.split('?')[0]
        : section.url;
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        {section.title && (
          <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
        )}
        {section.desc && (
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>{section.desc}</p>
        )}
        <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--sh-lg)' }}>
          <iframe
            key={videoId}
            src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
            title={section.title || 'Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    );
  }

  if (section.type === 'embed') {
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        {section.title && (
          <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
        )}
        {section.desc && (
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16, lineHeight: 1.6 }}>{section.desc}</p>
        )}
        <div style={{ position: 'relative', paddingBottom: section.ratio || '56.25%', height: 0, borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--sh-lg)' }}>
          <iframe
            src={section.url}
            title={section.title || 'Recurso interactivo'}
            allow="fullscreen"
            allowFullScreen
            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    );
  }

  if (section.type === 'image') {
    // Encuadre: con alto explícito se muestra la imagen COMPLETA (contain) — es
    // el caso de los documentos altos, donde recortar es justo lo que estorba.
    // Sin alto se conserva el comportamiento histórico (cover a 420 px), para no
    // cambiarle el aspecto a las lecciones ya publicadas.
    const hasHeight = !!section.height;
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        {section.title && (
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
        )}
        <div className="ls-image-wrap" style={{ width: cssSize(section.width) || '100%', maxWidth: '100%', marginInline: 'auto' }}>
          <img
            src={section.url}
            alt={section.caption || section.title || ''}
            style={{ width: '100%', borderRadius: 14, display: 'block',
              boxShadow: 'var(--sh-lg)',
              objectFit: hasHeight ? 'contain' : 'cover',
              background: hasHeight ? 'var(--bg-alt)' : undefined,
              maxHeight: cssSize(section.height) || 420 }}
          />
          {section.caption && (
            <p className="ls-image-caption">{section.caption}</p>
          )}
          {/* Sello EVIDENCIA en tema detective — via CSS */}
          <div className="ls-image-badge" aria-hidden="true" />
        </div>
      </div>
    );
  }

  if (section.type === 'pdf') return <PdfSection section={section} delay={delay} />;

  if (section.type === 'download') {
    const sizeLabel = section.filesize
      ? section.filesize < 1024 * 1024
        ? Math.round(section.filesize / 1024) + ' KB'
        : (section.filesize / (1024 * 1024)).toFixed(1) + ' MB'
      : null;
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        {section.title && (
          <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 12 }}>{section.title}</h3>
        )}
        {section.desc && (
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14, lineHeight: 1.6 }}>{section.desc}</p>
        )}
        <a href={section.url} download={section.filename || true} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 14,
            background: 'var(--white)', border: '1.5px solid var(--border)', textDecoration: 'none', boxShadow: 'var(--sh-sm)' }}>
          <span style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--orange-bg)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {section.filename || 'Descargar material'}
            </div>
            {sizeLabel && <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sizeLabel}</div>}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--orange)', flexShrink: 0 }}>Descargar ⬇</span>
        </a>
      </div>
    );
  }

  if (section.type === 'quote') {
    return (
      <div className="ls-quote" style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        <span className="ls-quote-mark">"</span>
        <blockquote className="ls-quote-text">{section.text}</blockquote>
        {section.author && (
          <cite className="ls-quote-author">— {section.author}</cite>
        )}
      </div>
    );
  }

  if (section.type === 'steps') {
    return (
      <div style={{ margin: '36px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        {section.title && (
          <h3 className="ls-steps-title" style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 24 }}>{section.title}</h3>
        )}
        <div className="ls-steps">
          {(section.items || []).map((item, i) => (
            <div key={i} className="ls-step" style={{ animationDelay: `${delay + i * 120}ms` }}>
              <div className="ls-step-rail" aria-hidden="true">
                <div className="ls-step-node">
                  <span className="ls-step-icon">{item.icon || '•'}</span>
                  <span className="ls-step-index">{i + 1}</span>
                </div>
              </div>
              <div className="ls-step-body">
                {item.t && <div className="ls-step-title">{item.t}</div>}
                {item.d && <div className="ls-step-desc">{item.d}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (section.type === 'reveal') {
    return <RevealSection section={section} delay={delay} />;
  }

  if (section.type === 'checklist') {
    return <ChecklistSection section={section} delay={delay} />;
  }

  if (section.type === 'compare') {
    return (
      <div style={{ margin: '32px 0', animation: `fadeUp .45s ${delay}ms ease both` }}>
        <h3 style={{ fontSize: 19, fontWeight: 700, color: 'var(--dark)', marginBottom: 6 }}>{section.title}</h3>
        <span style={{ fontSize: 12, color: 'var(--subtle)', fontWeight: 500, display: 'block', marginBottom: 16 }}>
          {section.label}
        </span>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
          <div style={{
            padding: '18px 20px', borderRadius: 14, background: 'var(--error-bg)',
            border: '1px solid #FECACA',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 8 }}>Enfoque Tradicional</div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>{section.trad}</p>
          </div>
          <div style={{
            padding: '18px 20px', borderRadius: 14, background: 'var(--success-bg)',
            border: '1px solid #99F6E4',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--success)', textTransform: 'uppercase',
              letterSpacing: 1, marginBottom: 8 }}>Enfoque DCE</div>
            <p style={{ fontSize: 13, color: 'var(--text-sec)', lineHeight: 1.6 }}>{section.dce}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
});

// ─── Cuerpo de la lección: hero + tarea + secciones + extras ───
// Es EXACTAMENTE lo que ve el estudiante. Se reutiliza en LessonView y en la
// vista previa del instructor para que el preview sea fiel al 100%.
//
// `page` es OPCIONAL: sin él (previews, clase en vivo, etc.) se renderiza todo
// el contenido de corrido, tal como siempre — así ningún llamador existente
// cambia de comportamiento. LessonView sí lo pasa: ahí `mod.content` puede
// venir partido en páginas por marcadores `{type:'pagebreak'}` (ver
// `splitContentPages`), y solo se pinta la página activa. Hero/tarea van
// únicamente en la primera página y los extras del instructor en la última,
// para no repetirlos en cada pantalla.
export const LessonBody = ({ mod, page }) => {
  const pages = splitContentPages(mod.content);
  const paginated = page !== undefined && pages.length > 1;
  const sections = paginated ? (pages[page] || []) : (mod.content || []).filter(s => s.type !== 'pagebreak');
  const showIntro = !paginated || page === 0;
  const showExtras = !paginated || page === pages.length - 1;

  return (
  <>
    {/* Hero */}
    {showIntro && (
    <div style={{
      padding: '32px 28px', borderRadius: 16, background: 'var(--gradient)',
      marginBottom: 36, animation: 'fadeUp .5s ease',
    }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.6)',
        textTransform: 'uppercase', letterSpacing: 1.5 }}>{mod.subtitle}</span>
      <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', marginTop: 6 }}>{mod.title}</h1>
      <p style={{ fontSize: 14, color: 'rgba(255,255,255,.75)', marginTop: 8 }}>{mod.desc}</p>
    </div>
    )}

    {/* Task instruction */}
    {showIntro && mod.task && (
      <div className="ls-task-box" style={{ marginBottom: 28, animation: 'fadeUp .4s ease' }}>
        <span style={{ fontSize: 22, flexShrink: 0 }}>📋</span>
        <div>
          <div className="ls-task-label" style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>¿Qué debes hacer?</div>
          <p className="ls-task-text" style={{ fontSize: 14, lineHeight: 1.6, margin: 0 }}>{mod.task}</p>
        </div>
      </div>
    )}

    {/* Sections */}
    {sections.map((sec, i) => <LessonSection key={i} section={sec} index={i} />)}

    {/* Extras added by instructor */}
    {showExtras && mod.extras?.length > 0 && (
      <div style={{ margin: '32px 0', padding: '20px 24px', borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>📎</span> Recursos adicionales del instructor
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mod.extras.map((extra, i) => {
            if (extra.type === 'video') {
              const videoId = extra.url?.includes('youtube.com/watch?v=')
                ? extra.url.split('v=')[1]?.split('&')[0]
                : extra.url?.includes('youtu.be/')
                  ? extra.url.split('youtu.be/')[1]?.split('?')[0]
                  : extra.url;
              return (
                <div key={i}>
                  {extra.title && <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>{extra.title}</h4>}
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--sh-md)' }}>
                    <iframe key={videoId} src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                      title={extra.title || 'Video'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                  </div>
                </div>
              );
            }
            if (extra.type === 'embed') {
              return (
                <div key={i}>
                  {extra.title && <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 8 }}>{extra.title}</h4>}
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, borderRadius: 12, overflow: 'hidden', boxShadow: 'var(--sh-md)' }}>
                    <iframe src={extra.url} title={extra.title || 'Recurso interactivo'} allow="fullscreen"
                      allowFullScreen style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                  </div>
                </div>
              );
            }
            return (
              <div key={i} style={{ padding: '14px 18px', borderRadius: 12, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                {extra.title && <h4 style={{ fontSize: 14, fontWeight: 600, color: '#92400E', marginBottom: 6 }}>{extra.title}</h4>}
                <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.7, margin: 0 }}>{extra.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    )}
  </>
  );
};

const LessonView = () => {
  const nodeId = useStore(s => s.nodeId);
  const completed = useStore(s => s.completed);
  const selectedArea = useStore(s => s.selectedArea);
  const unlockedPresence = useStore(s => s.unlockedPresenceModules);
  const enrolledCourseId = useStore(s => s.enrolledCourseId);
  const courseModules = useStore(s => s.courseModules);
  const isMobile = useMobile();
  const mod = findModule(nodeId) || findModuleInConfig(nodeId);
  const [progress, setProgress] = React.useState(0);
  const [done, setDone] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(false);
  const [pageIdx, setPageIdx] = React.useState(0);
  const scrollRef = React.useRef(null);

  const isCompleted = completed.includes(nodeId);

  // Módulos multipágina: `content` viene partido por marcadores `pagebreak`.
  // Sin ninguno (la inmensa mayoría), `pages.length===1` y todo el bloque de
  // paginación queda desactivado — se comporta exactamente como antes.
  const pages = splitContentPages(mod?.content);
  const isPaginated = pages.length > 1;
  const isLastPage = pageIdx === pages.length - 1;

  React.useEffect(() => {
    setProgress(0); setDone(false); setPageIdx(0);
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    // El personaje del tema saluda con la línea del módulo (si la tiene).
    reactCharacter('lessonIntro', mod?.characterLine);
  }, [nodeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Track scroll progress — solo aplica a módulos de una sola página. En un
  // módulo paginado el criterio de "leído" es haber llegado a la última
  // página (ver efecto de abajo), no el scroll de cada pantalla.
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el || isPaginated) return;
    const handler = () => {
      const scrollable = el.scrollHeight - el.clientHeight;
      // Contenido corto que ya cabe entero en pantalla (sin necesidad de
      // scroll) — no dividir por cero: se considera leído de inmediato,
      // si no, el botón "Completar lección" nunca se habilitaría.
      if (scrollable <= 0) { setProgress(100); setDone(true); return; }
      const pct = el.scrollTop / scrollable * 100;
      setProgress(Math.min(100, Math.round(pct)));
      if (pct > 85) setDone(true);
    };
    handler(); // corre una vez al montar, por si el contenido ya cabe sin scroll
    el.addEventListener('scroll', handler);
    return () => el.removeEventListener('scroll', handler);
  }, [nodeId, isPaginated]);

  // Progreso y gate de completar por página: llegar a la última página basta
  // (no exige volver a hacer scroll dentro de ella).
  React.useEffect(() => {
    if (!isPaginated) return;
    setProgress(Math.round(((pageIdx + 1) / pages.length) * 100));
    setDone(isLastPage);
  }, [pageIdx, isPaginated, isLastPage, pages.length]);

  const gotoPage = (idx) => {
    setPageIdx(p => {
      const next = Math.max(0, Math.min(pages.length - 1, idx));
      return next === p ? p : next;
    });
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  };

  const courseTheme = getActiveCourseTheme();

  const handleComplete = () => {
    let routeNowComplete = false;
    if (!isCompleted) {
      const res = completeNode(nodeId);
      setShowConfetti(true);
      const newCompleted = [...completed, nodeId];
      routeNowComplete = isRouteComplete(newCompleted, selectedArea);
      // Prioridad: fin de ruta > insignia nueva > módulo completado. Los tres
      // momentos tienen guión propio, y solo puede sonar uno.
      reactCharacter(routeNowComplete ? 'routeComplete' : res?.badge ? 'badge' : 'moduleComplete');
    }
    setTimeout(() => nav(routeNowComplete ? 'grid' : 'map'), courseTheme ? 2300 : 1500);
  };

  if (!mod || !mod.content) {
    return <div style={{ padding: 40, textAlign: 'center' }}>
      <p style={{ color: 'var(--muted)' }}>Contenido no disponible</p>
      <Btn variant="secondary" onClick={() => nav('map')} style={{ marginTop: 16 }}>
        <ArrowLIc s={16} /> Volver al mapa
      </Btn>
    </div>;
  }

  if (mod.requiresPresenceCode && !isCompleted && !unlockedPresence.includes(nodeId)) {
    return <PresenceGate mod={mod} nodeId={nodeId} />;
  }

  // Bloqueo "de ahí en adelante": si un paso anterior con código presencial aún
  // no se desbloqueó, este módulo (aunque se abra por enlace directo) queda cerrado.
  if (isBlockedByPresence(nodeId, completed, selectedArea, enrolledCourseId ? courseModules : null, unlockedPresence || [])) {
    return (
      <div style={{ padding: 40, textAlign: 'center', maxWidth: 380, margin: '0 auto' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--orange-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <LockIc s={26} c="var(--orange)" />
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 800, color: 'var(--dark)', marginBottom: 6 }}>Paso bloqueado</h3>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 20 }}>
          Antes de este contenido hay un paso que tu profe debe habilitar en clase con un código. Vuelve al mapa y desbloquéalo primero.
        </p>
        <Btn variant="primary" full onClick={() => nav('map')}>Volver al mapa</Btn>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {showConfetti && (courseTheme
        ? <ThemeCelebration theme={courseTheme} onDone={() => setShowConfetti(false)} />
        : <Confetti onDone={() => setShowConfetti(false)} />)}

      {/* Top progress bar */}
      <div style={{ height: 3, background: 'var(--border)', flexShrink: 0 }}>
        <div style={{ height: '100%', background: 'var(--orange)', width: progress + '%',
          transition: 'width .3s ease', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '12px 16px' : '14px 28px', borderBottom: '1px solid var(--border)', flexShrink: 0,
        background: 'var(--white)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => nav('map')} style={{
            background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}><ArrowLIc s={18} c="var(--text)" /></button>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--orange)', textTransform: 'uppercase',
              letterSpacing: 1 }}>{mod.subtitle}</span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>{mod.title}</h3>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--muted)' }}>+{mod.xp} XP</span>
        </div>
      </div>

      {/* Content */}
      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '20px 16px' : '32px 28px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <LessonBody mod={mod} page={isPaginated ? pageIdx : undefined} />

          {/* Navegación entre páginas */}
          {isPaginated && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 12, margin: '32px 0 8px' }}>
              <Btn variant="secondary" onClick={() => gotoPage(pageIdx - 1)} disabled={pageIdx === 0}>
                <ArrowLIc s={16} /> Anterior
              </Btn>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
                Página {pageIdx + 1} de {pages.length}
              </span>
              {isLastPage
                ? <div style={{ width: 108 }} />
                : (
                  <Btn variant="primary" onClick={() => gotoPage(pageIdx + 1)}>
                    Siguiente <ArrowRIc s={16} />
                  </Btn>
                )}
            </div>
          )}

          {/* Completion — en módulos paginados solo aparece en la última página;
              antes de eso el botón "Siguiente" de arriba ya guía el avance. */}
          {(!isPaginated || isLastPage) && (
          <div style={{
            marginTop: 48, padding: '32px', borderRadius: 16, textAlign: 'center',
            background: done || isCompleted ? '#F0FDFA' : 'var(--bg-alt)',
            border: done || isCompleted ? '2px solid #99F6E4' : '1px solid var(--border)',
            animation: 'fadeUp .4s ease both',
          }}>
            {isCompleted ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>
                  ¡Lección completada!
                </h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
                  Ya has completado esta lección. Puedes revisarla cuando quieras.
                </p>
                <Btn variant="secondary" onClick={() => nav('map')}>
                  Volver al mapa <ArrowRIc s={16} />
                </Btn>
              </>
            ) : done ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)', marginBottom: 8 }}>
                  ¡Has llegado al final!
                </h3>
                <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
                  Completa esta lección para ganar {mod.xp} XP y desbloquear el siguiente reto.
                </p>
                <Btn variant="gradient" size="lg" onClick={handleComplete}>
                  Completar lección <CheckIc s={18} c="#fff" />
                </Btn>
              </>
            ) : (
              <>
                <div style={{ fontSize: 28, marginBottom: 10 }}>📖</div>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>
                  Desplázate para leer todo el contenido y desbloquear el botón de completar.
                </p>
                <ProgressBar pct={progress} h={6} color="var(--orange)" />
                <span style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 6, display: 'block' }}>
                  {progress}% leído
                </span>
              </>
            )}
          </div>
          )}
          <div style={{ height: 80 }} />
        </div>
      </div>
    </div>
  );
};

export default LessonView;
