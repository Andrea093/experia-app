// Genera src/lib/questionTopics.json: { idPregunta: "tema" } con el TEMA limpio
// de cada pregunta del banco, para mostrarlo en la clase en vivo junto a la
// competencia y la dificultad (nov 2026). Es un archivo pequeño (~15 KB) para
// no cargar el banco completo (~670 KB) en el celular del estudiante.
//
// El campo `topic` del banco mezcla cosas: a veces es un tema ("MRU"), a veces
// "nivel · competencia — tema" y a veces solo el nivel o la competencia. Aquí
// se queda solo el tema; si no hay, la pregunta no entra al mapa.
// Correr: node scripts/build-temas.mjs  (después de regenerar el banco)
import fs from 'node:fs'
const bank = JSON.parse(fs.readFileSync(new URL('../src/lib/questionBank.json', import.meta.url), 'utf8'))
const NIVELES = /^(bajo|medio|alto|muy alto)$/i
const COMPETENCIA = /fen[oó]menos|uso comprensivo|indagaci[oó]n|contenidos locales|articula|reflexiona|evaluar contenido|pensamiento social|perspectivas|reflexivo|interpretaci[oó]n y representaci[oó]n|formulaci[oó]n y ejecuci[oó]n|^argumentaci[oó]n$/i
export const cleanTopic = (raw) => {
  if (!raw) return ''
  let t = String(raw).trim()
  if (t.includes(' — ')) t = t.split(' — ').pop()
  else if (t.includes(' · ')) t = t.split(' · ').pop()
  t = t.trim()
  if (!t || NIVELES.test(t) || COMPETENCIA.test(t)) return ''
  return t
}
const out = {}
for (const q of bank.questions) { const t = cleanTopic(q.topic); if (t) out[q.id] = t }
fs.writeFileSync(new URL('../src/lib/questionTopics.json', import.meta.url), JSON.stringify(out, null, 0) + '\n')
const porArea = {}
for (const q of bank.questions) { porArea[q.area] = porArea[q.area] || [0, 0]; porArea[q.area][1]++; if (out[q.id]) porArea[q.area][0]++ }
console.log('Preguntas con tema / total por asignatura:', porArea)
