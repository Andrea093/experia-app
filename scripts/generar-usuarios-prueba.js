// Genera un CSV con usuarios de prueba para importar via Admin → Carga masiva
// Uso: node scripts/generar-usuarios-prueba.js
// Abre el archivo generado en Excel y súbelo en la plataforma

import { writeFileSync } from 'fs'

const AREAS = ['lectura', 'ciudadanas', 'ingles', 'matematicas', 'ciencias']
const INSTITUCION = 'IED San Francisco'
const TOTAL = 50  // Cambia este número (5, 20, 50, 100)

const filas = [['Nombre', 'Email', 'Contraseña', 'Rol', 'Área', 'Institución']]

for (let i = 1; i <= TOTAL; i++) {
  const area = AREAS[(i - 1) % AREAS.length]
  filas.push([
    `Docente Test ${i}`,
    `test.docente${i}@prueba.com`,
    `Test${i}2024!`,
    'student',
    area,
    INSTITUCION,
  ])
}

const csv = filas.map(f => f.join(',')).join('\n')
writeFileSync('scripts/usuarios-prueba.csv', csv, 'utf8')
console.log(`✅ Generados ${TOTAL} usuarios en scripts/usuarios-prueba.csv`)
console.log('📥 Súbelo en Admin → Usuarios → Carga masiva')
