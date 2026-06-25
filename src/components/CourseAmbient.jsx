import React from 'react'
import { useStore } from '../store/store.jsx'

// Selector único del tema del curso activo. Reemplaza las 4 suscripciones
// duplicadas que antes hacía cada capa ambiental por su cuenta.
const selectActiveCourseTheme = (s) =>
  (s.courses || []).find(c => c.id === s.enrolledCourseId)?.theme || null

// Cada capa ambiental se carga bajo demanda: su código (SVGs y arrays de
// partículas) solo se descarga cuando un curso con ese tema está activo,
// manteniendo el bundle principal liviano para el resto de estudiantes.
const AMBIENTS = {
  detective:     React.lazy(() => import('./DetectiveAmbient.jsx')),
  'escape-room': React.lazy(() => import('./EscapeRoomAmbient.jsx')),
  lab:           React.lazy(() => import('./LabAmbient.jsx')),
  'time-travel': React.lazy(() => import('./TimeTravelAmbient.jsx')),
}

// Monta la capa ambiental inmersiva correspondiente al curso activo (o nada).
const CourseAmbient = () => {
  const theme = useStore(selectActiveCourseTheme)
  const Ambient = theme ? AMBIENTS[theme] : null
  if (!Ambient) return null
  return (
    <React.Suspense fallback={null}>
      <Ambient />
    </React.Suspense>
  )
}

export default CourseAmbient
