// NotFoundScreen.jsx — 404 / invalid route.
// Tipped king metaphor: "the game is over, find your way back".

function NotFoundScreen({ go }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '48px 32px', textAlign: 'center', minHeight: '100%',
    }}>

      {/* Tipped king */}
      <div style={{
        width: 88, height: 88, borderRadius: '50%',
        background: 'var(--surface-raised)',
        border: '1px solid var(--line)',
        boxShadow: 'var(--shadow-card)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 50, transform: 'rotate(90deg)',
        marginBottom: 28,
        color: 'var(--ink-faint)',
      }}>♚</div>

      <div style={{
        fontFamily: 'var(--font-num)',
        fontSize: 56, fontWeight: 700,
        color: 'var(--ink-faint)', lineHeight: 1,
        marginBottom: 10,
      }}>404</div>

      <div style={{
        fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif",
        fontSize: 20, fontWeight: 700, color: 'var(--ink)',
        marginBottom: 8,
      }}>找不到這個頁面</div>

      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: 14,
        color: 'var(--ink-muted)', lineHeight: 1.6,
        marginBottom: 36, maxWidth: 240,
      }}>看來這一步走到了棋盤之外。</div>

      <Button variant="jade" onClick={() => go('home')} style={{ gap: 8 }}>
        <IconHome size={16}/> 返回首頁
      </Button>

      <button className="g-press" onClick={() => go('learn')} style={{
        marginTop: 14, border: 'none', background: 'transparent', cursor: 'pointer',
        fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--primary)',
        fontWeight: 600,
      }}>繼續學習之路</button>
    </div>
  );
}

Object.assign(window, { NotFoundScreen });
