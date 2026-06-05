// DungeonScreen.jsx — 試煉道場
// Two views: 'map' (dungeon node path) → 'puzzle' (solving)

const { useState: useStateDS } = React;

const DIAMOND = 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';

// ── Map nodes ─────────────────────────────────────────────────
const D_NODES = [
  { id: 1, cx: 184, cy: 370, state: 'done',    title: '初探試煉', sub: 'Level 1' },
  { id: 2, cx: 88,  cy: 292, state: 'done',    title: '棋子取奪', sub: 'Level 1' },
  { id: 3, cx: 260, cy: 212, state: 'current', title: '將軍格局', sub: 'Level 2' },
  { id: 4, cx: 92,  cy: 136, state: 'locked',  title: '兵法試煉', sub: 'Level 2' },
  { id: 5, cx: 240, cy: 58,  state: 'locked',  title: '大師挑戰', sub: 'Level 3' },
];

// ── Puzzle data ───────────────────────────────────────────────
const D_PUZZLES = [
  { level: 2, prompt: '白方走步，找出制勝著法',
    fen: 'r1bq1rk1/pp3pbp/2np1np1/2p1p3/2B1P3/2NP1N1P/PPP2PP1/R1BQ1RK1 w - - 0 13',
    hl: { d5: 'gold', c5: 'seiji' } },
  { level: 1, prompt: '白方走步，贏取對方子力',
    fen: 'rnbqkbnr/pp2pppp/3p4/2p5/3PP3/5N2/PPP2PPP/RNBQKB1R b KQkq - 0 3',
    hl: { d4: 'gold', c5: 'seiji' } },
  { level: 3, prompt: '白方走步，一步將死',
    fen: 'r1bqkb1r/pppp1Qpp/2n2n2/4p3/2B1P3/8/PPPP1PPP/RNB1K1NR b KQkq - 0 4',
    hl: { f7: 'gold' } },
];

