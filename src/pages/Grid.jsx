import React from 'react'
import {
  useStore, nav, submitProduct, resubmitProduct, returnSubmission, approveSubmission,
  dismissStudentMessage, AREAS, RUBRIC_CRITERIA,
  isRouteComplete, progressPct, gradeTotal, gradeMax,
} from '../store/store.jsx'
import {
  useMobile, LogoImg,
  CheckIc, FileIc, LockIc, ClockIc, UsersIc, XIc, PlusIc,
  Btn, Confetti, Modal,
} from '../components/ui.jsx'

// ---- File Drop Zone ----
const FileDrop = ({ label, fileName, onFile, accept }) => {
  const [dragOver, setDragOver] = React.useState(false);
  const inputRef = React.useRef(null);
  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer?.files?.[0]; if(f) onFile(f); };
  const handleChange = (e) => { const f=e.target.files?.[0]; if(f) onFile(f); };
  return (
    <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)}
      onDrop={handleDrop} onClick={()=>inputRef.current?.click()}
      style={{
        border:fileName?'2px solid var(--success)':dragOver?'2px dashed var(--orange)':'2px dashed var(--border)',
        borderRadius:16,padding:'28px 24px',textAlign:'center',cursor:'pointer',
        background:fileName?'#F0FDF4':dragOver?'var(--orange-bg)':'var(--white)',
        transition:'all .2s',minHeight:120,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',gap:8,
      }}
      onMouseEnter={e=>!fileName&&(e.currentTarget.style.borderColor='var(--orange-light)')}
      onMouseLeave={e=>!fileName&&!dragOver&&(e.currentTarget.style.borderColor='var(--border)')}>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} style={{display:'none'}}/>
      {fileName ? (<>
        <div style={{width:44,height:44,borderRadius:12,background:'#D1FAE5',display:'flex',alignItems:'center',justifyContent:'center'}}><CheckIc s={22} c="var(--success)"/></div>
        <span style={{fontSize:14,fontWeight:600,color:'var(--success)'}}>{label}</span>
        <span style={{fontSize:13,color:'var(--dark)',fontWeight:500,padding:'4px 12px',background:'var(--white)',borderRadius:8,border:'1px solid var(--border)'}}>{fileName}</span>
        <span style={{fontSize:11,color:'var(--muted)'}}>Clic para cambiar</span>
      </>) : (<>
        <div style={{width:44,height:44,borderRadius:12,background:'var(--bg-alt)',display:'flex',alignItems:'center',justifyContent:'center'}}><PlusIc s={22} c="var(--muted)"/></div>
        <span style={{fontSize:14,fontWeight:600,color:'var(--dark)'}}>{label}</span>
        <span style={{fontSize:12,color:'var(--muted)'}}>Arrastra o haz clic · Solo Word (.doc / .docx)</span>
      </>)}
    </div>
  );
};

const readFileAsDataURL = (file) => new Promise((resolve) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => resolve(null);
  reader.readAsDataURL(file);
});

