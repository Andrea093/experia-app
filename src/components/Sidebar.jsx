import React from 'react'
import { useStore, nav, doLogout, AREAS } from '../store/store.jsx'
import {
  useMobile, LogoImg, MapIc, GameIc, FileIc, UserIc, BookIc,
  SchoolIc, BarIc, ClockIc, UsersIc, LogOutIc, XIc
} from './ui.jsx'

const Sidebar = React.memo(({ mobileOpen, onMobileClose }) => {
  const page = useStore(s => s.page);
  const isLoggedIn = useStore(s => s.isLoggedIn);
  const user = useStore(s => s.user);
  const selectedArea = useStore(s => s.selectedArea);
  const isMobile = useMobile();
  if (!isLoggedIn || !user) return null;

  const role = user.role;
  const area = AREAS.find(a => a.id === selectedArea);

  const studentItems = [
    { key: 'map', label: 'Mi formación', icon: <MapIc s={19} />, active: ['map','lesson','challenge'] },
    { key: 'games', label: 'Juegos', icon: <GameIc s={19} />, active: ['games'] },
    { key: 'grid', label: 'Entrega final', icon: <FileIc s={19} />, active: ['grid'] },
    { key: 'profile', label: 'Perfil', icon: <UserIc s={19} />, active: ['profile'] },
  ];
  const instructorItems = [
    { key: 'instructor-dashboard', label: 'Entregas',     icon: <FileIc s={19} />, active: ['instructor-dashboard'] },
    { key: 'instructor-stats',     label: 'Estadísticas', icon: <BarIc s={19} />,  active: ['instructor-stats'] },
    { key: 'instructor-route',     label: 'Ruta',         icon: <MapIc s={19} />,  active: ['instructor-route'] },
    { key: 'profile',              label: 'Perfil',       icon: <UserIc s={19} />, active: ['profile'] },
  ];
  const adminItems = [
    { key: 'admin-dashboard',  label: 'Usuarios',   icon: <UsersIc s={19} />, active: ['admin-dashboard'] },
    { key: 'admin-courses',    label: 'Cursos',     icon: <BookIc s={19} />,  active: ['admin-courses'] },
    { key: 'admin-schools',    label: 'Colegios',   icon: <SchoolIc s={19} />, active: ['admin-schools'] },
    { key: 'admin-analytics',  label: 'Analítica',  icon: <BarIc s={19} />,   active: ['admin-analytics'] },
    { key: 'admin-cohorts',    label: 'Cohortes',   icon: <ClockIc s={19} />, active: ['admin-cohorts'] },
    { key: 'profile',          label: 'Perfil',     icon: <UserIc s={19} />,  active: ['profile'] },
  ];
  const items = role === 'instructor' ? instructorItems : role === 'admin' ? adminItems : studentItems;

  const handleNav = (key) => {
    nav(key);
    if (isMobile && onMobileClose) onMobileClose();
  };

  const sidebarContent = (
    <aside style={{
      width: 'var(--sidebar-w)', height: '100%', background: 'var(--white)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'center', padding: '20px 22px 16px' }}>
        <LogoImg h={28} />
        {isMobile && (
          <button onClick={onMobileClose} style={{ background: 'var(--bg-alt)', border: 'none', cursor: 'pointer',
            width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XIc s={18} c="var(--muted)" />
          </button>
        )}
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        <div style={{ padding: '8px 12px', borderRadius: 8,
          background: role === 'admin' ? '#EDE9FE' : role === 'instructor' ? '#D1FAE5' : 'var(--purple-bg)',
          display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1,
            color: role === 'admin' ? '#7C3AED' : role === 'instructor' ? 'var(--success)' : 'var(--purple)' }}>
            {role === 'admin' ? 'Administrador' : role === 'instructor' ? 'Instructor' : 'Estudiante'}
          </span>
          {area && role === 'student' && (
            <span style={{ fontSize: 10, color: area.color, fontWeight: 600 }}>· {area.icon} {area.name}</span>
          )}
        </div>
      </div>

      <nav style={{ flex: 1, padding: '4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {items.map((item, i) => {
          const isActive = (item.active || [item.key]).includes(page);
          return (
            <button key={i} onClick={() => handleNav(item.key)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 10,
                border: 'none', cursor: 'pointer', background: isActive ? 'var(--orange-bg)' : 'transparent',
                color: isActive ? 'var(--orange)' : 'var(--text-sec)', fontFamily: 'var(--font)',
                fontSize: 14, fontWeight: isActive ? 600 : 500, transition: 'all .15s', textAlign: 'left', width: '100%',
                minHeight: 44 }}
              onMouseEnter={e => !isActive && (e.currentTarget.style.background = 'var(--bg-alt)')}
              onMouseLeave={e => !isActive && (e.currentTarget.style.background = 'transparent')}>
              {item.icon}{item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px', borderTop: '1px solid var(--border)' }}>
        <button onClick={doLogout} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
          borderRadius: 8, border: 'none', cursor: 'pointer', width: '100%', background: 'transparent',
          color: 'var(--muted)', fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, transition: 'color .2s',
          textAlign: 'left', minHeight: 44 }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--error)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
          <LogOutIc s={16} /> Cerrar sesión
        </button>
        <div style={{ fontSize: 9, color: 'var(--subtle)', textAlign: 'center', marginTop: 6, letterSpacing: .3 }}>
          {/* eslint-disable-next-line no-undef */}
          v{new Date(typeof __BUILD_TIME__ !== 'undefined' ? __BUILD_TIME__ : 0).toLocaleString('es-CO', { dateStyle:'short', timeStyle:'short' })}
        </div>
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        {mobileOpen && (
          <div onClick={onMobileClose} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 2999,
            backdropFilter: 'blur(2px)', animation: 'fadeIn .2s ease',
          }} />
        )}
        <div style={{
          position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 3000,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .3s cubic-bezier(.4,0,.2,1)',
          boxShadow: mobileOpen ? 'var(--sh-xl)' : 'none',
        }}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
});

export default Sidebar;