// ── Dungeon Map ───────────────────────────────────────────────
function DungeonMap({ onEnter, streak }) {
  const W = 368, H = 430;
  const curIdx = D_NODES.findIndex(n => n.state === 'current');
  const solidPts = D_NODES.slice(0, curIdx + 1);
  const lockPts  = D_NODES.slice(curIdx);
  const toD = pts => pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.cx} ${p.cy}`).join(' ');
  const Rc = { done: 26, current: 30, locked: 24 };

  return (
    <div style={{ background: '#070909', position: 'relative', overflow: 'hidden' }}>

      {/* Subtle chess-grid hint */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'repeating-conic-gradient(rgba(255,255,255,.014) 0% 25%, transparent 0% 50%)',
        backgroundSize: '52px 52px',
        pointerEvents: 'none',
      }}/>

      {/* Header */}
      <div style={{
        position: 'relative', zIndex: 2,
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px 10px',
        borderBottom: '1px solid rgba(255,255,255,.05)',
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'rgba(248,181,0,.10)', border: '1px solid rgba(248,181,0,.22)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)',
        }}><IconShield size={15}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, letterSpacing: '.12em', color: 'rgba(248,181,0,.55)', textTransform: 'uppercase', marginBottom: 1 }}>試煉道場</div>
          <div style={{ fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--ink-on-deep-dim)' }}>選擇試煉關卡</div>
        </div>
        {streak > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(248,181,0,.12)', border: '1px solid rgba(248,181,0,.28)', borderRadius: 999, padding: '4px 10px' }}>
            <IconZap size={12} stroke="var(--accent)"/>
            <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, fontWeight: 700, color: 'var(--accent)' }}>{streak}</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ position: 'relative', width: W, height: H }}>
        <svg width={W} height={H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
          {/* Locked dashes */}
          <path d={toD(lockPts)} fill="none" stroke="rgba(255,255,255,.07)" strokeWidth="2" strokeDasharray="3 12" strokeLinecap="round"/>
          {/* Done glow */}
          <path d={toD(solidPts)} fill="none" stroke="rgba(248,181,0,.10)" strokeWidth="10" strokeLinecap="round"/>
          {/* Done gold dashes */}
          <path d={toD(solidPts)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="4 10" strokeLinecap="round" opacity=".8"/>
        </svg>

        {D_NODES.map(n => {
          const isDone    = n.state === 'done';
          const isCurrent = n.state === 'current';
          const isLocked  = n.state === 'locked';
          const R  = Rc[n.state];
          const Rr = R + 8;
          const isLeft = n.cx <= W / 2;

          return (
            <React.Fragment key={n.id}>
              {/* Socket */}
              <div style={{ position: 'absolute', left: n.cx - R, top: n.cy - R + 8, width: R * 2, height: R * 2, clipPath: DIAMOND, background: isDone ? '#3A2000' : isCurrent ? '#5A3200' : '#111311', opacity: isLocked ? .4 : .9 }}/>

              {/* Breathe ring */}
              {isCurrent && (
                <div className="g-breathe" style={{ position: 'absolute', left: n.cx - Rr, top: n.cy - Rr, width: Rr * 2, height: Rr * 2, clipPath: DIAMOND, background: 'var(--accent)', opacity: .45 }}/>
              )}

              {/* Face */}
              <div
                className={isCurrent ? 'g-press' : ''}
                onClick={isCurrent ? onEnter : undefined}
                style={{
                  position: 'absolute', left: n.cx - R, top: n.cy - R,
                  width: R * 2, height: R * 2, clipPath: DIAMOND,
                  background: isDone ? 'linear-gradient(150deg,#D49028,#8A5810)' : isCurrent ? 'linear-gradient(150deg,#FFC94D,#F8B500,#C87820)' : 'linear-gradient(150deg,#1A1C1A,#0E100E)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: isLocked ? .55 : 1, cursor: isCurrent ? 'pointer' : 'default',
                }}>
                {isDone    && <IconCheck size={14} stroke="rgba(255,220,150,.9)" sw={2.8}/>}
                {isCurrent && <span style={{ fontFamily: 'var(--font-num)', fontSize: 13, fontWeight: 700, color: '#1A0800', lineHeight: 1 }}>{n.id}</span>}
                {isLocked  && <IconLock size={11} stroke="rgba(255,255,255,.2)" sw={2}/>}
              </div>

              {/* CTA bubble for current */}
              {isCurrent && (
                <div className="g-press" onClick={onEnter} style={{
                  position: 'absolute', left: n.cx, top: n.cy - R - 40,
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(180deg,var(--accent-light),var(--accent))',
                  color: 'var(--accent-ink)', fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
                  padding: '6px 13px', borderRadius: 999,
                  boxShadow: '0 2px 12px rgba(248,181,0,.5)',
                  display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap', cursor: 'pointer',
                }}>
                  進入試煉 <IconArrowR size={12}/>
                  <div style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '4px solid var(--accent)', pointerEvents: 'none' }}/>
                </div>
              )}

              {/* Label */}
              <div style={{
                position: 'absolute', top: n.cy - 11,
                ...(isLeft ? { left: n.cx + R + 10 } : { right: W - n.cx + R + 10 }),
                whiteSpace: 'nowrap',
              }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'rgba(255,255,255,.28)', marginBottom: 1 }}>{n.sub}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'rgba(248,210,120,.9)' : isDone ? 'rgba(200,160,80,.7)' : 'rgba(255,255,255,.22)' }}>{n.title}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── Dungeon Puzzle ─────────────────────────────────────────────
function DungeonPuzzle({ onBack, streak, setStreak, total, setTotal }) {
  const [pidx,     setPidx]     = useStateDS(0);
  const [phase,    setPhase]    = useStateDS('idle');
  const [hintUsed, setHintUsed] = useStateDS(false);
  const puzzle = D_PUZZLES[pidx % D_PUZZLES.length];

  function handleHint()   { setHintUsed(true); setPhase('hint'); }
  function handleSubmit() { if (!hintUsed) setStreak(s => s + 1); else setStreak(0); setTotal(t => t + 1); setPhase('correct'); }
  function handleNext()   { setPidx(i => i + 1); setPhase('idle'); setHintUsed(false); }

  return (
    <div style={{ position: 'relative', background: '#070909', minHeight: '100%', paddingBottom: 24 }}>
      {/* Back + header */}
      <div style={{ background: '#0A0C0A', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <button className="g-press" onClick={onBack} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 2px', display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(248,181,0,.7)', fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 12 }}>
          <IconChevL size={16} stroke="rgba(248,181,0,.7)"/> 地圖
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: 'var(--font-num)', fontSize: 11, color: 'var(--ink-on-deep-dim)' }}>
          Level 2 · 第 {(pidx % D_PUZZLES.length) + 1} 題
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: streak > 0 ? 'rgba(248,181,0,.12)' : 'rgba(255,255,255,.05)', border: `1px solid ${streak > 0 ? 'rgba(248,181,0,.28)' : 'rgba(255,255,255,.07)'}`, borderRadius: 999, padding: '4px 9px' }}>
          <IconZap size={12} stroke={streak > 0 ? 'var(--accent)' : 'rgba(255,255,255,.25)'}/>
          <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, fontWeight: 700, color: streak > 0 ? 'var(--accent)' : 'rgba(255,255,255,.28)' }}>{streak}</span>
        </div>
      </div>

      <Chessboard fen={puzzle.fen} size={368} coords={true} highlights={puzzle.hl}/>

      <div style={{ padding: '10px 16px 0' }}>
        <DarkPanel>
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, letterSpacing: '.08em', color: 'var(--ink-on-deep-dim)', marginBottom: 4 }}>謎題 {(pidx % D_PUZZLES.length) + 1}</div>
            <div style={{ fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif", fontSize: 16, fontWeight: 700, color: 'var(--ink-on-deep)' }}>{puzzle.prompt}</div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,.08)', marginBottom: 12 }}/>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="g-press" onClick={handleHint} disabled={phase !== 'idle'} style={{ flex: 1, cursor: phase !== 'idle' ? 'default' : 'pointer', borderRadius: 10, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, opacity: phase !== 'idle' ? .4 : 1, background: 'linear-gradient(180deg,rgba(248,181,0,.18),rgba(160,100,0,.14))', borderTop: '1px solid rgba(248,181,0,.5)', borderLeft: '1px solid rgba(248,181,0,.22)', borderRight: '1px solid rgba(0,0,0,.15)', borderBottom: '1px solid rgba(0,0,0,.25)', color: '#F5D070' }}>
              <IconBulb size={16}/> 提示
            </button>
            <button className="g-press" onClick={handleSubmit} disabled={phase !== 'idle'} style={{ flex: 2, cursor: phase !== 'idle' ? 'default' : 'pointer', border: 'none', borderRadius: 10, padding: '11px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, opacity: phase !== 'idle' ? .4 : 1, background: phase !== 'idle' ? 'rgba(28,112,89,.22)' : 'var(--primary)', color: '#fff', boxShadow: phase !== 'idle' ? 'none' : 'var(--shadow-button)' }}>
              確認著法 <IconArrowR size={16}/>
            </button>
          </div>
        </DarkPanel>
      </div>

      {/* Solved overlay */}
      {phase === 'correct' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 50, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'linear-gradient(160deg,#1E4D3E,#142E26)', borderRadius: 20, padding: '28px 32px', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 12px 40px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, minWidth: 220 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(74,124,89,.25)', border: '2px solid var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconCheck size={28} stroke="var(--success)" sw={2.5}/>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif", fontSize: 22, fontWeight: 700, color: 'var(--ink-on-deep)' }}>{hintUsed ? '看了提示' : '正確！'}</div>
              {!hintUsed && streak > 1 && (
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--accent)', marginTop: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                  <IconZap size={14}/>{streak} 連殺
                </div>
              )}
              {hintUsed && <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--ink-on-deep-dim)', marginTop: 4 }}>連殺中斷，繼續加油</div>}
            </div>
            <Button variant="gold" onClick={handleNext} style={{ minWidth: 140 }}>下一題 <IconArrowR size={16}/></Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main DungeonScreen ────────────────────────────────────────
function DungeonScreen({ go }) {
  const [view,    setView]    = useStateDS('map');
  const [streak,  setStreak]  = useStateDS(0);
  const [total,   setTotal]   = useStateDS(0);

  if (view === 'map') {
    return <DungeonMap onEnter={() => setView('puzzle')} streak={streak}/>;
  }
  return (
    <DungeonPuzzle
      onBack={() => setView('map')}
      streak={streak} setStreak={setStreak}
      total={total}   setTotal={setTotal}
    />
  );
}

Object.assign(window, { DungeonScreen });
