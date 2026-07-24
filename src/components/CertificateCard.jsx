import React from 'react'
import { LogoImg } from './ui.jsx'

// Tarjeta visual del certificado de curso, en formato HORIZONTAL (apaisado).
// Compartida por CourseCertificatePage (lo que ve/imprime el estudiante), la
// página pública de verificación y la vista previa del editor de ruta, para que
// todo se vea idéntico.
//
// Contenido (pedido del usuario):
//   [logo CEINFES]                         [sello Grupo de Investigación]
//                       CERTIFICADO
//                    {Nombre del estudiante}   (grande)
//   {achievementText} {title} con una intensidad de {hours} horas
//   {fecha}                                 [logo CEINFES = firma]
//
// Props: title, achievementText, hours (número|null), studentName, dateStr,
// certUuid (opcional), isMobile.
const CertificateCard = ({
  isMobile, title, achievementText, hours, studentName, dateStr, certUuid, idAttr = 'course-certificate',
}) => {
  const hoursNum = Number(hours)
  const ach = achievementText || 'Por haber concluido de manera satisfactoria el'
  return (
    <div id={idAttr} style={{ background: 'white', border: isMobile ? '5px solid var(--orange)' : '8px solid var(--orange)',
      borderRadius: isMobile ? 16 : 20, padding: isMobile ? '24px 18px' : '3% 6%', position: 'relative',
      boxShadow: 'var(--sh-xl)', textAlign: 'center',
      // Orientación HORIZONTAL (apaisada, proporción A4 landscape) en desktop.
      // El contenido se centra vertical dentro de la página. En móvil se deja
      // fluir para que no quede aplastado.
      ...(isMobile ? {} : { aspectRatio: '297 / 210', display: 'flex', flexDirection: 'column', justifyContent: 'center' }) }}>
      <div style={{ position: 'absolute', inset: 10, border: '2px solid #FADCBE', borderRadius: 14, pointerEvents: 'none' }} />

      {/* Logos: CEINFES (izquierda) · Grupo de Investigación (derecha).
          Nota: LogoImg usa `h` como factor (ancho = h×5), NO como altura. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: isMobile ? 14 : 22 }}>
        <LogoImg h={isMobile ? 26 : 34} />
        <img src="/sello-grupo-investigacion.png" alt="CEINFES — Grupo de Investigación reconocido por Minciencias"
          style={{ height: isMobile ? 60 : 84, width: 'auto' }} />
      </div>

      <div style={{ fontSize: isMobile ? 11 : 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 6, color: 'var(--orange)', marginBottom: isMobile ? 10 : 14 }}>
        Certificado
      </div>

      <div style={{ fontSize: isMobile ? 24 : 40, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.15, marginBottom: isMobile ? 8 : 10, padding: '0 8px' }}>
        {studentName}
      </div>
      <div style={{ width: 90, height: 4, background: 'var(--gradient)', borderRadius: 2, margin: isMobile ? '0 auto 16px' : '0 auto 22px' }} />

      <p style={{ fontSize: isMobile ? 14 : 17, color: 'var(--text-sec)', lineHeight: 1.65, maxWidth: 820, margin: '0 auto', marginBottom: isMobile ? 24 : 34 }}>
        {ach} <strong>{title}</strong>{hoursNum > 0 ? <> con una intensidad de <strong>{hoursNum} horas</strong></> : null}.
      </p>

      {/* Fecha (izquierda) · Firma = logo CEINFES (derecha) */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: 24, marginTop: 8, flexWrap: 'wrap' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: 'var(--dark)', fontWeight: 600, marginBottom: 10 }}>{dateStr}</div>
          <div style={{ width: 190, height: 1, background: 'var(--border)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>Fecha de expedición</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 8 }}><LogoImg h={16} /></div>
          <div style={{ width: 190, height: 1, background: 'var(--border)', margin: '0 auto 8px' }} />
          <div style={{ fontSize: 11, color: 'var(--muted)' }}>CEINFES</div>
        </div>
      </div>

      {certUuid && (
        <div style={{ borderTop: '1px solid var(--bg-alt)', paddingTop: 14, marginTop: 22, display: 'flex', alignItems: 'center',
          justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>ID: {certUuid}</span>
        </div>
      )}
    </div>
  )
}

export default CertificateCard