const downloadFile = (name, data) => {
  if (!data) return;
  const link = document.createElement('a');
  link.href = data;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const isWordFile = (file) => {
  const ext = file.name.split('.').pop().toLowerCase();
  return ext === 'doc' || ext === 'docx';
};

// ---- Certificate ----
const CertificatePage = ({ submission, area }) => {
  const total = gradeTotal(submission.grade);
  const max = gradeMax();
  const pct = Math.round((total / max) * 100);
  const dateStr = new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  const isMobile = useMobile();

  return (
    <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '16px 12px 48px' : '32px 24px 60px', background: 'var(--bg)' }}>
      <style dangerouslySetInnerHTML={{ __html: `@media print { .no-print { display: none !important; } #cert-wrap { padding: 0 !important; } #certificate { box-shadow: none !important; } }` }} />
      <div id="cert-wrap" style={{ maxWidth: 720, margin: '0 auto' }}>
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isMobile ? 16 : 28, flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 2 }}>🎓 ¡Proyecto aprobado!</h2>
            <p style={{ fontSize: 13, color: 'var(--muted)' }}>Tu proyecto fue aprobado. Descarga o imprime tu certificado.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="secondary" size="sm" onClick={() => nav('map')}>Volver al mapa</Btn>
            <Btn variant="gradient" size="sm" onClick={() => window.print()}>🖨️ Descargar / Imprimir</Btn>
          </div>
        </div>
        <div id="certificate" style={{ background: 'white', border: isMobile ? '5px solid var(--orange)' : '8px solid var(--orange)', borderRadius: isMobile ? 16 : 24, padding: isMobile ? '32px 20px' : '56px 64px', textAlign: 'center', position: 'relative', boxShadow: 'var(--sh-xl)' }}>
          <div style={{ position: 'absolute', inset: 10, border: '2px solid #FADCBE', borderRadius: 16, pointerEvents: 'none' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 40 }}>
            <LogoImg h={44} />
            <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Experia · Formación Docente</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 4, color: 'var(--orange)', marginBottom: 12 }}>Certificado de Formación Docente</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: 'var(--dark)', lineHeight: 1.2, marginBottom: 8 }}>Diseño Centrado en Experiencias</h1>
          <div style={{ width: 80, height: 4, background: 'var(--gradient)', borderRadius: 2, margin: '0 auto 36px' }} />
          <p style={{ fontSize: 16, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.6 }}>Este certificado acredita que</p>
          <div style={{ fontSize: isMobile ? 26 : 40, fontWeight: 800, color: 'var(--dark)', marginBottom: 12, lineHeight: 1.2, padding: '0 8px' }}>{submission.studentName}</div>
          <p style={{ fontSize: 15, color: 'var(--text-sec)', marginBottom: 36, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 36px' }}>
            ha completado satisfactoriamente la formación docente en<br />
            <strong>Diseño Centrado en Experiencias (DCE)</strong>
          </p>
          {area && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '12px 30px', borderRadius: 100, background: area.bg, border: `2px solid ${area.color}40`, marginBottom: 40 }}>
              <span style={{ fontSize: 24 }}>{area.icon}</span>
              <span style={{ fontSize: 17, fontWeight: 700, color: area.color }}>Área: {area.name}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'stretch', gap: 0, marginBottom: 52, border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', maxWidth: 420, margin: '0 auto 52px' }}>
            {[
              { label: 'Puntuación', value: `${total}/${max}`, color: 'var(--success)' },
              { label: 'Logro', value: `${pct}%`, color: 'var(--orange)' },
              { label: 'Programa', value: 'DCE', color: 'var(--purple)' },
            ].map((item, i, arr) => (
              <div key={item.label} style={{ flex: 1, textAlign: 'center', padding: '18px 12px', borderRight: i < arr.length - 1 ? '1px solid var(--border)' : 'none', background: 'var(--bg)' }}>
                <div style={{ fontSize: 30, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginTop: 6 }}>{item.label}</div>
              </div>
            ))}
          </div>
          {submission.feedback && (
            <div style={{ padding: '14px 24px', borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--border)', marginBottom: 40, textAlign: 'left', maxWidth: 480, margin: '0 auto 40px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Comentario del instructor</div>
              <p style={{ fontSize: 13, color: 'var(--text-sec)', fontStyle: 'italic', lineHeight: 1.6 }}>"{submission.feedback}"</p>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end', marginTop: 8 }}>
            {[
              { label: dateStr, sub: 'Fecha de expedición' },
              { label: 'Instructor DCE', sub: 'CEINFES · Experia' },
            ].map((sig, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: 'var(--dark)', fontWeight: 600, marginBottom: 10 }}>{sig.label}</div>
                <div style={{ width: 200, height: 1, background: 'var(--border)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sig.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ---- Submission Status Badge ----
const SubStatusBadge = ({ sub }) => {
  if (sub.status === 'approved') return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: '#D1FAE5', color: 'var(--success)', whiteSpace: 'nowrap' }}>✅ Aprobado</span>
  );
  if (sub.status === 'returned') return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: '#FEF9E7', color: '#92400E', whiteSpace: 'nowrap' }}>↩️ Devuelto ({sub.returnCount}/2)</span>
  );
  if (sub.grade) return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: '#EFF6FF', color: '#1D4ED8', whiteSpace: 'nowrap' }}>{gradeTotal(sub.grade)}/{gradeMax()} pts</span>
  );
  return (
    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: '#FEF3C7', color: 'var(--warn)', whiteSpace: 'nowrap' }}>Pendiente</span>
  );
};

