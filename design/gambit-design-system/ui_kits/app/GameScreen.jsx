// GameScreen.jsx — full-width board, DarkPanel move list, no eval bar.

const { useState: useStateG } = React;
const GAME_FEN = 'r1bq1rk1/pp3pbp/2np1np1/2p1p3/2B1P3/2NP1N1P/PPP2PP1/R1BQ1RK1';
const PHONE_W = 368; // PhoneFrame inner width (390 - 11*2)

function GameScreen() {
  const [thinking, setThinking] = useStateG(true);
  const [hint, setHint] = useStateG(false);

  const moves = [
    { n: '10.', w: 'O-O', b: 'b5' },
    { n: '11.', w: 'Bb3', b: 'Na5' },
    { n: '12.', w: 'c3',  b: '', live: true },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingBottom: 22 }}>

      {/* turn badge — padded */}
      <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'center' }}>
        <button className="g-press" onClick={() => setThinking(t => !t)}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
          {thinking ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999,
              background: 'linear-gradient(180deg, #1E5043 0%, #183E35 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
              color: 'var(--ink-on-deep-dim)',
              fontFamily: "'Cubic 11', monospace", fontSize: 13, padding: '8px 16px',
              borderTop: '1px solid rgba(255,255,255,0.12)',
            }}>AI 思考中 <span className="g-dots" style={{ letterSpacing: 2 }}>●●●</span></span>
          ) : (
            <Pill tone="jade">
              <span style={{ width: 7, height: 7, borderRadius: 999, background: '#fff' }}/>
              輪到你
            </Pill>
          )}
        </button>
      </div>

      {/* board — full width, no side padding */}
      <Chessboard
        fen={GAME_FEN}
        size={PHONE_W}
        coords
        highlights={hint ? { d2: 'gold', f3: 'seiji' } : {}}
      />

      {/* DarkPanel: move list + actions */}
      <div style={{ padding: '12px 16px 0' }}>
        <DarkPanel>
          {/* move list */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
            fontFamily: "'Cubic 11', monospace", fontSize: 13,
            fontVariantNumeric: 'tabular-nums', marginBottom: 12,
          }}>
            {moves.map((m, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: 'var(--ink-on-deep-dim)', fontFamily: 'var(--font-sans)', fontSize: 11 }}>{m.n}</span>
                <span style={{ color: 'var(--ink-on-deep)' }}>{m.w}</span>
                {m.b && <span style={{ color: 'var(--ink-on-deep)' }}>{m.b}</span>}
                {m.live && (
                  <span style={{ background: 'var(--accent)', color: 'var(--accent-ink)',
                    fontWeight: 700, borderRadius: 5, padding: '1px 7px' }}>{m.w}</span>
                )}
              </span>
            ))}
            {hint && (
              <span style={{ marginLeft: 'auto', color: 'var(--hint)',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700 }}>
                試試 Nbd2
              </span>
            )}
          </div>

          {/* divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }}/>

          {/* action row — elevated buttons on dark bg */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="g-press" onClick={() => setHint(h => !h)} style={{
              flex: 1, cursor: 'pointer', borderRadius: 10, padding: '11px 0',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              /* amber tinted elevated button */
              background: hint
                ? 'linear-gradient(180deg, rgba(248,181,0,0.28) 0%, rgba(180,120,0,0.22) 100%)'
                : 'linear-gradient(180deg, rgba(248,181,0,0.18) 0%, rgba(160,100,0,0.14) 100%)',
              borderTop:    '1px solid rgba(248,181,0,0.55)',
              borderLeft:   '1px solid rgba(248,181,0,0.25)',
              borderRight:  '1px solid rgba(0,0,0,0.15)',
              borderBottom: '1px solid rgba(0,0,0,0.25)',
              color: '#F5D070',
              boxShadow: hint ? '0 0 12px rgba(248,181,0,0.2)' : 'none',
            }}>
              <IconBulb size={17}/> 提示
            </button>
            <button className="g-press" style={{
              flex: 1, cursor: 'pointer', borderRadius: 10, padding: '11px 0',
              fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              /* red tinted elevated button */
              background: 'linear-gradient(180deg, rgba(184,83,58,0.25) 0%, rgba(140,55,35,0.20) 100%)',
              borderTop:    '1px solid rgba(224,130,105,0.50)',
              borderLeft:   '1px solid rgba(184,83,58,0.25)',
              borderRight:  '1px solid rgba(0,0,0,0.15)',
              borderBottom: '1px solid rgba(0,0,0,0.25)',
              color: '#F0A080',
            }}>
              <IconFlag size={17}/> 認輸
            </button>
          </div>
        </DarkPanel>
      </div>
    </div>
  );
}

Object.assign(window, { GameScreen });
