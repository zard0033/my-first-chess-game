// ReplayScreen.jsx — historical game replay (sub-screen, back → history).
// Playback only — no engine eval. FEN advances move-by-move.

const { useState: useStateRPL } = React;

const REPLAY_META = {
  white: 'Eason', black: 'AI Lv.4',
  result: '1-0', opening: '西西里防禦', date: '2026年6月4日',
};

const REPLAY_PLIES = [
  { san: '─',    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' },
  { san: 'e4',   fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1' },
  { san: 'c5',   fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2' },
  { san: 'Nf3',  fen: 'rnbqkbnr/pp1ppppp/8/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq - 1 2' },
  { san: 'd6',   fen: 'rnbqkbnr/pp2pppp/3p4/2p5/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 3' },
  { san: 'd4',   fen: 'rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3' },
  { san: 'cxd4', fen: 'rnbqkbnr/pp2pppp/3p4/8/3pP3/5N2/PPP2PPP/RNBQKB1R w KQkq - 0 4' },
  { san: 'Nxd4', fen: 'rnbqkbnr/pp2pppp/3p4/8/3NP3/8/PPP2PPP/RNBQKB1R b KQkq - 0 4' },
  { san: 'Nf6',  fen: 'rnbqkb1r/pp2pppp/3p1n2/8/3NP3/8/PPP2PPP/RNBQKB1R w KQkq - 1 5' },
  { san: '…',    fen: 'r1bq1rk1/pp3pbp/2np1np1/2p1p3/2B1P3/2NP1N1P/PPP2PP1/R1BQ1RK1 w - - 0 13' },
];

const LAST = REPLAY_PLIES.length - 1;

// Build move pairs (white + black) from plies[1..LAST-1]
function buildPairs(plies) {
  const pairs = [];
  for (let i = 1; i <= LAST - 1; i += 2) {
    pairs.push({
      no: Math.ceil(i / 2),
      w: plies[i]?.san, wi: i,
      b: plies[i + 1]?.san, bi: i + 1,
    });
  }
  return pairs;
}
const PAIRS = buildPairs(REPLAY_PLIES);

const NAV_BTN = {
  width: 36, height: 34, borderRadius: 8, border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.07)', color: 'var(--ink-on-deep)',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function ReplayScreen({ go }) {
  const [idx, setIdx] = useStateRPL(LAST);
  const ply = REPLAY_PLIES[idx];

  return (
    <div style={{ paddingBottom: 24 }}>

      {/* Sub-header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '13px 16px 10px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--line-subtle)',
      }}>
        <button className="g-press" onClick={() => go('history')} style={{
          border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 2px',
          display: 'flex', alignItems: 'center', gap: 3,
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
          color: 'var(--primary)',
        }}>
          <IconChevL size={17}/> 對局紀錄
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{
            fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif",
            fontSize: 17, fontWeight: 700, color: 'var(--ink)',
          }}>棋局重播</span>
        </div>
        <div style={{ width: 72 }}></div>
      </div>

      {/* Game meta strip */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px',
        background: 'var(--surface-card)', borderBottom: '1px solid var(--line-subtle)',
      }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-muted)' }}>白方</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{REPLAY_META.white}</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-num)', fontSize: 15, fontWeight: 700,
            color: 'var(--primary)', background: 'var(--primary-soft)',
            borderRadius: 999, padding: '4px 12px',
          }}>{REPLAY_META.result}</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--ink-faint)', marginTop: 3 }}>{REPLAY_META.opening}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-muted)' }}>黑方</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{REPLAY_META.black}</div>
        </div>
      </div>

      {/* Board — full width */}
      <Chessboard fen={ply.fen} size={368} coords={true}/>

      {/* DarkPanel: controls + move list */}
      <div style={{ padding: '12px 16px 0' }}>
        <DarkPanel>

          {/* Nav row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <button className="g-press" onClick={() => setIdx(0)} style={NAV_BTN}>
              <IconSkipBack size={15}/>
            </button>
            <button className="g-press" onClick={() => setIdx(n => Math.max(0, n - 1))} style={NAV_BTN}>
              <IconChevL size={17}/>
            </button>

            <div style={{ flex: 1, textAlign: 'center' }}>
              <span style={{
                fontFamily: 'var(--font-num)', fontSize: 14,
                color: 'var(--ink-on-deep)', fontVariantNumeric: 'tabular-nums',
              }}>
                {idx === 0 ? '開始' : idx === LAST ? '終局' : ply.san}
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 11,
                color: 'var(--ink-on-deep-dim)', marginLeft: 6,
              }}>{idx} / {LAST}</span>
            </div>

            <button className="g-press" onClick={() => setIdx(n => Math.min(LAST, n + 1))} style={NAV_BTN}>
              <IconChevR size={17}/>
            </button>
            <button className="g-press" onClick={() => setIdx(LAST)} style={NAV_BTN}>
              <IconSkipFwd size={15}/>
            </button>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }}/>

          {/* Move list */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 4px' }}>
            {PAIRS.map(p => (
              <React.Fragment key={p.no}>
                <span style={{
                  fontFamily: 'var(--font-num)', fontSize: 11,
                  color: 'var(--ink-on-deep-dim)', padding: '3px 2px',
                }}>{p.no}.</span>
                {[{ san: p.w, i: p.wi }, { san: p.b, i: p.bi }].map(({ san, i }) => san && (
                  <span key={i} className="g-press" onClick={() => setIdx(i)} style={{
                    fontFamily: 'var(--font-num)', fontSize: 13,
                    color: idx === i ? 'var(--accent-ink)' : 'var(--ink-on-deep)',
                    background: idx === i ? 'var(--accent)' : 'transparent',
                    borderRadius: 5, padding: '3px 6px', cursor: 'pointer',
                    fontWeight: idx === i ? 700 : 400,
                  }}>{san}</span>
                ))}
              </React.Fragment>
            ))}
          </div>

        </DarkPanel>
      </div>
    </div>
  );
}

Object.assign(window, { ReplayScreen });
