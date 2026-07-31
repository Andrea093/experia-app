// ── Motor de cálculo "Tabla de Efectividad" ──────────────────────────────────
// Traducción de la hoja `Tabla_de_efectividad_TOTAL.xlsx` (ver
// spec-tabla-efectividad.md). Funciones PURAS, sin React ni Supabase: son la
// única fuente de verdad del cálculo. `clone_effectiveness.summary` en la BD es
// una foto de lo que devuelve este módulo, no un cálculo paralelo.
//
// Dos momentos por sesión de clase: "Exploro mis competencias" y "Desarrollo mis
// competencias". Cada uno tiene su propio total de estudiantes y sus preguntas.

export const LETTERS = ['A', 'B', 'C', 'D']

export const SECTIONS = [
  { key: 'exploro',    label: 'Exploro mis competencias' },
  { key: 'desarrollo', label: 'Desarrollo mis competencias' },
]

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : 0
}

export const emptyQuestion = (n) => ({
  n, correcta: 'A', a: 0, b: 0, c: 0, d: 0, aplicada: true,
})

export const emptySection = (nPreguntas = 5) => ({
  total_estudiantes: 0,
  questions: Array.from({ length: nPreguntas }, (_, i) => emptyQuestion(i + 1)),
})

// VALOR — peso/dificultad de la pregunta según cuántos la acertaron.
//   0%      → 3      1%–33%  → 3      34%–68% → 2      69%–100% → 1
// Entre MENOS estudiantes aciertan, MAYOR es el peso. Es dificultad, no
// desempeño: no confundir con el P.E.P.
export function valorDePregunta(aciertos, total) {
  if (!(total > 0)) return 'Dat.error'
  const limiteBajo  = total * 0.33
  const limiteMedio = total * 0.68
  if (aciertos === 0) return 3
  if (aciertos >= 1 && aciertos <= limiteBajo) return 3
  if (aciertos > limiteBajo && aciertos <= limiteMedio) return 2
  if (aciertos > limiteMedio && aciertos <= total) return 1
  return 'Dat.error'   // aciertos > total, o dato imposible
}

// Cálculo de UNA pregunta contra el total de estudiantes de su sección.
export function questionStats(q, total) {
  const letra  = (q?.correcta ?? '').toString().trim().toUpperCase()
  const counts = { A: num(q?.a), B: num(q?.b), C: num(q?.c), D: num(q?.d) }
  const suma   = counts.A + counts.B + counts.C + counts.D

  if (!LETTERS.includes(letra)) {
    return { letra: null, aciertos: null, suma, esValida: false, pep: null,
             valor: 'Dat.error', error: 'Letra incorrecta' }
  }

  const aciertos = counts[letra]
  const esValida = suma === total          // paso 2 del spec: alerta de captura
  const pep      = total > 0 ? (aciertos * 100) / total : null
  const valor    = valorDePregunta(aciertos, total)

  return {
    letra, aciertos, suma, esValida, pep, valor,
    error: valor === 'Dat.error' ? 'Dat.error' : null,
  }
}

// Cálculo de una sección completa (Exploro o Desarrollo).
// ⚠️ Las preguntas con `aplicada === false` se EXCLUYEN por completo (no cuentan
// como cero), para que la efectividad se calcule solo sobre lo realmente
// trabajado en la sesión.
export function sectionStats(section) {
  const total = num(section?.total_estudiantes)
  const rows  = (section?.questions || []).map(q => ({ q, st: questionStats(q, total) }))
  const aplicadas = rows.filter(r => r.q?.aplicada !== false)

  const peps    = aplicadas.map(r => r.st.pep).filter(p => p != null)
  const valores = aplicadas.map(r => r.st.valor).filter(v => typeof v === 'number')

  return {
    total,
    rows,                                   // todas, para pintar la tabla
    aplicadas: aplicadas.length,
    // Efectividad máxima por estudiante = Σ VALOR de las preguntas aplicadas
    efectividadMaxima: valores.reduce((a, b) => a + b, 0),
    // Efectividad de grupo = promedio del P.E.P. — el indicador principal
    efectividadGrupo: peps.length ? peps.reduce((a, b) => a + b, 0) / peps.length : null,
    inconsistencias: aplicadas.filter(r => !r.st.esValida).length,
    errores:         aplicadas.filter(r => r.st.error).length,
    tieneDatos: total > 0 && aplicadas.length > 0,
  }
}

// Efectividad total de la sesión = promedio de las secciones que SÍ se
// aplicaron. Si solo se aplicó una, se reporta esa directamente.
export function sessionEffectiveness(sections) {
  const exploro    = sectionStats(sections?.exploro)
  const desarrollo = sectionStats(sections?.desarrollo)

  const vals = [exploro, desarrollo]
    .filter(s => s.tieneDatos && s.efectividadGrupo != null)
    .map(s => s.efectividadGrupo)

  return {
    exploro,
    desarrollo,
    seccionesAplicadas: vals.length,
    efectividadSesion: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null,
    // Regla obligatoria del spec: el informe necesita al menos uno de los dos
    // cuestionarios para poder reportarse.
    reportable: vals.length >= 1,
    inconsistencias: exploro.inconsistencias + desarrollo.inconsistencias,
    errores: exploro.errores + desarrollo.errores,
  }
}

// Lo que se persiste en `clone_effectiveness.summary` (derivado, recomputado en
// cada guardado — nunca se lee como fuente de verdad).
export function buildSummary(sections) {
  const r = sessionEffectiveness(sections)
  const pick = (s) => ({
    total: s.total, aplicadas: s.aplicadas,
    efectividadGrupo: s.efectividadGrupo, efectividadMaxima: s.efectividadMaxima,
    inconsistencias: s.inconsistencias, errores: s.errores,
  })
  return {
    exploro: pick(r.exploro),
    desarrollo: pick(r.desarrollo),
    efectividadSesion: r.efectividadSesion,
    seccionesAplicadas: r.seccionesAplicadas,
    calculadoEn: new Date().toISOString(),
  }
}

export const fmtPct = (v) => v == null ? '—' : `${v.toFixed(1)}%`

// Color semáforo del indicador (mismo criterio en tabla, resumen e impresión).
export const colorEfectividad = (v) =>
  v == null ? 'var(--subtle)' : v >= 69 ? 'var(--success)' : v >= 34 ? '#D97706' : 'var(--error)'

// Normaliza lo que viene de la BD o de un Excel a la forma que espera el cálculo.
export function normalizeSection(raw) {
  const questions = Array.isArray(raw?.questions) ? raw.questions : []
  return {
    total_estudiantes: num(raw?.total_estudiantes),
    questions: questions.map((q, i) => ({
      n: num(q?.n) || i + 1,
      correcta: (q?.correcta ?? 'A').toString().trim().toUpperCase(),
      a: num(q?.a), b: num(q?.b), c: num(q?.c), d: num(q?.d),
      aplicada: q?.aplicada !== false,
    })),
  }
}

export function normalizeSections(raw) {
  return {
    exploro:    normalizeSection(raw?.exploro),
    desarrollo: normalizeSection(raw?.desarrollo),
  }
}
