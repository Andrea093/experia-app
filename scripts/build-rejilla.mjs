// Genera src/lib/rejillaTareas.json a partir del Excel de la rejilla de
// recomendaciones y tareas (PILOTO modo clon, §13 de CLAUDE.md).
//
//   node scripts/build-rejilla.mjs [ruta/al/archivo.xlsx]
//
// Por defecto lee `scripts/data/tareas-y-recomendaciones.xlsx`, que es la copia
// dentro del repo del archivo que entrega el equipo académico. La copia se
// versiona a propósito: sin ella el JSON generado no se podría reproducir.
//
// Columnas esperadas (la primera hoja del libro):
//   Unidad | Sesión | # Nro Pregunta | Código Materia | EJE ARTICULADOR |
//   Categoría de Tarea | Dificultad | Componente | Recomendación | Tarea
//
// El JSON sale DEDUPLICADO: los textos de recomendación se repiten mucho entre
// preguntas (77 distintos para 166 filas), así que se guardan una sola vez y las
// filas apuntan por índice. Igual con los ejes articuladores y los componentes.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import XLSX from 'xlsx'

const here = path.dirname(fileURLToPath(import.meta.url))
const src  = process.argv[2] || path.join(here, 'data', 'tareas-y-recomendaciones.xlsx')
const out  = path.join(here, '..', 'src', 'lib', 'rejillaTareas.json')

const txt = (v) => (v === null || v === undefined ? '' : String(v).trim())

// "UNIDAD 3" → 3. Lo mismo que hace `unidadDe()` en el front con el nombre que
// el tutor le puso a la unidad en su plan: se cruza por NÚMERO, no por texto.
const unidadNum = (v) => {
  const m = txt(v).match(/\d+/)
  return m ? parseInt(m[0], 10) : null
}

// Exploro / Desarrollo / Aplico → clave interna. `aplico` no tiene momento en la
// tabla de efectividad (solo hay dos), pero se conserva en los datos: si el
// piloto lo agrega después, la rejilla ya lo trae.
const momentoKey = (v) => {
  const s = txt(v).toLowerCase()
  if (s.startsWith('desarrollo')) return 'desarrollo'
  if (s.startsWith('exploro'))    return 'exploro'
  if (s.startsWith('aplico'))     return 'aplico'
  return null
}

const wb   = XLSX.readFile(src)
const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })

const ejes = []
const comps = []
const recs = []
const idx  = (arr, value) => {
  if (!value) return -1
  const i = arr.indexOf(value)
  return i >= 0 ? i : arr.push(value) - 1
}

const filas = []
const descartadas = []

rows.forEach((r, i) => {
  const u = unidadNum(r['Unidad'])
  const s = momentoKey(r['Sesión'])
  const n = parseInt(txt(r['# Nro Pregunta']), 10)
  const rec = txt(r['Recomendación'])
  const tar = txt(r['Tarea'])
  if (!u || !s || !Number.isFinite(n) || (!rec && !tar)) {
    descartadas.push(i + 2)
    return
  }
  // Un 0 suelto en Dificultad o Componente es una celda sin diligenciar, no un
  // valor: se guarda vacío para que el informe no imprima "0".
  const cero = (v) => (txt(v) === '0' ? '' : txt(v))

  filas.push({
    u, s, n,
    e: idx(ejes, txt(r['EJE ARTICULADOR'])),
    m: idx(comps, cero(r['Componente'])),
    c: txt(r['Categoría de Tarea']),
    d: cero(r['Dificultad']).toUpperCase(),
    r: idx(recs, rec),
    t: tar,
  })
})

const data = {
  _origen: path.basename(src),
  _generado: new Date().toISOString().slice(0, 10),
  materia: txt(rows[0]?.['Código Materia']),
  ejes,
  componentes: comps,
  recomendaciones: recs,
  filas,
}

fs.writeFileSync(out, JSON.stringify(data, null, 0) + '\n', 'utf8')

const porUnidad = {}
filas.forEach(f => { porUnidad[`U${f.u} ${f.s}`] = (porUnidad[`U${f.u} ${f.s}`] || 0) + 1 })
console.log(`✔ ${filas.length} filas → ${path.relative(process.cwd(), out)}`)
console.log(`  ${ejes.length} ejes · ${comps.length} componentes · ${recs.length} recomendaciones distintas · ${(fs.statSync(out).size / 1024).toFixed(1)} KB`)
console.log('  ' + Object.entries(porUnidad).map(([k, v]) => `${k}:${v}`).join(' '))
if (descartadas.length) console.warn(`⚠ filas descartadas (sin unidad/sesión/pregunta): ${descartadas.join(', ')}`)
