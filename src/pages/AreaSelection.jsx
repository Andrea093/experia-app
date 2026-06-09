import React from 'react'
import { useStore, nav, selectArea, AREAS } from '../store/store.jsx'
import { useMobile, Btn, Modal } from '../components/ui.jsx'

const AreaSelection = () => {
  const selectedArea = useStore(s => s.selectedArea);
  const [hovArea, setHovArea] = React.useState(null);
  const [pendingArea, setPendingArea] = React.useState(null);
  const isMobile = useMobile();
  if (selectedArea) { nav('map'); return null; }
  const pending = AREAS.find(a => a.id === pendingArea);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: isMobile ? 20 : 40, background: 'var(--bg)', overflow: 'auto' }}>
      <div style={{ maxWidth: 700, width: '100%', textAlign: 'center' }}>
        <div style={{ marginBottom: isMobile ? 24 : 36 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--orange)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 17 }}>C</div>
            <span style={{ fontWeight: 800, fontSize: 19, color: 'var(--dark)' }}>ceinfes<span style={{ color: 'var(--orange)' }}>.</span></span>
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight: 800, color: 'var(--dark)', marginBottom: 10, lineHeight: 1.2 }}>
            Elige tu área de aprendizaje
          </h1>
          <p style={{ fontSize: isMobile ? 13 : 15, color: 'var(--muted)', maxWidth: 480, margin: '0 auto' }}>
            Selecciona <strong>una sola área</strong> para personalizar tu ruta formativa en DCE.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(180px, 1fr))', gap: isMobile ? 10 : 14, marginBottom: 24 }}>
          {AREAS.map(area => {
            const isHov = hovArea === area.id;
            return (
              <button key={area.id} onClick={() => setPendingArea(area.id)}
                onMouseEnter={() => setHovArea(area.id)} onMouseLeave={() => setHovArea(null)}
                style={{
                  padding: isMobile ? '20px 12px' : '28px 20px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: isHov ? area.bg : 'var(--white)',
                  boxShadow: isHov ? `0 8px 24px ${area.color}25` : 'var(--sh-sm)',
                  transition: 'all .25s ease', transform: isHov ? 'translateY(-4px)' : 'none',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                  outline: isHov ? `2px solid ${area.color}` : '2px solid transparent',
                }}>
                <span style={{ fontSize: isMobile ? 28 : 36 }}>{area.icon}</span>
                <span style={{ fontSize: isMobile ? 12 : 15, fontWeight: 700, color: area.color }}>{area.name}</span>
              </button>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: 'var(--subtle)' }}>Puedes cambiar tu área más adelante desde tu perfil.</p>
      </div>

      <Modal open={!!pendingArea} onClose={() => setPendingArea(null)} title="Confirmar selección" width={400}>
        {pending && (
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: 44 }}>{pending.icon}</span>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--dark)', marginTop: 12, marginBottom: 8 }}>{pending.name}</h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.6 }}>
              ¿Confirmas esta área como tu ruta formativa? Podrás cambiarla más adelante desde tu perfil.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn variant="secondary" full onClick={() => setPendingArea(null)}>Cancelar</Btn>
              <Btn variant="primary" full onClick={() => { selectArea(pendingArea); setPendingArea(null); }}>Confirmar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AreaSelection;
