import React from 'react'
import { supabase } from '../lib/supabaseClient.js'
import { useStore, AREAS, awardForumParticipation } from '../store/store.jsx'
import { useMobile, Btn, Modal, MsgIc, ArrowLIc, TrashIc, PlusIc, Skeleton } from '../components/ui.jsx'
// =============================================
// EXPERIA — Foro educativo (Comunidad)
// Temas y respuestas sobre tópicos educativos puntuales.
// Tablas: forum_topics / forum_replies (migración 0009)
// =============================================

const CATEGORIES = [
  { id: 'general', name: 'General',           icon: '💬', color: '#6B7280' },
  { id: 'dce',     name: 'DCE y metodología', icon: '🧭', color: '#E8732C' },
  ...AREAS.map(a => ({ id: a.id, name: a.name, icon: a.icon, color: a.color })),
]
const catById = id => CATEGORIES.find(c => c.id === id) || CATEGORIES[0]

const ROLE_TAGS = {
  student:    { label: 'Docente',     bg: 'var(--orange-bg)',  color: 'var(--orange)' },
  instructor: { label: 'Instructor',  bg: 'var(--success-bg-strong)', color: 'var(--success)' },
  admin:      { label: 'CEINFES',     bg: 'var(--violet-bg)',  color: '#7C3AED' },
}

const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 60) return 'hace un momento'
  const m = Math.floor(s / 60);    if (m < 60)  return `hace ${m} min`
  const h = Math.floor(m / 60);    if (h < 24)  return `hace ${h} h`
  const d = Math.floor(h / 24);    if (d < 30)  return `hace ${d} día${d > 1 ? 's' : ''}`
  return new Date(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })
}

const Avatar = ({ name, avatar, size = 36 }) => (
  <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
    background: 'var(--gradient-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#fff', fontWeight: 700, fontSize: size * .4 }}>
    {avatar?.startsWith('http')
      ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      : (avatar || name?.[0]?.toUpperCase() || '?')}
  </div>
)

const RoleTag = ({ role }) => {
  const t = ROLE_TAGS[role] || ROLE_TAGS.student
  return <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-full)',
    background: t.bg, color: t.color, whiteSpace: 'nowrap' }}>{t.label}</span>
}

const CatChip = ({ cat, small }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: small ? 11 : 12,
    fontWeight: 600, padding: small ? '2px 8px' : '3px 10px', borderRadius: 'var(--r-full)',
    background: cat.color + '18', color: cat.color, whiteSpace: 'nowrap' }}>
    {cat.icon} {cat.name}
  </span>
)

const inputBase = {
  width: '100%', padding: '11px 14px', borderRadius: 'var(--r-md)',
  border: '1.5px solid var(--border)', fontSize: 14, fontFamily: 'var(--font)',
  outline: 'none', background: 'var(--white)', color: 'var(--dark)',
  transition: 'border-color .2s, box-shadow .2s', boxSizing: 'border-box',
}
const focusInput = e => { e.target.style.borderColor = 'var(--orange)'; e.target.style.boxShadow = '0 0 0 4px rgba(232,115,44,.12)' }
const blurInput = e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none' }

