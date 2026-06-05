// SignInScreen.jsx — authentication entry. Full deep-jade immersive screen.
// No TopHeader / BottomTab — renders as sole child of PhoneFrame.

function SignInScreen({ onSignIn }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      background: 'linear-gradient(175deg, #0C2318 0%, #103029 42%, #0A1F18 100%)',
    }}>
      <StatusBar/>

      {/* Center block */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 36px',
      }}>

        {/* King badge */}
        <div style={{
          width: 76, height: 76, borderRadius: 22,
          background: 'linear-gradient(160deg, var(--accent-light) 0%, var(--accent) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 44, color: 'var(--accent-ink)', lineHeight: 1,
          boxShadow: '0 0 40px rgba(248,181,0,0.45), 0 8px 22px rgba(0,0,0,0.32)',
          marginBottom: 20,
        }}>♚</div>

        <div style={{
          fontFamily: "'Cinzel','Noto Serif TC',serif",
          fontSize: 32, fontWeight: 900, color: 'var(--ink-on-deep)',
          letterSpacing: '0.08em', marginBottom: 6,
        }}>GAMBIT</div>

        <div style={{
          fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif",
          fontSize: 14, color: 'var(--ink-on-deep-dim)',
          letterSpacing: '0.22em', marginBottom: 52,
        }}>棋 局 即 道 場</div>

        {/* Sign-in buttons */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 11 }}>

          {/* Apple */}
          <button className="g-press" onClick={onSignIn} style={{
            width: '100%', padding: '14px 20px', border: 'none', borderRadius: 13,
            background: '#fff', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 15, color: '#1c1c1e',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.35.76 3.16.8 1.2-.24 2.35-.94 3.62-.85 1.54.12 2.69.73 3.44 1.89-3.15 1.89-2.49 5.72.71 6.97-.57 1.5-1.3 2.99-2.93 4.07zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
            </svg>
            以 Apple 帳號登入
          </button>

          {/* Google */}
          <button className="g-press" onClick={onSignIn} style={{
            width: '100%', padding: '14px 20px', borderRadius: 13,
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.16)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            fontFamily: 'var(--font-sans)', fontWeight: 600, fontSize: 15,
            color: 'var(--ink-on-deep)',
          }}>
            <svg width="17" height="17" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            以 Google 帳號登入
          </button>

          {/* Email text link */}
          <button className="g-press" onClick={onSignIn} style={{
            width: '100%', padding: '12px 20px', border: 'none',
            background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 14,
            color: 'var(--ink-on-deep-dim)',
          }}>
            <IconMail size={15} stroke="var(--ink-on-deep-dim)"/>
            使用電子郵件登入
          </button>
        </div>
      </div>

      {/* Footer — guest */}
      <div style={{ padding: '0 36px 38px', textAlign: 'center' }}>
        <button className="g-press" onClick={onSignIn} style={{
          border: 'none', background: 'transparent', cursor: 'pointer',
          fontFamily: 'var(--font-sans)', fontSize: 12,
          color: 'var(--ink-on-deep-dim)', opacity: 0.5,
        }}>以訪客身份繼續瀏覽</button>
      </div>
    </div>
  );
}

Object.assign(window, { SignInScreen });
