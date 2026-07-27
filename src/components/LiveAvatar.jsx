import React from 'react'
import { useStore, calcLevel } from '../store/store.jsx'
import { Avatar, rankFromLevel } from '../lib/avatarKit.jsx'

// =============================================================================
// LiveAvatar — el avatar del estudiante dentro de la Clase en Vivo Guiada
// -----------------------------------------------------------------------------
// LiveQuestionView lo carga con React.lazy y SOLO lo monta cuando recibe una
// configuración de avatar. La página pública del PIN (LivePlay.jsx) nunca pasa
// esa prop —sus participantes son anónimos, no tienen perfil— así que el kit de
// DiceBear jamás se descarga ahí.
// =============================================================================

const LiveAvatar = ({ cfg, size = 92, expression = 'idle' }) => {
  const xp = useStore(s => s.xp)
  const rank = rankFromLevel(calcLevel(xp || 0))
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <Avatar cfg={cfg} size={size} rank={rank} expression={expression} />
    </div>
  )
}

export default LiveAvatar
