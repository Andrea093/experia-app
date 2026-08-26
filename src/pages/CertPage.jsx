import React from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useStore } from '../store/store.jsx'
import { useMobile, LogoImg, CheckIc, Skeleton } from '../components/ui.jsx'
import CertificateCard, { fichaCertificado } from '../components/CertificateCard.jsx'
// =============================================
// EXPERIA — Página pública de verificación de certificado
// Accesible sin autenticación: /#/cert/<cert_uuid>
// =============================================

const PROD_BASE = 'https://experia-app.pages.dev'

const AREA_META = {
  lectura:      { name: 'Lectura Crítica',   icon: '📖', color: '#E8732C' },
  ciudadanas:   { name: 'Competencias Ciudadanas', icon: '🌍', color: '#7C3AED' },
  ingles:       { name: 'Inglés',             icon: '🌐', color: '#0EA5E9' },
  matematicas:  { name: 'Matemáticas',        icon: '📐', color: '#10B981' },
  ciencias:     { name: 'Ciencias Naturales', icon: '🔬', color: '#F59E0B' },
}

const CertPage = () => {
  const nodeId = useStore(s => s.nodeId)
  const isMobile = useMobile()
  const [cert, setCert] = React.useState(null)
  const [loading, setLoading] = React.useState(true)
  const [notFound, setNotFound] = React.useState(false)

  React.useEffect(() => {
    if (!nodeId) { setNotFound(true); setLoading(false); return }
    supabase
      .from('certificates')
      .select('cert_uuid, student_name, area_id, score, max_score, issued_at, course_id, course_title, achievement_text, signatory_name, signatory_role, hours')
      .eq('cert_uuid', nodeId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('CertPage fetch:', error)
        if (data) setCert(data)
        else setNotFound(true)
        setLoading(false)
      })
  }, [nodeId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg, #F9FAFB)', flexDirection: 'column', gap: 24, padding: 32 }}>
        <LogoImg h={36} />
        <Skeleton h={320} r={20} style={{ width: '100%', maxWidth: 680 }} />
      </div>
    )
  }

  if (notFound) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg, #F9FAFB)', flexDirection: 'column', gap: 16, padding: 32, textAlign: 'center' }}>
        <LogoImg h={36} />
        <div style={{ fontSize: 56 }}>❌</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark, #111827)', margin: 0 }}>Certificado no encontrado</h2>
        <p style={{ fontSize: 14, color: 'var(--muted, #6B7280)', maxWidth: 340 }}>
          El enlace de verificación no es válido o el certificado fue revocado.
        </p>
        <a href={PROD_BASE} style={{ fontSize: 13, color: 'var(--orange, #E8732C)', fontWeight: 600 }}>
          Ir a Experia →
        </a>
      </div>
    )
  }

  const isCourseCert = !!cert.course_id
  const area = AREA_META[cert.area_id]
  const pct = cert.max_score > 0 ? Math.round((cert.score / cert.max_score) * 100) : null
  const dateStr = new Date(cert.issued_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })
  const certUrl = `${PROD_BASE}/#/cert/${cert.cert_uuid}`
  const courseTitle = cert.course_title || 'Curso'
  const achievementText = cert.achievement_text || 'ha completado satisfactoriamente la formación docente en'
  const signatoryName = cert.signatory_name || 'Instructor'
  const signatoryRole = cert.signatory_role || 'CEINFES · Experia'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #F9FAFB)', padding: isMobile ? '24px 16px 48px' : '40px 24px 60px' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: A4 landscape; margin: 0; }
        @media print {
          html, body { height: auto !important; overflow: visible !important; }
          .cert-no-print { display: none !important; }
          #cert-public { box-shadow: none !important; }
        }
      ` }} />

      <div style={{ maxWidth: isCourseCert ? 920 : 720, margin: '0 auto' }}>
        {/* Banner "Verificado" */}
        <div className="cert-no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px',
            borderRadius: 12, background: '#F0FDFA', border: '1.5px solid #5EEAD4' }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#134E4A' }}>Certificado verificado</div>
              <div style={{ fontSize: 11, color: '#0F766E' }}>Emitido por CEINFES</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => { navigator.clipboard?.writeText(certUrl); }}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid var(--border, #E5E7EB)',
                background: 'white', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                color: 'var(--text-sec, #6B7280)', fontFamily: 'inherit' }}>
              📋 Copiar enlace
            </button>
            <button onClick={() => window.print()}
              style={{ padding: '8px 14px', borderRadius: 8, border: 'none',
                background: 'var(--orange, #E8732C)', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                color: '#fff', fontFamily: 'inherit' }}>
              🖨️ Imprimir
            </button>
          </div>
        </div>

        {/* Certificado de curso: usa la MISMA tarjeta horizontal que la app */}
        {isCourseCert ? (
          <CertificateCard
            isMobile={isMobile}
            idAttr="cert-public"
            title={courseTitle}
            achievementText={achievementText}
            hours={cert.hours}
            studentName={cert.student_name}
            dateStr={dateStr}
            certUuid={cert.cert_uuid}
            {...fichaCertificado(cert.course_id)}
          />
        ) : (
        /* Certificado legacy por área (score/logro/DCE) */
        <div id="cert-public" style={{ background: 'white',
          border: isMobile ? '5px solid #E8732C' : '8px solid #E8732C',
          borderRadius: isMobile ? 16 : 24,
          padding: isMobile ? '28px 18px' : '40px 56px',
          textAlign: 'center', position: 'relative',
          boxShadow: '0 20px 60px rgba(0,0,0,.12)' }}>
          <div style={{ position: 'absolute', inset: 10, border: '2px solid #FADCBE', borderRadius: 16, pointerEvents: 'none' }} />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 20 : 44, marginBottom: 20 }}>
            <LogoImg h={isMobile ? 40 : 52} />
            <img src="/sello-grupo-investigacion.png" alt="CEINFES — Grupo de Investigación reconocido por Minciencias" style={{ height: isMobile ? 72 : 96, width: 'auto' }} />
          </div>

          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: '#E8732C', marginBottom: 12 }}>
            Certificado
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: '#111827', lineHeight: 1.2, marginBottom: 8 }}>
            Diseño Centrado en Evidencias
          </h1>
          <div style={{ width: 80, height: 4, background: 'linear-gradient(90deg,#E8732C,#F09848)', borderRadius: 2, margin: '0 auto 24px' }} />

          <p style={{ fontSize: 16, color: '#6B7280', marginBottom: 20, lineHeight: 1.6 }}>Este certificado acredita que</p>
          <div style={{ fontSize: isMobile ? 26 : 38, fontWeight: 800, color: '#111827', marginBottom: 12, lineHeight: 1.2, padding: '0 8px' }}>
            {cert.student_name}
          </div>
          <p style={{ fontSize: 15, color: '#374151', marginBottom: 20, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 20px' }}>
            ha completado satisfactoriamente la formación docente en<br />
            <strong>Diseño Centrado en Evidencias (DCE)</strong>
          </p>

          {area && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 24px',
              borderRadius: 100, background: area.color + '18', border: `2px solid ${area.color}40`, marginBottom: 24 }}>
              <span style={{ fontSize: 24 }}>{area.icon}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: area.color }}>Área: {area.name}</span>
            </div>
          )}

          {pct !== null && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: 0,
              marginBottom: 28, border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden',
              maxWidth: 360, margin: '0 auto 28px' }}>
              {[
                { label: 'Puntuación', value: `${cert.score}/${cert.max_score}`, color: '#0D9488' },
                { label: 'Logro',      value: `${pct}%`,                         color: '#E8732C' },
                { label: 'Programa',   value: 'DCE',                              color: '#7C3AED' },
              ].map((item, i, arr) => (
                <div key={item.label} style={{ flex: 1, textAlign: 'center', padding: '16px 10px',
                  borderRight: i < arr.length - 1 ? '1px solid #E5E7EB' : 'none', background: '#F9FAFB' }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>{item.label}</div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginBottom: 24 }}>
            {[
              { label: dateStr, sub: 'Fecha de expedición' },
              { label: 'Instructor', sub: 'CEINFES' },
            ].map((sig, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#111827', fontWeight: 600, marginBottom: 10 }}>{sig.label}</div>
                <div style={{ width: 180, height: 1, background: '#E5E7EB', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 11, color: '#9CA3AF' }}>{sig.sub}</div>
              </div>
            ))}
          </div>

          {/* ID de verificación */}
          <div style={{ borderTop: '1px solid #F3F4F6', paddingTop: 16, display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <CheckIc s={13} c="#0D9488" />
            <span style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace', wordBreak: 'break-all' }}>
              ID: {cert.cert_uuid}
            </span>
          </div>
        </div>
        )}

        {/* Pie: volver */}
        <div className="cert-no-print" style={{ textAlign: 'center', marginTop: 24 }}>
          <a href={PROD_BASE} style={{ fontSize: 13, color: '#E8732C', fontWeight: 600 }}>
            ← Ir a Experia by CEINFES
          </a>
        </div>
      </div>
    </div>
  )
}

export default CertPage
