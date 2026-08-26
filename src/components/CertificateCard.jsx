import React from 'react'
import { LogoImg } from './ui.jsx'

// Tarjeta visual del certificado de curso, en formato HORIZONTAL (apaisado).
// Compartida por CourseCertificatePage, la página pública de verificación y la
// vista previa del editor, para que todo se vea idéntico.
//
// Props obligatorias: title, achievementText, hours, studentName, dateStr.
// Opcionales (si faltan, la línea NO se pinta — nunca se imprime un
// marcador de posición en un documento que la gente firma y archiva):
//   documentId  → "C.C. 1.020.304.050"
//   area, grade → píldora "ÁREA · GRADO · INTENSIDAD"
//   city        → "Expedido en Bogotá, D. C., el …"
//   description → párrafo de cierre bajo el nombre del curso
//   certUuid    → código de verificación al pie
//
// ⚠️ PALETA FIJA, no tokens del tema. Un certificado es un documento
// imprimible: tiene que verse igual en claro, en oscuro y en papel. Con
// `var(--dark)` el nombre salía en texto claro sobre el fondo crema en modo
// oscuro, porque estos ids (course-certificate / cert-public / cert-preview) no
// están cubiertos por la regla `#certificate` de styles.css.
// Texto de logro por defecto: GENÉRICO a propósito. Cada curso puede poner el
// suyo desde el editor de Ruta (courses.certificate_achievement_text) — ahí es
// donde va la redacción específica de un programa.
export const DEFAULT_ACHIEVEMENT_TEXT = 'Por haber concluido de manera satisfactoria el'

// ── Ficha CEINFES: área, grado, ciudad y párrafo de cierre ──────────────────
// El REDISEÑO visual aplica a todos los cursos (es la identidad de la marca),
// pero estos DATOS no: son propios de un programa concreto. Un certificado que
// dijera "Ciencias Naturales · Grado 11" en un curso de Matemáticas sería un
// dato falso en un documento que la gente archiva y presenta.
//
// Por eso van en una lista explícita por curso. Lo que no esté aquí sale sin
// píldora y sin ciudad, y el componente omite ambas cosas limpiamente.
//
// ⚠️ TEMPORAL. En cuanto haya un segundo programa con su propia ficha, esto
// debe pasar a columnas del curso (certificate_area / certificate_grade /
// certificate_city / certificate_description) editables desde el editor de
// Ruta, y esta constante desaparece.
// ⚠️ La ficha se registra POR CURSO, y cada colegio tiene su propia copia
// (fork) del mismo programa. Si el certificado sale sin píldora, casi siempre
// es porque falta el id de ESA copia aquí — no porque el código no funcione.
// Para saber en cuál estás:
//   select id, name, institution_id from public.courses
//    where name ilike '%Producto Sustituto%' or name ilike '%GenIA%';
const FICHA_GENIA_CONSTRUYE = {
  area: 'Ciencias Naturales',
  grade: '11',
  city: 'Bogotá, D. C.',
  description: 'Durante este proceso fortaleció sus capacidades para interpretar resultados, priorizar aprendizajes y desarrollar en el aula la secuencia didáctica propuesta.',
}

const FICHAS_POR_CURSO = {
  // Las dos versiones del programa "Formación Docente · Producto Sustituto".
  // Misma ficha porque es el mismo programa dictado en dos colegios.
  'a0d38833-f43f-499b-9396-bb6596f9e5b9': FICHA_GENIA_CONSTRUYE, // "GenIA Construye" — colegio Ceinfes
  'c2fdd9e3-b2ca-4cb2-9796-7c69bd43ab64': FICHA_GENIA_CONSTRUYE, // "— mi versión"    — colegio 47661484…
}

// Devuelve las props extra del certificado para un curso, o {} si no tiene
// ficha propia. Pensado para hacer spread sobre <CertificateCard {...} />.
export const fichaCertificado = (courseId) => FICHAS_POR_CURSO[courseId] || {}

