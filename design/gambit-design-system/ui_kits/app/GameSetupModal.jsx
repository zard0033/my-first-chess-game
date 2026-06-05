// GameSetupModal.jsx — bottom-sheet modal for new game configuration.
// Two-zone: jade header + cream body (matches app's overall language).

const { useState: useStateGSM } = React;

const TIME_OPTS = [
  { val: '3',  label: '子彈', sub: '3 分鐘' },
  { val: '5',  label: '快棋', sub: '5 分鐘' },
  { val: '10', label: '標準', sub: '10 分鐘' },
  { val: '∞',  label: '無限', sub: '無計時' },
];

const COLOR_OPTS = [
  { val: 'white',  glyph: '♔', label: '執白' },
  { val: 'random', glyph: '⚖', label: '隨機' },
  { val: 'black',  glyph: '♚', label: '執黑' },
];

function GameSetupModal({ open, onClose, onStart }) {
  const [color, setColor] = useStateGSM('random');
  const [diff,  setDiff]  = useStateGSM(4);
  const [time,  setTime]  = useStateGSM('10');

  if (!open) return null;

  const bodyLabel = {
    fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
    letterSpacing: '.08em', textTransform: 'uppercase',
    color: 'var(--ink-muted)', marginBottom: 9,
  };

  return (
    /* Backdrop */
    <div
      style={{ position: 'absolute', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.55)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
      onClick={onClose}
    >
      {/* Sheet */}
      <div onClick={e => e.stopPropagation()} style={{ borderRadius: '20px 20px 0 0', overflow: 'hidden' }}>

        {/* ── JADE HEADER ZONE ── */}
        <div style={{
          background: 'linear-gradient(160deg, #2A6654 0%, #1E4D3E 55%, #1A4238 100%)',
          borderTop:  '1px solid rgba(255,255,255,.18)',
          borderLeft: '1px solid rgba(255,255,255,.10)',
          borderRight:'1px solid rgba(0,0,0,.15)',
          padding: '0 18px 16px',
        }}>
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 14px' }}>
            <div style={{ width: 38, height: 4, borderRadius: 999, background: 'rgba(255,255,255,.2)' }}/>
          </div>
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif", fontSize: 20, fontWeight: 700, color: 'var(--ink-on-deep)' }}>新對局設定</div>
            <button className="g-press" onClick={onClose} style={{ border: 'none', background: 'rgba(255,255,255,.10)', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-on-deep-dim)' }}>
              <IconX size={16}/>
            </button>
          </div>
        </div>

        {/* ── CREAM BODY ZONE ── */}
        <div style={{ background: '#FAF6F0', padding: '20px 18px 36px' }}>

          {/* 執子 */}
          <div style={{ marginBottom: 20 }}>
            <div style={bodyLabel}>執子</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLOR_OPTS.map(opt => {
                const on = color === opt.val;
                return (
                  <button key={opt.val} className="g-press" onClick={() => setColor(opt.val)} style={{
                    flex: 1, padding: '10px 6px', border: 'none', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    background: on ? 'var(--primary)' : 'var(--surface-raised)',
                    boxShadow: on ? 'var(--shadow-button), inset 0 1px 0 rgba(255,255,255,.15)' : 'none',
                    border: on ? 'none' : '1px solid var(--line)',
                    transition: 'background var(--duration-fast) var(--ease-standard)',
                  }}>
                    <span style={{ fontSize: 22, lineHeight: 1, color: on ? '#fff' : 'var(--ink-muted)' }}>{opt.glyph}</span>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: on ? '#fff' : 'var(--ink-muted)' }}>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 對手強度 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...bodyLabel, display: 'flex', justifyContent: 'space-between' }}>
              <span>對手強度</span>
              <span style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>Lv.{diff}</span>
            </div>
            <div style={{ display: 'flex', gap: 7 }}>
              {[1,2,3,4,5].map(lvl => {
                const on = diff === lvl;
                return (
                  <button key={lvl} className="g-press" onClick={() => setDiff(lvl)} style={{
                    flex: 1, padding: '10px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
                    fontFamily: 'var(--font-num)', fontSize: 15, fontWeight: 700,
                    background: on ? 'var(--primary)' : 'var(--surface-raised)',
                    border: on ? 'none' : '1px solid var(--line)',
                    color: on ? '#fff' : 'var(--ink-muted)',
                    boxShadow: on ? 'var(--shadow-button)' : 'none',
                    transition: 'background var(--duration-fast) var(--ease-standard)',
                  }}>{lvl}</button>
                );
              })}
            </div>
          </div>

          {/* 時間限制 */}
          <div style={{ marginBottom: 24 }}>
            <div style={bodyLabel}>時間限制</div>
            <div style={{ display: 'flex', gap: 7 }}>
              {TIME_OPTS.map(opt => {
                const on = time === opt.val;
                return (
                  <button key={opt.val} className="g-press" onClick={() => setTime(opt.val)} style={{
                    flex: 1, padding: '10px 4px', border: 'none', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    background: on ? 'var(--primary)' : 'var(--surface-raised)',
                    border: on ? 'none' : '1px solid var(--line)',
                    boxShadow: on ? 'var(--shadow-button)' : 'none',
                    transition: 'background var(--duration-fast) var(--ease-standard)',
                  }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: on ? '#fff' : 'var(--ink-muted)' }}>{opt.label}</span>
                    <span style={{ fontFamily: 'var(--font-num)', fontSize: 10, color: on ? 'rgba(255,255,255,.7)' : 'var(--ink-faint)' }}>{opt.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <Button variant="gold" full onClick={() => { onStart(); onClose(); }}>
            開始對局 <IconArrowR size={16}/>
          </Button>

        </div>
      </div>
    </div>
  );
}

Object.assign(window, { GameSetupModal });
