// HistoryScreen.jsx — game history list (sub-screen, back → me/profile).

const HISTORY_GAMES = [
  { id: 1, opp: 'AI Lv.4', result: 'W', color: '執白', opening: '西西里防禦', date: '6月4日',  moves: 42 },
  { id: 2, opp: 'AI Lv.3', result: 'L', color: '執黑', opening: '倫敦體系',   date: '6月3日',  moves: 31 },
  { id: 3, opp: 'AI Lv.4', result: 'D', color: '執白', opening: '拿破崙開局', date: '6月2日',  moves: 67 },
  { id: 4, opp: 'AI Lv.2', result: 'W', color: '執黑', opening: '王翼棄兵',   date: '5月31日', moves: 28 },
  { id: 5, opp: 'AI Lv.5', result: 'L', color: '執白', opening: '西西里防禦', date: '5月30日', moves: 55 },
];

const RES_LABEL = { W: '勝', L: '負', D: '和' };
const RES_INK   = { W: 'var(--success)', L: 'var(--danger)', D: 'var(--ink-muted)' };
const RES_BG    = { W: 'var(--success-light)', L: 'var(--danger-light)', D: 'var(--surface-raised)' };

function HistoryScreen({ go }) {
  const wins   = HISTORY_GAMES.filter(g => g.result === 'W').length;
  const draws  = HISTORY_GAMES.filter(g => g.result === 'D').length;
  const losses = HISTORY_GAMES.filter(g => g.result === 'L').length;

  return (
    <div>

      {/* Sub-header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '13px 16px 10px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--line-subtle)',
      }}>
        <button className="g-press" onClick={() => go('me')} style={{
          border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 2px',
          display: 'flex', alignItems: 'center', gap: 3,
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
          color: 'var(--primary)',
        }}>
          <IconChevL size={17}/> 我的
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{
            fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif",
            fontSize: 17, fontWeight: 700, color: 'var(--ink)',
          }}>對局紀錄</span>
        </div>
        {/* Spacer to balance back button */}
        <div style={{ width: 56 }}></div>
      </div>

      {/* Stats summary — DarkPanel */}
      <div style={{ padding: '16px 18px 0' }}>
        <DarkPanel style={{ borderRadius: 14 }}>
          <div style={{ display: 'flex' }}>
            {[['勝', wins, '#7FD4A8'], ['和', draws, 'var(--ink-on-deep-dim)'], ['負', losses, '#E08E79']].map(([label, val, col]) => (
              <div key={label} style={{ flex: 1, textAlign: 'center', padding: '4px 0' }}>
                <div style={{
                  fontFamily: 'var(--font-num)', fontSize: 28, fontWeight: 700,
                  color: col, lineHeight: 1,
                }}>{val}</div>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: 11,
                  color: 'var(--ink-on-deep-dim)', marginTop: 5,
                }}>{label}</div>
              </div>
            ))}
          </div>
        </DarkPanel>
      </div>

      {/* Game list */}
      <div style={{ padding: '14px 18px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {HISTORY_GAMES.map(g => (
          <div key={g.id} className="g-press" onClick={() => go('replay')} style={{
            background: 'var(--surface-card)',
            borderTop:    '1px solid rgba(255,255,255,0.72)',
            borderRight:  '1px solid var(--line)',
            borderBottom: '1px solid var(--line-subtle)',
            borderLeft:   '1px solid var(--line)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
            cursor: 'pointer',
          }}>

            {/* Result badge */}
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: RES_BG[g.result],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontFamily: 'var(--font-num)', fontSize: 16, fontWeight: 700,
                color: RES_INK[g.result],
              }}>{RES_LABEL[g.result]}</span>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
                  {g.opp}
                </span>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-muted)' }}>
                  · {g.color}
                </span>
              </div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-muted)' }}>
                {g.opening} · {g.moves} 手
              </div>
            </div>

            {/* Date + arrow */}
            <div style={{ textAlign: 'right', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-faint)' }}>{g.date}</span>
              <IconChevR size={14} stroke="var(--ink-faint)"/>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

Object.assign(window, { HistoryScreen });
