import React from 'react'
import {
  useStore, INITIAL_INSTITUTIONS,
  createInstitution, updateInstitution, deleteInstitution
} from '../store/store.jsx'
import { useMobile, Btn, PlusIc, EditIc, TrashIc, Modal } from '../components/ui.jsx'

const SchoolsAdminPage = () => {
  const institutions = useStore(s => s.institutions || INITIAL_INSTITUTIONS);
  const accounts = useStore(s => s.accounts);
  const isMobile = useMobile();
  const [search, setSearch] = React.useState('');
  const [showCreate, setShowCreate] = React.useState(false);
  const [newName, setNewName] = React.useState('');
  const [nameError, setNameError] = React.useState('');
  const [editId, setEditId] = React.useState(null);
  const [editName, setEditName] = React.useState('');
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  const studentsByInst = React.useMemo(() => {
    const map = {};
    accounts.filter(a => a.role === 'student').forEach(a => {
      if (a.institution) map[a.institution] = (map[a.institution] || 0) + 1;
    });
    return map;
  }, [accounts]);

  const totalStudents = React.useMemo(() => accounts.filter(a => a.role === 'student').length, [accounts]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return institutions.filter(i => !q || i.name.toLowerCase().includes(q));
  }, [institutions, search]);

  const inputSt = (hasErr) => ({
    width:'100%', padding:'10px 14px', borderRadius:10, boxSizing:'border-box',
    border: hasErr ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
    fontFamily:'var(--font)', fontSize:14, outline:'none', background:'var(--white)',
  });

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) { setNameError('Nombre requerido'); return; }
    if (institutions.some(i => i.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Ya existe una institución con ese nombre'); return;
    }
    createInstitution(trimmed);
    setNewName(''); setNameError(''); setShowCreate(false);
  };

  const handleEditSave = () => {
    if (!editName.trim()) return;
    updateInstitution(editId, editName.trim());
    setEditId(null); setEditName('');
  };

  return (
    <div style={{ height:'100%', overflow:'auto', WebkitOverflowScrolling:'touch', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom:20 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight:800, color:'var(--dark)', marginBottom:4 }}>Gestión de Colegios</h2>
        <p style={{ fontSize:14, color:'var(--muted)' }}>Administra las instituciones educativas de la plataforma</p>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px, 1fr))', gap:12, marginBottom:20 }}>
        {[
          { label:'Colegios registrados', value:institutions.length, color:'var(--purple)' },
          { label:'Docentes registrados', value:totalStudents, color:'var(--orange)' },
        ].map((s,i) => (
          <div key={i} style={{ padding:'14px 18px', borderRadius:14, background:'var(--white)', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:26, fontWeight:800, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:12, color:'var(--muted)', marginTop:2, fontWeight:500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Search + create */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ flex:'1 1 200px', position:'relative', minWidth:180 }}>
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, pointerEvents:'none' }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar institución..."
            style={{ width:'100%', padding:'9px 14px 9px 36px', borderRadius:10, border:'1.5px solid var(--border)',
              fontFamily:'var(--font)', fontSize:13, outline:'none', boxSizing:'border-box', background:'var(--white)', transition:'border-color .2s' }}
            onFocus={e => e.target.style.borderColor = 'var(--orange)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'} />
        </div>
        <Btn variant="gradient" onClick={() => setShowCreate(true)}>
          <PlusIc s={16} c="#fff" /> Nueva institución
        </Btn>
      </div>

      {/* Institution list */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.length === 0 && (
          <div style={{ padding:40, textAlign:'center', color:'var(--muted)', fontSize:14,
            background:'var(--white)', borderRadius:14, border:'1px solid var(--border)' }}>
            {search ? 'No se encontraron instituciones.' : 'No hay instituciones registradas. Crea la primera.'}
          </div>
        )}
        {filtered.map(inst => {
          const count = studentsByInst[inst.name] || 0;
          return (
            <div key={inst.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 20px',
              borderRadius:14, background:'var(--white)', border:'1px solid var(--border)', transition:'box-shadow .2s' }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--sh-sm)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
              <div style={{ width:46, height:46, borderRadius:12, background:'var(--purple-bg)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>
                🏫
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--dark)', marginBottom:2,
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{inst.name}</div>
                <div style={{ fontSize:12, color:'var(--muted)' }}>
                  {count} docente{count !== 1 ? 's' : ''} registrado{count !== 1 ? 's' : ''}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                <button onClick={() => { setEditId(inst.id); setEditName(inst.name); }}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px', borderRadius:8,
                    border:'1.5px solid var(--border)', background:'var(--white)', color:'var(--text-sec)',
                    cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
                  <EditIc s={13} c="var(--muted)" />{isMobile ? '' : ' Editar'}
                </button>
                <button onClick={() => setDeleteConfirm(inst)}
                  style={{ display:'flex', alignItems:'center', gap:4, padding:'7px 12px', borderRadius:8,
                    border:'1.5px solid var(--error)', background:'none', color:'var(--error)',
                    cursor:'pointer', fontFamily:'var(--font)', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
                  <TrashIc s={13} c="var(--error)" />{isMobile ? '' : ' Eliminar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setNewName(''); setNameError(''); }} title="Nueva institución educativa" width={420}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
              Nombre de la institución
            </label>
            <input value={newName} onChange={e => { setNewName(e.target.value); setNameError(''); }}
              placeholder="Ej: IED San Francisco" style={inputSt(!!nameError)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()} autoFocus />
            {nameError && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{nameError}</p>}
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <Btn variant="secondary" full onClick={() => { setShowCreate(false); setNewName(''); setNameError(''); }}>Cancelar</Btn>
            <Btn variant="gradient" full onClick={handleCreate}>Crear institución</Btn>
          </div>
        </div>
      </Modal>

      {/* Edit modal */}
      <Modal open={!!editId} onClose={() => { setEditId(null); setEditName(''); }} title="Editar institución" width={420}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
              Nombre de la institución
            </label>
            <input value={editName} onChange={e => setEditName(e.target.value)}
              placeholder="Nombre de la institución" style={inputSt(false)}
              onKeyDown={e => e.key === 'Enter' && handleEditSave()} autoFocus />
          </div>
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <Btn variant="secondary" full onClick={() => { setEditId(null); setEditName(''); }}>Cancelar</Btn>
            <Btn variant="gradient" full disabled={!editName.trim()} onClick={handleEditSave}>Guardar cambios</Btn>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar institución" width={400}>
        {deleteConfirm && (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>⚠️</div>
            <p style={{ fontSize:14, color:'var(--text-sec)', lineHeight:1.6, marginBottom:8 }}>
              ¿Eliminar <strong>{deleteConfirm.name}</strong>?
            </p>
            {(studentsByInst[deleteConfirm.name] || 0) > 0 && (
              <div style={{ fontSize:12, color:'#92400E', padding:'10px 14px', borderRadius:10,
                background:'#FEF3C7', border:'1px solid #FDE68A', marginBottom:12, textAlign:'left' }}>
                ⚠️ Hay <strong>{studentsByInst[deleteConfirm.name]}</strong> docente(s) asociados. Sus cuentas <strong>no</strong> se eliminarán.
              </div>
            )}
            <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display:'flex', gap:10 }}>
              <Btn variant="secondary" full onClick={() => setDeleteConfirm(null)}>Cancelar</Btn>
              <Btn variant="danger" full onClick={() => { deleteInstitution(deleteConfirm.id); setDeleteConfirm(null); }}>Eliminar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SchoolsAdminPage;
