import React from 'react'
import { LogoImg } from './ui.jsx'

// Tarjeta visual del certificado de curso, en formato HORIZONTAL (apaisado).
// Compartida por CourseCertificatePage, la página pública de verificación y la
// vista previa del editor, para que todo se vea idéntico.
//
// Props: title, achievementText, hours (número|null), studentName, dateStr,
// certUuid (opcional), isMobile, idAttr.
const SERIF = "'Georgia', 'Times New Roman', serif"

// Esquinas ornamentales (marcos en L) del marco interior.
const Corner = ({ v, h }) => (
  <div style={{
    position: 'absolute', [v]: 26, [h]: 26, width: 26, height: 26, pointerEvents: 'none',
    borderTop: v === 'top' ? '2px solid var(--orange)' : 'none',
    borderBottom: v === 'bottom' ? '2px solid var(--orange)' : 'none',
    borderLeft: h === 'left' ? '2px solid var(--orange)' : 'none',
    borderRight: h === 'right' ? '2px solid var(--orange)' : 'none',
    borderTopLeftRadius: v === 'top' && h === 'left' ? 8 : 0,
    borderTopRightRadius: v === 'top' && h === 'right' ? 8 : 0,
    borderBottomLeftRadius: v === 'bottom' && h === 'left' ? 8 : 0,
    borderBottomRightRadius: v === 'bottom' && h === 'right' ? 8 : 0,
  }} />
)

const CertificateCard = ({
  isMobile, title, achievementText, hours, studentName, dateStr, certUuid, idAttr = 'course-certificate',
}) => {
  const hoursNum = Number(hours)
  const ach = achievementText || 'Por haber concluido de manera satisfactoria el'
  return (
    <div id={idAttr} style={{
      position: 'relative', overflow: 'hidden', textAlign: 'center',
      border: isMobile ? '5px solid var(--orange)' : '9px double var(--orange)',
      borderRadius: isMobile ? 16 : 18,
      padding: isMobile ? '26px 20px' : '3.5% 7%',
      boxShadow: '0 24px 60px rgba(232,115,44,.18)',
      background: 'linear-gradient(135deg, #FFFDFA 0%, #FFF6EC 55%, #FEEFE0 100%)',
      ...(isMobile ? {} : { aspectRatio: '297 / 210', display: 'flex', flexDirection: 'column', justifyContent: 'center' }),
    }}>
      {/* Resplandor sutil detrás del contenido */}
      <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)',
        width: '70%', height: '70%', borderRadius: '50%',
        background: 'radial-gradient(closest-side, rgba(240,152,72,.12), transparent)', pointerEvents: 'none' }} />
      {/* Marco interior fino */}
      <div style={{ position: 'absolute', inset: isMobile ? 10 : 16, border: '1.5px solid rgba(232,115,44,.35)',
        borderRadius: 12, pointerEvents: 'none' }} />
      {/* Esquinas ornamentales */}
      {!isMobile && [['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']].map(([v, h]) => (
        <Corner key={v + h} v={v} h={h} />
      ))}

      <div style={{ position: 'relative' }}>
        {/* Logos: CEINFES (izquierda) · Grupo de Investigación (derecha).
            LogoImg usa `h` como factor (ancho = h×5), no como altura. */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: isMobile ? 12 : 18 }}>
          <LogoImg h={isMobile ? 26 : 34} />
          <img src="/sello-grupo-investigacion.png" alt="CEINFES — Grupo de Investigación reconocido por Minciencias"
            style={{ height: isMobile ? 58 : 82, width: 'auto' }} />
        </div>

        {/* CERTIFICADO con líneas laterales */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: isMobile ? 8 : 12 }}>
          <span style={{ width: isMobile ? 26 : 48, height: 2, background: 'linear-gradient(90deg, transparent, var(--orange))' }} />
          <span style={{ fontFamily: SERIF, fontSize: isMobile ? 12 : 15, fontWeight: 700, letterSpacing: isMobile ? 5 : 9, color: 'var(--orange)', textTransform: 'uppercase' }}>Certificado</span>
          <span style={{ width: isMobile ? 26 : 48, height: 2, background: 'linear-gradient(90deg, var(--orange), transparent)' }} />
        </div>

        <div style={{ fontSize: isMobile ? 12 : 14, color: 'var(--muted)', marginBottom: isMobile ? 6 : 10 }}>Se otorga el presente certificado a</div>

        {/* Nombre del estudiante */}
        <div style={{ fontFamily: SERIF, fontSize: isMobile ? 26 : 44, fontWeight: 700, color: 'var(--dark)', lineHeight: 1.1, letterSpacing: .5, padding: '0 8px' }}>
          {studentName}
        </div>

        {/* Divisor ornamental */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, margin: isMobile ? '12px auto 16px' : '16px auto 22px' }}>
          <span style={{ width: isMobile ? 50 : 80, height: 1, background: 'linear-gradient(90deg, transparent, var(--orange-pale))' }} />
          <span style={{ color: 'var(--orange)', fontSize: 13 }}>◆</span>
          <span style={{ width: isMobile ? 50 : 80, height: 1, background: 'linear-gradient(90deg, var(--orange-pale), transparent)' }} />
        </div>

        {/* Texto de reconocimiento */}
        <p style={{ fontSize: isMobile ? 13.5 : 16.5, color: 'var(--text-sec)', lineHeight: 1.7, maxWidth: 780, margin: '0 auto', marginBottom: isMobile ? 22 : 34 }}>
          {ach} <strong style={{ color: 'var(--dark)' }}>{title}</strong>
          {hoursNum > 0 ? <> con una intensidad de <strong style={{ color: 'var(--dark)' }}>{hoursNum} horas</strong></> : null}.
        </p>

        {/* Fecha (izquierda) · Firma = logo CEINFES (derecha) */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 24, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: SERIF, fontSize: 15, color: 'var(--dark)', fontWeight: 600, marginBottom: 8 }}>{dateStr}</div>
            <div style={{ width: 200, height: 1.5, background: 'var(--orange-pale)', margin: '0 auto 7px' }} />
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Fecha de expedición</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 9 }}><LogoImg h={17} /></div>
            <div style={{ width: 200, height: 1.5, background: 'var(--orange-pale)', margin: '0 auto 7px' }} />
            <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Firma CEINFES</div>
          </div>
        </div>

        {certUuid && (
          <div style={{ marginTop: isMobile ? 16 : 22, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, color: 'var(--subtle)', fontFamily: 'monospace', wordBreak: 'break-all' }}>Verificación: {certUuid}</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default CertificateCard