const ForumPage = () => {
  const user = useStore(s => s.user)
  const isMobile = useMobile()
  const [topics, setTopics] = React.useState([])
  const [loading, setLoading] = React.useState(true)
  const [dbMissing, setDbMissing] = React.useState(false)
  const [activeCat, setActiveCat] = React.useState('all')
  const [selected, setSelected] = React.useState(null)   // tema abierto
  const [replies, setReplies] = React.useState([])
  const [repliesLoading, setRepliesLoading] = React.useState(false)
  const [showNew, setShowNew] = React.useState(false)
  const [posting, setPosting] = React.useState(false)
  // Formulario nuevo tema
  const [title, setTitle] = React.useState('')
  const [category, setCategory] = React.useState('general')
  const [body, setBody] = React.useState('')
  const [formError, setFormError] = React.useState('')
  // Composer de respuesta
  const [replyBody, setReplyBody] = React.useState('')

  const isAdmin = user?.role === 'admin'
  const canModerate = (authorId) => user && (user.id === authorId || user.role === 'instructor' || user.role === 'admin')

  const loadTopics = React.useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('forum_topics')
      .select('*, forum_replies(count)')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) {
      // 42P01 = tabla inexistente → la migración 0009 no está aplicada
      if (error.code === '42P01' || /forum_topics/.test(error.message)) setDbMissing(true)
      else console.error('loadTopics:', error)
      setTopics([])
    } else {
      setTopics((data || []).map(t => ({ ...t, replyCount: t.forum_replies?.[0]?.count ?? 0 })))
    }
    setLoading(false)
  }, [])

  React.useEffect(() => { loadTopics() }, [loadTopics])

  const openTopic = async (t) => {
    setSelected(t)
    setRepliesLoading(true)
    const { data, error } = await supabase.from('forum_replies')
      .select('*').eq('topic_id', t.id).order('created_at')
    if (error) console.error('loadReplies:', error)
    setReplies(data || [])
    setRepliesLoading(false)
  }

  const createTopic = async () => {
    if (title.trim().length < 4) { setFormError('El título debe tener al menos 4 caracteres'); return }
    if (!body.trim()) { setFormError('Escribe el contenido del tema'); return }
    setFormError(''); setPosting(true)
    const { data, error } = await supabase.from('forum_topics').insert({
      author_id: user.id, author_name: user.name, author_avatar: user.avatar, author_role: user.role,
      title: title.trim(), body: body.trim(), category,
    }).select().single()
    setPosting(false)
    if (error) { setFormError('No se pudo publicar. Intenta de nuevo.'); console.error('createTopic:', error); return }
    awardForumParticipation()
    setShowNew(false); setTitle(''); setBody(''); setCategory('general')
    setTopics(ts => [{ ...data, replyCount: 0 }, ...ts])
    openTopic(data)
  }

  const addReply = async () => {
    if (!replyBody.trim() || !selected) return
    setPosting(true)
    const { data, error } = await supabase.from('forum_replies').insert({
      topic_id: selected.id,
      author_id: user.id, author_name: user.name, author_avatar: user.avatar, author_role: user.role,
      body: replyBody.trim(),
    }).select().single()
    setPosting(false)
    if (error) { console.error('addReply:', error); return }
    awardForumParticipation()
    setReplyBody('')
    setReplies(rs => [...rs, data])
    setTopics(ts => ts.map(t => t.id === selected.id ? { ...t, replyCount: (t.replyCount || 0) + 1 } : t))
  }

  const deleteTopic = async (t) => {
    if (!window.confirm('¿Eliminar este tema y todas sus respuestas?')) return
    const { error } = await supabase.from('forum_topics').delete().eq('id', t.id)
    if (error) { console.error('deleteTopic:', error); return }
    setTopics(ts => ts.filter(x => x.id !== t.id))
    if (selected?.id === t.id) setSelected(null)
  }

  const deleteReply = async (r) => {
    if (!window.confirm('¿Eliminar esta respuesta?')) return
    const { error } = await supabase.from('forum_replies').delete().eq('id', r.id)
    if (error) { console.error('deleteReply:', error); return }
    setReplies(rs => rs.filter(x => x.id !== r.id))
    setTopics(ts => ts.map(t => t.id === selected?.id ? { ...t, replyCount: Math.max(0, (t.replyCount || 1) - 1) } : t))
  }

  const togglePin = async (t, e) => {
    e.stopPropagation()
    const newVal = !t.pinned
    const { error } = await supabase.from('forum_topics').update({ pinned: newVal }).eq('id', t.id)
    if (error) { console.error('togglePin:', error); return }
    setTopics(ts => ts.map(x => x.id === t.id ? { ...x, pinned: newVal } : x))
    if (selected?.id === t.id) setSelected(s => ({ ...s, pinned: newVal }))
  }

  const visible = activeCat === 'all' ? topics : topics.filter(t => t.category === activeCat)

  // ---------- Vista detalle de tema ----------
  if (selected) {
    const cat = catById(selected.category)
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '16px 16px 40px' : '24px 24px 48px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <button onClick={() => setSelected(null)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
              cursor: 'pointer', color: 'var(--muted)', fontSize: 13, fontWeight: 600,
              fontFamily: 'var(--font)', marginBottom: 16, padding: '4px 0' }}>
            <ArrowLIc s={15} /> Volver al foro
          </button>

          {/* Tema */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)',
            padding: isMobile ? 18 : 28, marginBottom: 20, animation: 'fadeUp .3s var(--ease-out)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <CatChip cat={cat} />
              {selected.pinned && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--warn)' }}>📌 Fijado</span>}
              <span style={{ fontSize: 12, color: 'var(--subtle)', marginLeft: 'auto' }}>{timeAgo(selected.created_at)}</span>
            </div>
            <h2 style={{ fontSize: isMobile ? 19 : 24, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.3, marginBottom: 14 }}>
              {selected.title}
            </h2>
            <p style={{ fontSize: 14.5, color: 'var(--text-sec)', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 18 }}>
              {selected.body}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
              <Avatar name={selected.author_name} avatar={selected.author_avatar} size={32} />
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginRight: 8 }}>{selected.author_name}</span>
                <RoleTag role={selected.author_role} />
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                {isAdmin && (
                  <button onClick={(e) => togglePin(selected, e)} aria-label={selected.pinned ? 'Desfijar tema' : 'Fijar tema'}
                    title={selected.pinned ? 'Desfijar tema' : 'Fijar en inicio'}
                    style={{ background: selected.pinned ? 'var(--warn-bg)' : 'var(--bg)', border: '1.5px solid',
                      borderColor: selected.pinned ? 'var(--warn)' : 'var(--border)', cursor: 'pointer',
                      width: 30, height: 30, minHeight: 30, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>
                    📌
                  </button>
                )}
                {canModerate(selected.author_id) && (
                  <button onClick={() => deleteTopic(selected)} aria-label="Eliminar tema"
                    style={{ background: 'var(--error-bg)', border: 'none', cursor: 'pointer', width: 30, height: 30,
                      minHeight: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TrashIc s={14} c="var(--error)" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Respuestas */}
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sec)', textTransform: 'uppercase',
            letterSpacing: .8, marginBottom: 12 }}>
            {replies.length} respuesta{replies.length !== 1 ? 's' : ''}
          </div>
          {repliesLoading && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Skeleton h={72} r={14} /><Skeleton h={72} r={14} />
          </div>}
          {!repliesLoading && replies.length === 0 && (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--muted)', fontSize: 13,
              background: 'var(--white)', borderRadius: 'var(--r-lg)', border: '1px dashed var(--border)', marginBottom: 16 }}>
              Nadie ha respondido aún. ¡Sé la primera persona en aportar!
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {replies.map((r, i) => (
              <div key={r.id} style={{ background: 'var(--white)', borderRadius: 14, border: '1px solid var(--border)',
                padding: '14px 18px', animation: `fadeUp .3s ${Math.min(i, 8) * 50}ms var(--ease-out) both` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Avatar name={r.author_name} avatar={r.author_avatar} size={28} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>{r.author_name}</span>
                  <RoleTag role={r.author_role} />
                  <span style={{ fontSize: 11, color: 'var(--subtle)', marginLeft: 'auto', whiteSpace: 'nowrap' }}>{timeAgo(r.created_at)}</span>
                  {canModerate(r.author_id) && (
                    <button onClick={() => deleteReply(r)} aria-label="Eliminar respuesta"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, minHeight: 24,
                        display: 'flex', alignItems: 'center' }}>
                      <TrashIc s={13} c="var(--subtle)" />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: 14, color: 'var(--text-sec)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{r.body}</p>
              </div>
            ))}
          </div>

          {/* Composer */}
          <div style={{ background: 'var(--white)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', padding: 16 }}>
            <textarea value={replyBody} onChange={e => setReplyBody(e.target.value)}
              placeholder="Escribe tu aporte a la discusión..."
              rows={3} onFocus={focusInput} onBlur={blurInput}
              style={{ ...inputBase, resize: 'vertical', marginBottom: 10 }} />
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Btn size="sm" onClick={addReply} disabled={posting || !replyBody.trim()}>
                {posting ? 'Publicando...' : 'Responder'}
              </Btn>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ---------- Vista lista de temas ----------
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: isMobile ? '16px 16px 40px' : '24px 24px 48px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          marginBottom: 18, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 800, color: 'var(--dark)',
              display: 'flex', alignItems: 'center', gap: 10 }}>
              <MsgIc s={24} c="var(--orange)" /> Comunidad educativa
            </h2>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>
              Discute temas educativos puntuales con docentes e instructores
            </p>
          </div>
          <Btn size="sm" onClick={() => setShowNew(true)} disabled={dbMissing}>
            <PlusIc s={15} /> Nuevo tema
          </Btn>
        </div>

        {dbMissing && (
          <div style={{ padding: '14px 18px', borderRadius: 12, background: 'var(--warn-bg)',
            border: '1px solid #FDE68A', fontSize: 13, color: '#92400E', marginBottom: 16 }}>
            ⚠️ El foro aún no está habilitado en la base de datos. Aplica la migración
            <code style={{ fontWeight: 700 }}> supabase/migrations/0009_forum_onboarding.sql</code> y recarga.
          </div>
        )}

        {/* Filtro de categorías */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 14,
          WebkitOverflowScrolling: 'touch' }}>
          {[{ id: 'all', name: 'Todos', icon: '🗂️', color: 'var(--orange)' }, ...CATEGORIES].map(c => {
            const active = activeCat === c.id
            return (
              <button key={c.id} onClick={() => setActiveCat(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', flexShrink: 0,
                  borderRadius: 'var(--r-full)', border: '1.5px solid', cursor: 'pointer',
                  borderColor: active ? 'var(--orange)' : 'var(--border)',
                  background: active ? 'var(--orange-bg)' : 'var(--white)',
                  color: active ? 'var(--orange)' : 'var(--text-sec)',
                  fontSize: 12.5, fontWeight: active ? 700 : 500, fontFamily: 'var(--font)',
                  transition: 'all .2s var(--ease-out)' }}>
                {c.icon} {c.name}
              </button>
            )
          })}
        </div>

        {/* Lista */}
        {loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Skeleton h={86} r={16} /><Skeleton h={86} r={16} /><Skeleton h={86} r={16} />
        </div>}

        {!loading && !dbMissing && visible.length === 0 && (
          <div style={{ padding: '56px 20px', textAlign: 'center', background: 'var(--white)',
            borderRadius: 'var(--r-lg)', border: '1px dashed var(--border)' }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>💬</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 4 }}>
              {activeCat === 'all' ? 'Aún no hay temas en el foro' : 'No hay temas en esta categoría'}
            </div>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 18 }}>
              Abre la primera discusión y gana tu insignia 💬 Voz de la Comunidad
            </p>
            <Btn size="sm" onClick={() => setShowNew(true)}><PlusIc s={15} /> Crear el primer tema</Btn>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visible.map((t, i) => {
            const cat = catById(t.category)
            return (
              <div key={t.id} onClick={() => openTopic(t)} className="hover-lift"
                style={{ background: 'var(--white)', borderRadius: 16, padding: isMobile ? '14px 16px' : '16px 20px',
                  border: t.pinned ? '1.5px solid var(--orange-pale)' : '1px solid var(--border)',
                  cursor: 'pointer', animation: `fadeUp .35s ${Math.min(i, 10) * 40}ms var(--ease-out) both`,
                  position: 'relative' }}>
                {isAdmin && (
                  <button onClick={(e) => togglePin(t, e)} aria-label={t.pinned ? 'Desfijar' : 'Fijar'}
                    title={t.pinned ? 'Desfijar tema' : 'Fijar en inicio'}
                    style={{ position: 'absolute', top: 10, right: 10, background: t.pinned ? 'var(--warn-bg)' : 'var(--bg)',
                      border: '1.5px solid', borderColor: t.pinned ? 'var(--warn)' : 'var(--border)',
                      cursor: 'pointer', width: 26, height: 26, borderRadius: 8, zIndex: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                      opacity: t.pinned ? 1 : 0.4, transition: 'opacity .2s' }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = t.pinned ? 1 : 0.4}>
                    📌
                  </button>
                )}
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <Avatar name={t.author_name} avatar={t.author_avatar} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                      {t.pinned && <span style={{ fontSize: 12 }}>📌</span>}
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)', lineHeight: 1.35 }}>{t.title}</h3>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 8,
                      display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.body}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <CatChip cat={cat} small />
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-sec)' }}>{t.author_name}</span>
                      <RoleTag role={t.author_role} />
                      <span style={{ fontSize: 11, color: 'var(--subtle)' }}>· {timeAgo(t.created_at)}</span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 'auto',
                        fontSize: 12, fontWeight: 700, color: t.replyCount > 0 ? 'var(--orange)' : 'var(--subtle)' }}>
                        <MsgIc s={13} c="currentColor" /> {t.replyCount}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal nuevo tema */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Nuevo tema de discusión" width={600}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>Título</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={160}
              placeholder="Ej: ¿Cómo aplicar el DCE en grupos numerosos?"
              onFocus={focusInput} onBlur={blurInput} style={inputBase} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>Categoría</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CATEGORIES.map(c => {
                const active = category === c.id
                return (
                  <button key={c.id} onClick={() => setCategory(c.id)} type="button"
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px',
                      borderRadius: 'var(--r-full)', border: '1.5px solid', cursor: 'pointer',
                      borderColor: active ? c.color : 'var(--border)',
                      background: active ? c.color + '18' : 'var(--white)',
                      color: active ? c.color : 'var(--text-sec)',
                      fontSize: 12, fontWeight: active ? 700 : 500, fontFamily: 'var(--font)',
                      transition: 'all .15s' }}>
                    {c.icon} {c.name}
                  </button>
                )
              })}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 6, display: 'block' }}>Contenido</label>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={6} maxLength={5000}
              placeholder="Plantea tu pregunta o tema de discusión. Sé específico para recibir mejores aportes."
              onFocus={focusInput} onBlur={blurInput}
              style={{ ...inputBase, resize: 'vertical' }} />
          </div>
          {formError && (
            <div style={{ padding: '10px 14px', borderRadius: 'var(--r-sm)', background: 'var(--error-bg)',
              color: 'var(--error)', fontSize: 13, fontWeight: 500, animation: 'shake .4s ease' }}>{formError}</div>
          )}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Btn variant="ghost" size="sm" onClick={() => setShowNew(false)}>Cancelar</Btn>
            <Btn size="sm" onClick={createTopic} disabled={posting}>
              {posting ? 'Publicando...' : 'Publicar tema'}
            </Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default ForumPage