const SERIF = "'Georgia', 'Times New Roman', serif"
const C = {
  papel:  '#FBF7F2',
  marco:  '#E8732C',
  naranja:'#E8732C',
  navy:   '#14284A',
  texto:  '#43516B',
  suave:  '#7C8AA0',
  linea:  'rgba(232,115,44,.30)',
}

// Círculos y arcos decorativos del fondo, como en el arte de referencia.
const Ornamento = () => (
  <div aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
    <div style={{ position: 'absolute', top: '14%', left: '4%', width: 92, height: 92, borderRadius: '50%', background: 'rgba(232,115,44,.05)' }} />
    <div style={{ position: 'absolute', top: '46%', left: '1%', width: 54, height: 54, borderRadius: '50%', border: '9px solid rgba(232,115,44,.07)' }} />
    <div style={{ position: 'absolute', bottom: '10%', left: '9%', width: 34, height: 34, borderRadius: '50%', background: 'rgba(232,115,44,.06)' }} />
    <div style={{ position: 'absolute', top: '30%', right: '5%', width: 70, height: 70, borderRadius: '50%', border: '10px solid rgba(232,115,44,.06)' }} />
    <div style={{ position: 'absolute', bottom: '16%', right: '11%', width: 44, height: 44, borderRadius: '50%', background: 'rgba(232,115,44,.05)' }} />
    {/* Arcos suaves, guiños al trazo del arte original */}
    <svg viewBox="0 0 400 300" preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: .5 }}>
      <path d="M -10 250 C 60 210, 90 120, 165 96" fill="none" stroke="rgba(232,115,44,.16)" strokeWidth="1.2" strokeDasharray="5 6" />
      <path d="M 410 70 C 350 96, 330 170, 262 205" fill="none" stroke="rgba(232,115,44,.16)" strokeWidth="1.2" strokeDasharray="5 6" />
    </svg>
  </div>
)

// Rombo entre dos filetes, el separador del arte de referencia.
const Filete = ({ w = 120 }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
    <span style={{ width: w, height: 1, background: `linear-gradient(90deg, transparent, ${C.linea})` }} />
    <span style={{ color: C.naranja, fontSize: 9 }}>◆</span>
    <span style={{ width: w, height: 1, background: `linear-gradient(90deg, ${C.linea}, transparent)` }} />
  </div>
)

