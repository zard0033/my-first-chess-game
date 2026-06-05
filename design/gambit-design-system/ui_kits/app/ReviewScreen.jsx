// ReviewScreen.jsx — full-width board + merged DarkPanel eval+nav card.

const { useState: useStateR } = React;
const REVIEW_FEN = 'r1bq1rk1/pp3pbp/2np1np1/2p1p3/2B1P3/2NP1N1P/PPP2PP1/R1BQ1RK1';
const BOARD_W = 368; // PhoneFrame inner width

const PLIES = [
  { no: '10.O-O', eval: 0.3,  best: 'O-O',  key: false },
  { no: '10…b5',  eval: 0.5,  best: 'a6',   key: false },
  { no: '11.Bb3', eval: 0.4,  best: 'Bb3',  key: false },
  { no: '11…Na5', eval: -0.2, best: 'O-O',  key: true  },
  { no: '12.c3',  eval: 0.6,  best: 'Nbd2', key: true  },
];

function ReviewScreen() {
  const [i, setI] = useStateR(4);
  const ply = PLIES[i];
  const keyIdx = PLIES.findIndex(p => p.key);

  const mag   = Math.abs(ply.eval);
  const sign  = ply.eval >= 0 ? '+' : '−';
  const side  = ply.eval >= 0 ? '白方' : '黑方';
  const word  = mag < 0.5 ? '均勢' : mag < 1.0 ? '稍優' : mag < 2.0 ? '佔優' : '勝勢';
  const share = Math.max(0.08, Math.min(0.92, 0.5 + ply.eval / 6));
  const verdictColor = ply.eval >= 0 ? 'var(--success)' : 'var(--danger)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 22 }}>

      {/* progress pill — padded */}
      <div style={{ padding: '12px 16px 10px', display: 'flex', justifyContent: 'center' }}>
        <Pill tone="cream">
          <IconRotate size={14}/>
          <span style={{ fontFamily: "'Cubic 11', monospace", fontSize: 12 }}>覆盤 · {i + 1} / 34</span>
        </Pill>
      </div>

      {/* board — full width */}
      <Chessboard
        fen={REVIEW_FEN}
        size={BOARD_W}
        coords
        highlights={ply.key ? { d2: 'gold' } : {}}
      />

      {/* ── Merged DarkPanel: engine output + nav ── */}
      <div style={{ padding: '12px 16px 0' }}>
        <DarkPanel>

          {/* top row: dim label + 關鍵一手 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{
              fontFamily: "'Cubic 11', monospace", fontSize: 10,
              letterSpacing: '0.12em', color: 'var(--ink-on-deep-dim)', textTransform: 'uppercase',
            }}>Engine Analysis</span>
            <button className="g-press" onClick={() => setI(keyIdx)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
              color: 'var(--accent-ink)', border: 'none', borderRadius: 8,
              padding: '6px 12px', fontFamily: 'var(--font-sans)', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
              boxShadow: '0 0 12px rgba(248,181,0,0.35)',
            }}>
              <IconZap size={14}/> 關鍵一手
            </button>
          </div>

          {/* eval number + verdict + best move */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
            <div>
              <div style={{
                fontFamily: "'Cubic 11', monospace", fontSize: 28,
                fontVariantNumeric: 'tabular-nums', color: '#C4F5E0', lineHeight: 1,
              }}>{sign}{mag.toFixed(1)}</div>
              <div style={{
                fontFamily: "'BIZ UDPMincho', 'Noto Serif TC', serif", fontWeight: 700,
                fontSize: 15, marginTop: 3,
                color: ply.eval >= 0 ? '#7FD4A8' : '#E08E79',
              }}>{side}{word}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10,
                color: 'var(--ink-on-deep-dim)', marginBottom: 4 }}>最佳著法</div>
              <div style={{ fontFamily: "'Cubic 11', monospace", fontSize: 18,
                color: 'var(--ink-on-deep)' }}>{ply.best}</div>
            </div>
          </div>

          {/* eval bar */}
          <div style={{
            background: 'rgba(0,0,0,0.2)', borderRadius: 999, padding: '2px',
            border: '1px solid rgba(255,255,255,0.07)', marginBottom: 5,
          }}>
            <div style={{ height: 10, borderRadius: 999, overflow: 'hidden', display: 'flex' }}>
              <div style={{
                width: `${share * 100}%`,
                background: 'linear-gradient(90deg, #DFC498, #CBA870)',
                transition: 'width var(--duration-base) var(--ease-standard)',
              }}/>
              <div style={{ width: 3, background: 'var(--accent)',
                boxShadow: '0 0 5px rgba(248,181,0,0.6)', flexShrink: 0 }}/>
              {/* black side: back to original eval-black token */}
              <div style={{ flex: 1, background: 'var(--eval-black)' }}/>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            fontFamily: 'var(--font-sans)', fontSize: 10,
            color: 'var(--ink-on-deep-dim)', marginBottom: 12 }}>
            <span>白優</span><span>黑優</span>
          </div>

          {/* divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }}/>

          {/* nav row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="g-press" onClick={() => setI(n => Math.max(0, n - 1))} style={navBtn}>
              <IconChevL size={18}/>
            </button>
            <button className="g-press" onClick={() => setI(n => Math.min(PLIES.length - 1, n + 1))} style={navBtn}>
              <IconChevR size={18}/>
            </button>
            <span style={{
              fontFamily: "'Cubic 11', monospace", fontSize: 14,
              color: 'var(--ink-on-deep)', fontVariantNumeric: 'tabular-nums', marginLeft: 4,
            }}>{ply.no}</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-sans)',
              fontSize: 11, color: 'var(--ink-on-deep-dim)' }}>
              {i + 1} / {PLIES.length}
            </span>
          </div>

        </DarkPanel>
      </div>
    </div>
  );
}

const navBtn = {
  width: 36, height: 32, borderRadius: 7,
  border: '1px solid rgba(255,255,255,0.15)',
  background: 'rgba(255,255,255,0.08)',
  color: 'var(--ink-on-deep)', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

Object.assign(window, { ReviewScreen });
