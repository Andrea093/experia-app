// Prueba de estrés simulada contra Supabase
// Uso: node scripts/stress-test.js [concurrentes] [url]
// Ejemplo: node scripts/stress-test.js 20 https://experia-app.pages.dev
//
// Simula usuarios concurrentes que:
//   1. Inician sesión
//   2. Leen su perfil
//   3. Leen instituciones
//   4. Cierran sesión
//
// Requiere: usuarios creados previamente (usa generar-usuarios-prueba.js)

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ── Configuración ────────────────────────────────────────────────────────────
const SUPABASE_URL     = 'https://ttgycluzeyuxsmgcijgi.supabase.co'
const SUPABASE_ANON    = 'sb_publishable_zKM7rS23yiTSsibbQpO5Hw_9eFtvf-i'
const CONCURRENTES     = parseInt(process.argv[2] || '10')
const PASS_BASE        = 'Test'   // contraseña base: Test{i}2024!
const TOTAL_USUARIOS   = 50       // cuántos usuarios existen en Supabase

// ── Helpers ──────────────────────────────────────────────────────────────────
const ms = (t) => `${t}ms`
const color = (text, code) => `\x1b[${code}m${text}\x1b[0m`
const verde  = (t) => color(t, 32)
const rojo   = (t) => color(t, 31)
const amarillo = (t) => color(t, 33)
const cyan   = (t) => color(t, 36)

// ── Simular un usuario ────────────────────────────────────────────────────────
async function simularUsuario(i) {
  const email = `test.docente${i}@prueba.com`
  const pass  = `Test${i}2024!`
  const client = createClient(SUPABASE_URL, SUPABASE_ANON)
  const resultado = { usuario: i, email, pasos: [] }
  const t0 = Date.now()

  try {
    // Paso 1: Login
    const t1 = Date.now()
    const { data: auth, error: authErr } = await client.auth.signInWithPassword({ email, password: pass })
    resultado.pasos.push({ paso: 'login', ms: Date.now() - t1, ok: !authErr })
    if (authErr) { resultado.error = authErr.message; return resultado }

    // Paso 2: Leer perfil
    const t2 = Date.now()
    const { error: profErr } = await client.from('profiles').select('*').eq('id', auth.user.id).single()
    resultado.pasos.push({ paso: 'perfil', ms: Date.now() - t2, ok: !profErr })

    // Paso 3: Leer instituciones
    const t3 = Date.now()
    const { error: instErr } = await client.from('institutions').select('*')
    resultado.pasos.push({ paso: 'instituciones', ms: Date.now() - t3, ok: !instErr })

    // Paso 4: Logout
    await client.auth.signOut()

    resultado.totalMs = Date.now() - t0
    resultado.ok = true
  } catch (err) {
    resultado.error = err.message
    resultado.ok = false
  }

  return resultado
}

// ── Runner principal ──────────────────────────────────────────────────────────
async function correrPrueba(oleada, indices) {
  console.log(cyan(`\n▶ Oleada ${oleada}: ${indices.length} usuarios concurrentes`))
  const inicio = Date.now()

  const resultados = await Promise.allSettled(indices.map(i => simularUsuario(i)))
  const total = Date.now() - inicio

  let ok = 0, errores = 0
  const tiempos = []

  resultados.forEach(r => {
    if (r.status === 'fulfilled' && r.value.ok) {
      ok++
      tiempos.push(r.value.totalMs)
    } else {
      errores++
      const v = r.value || {}
      console.log(rojo(`  ✗ Usuario ${v.usuario || '?'}: ${v.error || r.reason}`))
    }
  })

  const promedio = tiempos.length ? Math.round(tiempos.reduce((a,b)=>a+b,0)/tiempos.length) : 0
  const maxT     = tiempos.length ? Math.max(...tiempos) : 0
  const minT     = tiempos.length ? Math.min(...tiempos) : 0

  console.log(`  Completados en ${ms(total)} de pared`)
  console.log(`  ${verde(`✓ ${ok} exitosos`)}  ${errores > 0 ? rojo(`✗ ${errores} errores`) : ''}`)
  if (tiempos.length) {
    console.log(`  Tiempos por usuario — promedio: ${amarillo(ms(promedio))}  min: ${ms(minT)}  max: ${ms(maxT)}`)
  }

  return { ok, errores, promedio, maxT, minT, totalMs: total }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(cyan('═══════════════════════════════════════════════════'))
  console.log(cyan('   EXPERIA — Prueba de estrés simulada'))
  console.log(cyan('═══════════════════════════════════════════════════'))
  console.log(`Supabase: ${SUPABASE_URL}`)
  console.log(`Plan: ${CONCURRENTES} usuarios concurrentes\n`)

  // Rampa: 5 → 10 → CONCURRENTES
  const oleadas = []
  if (CONCURRENTES > 5)  oleadas.push(5)
  if (CONCURRENTES > 10) oleadas.push(10)
  oleadas.push(CONCURRENTES)

  const resumen = []

  for (let o = 0; o < oleadas.length; o++) {
    const n = oleadas[o]
    // Selecciona N usuarios aleatorios del pool
    const indices = Array.from({ length: n }, () => Math.floor(Math.random() * TOTAL_USUARIOS) + 1)
    const r = await correrPrueba(o + 1, indices)
    resumen.push({ usuarios: n, ...r })

    if (o < oleadas.length - 1) {
      console.log('  ⏱  Pausa 3s antes de la siguiente oleada...')
      await new Promise(res => setTimeout(res, 3000))
    }
  }

  // Resumen final
  console.log(cyan('\n═══════════════════════════════════════════════════'))
  console.log(cyan('   RESUMEN'))
  console.log(cyan('═══════════════════════════════════════════════════'))
  resumen.forEach(r => {
    const estado = r.errores === 0 ? verde('✓ OK') : rojo(`✗ ${r.errores} errores`)
    console.log(`  ${r.usuarios} usuarios — ${ms(r.promedio)} promedio — ${ms(r.maxT)} máx — ${estado}`)
  })

  const hayErrores = resumen.some(r => r.errores > 0)
  const promedioFinal = resumen[resumen.length - 1]?.promedio || 0

  console.log()
  if (!hayErrores && promedioFinal < 2000) {
    console.log(verde('✅ La plataforma maneja la carga correctamente.'))
  } else if (!hayErrores && promedioFinal < 5000) {
    console.log(amarillo('⚠️  Sin errores pero respuesta lenta. Revisa Supabase → Reports → Slow queries.'))
  } else {
    console.log(rojo('❌ Hay errores o latencia alta. Revisa Supabase → Reports antes del lanzamiento.'))
  }

  console.log('\n📊 Monitorea en tiempo real:')
  console.log(`   Supabase Reports → https://supabase.com/dashboard/project/${SUPABASE_URL.split('//')[1].split('.')[0]}/reports`)
  console.log('   Cloudflare Analytics → https://dash.cloudflare.com → Workers & Pages → experia-app → Metrics\n')
}

main().catch(console.error)
