// HomeScreen.jsx — dashboard. DarkPanel for New Game card. Elevated cream cards elsewhere.
// HeroBadge replaced by shared ChapterBadge (primitives.jsx).

function StatCard({ Icon, label, value, locked }) {
  return (
    <div style={{
      flex: 1,
      borderTop:    '1px solid rgba(255,255,255,0.68)',
      borderRight:  '1px solid var(--line)',
      borderBottom: '1px solid var(--line-subtle)',
      borderLeft:   '1px solid var(--line)',
      background: 'var(--surface-card)', borderRadius: 'var(--radius-card)',
      boxShadow: '0 4px 12px rgba(61,34,16,0.08), 0 1px 3px rgba(61,34,16,0.05), inset 0 1px 0 rgba(255,255,255,0.5)',
      padding: '12px 10px', textAlign: 'center', opacity: locked ? 0.55 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'center', color: locked ? 'var(--ink-faint)' : 'var(--primary)', marginBottom: 6 }}>
        <Icon size={20}/>
      </div>
      <div style={{ fontFamily: locked ? 'var(--font-sans)' : "'Cubic 11', monospace", fontSize: locked ? 13 : 18, fontWeight: 700, color: locked ? 'var(--ink-faint)' : 'var(--ink)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-muted)', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--ink-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '20px 2px 10px' }}>{children}</div>
  );
}

function HomeScreen({ go }) {
  return (
    <div style={{ padding: '18px 18px 24px' }}>

      {/* Greeting */}
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-muted)', fontWeight: 500 }}>晚安，Eason</div>
      <div style={{ fontFamily: "'BIZ UDPMincho', 'Noto Serif TC', serif", fontSize: 26, fontWeight: 700, color: 'var(--ink)', marginTop: 2, lineHeight: 1.2 }}>今天想下一盤嗎？</div>

      {/* NEW GAME — DarkPanel with badge */}
      <div style={{ marginTop: 16 }}>
        <DarkPanel style={{ cursor: 'pointer', borderRadius: 16 }} onClick={() => go('gameSetup')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>

            {/* Text column */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--accent)' }}>NEW GAME</div>
              <div style={{ fontFamily: "'BIZ UDPMincho', 'Noto Serif TC', serif", fontSize: 22, fontWeight: 700, color: 'var(--ink-on-deep)', marginTop: 5 }}>開始新對局</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--ink-on-deep-dim)', marginTop: 3 }}>對手 Lv.4 · 自選強度與執子</div>
              <button className="g-press" onClick={(e) => { e.stopPropagation(); go('gameSetup'); }} style={{
                marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(180deg, var(--accent-light), var(--accent))',
                color: 'var(--accent-ink)', border: 'none', borderRadius: 8,
                padding: '10px 18px', fontFamily: 'var(--font-sans)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                boxShadow: '0 0 14px rgba(248,181,0,0.3)',
              }}>
                開始對局 <IconArrowR size={16}/>
              </button>
            </div>

            {/* ChapterBadge — cream coin, king glyph on jade */}
            <ChapterBadge glyph="♚" size={62}/>

          </div>
        </DarkPanel>
      </div>

      {/* Continue learning — elevated cream card */}
      <SectionLabel>繼續學習</SectionLabel>
      <Card accent onClick={() => go('learn')}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--primary-dark)' }}>第一章 · 基礎規則</div>
            <div style={{ fontFamily: "'BIZ UDPMincho', 'Noto Serif TC', serif", fontSize: 20, fontWeight: 700, color: 'var(--ink)', marginTop: 4 }}>城堡與主教</div>
            <div style={{ marginTop: 12 }}>
              <Button variant="jade" style={{ fontSize: 13, padding: '8px 14px' }} onClick={(e) => { e.stopPropagation(); go('learn'); }}>
                繼續 · 第 3 課 <IconArrowR size={15}/>
              </Button>
            </div>
          </div>
          {/* Same badge system — on cream card */}
          <ChapterBadge glyph="♟" size={52}/>
        </div>
        <div style={{ marginTop: 14 }}><Progress value={3} total={8}/></div>
      </Card>

      {/* Stats overview */}
      <SectionLabel>總覽</SectionLabel>
      <div style={{ display: 'flex', gap: 10 }}>
        <StatCard Icon={IconTarget} label="今日謎題" value="3 題"/>
        <StatCard Icon={IconStar}   label="戰績"     value="1240"/>
        <StatCard Icon={IconBook}   label="開局庫"   value="即將推出" locked/>
      </div>

    </div>
  );
}

Object.assign(window, { HomeScreen });