// ---- Submission Table ----
const SubTable = ({ subs, onGrade, onViewFile, saveFlash, onStudentClick }) => (
  <div style={{ borderRadius: 14, border: '1px solid var(--border)', background: 'var(--white)', overflow: 'hidden', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: 'var(--bg-alt)' }}>
          {['Estudiante', 'Institución', 'Archivos', 'Fecha', 'Estado', 'Acción'].map(h => (
            <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, textAlign: 'left', borderBottom: '1.5px solid var(--border)' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {subs.map(sub => {
          const area = AREAS.find(a => a.id === sub.area);
          const justSaved = saveFlash === sub.id;
          const isApproved = sub.status === 'approved';
          return (
            <tr key={sub.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background .15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: area?.bg || 'var(--bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: area?.color || 'var(--muted)', flexShrink: 0 }}>
                    {sub.studentName.charAt(0)}
                  </div>
                  <div>
                    <div onClick={() => onStudentClick?.({ name: sub.studentName, email: sub.studentEmail, avatar: sub.studentName?.charAt(0), area: sub.area })}
                      style={{ fontSize: 13, fontWeight: 600, color: onStudentClick ? 'var(--orange)' : 'var(--dark)',
                        cursor: onStudentClick ? 'pointer' : 'default', textDecoration: onStudentClick ? 'underline' : 'none' }}>
                      {sub.studentName}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{sub.studentEmail}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding: '12px 14px' }}>
                {sub.studentInstitution
                  ? <span style={{ fontSize: 12, color: 'var(--purple-deep)', fontWeight: 500, whiteSpace: 'nowrap' }}>🏫 {sub.studentInstitution}</span>
                  : <span style={{ fontSize: 12, color: 'var(--subtle)' }}>—</span>}
              </td>
              <td style={{ padding: '12px 14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { name: sub.rejillaName, data: sub.rejillaData, color: 'var(--orange)' },
                    { name: sub.preguntaName, data: sub.preguntaData, color: 'var(--purple)' },
                  ].map((f, i) => (
                    <button key={i} onClick={() => onViewFile(f.name, f.data)}
                      style={{ fontSize: 12, color: 'var(--dark)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 4, padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.color = f.color}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--dark)'}>
                      📄 {f.name} {f.data && <span style={{ fontSize: 9, color: 'var(--success)' }}>●</span>}
                    </button>
                  ))}
                </div>
              </td>
              <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{sub.date}</td>
              <td style={{ padding: '12px 14px' }}><SubStatusBadge sub={sub} /></td>
              <td style={{ padding: '12px 14px' }}>
                {isApproved ? (
                  <span style={{ fontSize: 12, color: 'var(--success)', fontWeight: 600 }}>Completado</span>
                ) : (
                  <Btn variant={sub.grade ? 'secondary' : 'primary'} size="sm" onClick={() => onGrade(sub)}>
                    {justSaved ? <><CheckIc s={14} c="var(--success)" /> Guardado</> : sub.grade || sub.status === 'returned' ? 'Revisar' : 'Evaluar'}
                  </Btn>
                )}
              </td>
            </tr>
          );
        })}
        {subs.length === 0 && <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>No hay entregas en esta área</td></tr>}
      </tbody>
    </table>
  </div>
);

// =============================================
// ---- Student Product Upload ----
// =============================================
const StudentProductUpload = () => {
  const user = useStore(s => s.user);
  const selectedArea = useStore(s => s.selectedArea);
  const submissions = useStore(s => s.submissions);
  const isMobile = useMobile();
  const completed = useStore(s => s.completed);
  const [rejillaFile, setRejillaFile] = React.useState(null);
  const [preguntaFile, setPreguntaFile] = React.useState(null);
  const [rejillaData, setRejillaData] = React.useState(null);
  const [preguntaData, setPreguntaData] = React.useState(null);
  const [submitted, setSubmitted] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [rejillaError, setRejillaError] = React.useState('');
  const [preguntaError, setPreguntaError] = React.useState('');

  const area = AREAS.find(a => a.id === selectedArea);
  const routeComplete = isRouteComplete(completed, selectedArea);
  const existingSub = submissions.find(s => s.studentEmail === user?.email && s.area === selectedArea);

  const handleRejilla = async (f) => {
    if (!isWordFile(f)) { setRejillaError('Solo se aceptan archivos Word (.doc o .docx)'); return; }
    setRejillaError('');
    setRejillaFile(f);
    const data = await readFileAsDataURL(f);
    setRejillaData(data);
  };
  const handlePregunta = async (f) => {
    if (!isWordFile(f)) { setPreguntaError('Solo se aceptan archivos Word (.doc o .docx)'); return; }
    setPreguntaError('');
    setPreguntaFile(f);
    const data = await readFileAsDataURL(f);
    setPreguntaData(data);
  };

  const handleSubmit = () => {
    if (!rejillaFile || !preguntaFile || !routeComplete) return;
    setSubmitting(true);
    setTimeout(() => {
      if (existingSub && existingSub.status === 'returned') {
        resubmitProduct(existingSub.id, rejillaFile.name, preguntaFile.name, rejillaData, preguntaData);
      } else {
        submitProduct(rejillaFile.name, preguntaFile.name, rejillaData, preguntaData);
      }
      setSubmitted(true); setShowSuccess(true); setSubmitting(false);
    }, 600);
  };

  const canSubmit = rejillaFile && preguntaFile && routeComplete && !rejillaError && !preguntaError;

  const WordNotice = () => (
    <div style={{ padding: '12px 16px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 16 }}>📝</span>
      <span style={{ fontSize: 13, color: '#1D4ED8', fontWeight: 500 }}>Solo se aceptan archivos en formato <strong>Word (.doc / .docx)</strong></span>
    </div>
  );

  if (existingSub && existingSub.status === 'approved') {
    return <CertificatePage submission={existingSub} area={area} />;
  }

  if (existingSub && existingSub.status === 'returned' && !submitted) {
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: '0 24px 40px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div style={{ marginTop: 32, marginBottom: 24, padding: '20px 24px', borderRadius: 16, background: '#FFFBEB', border: '2px solid var(--warn)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 26, flexShrink: 0 }}>↩️</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#92400E' }}>El instructor devolvió tu entrega para corrección</div>
                <div style={{ fontSize: 12, color: 'var(--warn)', fontWeight: 600, marginTop: 2 }}>
                  Devolución {existingSub.returnCount}/2
                  {existingSub.returnCount < 2 ? ' — Aún puedes recibir una devolución más si es necesario' : ' — Esta es tu última oportunidad de corrección'}
                </div>
              </div>
            </div>
            {existingSub.returnNotes && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'white', border: '1px solid #FCD34D', marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#92400E', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6 }}>Notas del instructor:</div>
                <p style={{ fontSize: 14, color: 'var(--dark)', lineHeight: 1.7 }}>{existingSub.returnNotes}</p>
              </div>
            )}
            {(existingSub.instrRejillaName || existingSub.instrPreguntaName) && (
              <div style={{ padding: '12px 16px', borderRadius: 10, background: '#EFF6FF', border: '1px solid #BFDBFE', marginTop: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 8 }}>📎 Archivos corregidos por el instructor:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {existingSub.instrRejillaName && (
                    <button onClick={() => downloadFile(existingSub.instrRejillaName, existingSub.instrRejillaData)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #BFDBFE', background: 'white', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, color: '#1D4ED8', fontWeight: 500, textAlign: 'left' }}>
                      📄 {existingSub.instrRejillaName}<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>↓ Descargar</span>
                    </button>
                  )}
                  {existingSub.instrPreguntaName && (
                    <button onClick={() => downloadFile(existingSub.instrPreguntaName, existingSub.instrPreguntaData)}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #BFDBFE', background: 'white', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 13, color: '#1D4ED8', fontWeight: 500, textAlign: 'left' }}>
                      📄 {existingSub.instrPreguntaName}<span style={{ fontSize: 11, color: 'var(--muted)', marginLeft: 4 }}>↓ Descargar</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Subir corrección</h2>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>Corrige tu trabajo y sube los archivos actualizados.</p>
          <WordNotice />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--orange)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
                Archivo de la Rejilla (corregido) {rejillaFile && <CheckIc s={16} c="var(--success)" />}
              </div>
              <FileDrop label="Archivo de la Rejilla" fileName={rejillaFile?.name} onFile={handleRejilla} accept=".doc,.docx" />
              {rejillaError && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6, fontWeight: 500 }}>{rejillaError}</p>}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--purple)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
                Archivo de la Pregunta (corregido) {preguntaFile && <CheckIc s={16} c="var(--success)" />}
              </div>
              <FileDrop label="Archivo de la Pregunta" fileName={preguntaFile?.name} onFile={handlePregunta} accept=".doc,.docx" />
              {preguntaError && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6, fontWeight: 500 }}>{preguntaError}</p>}
            </div>
          </div>
          <Btn variant="gradient" size="lg" full disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? 'Enviando corrección...' : canSubmit ? 'Enviar corrección' : `Adjunta ${!rejillaFile && !preguntaFile ? 'ambos archivos' : '1 archivo más'}`}
          </Btn>
        </div>
      </div>
    );
  }

  if (submitted || existingSub) {
    const sub = existingSub || submissions[submissions.length - 1];
    return (
      <div style={{ height: '100%', overflow: 'auto', padding: '0 24px 40px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {showSuccess && <Confetti onDone={() => setShowSuccess(false)} />}
          <div style={{ textAlign: 'center', marginTop: 40, marginBottom: 32 }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>
              {submitted ? '¡Corrección enviada!' : '¡Entrega realizada!'}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 8 }}>
              {submitted ? 'Tu corrección fue enviada. El instructor la revisará.' : 'Tu producto final ha sido enviado. El instructor lo revisará pronto.'}
            </p>
          </div>
          <div style={{ padding: '24px', borderRadius: 16, background: 'var(--white)', border: '1px solid var(--border)', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 16 }}>Resumen de entrega</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-alt)' }}>
                <FileIc s={18} c="var(--orange)" />
                <div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>Archivo de Rejilla</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{sub?.rejillaName}</div></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-alt)' }}>
                <FileIc s={18} c="var(--purple)" />
                <div><div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>Archivo de Pregunta</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{sub?.preguntaName}</div></div>
              </div>
              {area && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 10, background: area.bg, border: '1px solid ' + area.color + '30' }}>
                  <span style={{ fontSize: 18 }}>{area.icon}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: area.color }}>Área: {area.name}</span>
                </div>
              )}
            </div>
            {sub?.grade && (
              <div style={{ marginTop: 20, padding: '16px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--success)', marginBottom: 8 }}>
                  Calificación: {gradeTotal(sub.grade)}/{gradeMax()}
                </div>
                {sub.feedback && <p style={{ fontSize: 13, color: 'var(--text-sec)', fontStyle: 'italic' }}>"{sub.feedback}"</p>}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center' }}><Btn variant="secondary" onClick={() => nav('map')}>Volver al mapa</Btn></div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Producto Final</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>Adjunta tus dos archivos para completar la entrega.</p>
        </div>
        {!routeComplete && (
          <div style={{ padding: '18px 22px', borderRadius: 14, background: '#FEF2F2', border: '1.5px solid #FECACA', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <LockIc s={22} c="var(--error)" />
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--error)' }}>Ruta no completada</div>
              <p style={{ fontSize: 13, color: 'var(--text-sec)', marginTop: 2 }}>
                Debes completar todos los módulos y retos de tu ruta antes de poder entregar el producto final.
                Progreso: {progressPct(completed, selectedArea)}%
              </p>
            </div>
          </div>
        )}
        {area && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 12, background: area.bg, border: '1px solid ' + area.color + '30', marginBottom: 20 }}>
            <span style={{ fontSize: 24 }}>{area.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: area.color, textTransform: 'uppercase', letterSpacing: .5 }}>Área seleccionada</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--dark)' }}>{area.name}</div>
            </div>
          </div>
        )}
        <WordNotice />
        <div style={{ padding: '16px 20px', borderRadius: 12, background: 'var(--purple-bg)', borderLeft: '4px solid var(--purple)', marginBottom: 24 }}>
          <p style={{ fontSize: 13, color: 'var(--purple-deep)', lineHeight: 1.6 }}><strong>Instrucciones:</strong> Adjunta exactamente <strong>2 archivos</strong>:</p>
          <ol style={{ fontSize: 13, color: 'var(--purple-deep)', lineHeight: 1.8, paddingLeft: 20, marginTop: 8 }}>
            <li><strong>Archivo de la Rejilla</strong> — Tu rejilla pedagógica completa</li>
            <li><strong>Archivo de la Pregunta</strong> — La pregunta formulada para tu área</li>
          </ol>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28, opacity: routeComplete ? 1 : .5, pointerEvents: routeComplete ? 'auto' : 'none' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--orange)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</span>
              Archivo de la Rejilla {rejillaFile && <CheckIc s={16} c="var(--success)" />}
            </div>
            <FileDrop label="Archivo de la Rejilla" fileName={rejillaFile?.name} onFile={handleRejilla} accept=".doc,.docx" />
            {rejillaError && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6, fontWeight: 500 }}>{rejillaError}</p>}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 22, height: 22, borderRadius: 6, background: 'var(--purple)', color: '#fff', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</span>
              Archivo de la Pregunta {preguntaFile && <CheckIc s={16} c="var(--success)" />}
            </div>
            <FileDrop label="Archivo de la Pregunta" fileName={preguntaFile?.name} onFile={handlePregunta} accept=".doc,.docx" />
            {preguntaError && <p style={{ fontSize: 12, color: 'var(--error)', marginTop: 6, fontWeight: 500 }}>{preguntaError}</p>}
          </div>
        </div>
        <Btn variant="gradient" size="lg" full disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? 'Enviando...' : canSubmit ? 'Enviar producto final' : !routeComplete ? 'Completa tu ruta primero' : `Adjunta ${!rejillaFile && !preguntaFile ? 'ambos archivos' : '1 archivo más'}`}
        </Btn>
      </div>
    </div>
  );
};

