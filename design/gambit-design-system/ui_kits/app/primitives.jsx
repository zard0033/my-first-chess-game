// primitives.jsx — Gambit shared UI primitives.
// Updated: lighter navbar, DarkPanel elevation system, refined components.

const { useState } = React;

// ── Phone shell ────────────────────────────────────────────────
function PhoneFrame({ children }) {
  return (
    <div style={{
      width: 390, height: 844, borderRadius: 46, padding: 11,
      background: '#0b0b0c',
      boxShadow: '0 40px 90px rgba(16,48,41,0.30), 0 0 0 1px rgba(0,0,0,0.4), inset 0 0 0 2px #1c1c1f',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden',
        position: 'relative', display: 'flex', flexDirection: 'column',
        background: 'var(--surface-base)',
      }}>
        {children}
      </div>
    </div>
  );
}

// Status row
function StatusBar() {
  const c = 'var(--ink-on-deep)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 22px 2px', fontFamily: 'var(--font-num)',
    }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: c, letterSpacing: 0.3 }}>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><g fill="#E7F1EC">
          <rect x="0" y="7" width="3" height="4" rx="0.6"/><rect x="4.5" y="4.5" width="3" height="6.5" rx="0.6"/>
          <rect x="9" y="2.2" width="3" height="8.8" rx="0.6"/><rect x="13.5" y="0" width="3" height="11" rx="0.6"/></g></svg>
        <svg width="22" height="11" viewBox="0 0 24 12"><rect x="0.5" y="1" width="20" height="10" rx="2.5" fill="none" stroke="#E7F1EC" strokeOpacity="0.5"/><rect x="2" y="2.5" width="15" height="7" rx="1.3" fill="#E7F1EC"/><rect x="21.5" y="4" width="1.6" height="4" rx="0.8" fill="#E7F1EC" fillOpacity="0.6"/></svg>
      </div>
    </div>
  );
}

// Top header — lightened jade, top sheen for lift
function TopHeader() {
  return (
    <div style={{
      background: 'linear-gradient(180deg, #1E5043 0%, #183E35 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12)',
      paddingBottom: 12,
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <StatusBar />
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '4px 18px 0',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 19, color: 'var(--accent-ink)', boxShadow: '0 0 10px rgba(248,181,0,0.35)',
          }}>♚</span>
          <span style={{ fontFamily: "'Cinzel', 'Noto Serif TC', serif", fontWeight: 900, fontSize: 20, color: 'var(--ink-on-deep)', letterSpacing: '0.04em' }}>GAMBIT</span>
        </div>
        <button className="g-press" style={{
          border: 'none', background: 'transparent', cursor: 'pointer', padding: 6,
          color: 'var(--ink-on-deep-dim)',
        }} aria-label="設定"><IconGear size={22}/></button>
      </div>
    </div>
  );
}

// Bottom tab bar — lightened jade gradient
function BottomTab({ active, onChange }) {
  const tabs = [
    { id: 'home',  label: '首頁', Icon: IconHome },
    { id: 'learn', label: '學習', Icon: IconLearn },
    { id: 'play',  label: '對局', Icon: IconPlay },
    { id: 'me',    label: '我的', Icon: IconUser },
  ];
  return (
    <nav style={{
      display: 'flex', gap: 4,
      background: 'linear-gradient(180deg, #183E35 0%, #142F28 100%)',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
      padding: '8px 10px 26px', borderTop: '1px solid rgba(255,255,255,0.06)',
    }}>
      {tabs.map(({ id, label, Icon }) => {
        const on = active === id;
        return (
          <button key={id} onClick={() => onChange(id)} className="g-press" style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            padding: '8px 4px 7px', border: 'none', cursor: 'pointer', position: 'relative',
            borderRadius: 12, background: on ? 'var(--primary)' : 'transparent',
            color: on ? '#fff' : 'rgba(180,215,200,0.6)',
            fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: on ? 700 : 500,
            transition: 'background var(--duration-fast) var(--ease-standard)',
          }}>
            <Icon size={22}/>
            {label}
            {on && <span style={{
              position: 'absolute', bottom: -1, left: '30%', right: '30%', height: 3,
              borderRadius: 999, background: 'var(--accent)',
            }}/>}
          </button>
        );
      })}
    </nav>
  );
}

// ── DarkPanel — signature elevated dark-jade surface ──────────
// The global design language for system/engine/action surfaces.
// Elevation via: top bright border + bottom dark border + diagonal sheen.
// Use for: eval card, move list, AI badge area, key action blocks.
function DarkPanel({ children, style = {}, noPad }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #2A6654 0%, #1E4D3E 55%, #1A4238 100%)',
      borderRadius: 14,
      borderTop: '1px solid rgba(255,255,255,0.18)',
      borderLeft: '1px solid rgba(255,255,255,0.10)',
      borderRight: '1px solid rgba(0,0,0,0.15)',
      borderBottom: '1px solid rgba(0,0,0,0.25)',
      boxShadow: '0 6px 20px rgba(10,30,24,0.40), 0 2px 6px rgba(10,30,24,0.22)',
      padding: noPad ? 0 : '14px 15px',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      {/* diagonal top-left sheen — light source top-left */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: '55%', height: '50%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, transparent 100%)',
        pointerEvents: 'none', borderRadius: '14px 0 0 0',
      }}/>
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

