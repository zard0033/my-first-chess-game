// App.jsx — Gambit shell. Routes all screens + modals + dungeon mode.

const { useState: useStateA } = React;

const ACTIVE_TAB = {
  home: 'home',
  learn: 'learn', lesson: 'learn',
  play: 'play',
  me: 'me', history: 'me', replay: 'me',
};

function Segmented({ value, onChange, options }) {
  return (
    <div style={{
      display: 'flex', gap: 4, background: 'var(--surface-raised)',
      borderRadius: 999, padding: 4, margin: '12px 16px 0',
    }}>
      {options.map(o => {
        const on = value === o.id;
        return (
          <button key={o.id} className="g-press" onClick={() => onChange(o.id)} style={{
            flex: 1, border: 'none', cursor: 'pointer', borderRadius: 999, padding: '7px 0',
            fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14,
            background: on ? 'var(--surface-card)' : 'transparent',
            color: on ? 'var(--ink)' : 'var(--ink-muted)',
            boxShadow: on ? 'var(--shadow-button)' : 'none',
            transition: 'background 150ms ease',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function App() {
  const [screen,     setScreen]     = useStateA('home');
  const [playMode,   setPlayMode]   = useStateA('game');
  const [learnMode,  setLearnMode]  = useStateA('course');
  const [setupOpen,  setSetupOpen]  = useStateA(false);
  const [learnSheet, setLearnSheet] = useStateA(null);

  function go(s) {
    if (s === 'gameSetup') { setSetupOpen(true); return; }
    setScreen(s);
  }

  const isSignIn  = screen === 'signin';
  const activeTab = ACTIVE_TAB[screen] || 'home';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      padding: 24, boxSizing: 'border-box',
    }}>
      <PhoneFrame>

        {isSignIn ? (
          <SignInScreen onSignIn={() => go('home')}/>
        ) : (
          <>
            <TopHeader/>

            {/* Scrollable content */}
            <div key={screen} style={{
              flex: 1, overflowY: 'auto',
              background: 'var(--surface-base)',
              position: 'relative',
            }}>
              {screen === 'home'  && <HomeScreen go={go}/>}

              {screen === 'learn' && (
                <>
                  {/* Sticky segmented — stays visible while scrolling */}
                  <div style={{
                    position: 'sticky', top: 0, zIndex: 10,
                    background: 'var(--surface-base)',
                    borderBottom: '1px solid var(--line-subtle)',
                    paddingBottom: 12,
                  }}>
                    <Segmented
                      value={learnMode} onChange={setLearnMode}
                      options={[{ id: 'course', label: '課程' }, { id: 'dungeon', label: '試煉' }]}
                    />
                  </div>
                  {learnMode === 'course'
                    ? <LearnScreen go={go} onChapterPreview={setLearnSheet}/>
                    : <DungeonScreen go={go}/>
                  }
                </>
              )}

              {screen === 'lesson'  && <LessonScreen go={go}/>}

              {screen === 'play' && (
                <>
                  <Segmented
                    value={playMode} onChange={setPlayMode}
                    options={[{ id: 'game', label: '對局' }, { id: 'review', label: '覆盤' }]}
                  />
                  {playMode === 'game' ? <GameScreen go={go}/> : <ReviewScreen/>}
                </>
              )}

              {screen === 'me'       && <ProfileScreen go={go}/>}
              {screen === 'history'  && <HistoryScreen go={go}/>}
              {screen === 'replay'   && <ReplayScreen go={go}/>}
              {screen === 'notfound' && <NotFoundScreen go={go}/>}

              {/* Game Setup Modal */}
              <GameSetupModal
                open={setupOpen}
                onClose={() => setSetupOpen(false)}
                onStart={() => { setScreen('play'); setPlayMode('game'); }}
              />
            </div>

            <BottomTab active={activeTab} onChange={(t) => go(t)}/>

            {/* LearnChapterSheet — outside scroll so it covers tab bar */}
            {learnSheet && (
              <LearnChapterSheet
                chapter={learnSheet}
                onClose={() => setLearnSheet(null)}
              />
            )}
          </>
        )}

      </PhoneFrame>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