const CertificateCard = ({
  isMobile, title, achievementText, hours, studentName, dateStr, certUuid,
  documentId, area, grade, city, description, idAttr = 'course-certificate',
}) => {
  const hoursNum = Number(hours)
  const ach = achievementText || DEFAULT_ACHIEVEMENT_TEXT
  const S = (m, d) => (isMobile ? m : d)

  // La píldora solo aparece si hay al menos un dato que poner dentro.
  const datos = [
    area          ? { k: 'ÁREA',       v: area }               : null,
    grade         ? { k: 'GRADO',      v: grade }              : null,
    hoursNum > 0  ? { k: 'INTENSIDAD', v: `${hoursNum} HORAS` } : null,
  ].filter(Boolean)

  return (
    <div id={idAttr} style={{
      position: 'relative', overflow: 'hidden', textAlign: 'center',
      background: C.papel,
      border: `2px solid ${C.marco}`,
      borderRadius: S(14, 10),
      boxShadow: '0 24px 60px rgba(232,115,44,.18)',
      padding: S('24px 18px', '3.2% 6%'),
      ...(isMobile ? {} : { aspectRatio: '297 / 210', display: 'flex', flexDirection: 'column', justifyContent: 'center' }),
    }}>
      <Ornamento />
      {/* Filete interior, a un par de milímetros del borde */}
      <div style={{ position: 'absolute', inset: S(7, 9), border: `1px solid ${C.linea}`,
        borderRadius: S(10, 7), pointerEvents: 'none' }} />

      <div style={{ position: 'relative' }}>
        {/* Logo CEINFES · sello del grupo de investigación */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: S(10, 4) }}>
          <LogoImg h={S(24, 32)} />
          <img src="/sello-grupo-investigacion.png" alt="CEINFES — Grupo de Investigación reconocido por Minciencias"
            style={{ height: S(52, 76), width: 'auto' }} />
        </div>

        {/* CERTIFICADO DE APROBACIÓN */}
        <div style={{ marginBottom: S(10, 8) }}>
          <Filete w={S(28, 70)} />
          <div style={{ fontSize: S(12, 16), fontWeight: 800, letterSpacing: S(2.5, 4.5),
            color: C.naranja, textTransform: 'uppercase', margin: S('8px 0', '7px 0') }}>
            Certificado de aprobación
          </div>
          <Filete w={S(28, 70)} />
        </div>

        <div style={{ fontSize: S(12, 15), color: C.texto, marginBottom: S(4, 4) }}>Ceinfes certifica que</div>

        {/* Nombre del docente */}
        <div style={{ fontFamily: SERIF, fontSize: S(24, 40), fontWeight: 700, color: C.navy,
          lineHeight: 1.12, letterSpacing: .3, padding: '0 6px' }}>
          {studentName}
        </div>

        {documentId && (
          <div style={{ fontSize: S(12, 15), color: C.texto, marginTop: 3, letterSpacing: .4 }}>
            C.C. {documentId}
          </div>
        )}

        {/* Logro + nombre del curso */}
        <div style={{ fontSize: S(12.5, 15), color: C.texto, lineHeight: 1.5,
          margin: S('10px auto 0', '11px auto 0'), maxWidth: 760, whiteSpace: 'pre-line' }}>
          {ach}
        </div>
        <div style={{ fontSize: S(17, 25), fontWeight: 800, color: C.naranja,
          lineHeight: 1.2, margin: S('3px 0 0', '2px 0 0'), padding: '0 6px' }}>
          {title}
        </div>

        {description && (
          <p style={{ fontSize: S(11.5, 13.5), color: C.texto, lineHeight: 1.55,
            maxWidth: 700, margin: S('9px auto 0', '10px auto 0') }}>
            {description}
          </p>
        )}

        {/* Píldora ÁREA · GRADO · INTENSIDAD */}
        {datos.length > 0 && (
          <div style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap',
            justifyContent: 'center', gap: S(10, 18),
            margin: S('14px auto 0', '16px auto 0'),
            padding: S('8px 16px', '9px 26px'),
            borderRadius: 999, background: 'rgba(232,115,44,.09)', border: `1px solid ${C.linea}` }}>
            {datos.map((d, i) => (
              <React.Fragment key={d.k}>
                {i > 0 && <span style={{ color: C.naranja, fontSize: 9 }}>●</span>}
                <span style={{ fontSize: S(10.5, 12.5), letterSpacing: .3 }}>
                  <b style={{ color: C.naranja, fontWeight: 800 }}>{d.k}:</b>{' '}
                  <span style={{ color: C.navy, fontWeight: 600 }}>{d.v}</span>
                </span>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Expedición */}
        <div style={{ fontSize: S(11.5, 13.5), color: C.texto, margin: S('16px 0 0', '20px 0 0') }}>
          {city ? `Expedido en ${city}, el ${dateStr}.` : `Expedido el ${dateStr}.`}
        </div>

        <div style={{ marginTop: S(10, 12) }}><Filete w={S(40, 90)} /></div>

        {certUuid && (
          <div style={{ marginTop: S(8, 9), fontSize: S(8.5, 9.5), color: C.suave,
            fontFamily: 'monospace', wordBreak: 'break-all' }}>
            Verificación: {certUuid}
          </div>
        )}
      </div>
    </div>
  )
}

export default CertificateCard
