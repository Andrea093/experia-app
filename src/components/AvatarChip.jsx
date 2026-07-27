import React from 'react'
import { useStore, nav, calcLevel } from '../store/store.jsx'
import { Avatar, RANKS, rankFromLevel } from '../lib/avatarKit.jsx'

// =============================================================================
// AvatarChip — el avatar del estudiante en la cabecera, con su rango
// -----------------------------------------------------------------------------
// Se carga con React.lazy desde Header.jsx y SOLO se monta cuando hay un curso
// temático activo y la persona ya creó su avatar: así el kit de DiceBear (~250 KB)
// nunca entra en el bundle principal ni lo descarga quien no lo usa.
// =============================================================================

const AvatarChip = ({ cfg, size = 38 }) => {
  const xp = useStore(s => s.xp)
  const rank = rankFromLevel(calcLevel(xp || 0))
  const r = RANKS[rank - 1]

  return (
    <button
      onClick={() => nav('profile', 'avatar')}
      title={`Tu avatar — rango ${r.name}`}
      aria-label={`Tu avatar, rango ${r.name}. Ir a editarlo`}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        display: 'flex', alignItems: 'center', flexShrink: 0, lineHeight: 0,
      }}
    >
      <Avatar cfg={cfg} size={size} rank={rank} />
    </button>
  )
}

export default AvatarChip