// ── ChapterBadge — cream coin, jade glyph (shared across screens) ──────────
// Cream background + 2.5px gold ring + jade cardinal dots + jade chess glyph.
// On DarkPanel surfaces the cream pops; on cream Cards use size=52 for balance.
function ChapterBadge({ glyph = '♜', size = 60 }) {
  const d  = Math.round(size * 0.065);
  const c  = size / 2 - d / 2;
  const dots = [[c, 1], [size - d - 2, c], [c, size - d - 2], [1, c]];
  return (
    <div style={{
      position: 'relative', flexShrink: 0,
      width: size, height: size, borderRadius: '50%',
      background: 'var(--surface-card)',
      boxShadow: '0 0 0 2.5px var(--accent), 0 4px 14px rgba(61,34,16,.16), inset 0 1px 0 rgba(255,255,255,.9)',
    }}>
      {dots.map(([l, t], i) => (
        <div key={i} style={{
          position: 'absolute', left: l, top: t,
          width: d, height: d, borderRadius: '50%',
          background: 'var(--primary)', opacity: .5,
        }}/>
      ))}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontSize: Math.round(size * 0.52), lineHeight: 1,
          color: 'var(--primary)',
          textShadow: '0 1px 2px rgba(61,34,16,.12)',
        }}>{glyph}</span>
      </div>
    </div>
  );
}

// Button
function Button({ children, variant = 'jade', full, onClick, style = {}, ...rest }) {
  const base = {
    fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15,
    border: 'none', borderRadius: 'var(--radius-btn)', cursor: 'pointer',
    padding: '12px 20px', display: 'inline-flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, width: full ? '100%' : undefined,
  };
  const variants = {
    jade:  { background: 'var(--primary)', color: '#fff', boxShadow: 'var(--shadow-button)' },
    gold:  { background: 'linear-gradient(180deg, var(--accent-light), var(--accent))', color: 'var(--accent-ink)', boxShadow: '0 1px 2px rgba(61,34,16,.12), 0 0 14px rgba(248,181,0,.3)' },
    ghost: { background: 'transparent', color: 'var(--primary-dark)', border: '1.5px solid var(--line-strong)' },
    hint:  { background: 'var(--hint-light)', color: 'var(--hint)', border: '1.5px solid var(--hint-ring)' },
  };
  return (
    <button className="g-press" onClick={onClick} style={{ ...base, ...variants[variant], ...style }} {...rest}>
      {children}
    </button>
  );
}

// Card — cream surface with consistent elevation language (top-bright edge, warm lift shadow)
function Card({ children, accent, style = {}, onClick }) {
  return (
    <div onClick={onClick} className={onClick ? 'g-press' : ''} style={{
      background: 'var(--surface-card)',
      borderTop:    '1px solid rgba(255,255,255,0.72)',
      borderRight:  '1px solid var(--line)',
      borderBottom: '1px solid var(--line-subtle)',
      borderLeft:   accent ? '4px solid var(--primary)' : '1px solid var(--line)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: '0 6px 16px rgba(61,34,16,0.09), 0 2px 4px rgba(61,34,16,0.06), inset 0 1px 0 rgba(255,255,255,0.55)',
      padding: 16, cursor: onClick ? 'pointer' : undefined, ...style,
    }}>{children}</div>
  );
}

// Progress bar
function Progress({ value, total }) {
  const pct = Math.round((value / total) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--line-subtle)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: pct + '%', height: '100%', background: 'var(--primary)', borderRadius: 999, transition: 'width var(--duration-base) var(--ease-standard)' }}/>
      </div>
      <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--ink-muted)', fontVariantNumeric: 'tabular-nums' }}>{value}/{total}</span>
    </div>
  );
}

// Pill
function Pill({ children, tone = 'cream', style = {} }) {
  const tones = {
    jade:  { background: 'var(--primary)', color: '#fff', border: 'none' },
    deep:  { background: 'var(--surface-deep)', color: 'var(--ink-on-deep-dim)', border: 'none' },
    cream: { background: 'var(--surface-card)', color: 'var(--ink-muted)', border: '1px solid var(--line)' },
    hint:  { background: 'var(--hint-light)', color: 'var(--hint)', border: 'none' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999,
      padding: '6px 13px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 13,
      ...tones[tone], ...style,
    }}>{children}</span>
  );
}

Object.assign(window, {
  PhoneFrame, StatusBar, TopHeader, BottomTab,
  DarkPanel, Button, Card, Progress, Pill, ChapterBadge,
});
