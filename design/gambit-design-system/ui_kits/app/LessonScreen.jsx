// LessonScreen.jsx — step-by-step lesson (sub-screen, back → learn).
// Lesson: 第 3 課 · 車的走法

const { useState: useStateLSN } = React;

const LSN_STEPS = [
  {
    title: '認識車',
    text: '車（Rook）是最具攻擊力的棋子之一。外型如古代城堡，能夠主宰整排或整列。',
    fen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
    hl: { d4: 'gold' },
  },
  {
    title: '橫向移動',
    text: '車可以在同一橫排任意滑動。只要路徑中沒有阻擋，它能一口氣走到邊界。',
    fen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
    hl: { d4: 'gold', a4: 'seiji', b4: 'seiji', c4: 'seiji', e4: 'seiji', f4: 'seiji', g4: 'seiji', h4: 'seiji' },
  },
  {
    title: '縱向移動',
    text: '同樣地，車也能在同一直列自由上下穿行，如同一條連通棋盤兩端的鐵軌。',
    fen: '8/8/8/8/3R4/8/8/8 w - - 0 1',
    hl: { d4: 'gold', d1: 'seiji', d2: 'seiji', d3: 'seiji', d5: 'seiji', d6: 'seiji', d7: 'seiji', d8: 'seiji' },
  },
  {
    title: '不能穿越棋子',
    text: '車無法跳過任何棋子。遇到敵方棋子可以吃掉它並停在那格；遇到己方棋子則須在前一格停下。',
    fen: '8/8/8/8/3R2p1/8/8/8 w - - 0 1',
    hl: { d4: 'gold', e4: 'seiji', f4: 'seiji', g4: 'played' },
  },
];

function LessonScreen({ go }) {
  const [step, setStep] = useStateLSN(0);
  const cur   = LSN_STEPS[step];
  const total = LSN_STEPS.length;
  const isLast = step === total - 1;
  const pct    = Math.round(((step + 1) / total) * 100);
  const BOARD  = 300;

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>

      {/* Sub-header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '13px 16px 10px',
        background: 'var(--surface-card)',
        borderBottom: '1px solid var(--line-subtle)',
      }}>
        <button className="g-press" onClick={() => go('learn')} style={{
          border: 'none', background: 'transparent', cursor: 'pointer', padding: '4px 2px',
          display: 'flex', alignItems: 'center', gap: 3,
          fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 13,
          color: 'var(--primary)',
        }}>
          <IconChevL size={17}/> 學習之路
        </button>
        <div style={{ flex: 1 }}></div>
        <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--ink-muted)' }}>
          {step + 1} / {total}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: 3, background: 'var(--line-subtle)' }}>
        <div style={{
          width: pct + '%', height: '100%', background: 'var(--primary)',
          transition: 'width var(--duration-base) var(--ease-standard)',
        }}/>
      </div>

      {/* Body */}
      <div style={{ padding: '18px 18px 0' }}>

        {/* Lesson eyebrow + title */}
        <div style={{
          fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
          letterSpacing: '0.14em', color: 'var(--primary-dark)', textTransform: 'uppercase',
          marginBottom: 4,
        }}>第 3 課 · 車的走法</div>

        <div style={{
          fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif",
          fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 18, lineHeight: 1.2,
        }}>{cur.title}</div>

        {/* Board — centred */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <Chessboard fen={cur.fen} size={BOARD} coords={true} highlights={cur.hl}/>
        </div>

        {/* Explanation */}
        <p style={{
          fontFamily: 'var(--font-lesson)', fontSize: 16, lineHeight: 1.75,
          color: 'var(--ink)', margin: 0,
        }}>{cur.text}</p>
      </div>

      {/* Nav row */}
      <div style={{ display: 'flex', gap: 10, padding: '20px 18px 24px' }}>
        {step > 0 && (
          <button className="g-press" onClick={() => setStep(s => s - 1)} style={{
            flexShrink: 0, border: '1.5px solid var(--line-strong)', borderRadius: 'var(--radius-btn)',
            background: 'transparent', cursor: 'pointer', padding: '12px 18px',
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
            color: 'var(--primary-dark)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <IconChevL size={15}/> 上一步
          </button>
        )}
        <Button
          variant={isLast ? 'gold' : 'jade'}
          full={step === 0}
          onClick={() => isLast ? go('learn') : setStep(s => s + 1)}
          style={{ flex: 1 }}
        >
          {isLast ? (
            <><IconCheck size={16}/> 完成課程</>
          ) : (
            <>下一步 <IconArrowR size={16}/></>
          )}
        </Button>
      </div>

    </div>
  );
}

Object.assign(window, { LessonScreen });
