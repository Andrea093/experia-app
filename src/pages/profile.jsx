import React from 'react'
import {
  useStore, nav, changeArea, updateAvatar, AREAS, BADGES, LEVELS,
  calcLevel, xpForNext, xpProgress, progressPct, isRouteComplete,
  getStudentModules, findModule, nodeStatus, gradeTotal, gradeMax,
} from '../store/store.jsx'
import { supabase } from '../lib/supabaseClient.js'
import {
  useMobile, LogoImg,
  HomeIc, BookIc, GameIc, FileIc, UserIc, LockIc, CheckIc, PlayIc,
  ArrowRIc, ArrowLIc, ChevRIc, StarIc, TrophyIc, ZapIc, AwardIc, BellIc,
  LogOutIc, ClockIc, XIc, PlusIc, TrashIc, EditIc, MenuIc, TargetIc,
  SettingsIc, BarIc, UsersIc, GripIc, MapIc, SchoolIc, UploadIc,
  Btn, ProgressRing, ProgressBar, AnimNum, Confetti, NotifManager,
  Modal, BadgeCard, StatChip, Stagger,
} from '../components/ui.jsx'
// =============================================
// EXPERIA — Profile Page
// =============================================

const ProfilePage = () => {
  const user = useStore(s => s.user);
  const xp = useStore(s => s.xp);
  const completed = useStore(s => s.completed);
  const badges = useStore(s => s.badges);
  const selectedArea = useStore(s => s.selectedArea);
  const level = calcLevel(xp);
  const pct = user?.role === 'student' ? progressPct(completed, selectedArea) : 0;
  const xpProg = xpProgress(xp);
  const nextLvl = xpForNext(xp);
  const prevLvl = LEVELS[level - 1] || 0;
  const area = AREAS.find(a => a.id === selectedArea);
  const allBadgeIds = Object.keys(BADGES);
  const isStudent = user?.role === 'student';

  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const fileInputRef = React.useRef(null);

  const isAvatarUrl = user?.avatar?.startsWith('http');

  const handleAvatarUpload = async (file) => {
    if (!file || !user?.id) return;
    if (!file.type.startsWith('image/')) { setUploadError('Solo se aceptan imágenes (JPG, PNG, WebP).'); return; }
    if (file.size > 3 * 1024 * 1024) { setUploadError('La imagen no puede superar 3 MB.'); return; }
    setUploadError('');
    setUploading(true);
    try {
      const ext = file.name.split('.').pop().toLowerCase();
      const path = `${user.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      updateAvatar(publicUrl + '?t=' + Date.now());
    } catch (e) {
      console.error('avatar upload:', e);
      setUploadError('Error al subir la foto. Intenta de nuevo.');
    }
    setUploading(false);
  };

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: '0 24px 40px' }}>
      {/* Header card */}
      <div style={{
        margin: '0 0 28px', padding: '32px', borderRadius: 20,
        background: 'var(--gradient)', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160,
          borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar with upload overlay */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(8px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 800, border: '3px solid rgba(255,255,255,.3)',
              overflow: 'hidden',
            }}>
              {isAvatarUrl
                ? <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : (user?.avatar || 'D')}
            </div>
            {/* Upload button overlay */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Cambiar foto de perfil"
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 24, height: 24, borderRadius: '50%',
                background: uploading ? 'var(--muted)' : 'var(--orange)',
                border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: uploading ? 'default' : 'pointer',
                fontSize: 11,
              }}>
              {uploading ? '⏳' : '📷'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(f); e.target.value = ''; }}
            />
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{user?.name || 'Usuario'}</h2>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,.7)' }}>{user?.email}</p>
            {uploadError && (
              <p style={{ fontSize: 12, color: '#FEE2E2', marginTop: 6 }}>{uploadError}</p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 12px',
                fontSize: 13, fontWeight: 600 }}>
                {isStudent ? `Nivel ${level}` : 'Instructor'}
              </div>
              {isStudent && <>
                <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 12px',
                  fontSize: 13, fontWeight: 600 }}>{xp} XP</div>
                <div style={{ background: 'rgba(255,255,255,.15)', borderRadius: 8, padding: '6px 12px',
                  fontSize: 13, fontWeight: 600 }}>{pct}% completado</div>
              </>}
            </div>
          </div>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 12 }}>
          Haz clic en el ícono 📷 para cambiar tu foto de perfil (JPG/PNG, máx. 3 MB)
        </p>
      </div>

      {/* Area (students only) */}
      {isStudent && area && (
        <div style={{
          padding: '16px 20px', borderRadius: 14, background: 'var(--white)',
          border: '1px solid var(--border)', marginBottom: 20,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 28 }}>{area.icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: .5 }}>
                Área de formación
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: area.color }}>{area.name}</div>
            </div>
          </div>
          <span style={{ fontSize: 11, color: 'var(--subtle)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <LockIc s={13} c="var(--subtle)" /> Asignada
          </span>
        </div>
      )}

      {/* Stats (students) */}
      {isStudent && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 28,
        }}>
          {[
            { label: 'Nivel actual', value: level, icon: <TargetIc s={22} c="var(--orange)" />, sub: `${Math.round(xpProg * 100)}% al siguiente` },
            { label: 'XP acumulado', value: xp, icon: <ZapIc s={22} c="var(--warn)" />, sub: `${nextLvl - xp} XP para nivel ${level + 1}` },
            { label: 'Módulos completados', value: completed.length + '/' + getStudentModules(selectedArea).length, icon: <BookIc s={22} c="var(--purple)" />, sub: `${pct}% del recorrido` },
            { label: 'Insignias ganadas', value: badges.length + '/' + allBadgeIds.length, icon: <AwardIc s={22} c="var(--success)" />, sub: `${allBadgeIds.length - badges.length} por desbloquear` },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '20px', borderRadius: 16, background: 'var(--white)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                {stat.icon}
                <span style={{ fontSize: 11, color: 'var(--subtle)', fontWeight: 500 }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--dark)' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* XP Progress (students) */}
      {isStudent && (
        <div style={{
          padding: '20px 24px', borderRadius: 16, background: 'var(--white)',
          border: '1px solid var(--border)', marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>Progreso de nivel</h3>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Nivel {level} → {level + 1}</span>
          </div>
          <ProgressBar pct={xpProg * 100} h={10} color="var(--orange)" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: 'var(--subtle)' }}>{prevLvl} XP</span>
            <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 600 }}>{xp} XP</span>
            <span style={{ fontSize: 12, color: 'var(--subtle)' }}>{nextLvl} XP</span>
          </div>
        </div>
      )}

      {/* Badges (students) */}
      {isStudent && (
        <div style={{
          padding: '24px', borderRadius: 16, background: 'var(--white)',
          border: '1px solid var(--border)', marginBottom: 28,
        }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 18 }}>Insignias</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, justifyContent: 'center' }}>
            {allBadgeIds.map(bid => (
              <BadgeCard key={bid} bid={bid} earned={badges.includes(bid)} size="md" />
            ))}
          </div>
        </div>
      )}

      {/* Activity */}
      <div style={{
        padding: '24px', borderRadius: 16, background: 'var(--white)',
        border: '1px solid var(--border)',
      }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)', marginBottom: 14 }}>
          {isStudent ? 'Actividad reciente' : 'Información de cuenta'}
        </h3>
        {isStudent ? (
          completed.length === 0 ? (
            <p style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic' }}>
              Aún no has completado actividades. ¡Comienza tu recorrido!
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {completed.map((cid, i) => {
                const m = findModule(cid);
                return m ? (
                  <div key={cid} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                    borderRadius: 10, background: 'var(--bg)',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: '#D1FAE5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}><CheckIc s={16} c="var(--success)" /></div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--dark)' }}>{m.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted)', display: 'block' }}>{m.subtitle} · +{m.xp} XP</span>
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          )
        ) : (
          <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>
            <p><strong>Rol:</strong> Instructor</p>
            <p style={{ marginTop: 4 }}><strong>Email:</strong> {user?.email}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
