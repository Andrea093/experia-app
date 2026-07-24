import React from 'react'
import { LogoImg, CheckIc } from './ui.jsx'

// Tarjeta visual del certificado de curso. Compartida por CourseCertificatePage
// (lo que ve/imprime el estudiante) y por la vista previa del editor de ruta,
// para que la previsualización sea IDÉNTICA al certificado real.
// Props: title, achievementText, hours (número|null), studentName, dateStr,
// signatoryName, signatoryRole, certUuid (opcional), isMobile.
const CertificateCard = ({
  isMobile, title, achievementText, hours, studentName,
  dateStr, signatoryName, signatoryRole, certUuid, idAttr = 'course-certificate',
}) => {
  const hoursNum = Number(hours)
  return (
    <div id={idAttr} style={{ background: 'white', border: isMobile ? '5px solid var(--orange)' : '8px solid var(--orange)',
      borderRadius: isMobile ? 16 : 24, padding: isMobile ? '28px 18px' : '40px 56px', textAlign: 'center',
      position: 'relative', boxShadow: 'var(--sh-xl)' }}>
      <div style={{ position: 'absolute', inset: 10, border: '2px solid #FADCBE', borderRadius: 16, pointerEvents: 'none' }} />
      {/* Logos: CEINFES (izquierda) · Grupo de Investigación (derecha) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 20 : 44, marginBottom: 20 }}>
        <LogoImg h={isMobile ? 40 : 52} />
        <img src="/sello-grupo-investigacion.png" alt="CEINFES — Grupo de Investigación reconocido por Minciencias" style={{ height: isMobile ? 72 : 96, width: 'auto' }} />
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: 'var(--orange)', marginBottom: 12 }}>Certificado</div>
      <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.2, marginBottom: 8 }}>{title}</h1>
      <div style={{ width: 80, height: 4, background: 'var(--gradient)', borderRadius: 2, margin: '0 auto 24px' }} />
      <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>Este certificado acredita que</p>
      <div style={{ fontSize: isMobile ? 26 : 40, fontWeight: 800, color: 'var(--dark)', marginBottom: 12, lineHeight: 1.2, padding: '0 8px' }}>{studentName}</div>
      <p style={{ fontSize: 15, color: 'var(--text-sec)', marginBottom: 20, lineHeight: 1.6, maxWidth: 520, margin: '0 auto 20px' }}>
        {achievementText}<br /><strong>{title}</strong>
      </p>
      {hoursNum > 0 && (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 20px', borderRadius: 100,
          background: 'var(--orange-bg)', border: '1.5px solid var(--orange-pale)', marginBottom: 32 }}>
          <span style={{ fontSize: 16 }}>🕒</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--orange)' }}>Intensidad: {hoursNum} horas</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: hoursNum > 0 ? 8 : 24 }}>
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
      {certUuid && (
        <div style={{ borderTop: '1px solid var(--bg-alt)', paddingTop: 16, marginTop: 24, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          <CheckIc s={13} c="var(--success)" />
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>ID: {certUuid}</span>
        </div>
      )}
    </div>
  )
}

export default CertificateCard