// =============================================
// ---- Instructor Review Panel ----
// =============================================
export const InstructorDashboard = ({ onStudentClick }) => {
  const submissions = useStore(s => s.submissions);
  const isMobile = useMobile();
  const [activeInstitution, setActiveInstitution] = React.useState('all');
  const [activeArea, setActiveArea] = React.useState('all');
  const [gradeModal, setGradeModal] = React.useState(null);
  const [gradeValues, setGradeValues] = React.useState({});
  const [feedbackText, setFeedbackText] = React.useState('');
  const [returnNotes, setReturnNotes] = React.useState('');
  const [saveFlash, setSaveFlash] = React.useState(null);
  const [viewFile, setViewFile] = React.useState(null);
  const [instrRejillaFile, setInstrRejillaFile] = React.useState(null);
  const [instrRejillaData, setInstrRejillaData] = React.useState(null);
  const [instrPreguntaFile, setInstrPreguntaFile] = React.useState(null);
  const [instrPreguntaData, setInstrPreguntaData] = React.useState(null);

  const institutions = React.useMemo(() => {
    const set = new Set(submissions.map(s => s.studentInstitution || 'Sin institución'));
    return [...set].filter(Boolean).sort();
  }, [submissions]);

  const byInstitution = React.useMemo(() =>
    activeInstitution === 'all' ? submissions
      : submissions.filter(s => (s.studentInstitution || 'Sin institución') === activeInstitution),
  [submissions, activeInstitution]);

  const filtered = React.useMemo(() =>
    activeArea === 'all' ? byInstitution : byInstitution.filter(s => s.area === activeArea),
  [byInstitution, activeArea]);

  const grouped = React.useMemo(() => {
    const g = {};
    AREAS.forEach(a => { g[a.id] = []; });
    filtered.forEach(s => { if (g[s.area]) g[s.area].push(s); });
    return g;
  }, [filtered]);

  const byInstGroup = React.useMemo(() => {
    if (activeInstitution !== 'all') return null;
    const g = {};
    submissions.forEach(s => {
      const inst = s.studentInstitution || 'Sin institución';
      if (!g[inst]) { g[inst] = {}; AREAS.forEach(a => { g[inst][a.id] = []; }); }
      if (g[inst][s.area]) g[inst][s.area].push(s);
    });
    return g;
  }, [submissions, activeInstitution]);

  const totalCount    = filtered.length;
  const approvedCount = filtered.filter(s => s.status === 'approved').length;
  const returnedCount = filtered.filter(s => s.status === 'returned').length;
  const pendingCount  = filtered.filter(s => !s.status || s.status === 'pending').length;

  const openGradeModal = (sub) => {
    setGradeModal(sub.id);
    setGradeValues(sub.grade || {});
    setFeedbackText(sub.feedback || '');
    setReturnNotes('');
    setInstrRejillaFile(null); setInstrRejillaData(null);
    setInstrPreguntaFile(null); setInstrPreguntaData(null);
  };

  const flash = (id) => { setSaveFlash(id); setTimeout(() => setSaveFlash(null), 1800); };

  const handleReturn = () => {
    if (!gradeModal || !returnNotes.trim()) return;
    returnSubmission(gradeModal, returnNotes.trim(),
      instrRejillaFile?.name || null, instrRejillaData || null,
      instrPreguntaFile?.name || null, instrPreguntaData || null);
    flash(gradeModal);
    setGradeModal(null);
    setInstrRejillaFile(null); setInstrRejillaData(null);
    setInstrPreguntaFile(null); setInstrPreguntaData(null);
  };

  const handleApprove = () => {
    if (!gradeModal) return;
    const grade = {};
    RUBRIC_CRITERIA.forEach(c => { grade[c.key] = gradeValues[c.key] || 0; });
    approveSubmission(gradeModal, grade, feedbackText);
    flash(gradeModal);
    setGradeModal(null);
  };

  const openFile = (name, data) => {
    if (data) { downloadFile(name, data); } else { setViewFile({ name, data: null }); }
  };

  const currentSub = submissions.find(s => s.id === gradeModal);
  const canReturn = currentSub && (currentSub.returnCount || 0) < 2 && currentSub.status !== 'approved';
  const rubricTotal = Object.values(gradeValues).reduce((a, b) => a + b, 0);

  return (
    <div style={{ height: '100%', overflow: 'auto', WebkitOverflowScrolling: 'touch', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: 'var(--dark)', marginBottom: 4 }}>Panel del Instructor</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)' }}>Revisa entregas, califica rúbricas y da retroalimentación</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total entregas', value: totalCount, color: 'var(--purple)', icon: <UsersIc s={18} c="var(--purple)" /> },
          { label: 'Aprobadas', value: approvedCount, color: 'var(--success)', icon: <CheckIc s={18} c="var(--success)" /> },
          { label: 'Devueltas', value: returnedCount, color: 'var(--warn)', icon: <span style={{ fontSize: 16 }}>↩️</span> },
          { label: 'Pendientes', value: pendingCount, color: 'var(--muted)', icon: <ClockIc s={18} c="var(--muted)" /> },
        ].map((st, i) => (
          <div key={i} style={{ padding: '16px 18px', borderRadius: 14, background: 'var(--white)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>{st.icon}
              <span style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 500 }}>{st.label}</span></div>
            <div style={{ fontSize: 28, fontWeight: 800, color: st.color }}>{st.value}</div>
          </div>
        ))}
      </div>
      {institutions.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>🏫 Institución</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => { setActiveInstitution('all'); setActiveArea('all'); }}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, background: activeInstitution === 'all' ? 'var(--dark)' : 'var(--bg-alt)', color: activeInstitution === 'all' ? '#fff' : 'var(--muted)' }}>
              Todas ({submissions.length})
            </button>
            {institutions.map(inst => {
              const count = submissions.filter(s => (s.studentInstitution || 'Sin institución') === inst).length;
              const isActive = activeInstitution === inst;
              return (
                <button key={inst} onClick={() => { setActiveInstitution(inst); setActiveArea('all'); }}
                  style={{ padding: '7px 14px', borderRadius: 8, border: isActive ? '1.5px solid var(--purple)' : '1px solid var(--border)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, background: isActive ? 'var(--purple-bg)' : 'var(--white)', color: isActive ? 'var(--purple)' : 'var(--muted)' }}>
                  🏫 {inst} ({count})
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        <button onClick={() => setActiveArea('all')} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, background: activeArea === 'all' ? 'var(--dark)' : 'var(--bg-alt)', color: activeArea === 'all' ? '#fff' : 'var(--muted)' }}>
          Todas ({totalCount})
        </button>
        {AREAS.map(a => {
          const count = grouped[a.id]?.length || 0;
          return <button key={a.id} onClick={() => setActiveArea(a.id)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, background: activeArea === a.id ? a.color + '18' : 'var(--bg-alt)', color: activeArea === a.id ? a.color : 'var(--muted)' }}>
            {a.icon} {a.name} ({count})
          </button>;
        })}
      </div>
      {activeInstitution === 'all' && activeArea === 'all' ? (
        byInstGroup && Object.keys(byInstGroup).length > 0
          ? Object.entries(byInstGroup).map(([inst, areaMap]) => {
              const instTotal = Object.values(areaMap).reduce((n, a) => n + a.length, 0);
              if (instTotal === 0) return null;
              return (
                <div key={inst} style={{ marginBottom: 32 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 16px', borderRadius: 12, background: 'var(--purple-bg)', border: '1px solid var(--purple-light)' }}>
                    <span style={{ fontSize: 20 }}>🏫</span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--purple-deep)', flex: 1 }}>{inst}</h3>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--purple)', background: 'var(--white)', padding: '2px 10px', borderRadius: 6, border: '1px solid var(--purple-light)' }}>{instTotal} entrega{instTotal !== 1 ? 's' : ''}</span>
                  </div>
                  {AREAS.map(area => {
                    const subs = areaMap[area.id] || [];
                    if (subs.length === 0) return null;
                    return (
                      <div key={area.id} style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                          <span style={{ fontSize: 16 }}>{area.icon}</span>
                          <span style={{ fontSize: 14, fontWeight: 700, color: area.color }}>{area.name}</span>
                          <span style={{ fontSize: 11, color: 'var(--muted)', background: 'var(--bg-alt)', padding: '1px 7px', borderRadius: 4 }}>{subs.length}</span>
                        </div>
                        <SubTable subs={subs} onGrade={openGradeModal} onViewFile={openFile} saveFlash={saveFlash} />
                      </div>
                    );
                  })}
                </div>
              );
            })
          : <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--muted)', fontSize: 14 }}>No hay entregas registradas aún.</div>
      ) : activeArea === 'all' ? (
        AREAS.map(area => {
          const subs = grouped[area.id];
          if (!subs || subs.length === 0) return null;
          return (
            <div key={area.id} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 18 }}>{area.icon}</span>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: area.color }}>{area.name}</h3>
                <span style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--bg-alt)', padding: '2px 8px', borderRadius: 4 }}>{subs.length}</span>
              </div>
              <SubTable subs={subs} onGrade={openGradeModal} onViewFile={openFile} saveFlash={saveFlash} />
            </div>
          );
        })
      ) : (
        <SubTable subs={filtered} onGrade={openGradeModal} onViewFile={openFile} saveFlash={saveFlash} />
      )}
      <Modal open={!!gradeModal} onClose={() => setGradeModal(null)} title="Evaluar Entrega" width={580}>
        {currentSub && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: 'var(--bg-alt)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--orange-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'var(--orange)' }}>{currentSub.studentName.charAt(0)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)' }}>{currentSub.studentName}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{currentSub.studentEmail}</div>
                {currentSub.studentInstitution && <div style={{ fontSize: 11, color: 'var(--purple)', fontWeight: 600, marginTop: 2 }}>🏫 {currentSub.studentInstitution}</div>}
              </div>
              {(currentSub.returnCount || 0) > 0 && <div style={{ padding: '4px 12px', borderRadius: 8, background: '#FEF9E7', border: '1px solid #FCD34D', fontSize: 12, fontWeight: 700, color: '#92400E', whiteSpace: 'nowrap' }}>↩️ Devuelto {currentSub.returnCount}/2</div>}
            </div>
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .8, marginBottom: 8 }}>Archivos entregados</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {[{ name: currentSub.rejillaName, data: currentSub.rejillaData, color: 'var(--orange)' }, { name: currentSub.preguntaName, data: currentSub.preguntaData, color: 'var(--purple)' }].map((f, i) => (
                  <button key={i} onClick={() => openFile(f.name, f.data)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: 12, fontWeight: 600, color: 'var(--dark)' }}>
                    <FileIc s={13} c={f.color} /> {f.name || '—'}
                    {f.data ? <span style={{ fontSize: 9, color: 'var(--success)', fontWeight: 700 }}>↗ Ver</span> : <span style={{ fontSize: 9, color: 'var(--subtle)' }}>sin datos</span>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 14 }}>Rúbrica de evaluación</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {RUBRIC_CRITERIA.map(cr => (
                <div key={cr.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{cr.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 700 }}>{gradeValues[cr.key] || 0}/5</span>
                  </div>
                  <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>{cr.desc}</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(v => (
                      <button key={v} onClick={() => setGradeValues(g => ({ ...g, [cr.key]: v }))}
                        style={{ width: 36, height: 36, borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 14, background: (gradeValues[cr.key] || 0) >= v ? 'var(--orange)' : 'var(--bg-alt)', color: (gradeValues[cr.key] || 0) >= v ? '#fff' : 'var(--muted)' }}>{v}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)', display: 'block', marginBottom: 6 }}>Retroalimentación general</label>
              <textarea value={feedbackText} onChange={e => setFeedbackText(e.target.value)} placeholder="Escribe retroalimentación para el estudiante..." rows={3}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid var(--border)', fontFamily: 'var(--font)', fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            {canReturn && (
              <div style={{ padding: '16px', borderRadius: 12, background: '#FFFBEB', border: '1.5px solid #FCD34D', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>↩️ Devolver para corrección ({currentSub.returnCount || 0}/2 devoluciones usadas)</div>
                <textarea value={returnNotes} onChange={e => setReturnNotes(e.target.value)} placeholder="Ej: Revisar la formulación de la pregunta..." rows={3}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #FCD34D', fontFamily: 'var(--font)', fontSize: 13, resize: 'vertical', outline: 'none', background: 'white', boxSizing: 'border-box' }} />
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 8 }}>📎 Adjuntar archivos corregidos (opcional)</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 11, color: '#92400E', marginBottom: 4 }}>Rejilla corregida</div>
                      <FileDrop label="Rejilla (corregida)" fileName={instrRejillaFile?.name} accept=".doc,.docx"
                        onFile={async (f) => { if (!isWordFile(f)) return; setInstrRejillaFile(f); setInstrRejillaData(await readFileAsDataURL(f)); }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 11, color: '#92400E', marginBottom: 4 }}>Pregunta corregida</div>
                      <FileDrop label="Pregunta (corregida)" fileName={instrPreguntaFile?.name} accept=".doc,.docx"
                        onFile={async (f) => { if (!isWordFile(f)) return; setInstrPreguntaFile(f); setInstrPreguntaData(await readFileAsDataURL(f)); }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--dark)' }}>Total: {rubricTotal}/{gradeMax()}</span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn variant="secondary" size="sm" onClick={() => setGradeModal(null)}>Cancelar</Btn>
                {canReturn && (
                  <button onClick={handleReturn} disabled={!returnNotes.trim()}
                    style={{ padding: '8px 16px', borderRadius: 10, border: '1.5px solid #FCD34D', background: returnNotes.trim() ? '#FFFBEB' : 'var(--bg-alt)', color: returnNotes.trim() ? '#92400E' : 'var(--subtle)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 600, cursor: returnNotes.trim() ? 'pointer' : 'not-allowed' }}>
                    ↩️ Devolver para corrección
                  </button>
                )}
                <Btn variant="gradient" size="sm" onClick={handleApprove}>✅ Aprobar proyecto</Btn>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!viewFile && !viewFile?.data} onClose={() => setViewFile(null)} title="Archivo" width={400}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📄</div>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 4 }}>{viewFile?.name}</p>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Este archivo fue registrado pero los datos no están disponibles en esta sesión.</p>
        </div>
      </Modal>
    </div>
  );
};

export default StudentProductUpload;
