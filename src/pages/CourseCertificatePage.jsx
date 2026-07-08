import React from 'react'
import {
  useStore, nav, isRouteComplete, issueCourseCertificate, getCourseCertConfig,
} from '../store/store.jsx'
import { useMobile, LogoImg, CheckIc, Btn } from '../components/ui.jsx'
// =============================================
// EXPERIA — Certificado de curso personalizado
// A diferencia del certificado DCE (Grid.jsx), no depende de una Entrega
// Final calificada: se emite solo con completar el 100% de la ruta. El
// contenido (título, texto de logro, firmante) lo define el tutor desde el
// Editor de Ruta (personalización del curso) — ver 0037_course_certificates.sql.
// =============================================

const PROD_BASE = 'https://experia-app.pages.dev'

const DEFAULT_ACHIEVEMENT_TEXT = 'ha completado satisfactoriamente la formación docente en'
const DEFAULT_SIGNATORY_ROLE = 'CEINFES · Experia'

const CourseCertificatePage = () => {
  const isMobile = useMobile()
  const user = useStore(s => s.user)
  const completed = useStore(s => s.completed)
  const courseModules = useStore(s => s.courseModules)
  const courses = useStore(s => s.courses)
  const enrolledCourseId = useStore(s => s.enrolledCourseId)
  const effectiveCourseId = useStore(s => s.effectiveCourseId)

  const courseId = effectiveCourseId || enrolledCourseId
  const courseRow = React.useMemo(() => (courses || []).find(c => c.id === courseId), [courses, courseId])
  const certConfig = React.useMemo(() => getCourseCertConfig(courses, courseRow), [courses, courseRow])
  const routeComplete = courseModules.length > 0 && isRouteComplete(completed, null, courseModules)

  const [cert, setCert] = React.useState(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    if (!courseId || !certConfig.enabled || !routeComplete) { setLoading(false); return }
    issueCourseCertificate(courseId, user?.name, certConfig).then(data => {
      if (data) setCert(data)
      setLoading(false)
    })
  }, [courseId, certConfig.enabled, routeComplete])

  if (!courseId || !certConfig.enabled) {
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: 40, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Este curso no tiene certificado habilitado.</p>
        <Btn variant="secondary" onClick={() => nav('map')}>Volver al mapa</Btn>
      </div>
    )
  }

  if (!routeComplete) {
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 16 }}>
          Completa el 100% de tu ruta para obtener el certificado.
        </p>
        <Btn variant="secondary" onClick={() => nav('map')}>Volver al mapa</Btn>
      </div>
    )
  }

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>Generando certificado…</div>
  }

  const title = certConfig.title || certConfig._displayName || 'Curso'
  const achievementText = certConfig.achievementText || DEFAULT_ACHIEVEMENT_TEXT
  const signatoryName = certConfig.signatoryName || 'Instructor'
  const signatoryRole = certConfig.signatoryRole || DEFAULT_SIGNATORY_ROLE
  const certUrl = cert ? `${PROD_BASE}/#/cert/${cert.cert_uuid}` : null
  const dateStr = new Date(cert?.issued_at || Date.now()).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '16px 12px 48px' : '32px 24px 60px', background: 'var(--bg)' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 portrait; margin: 0; }
        @media print {
          html, body { height: auto !important; overflow: visible !important; margin: 0 !important; }
          .no-print { display: none !important; }
          #cert-wrap { padding: 12mm !important; max-width: 100% !important; box-sizing: border-box; }
          #course-certificate { box-shadow: none !important; width: 100% !important; max-width: 100% !important;
            border-width: 6px !important; border-radius: 16px !important; padding: 28px 36px !important;
            page-break-inside: avoid; break-inside: avoid; }
        }
      ` }} />
      <div id="cert-wrap" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? 16 : 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 2 }}>🎓 ¡Ruta completada!</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: certUrl ? 8 : 0 }}>Descarga o imprime tu certificado.</p>
            {certUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11, color: 'var(--subtle)' }}>Enlace de verificación:</span>
                <a href={certUrl} target="_blank" rel="noreferrer"
                  style={{ fontSize: 11, color: 'var(--orange)', fontWeight: 600, wordBreak: 'break-all' }}>
                  {certUrl.replace('https://', '')}
                </a>
                <button onClick={() => navigator.clipboard?.writeText(certUrl)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 2 }}
                  title="Copiar enlace">📋</button>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn variant="secondary" size="sm" onClick={() => nav('map')}>Volver al mapa</Btn>
            <Btn variant="gradient" size="sm" onClick={() => window.print()}>🖨️ Imprimir</Btn>
          </div>
        </div>

        <div id="course-certificate" style={{ background: 'white', border: isMobile ? '5px solid var(--orange)' : '8px solid var(--orange)',
          borderRadius: isMobile ? 16 : 24, padding: isMobile ? '28px 18px' : '40px 56px', textAlign: 'center',
          position: 'relative', boxShadow: 'var(--sh-xl)' }}>
          <div style={{ position: 'absolute', inset: 10, border: '2px solid #FADCBE', borderRadius: 16, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 24 }}>
            <LogoImg h={44} />
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Experia · Formación Docente</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: 'var(--orange)', marginBottom: 12 }}>Certificado de Formación Docente</div>
          <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.2, marginBottom: 8 }}>{title}</h1>
          <div style={{ width: 80, height: 4, background: 'var(--gradient)', borderRadius: 2, margin: '0 auto 24px' }} />
          <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>Este certificado acredita que</p>
          <div style={{ fontSize: isMobile ? 26 : 40, fontWeight: 800, color: 'var(--dark)', marginBottom: 12, lineHeight: 1.2, padding: '0 8px' }}>{user?.name}</div>
          <p style={{ fontSize: 15, color: 'var(--text-sec)', marginBottom: 32, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 32px' }}>
            {achievementText}<br /><strong>{title}</strong>
          </p>
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 8 }}>
            {[
              { label: dateStr, sub: 'Fecha de expedición' },
              { label: signatoryName, sub: signatoryRole },
            ].map((sig, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--dark)', fontWeight: 600, marginBottom: 10 }}>{sig.label}</div>
                <div style={{ width: 200, height: 1, background: 'var(--border)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sig.sub}</div>
              </div>
            ))}
          </div>
          {cert && (
            <div style={{ borderTop: '1px solid var(--bg-alt)', paddingTop: 16, marginTop: 24, display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              <CheckIc s={13} c="var(--success)" />
              <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>ID: {cert.cert_uuid}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CourseCertificatePage
