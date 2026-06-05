// LearnScreen.jsx — B-style: chapter cards + expanded lesson list.
// ChapterBadge lives in primitives.jsx (shared).

const { useState: useStateLSC } = React;

const CHAPTERS = [
  {
    id: 1, num: '一', glyph: '♜', title: '基礎規則', sub: '棋子走法 · 基本規則',
    progress: 3, total: 8, active: true,
    lessons: [
      { id: 1, title: '初探棋盤',   state: 'done' },
      { id: 2, title: '兵的走法',   state: 'done' },
      { id: 3, title: '車的走法',   state: 'current' },
      { id: 4, title: '象的走法',   state: 'locked' },
      { id: 5, title: '馬的跳躍',   state: 'locked' },
      { id: 6, title: '后的走法',   state: 'locked' },
      { id: 7, title: '王的移動',   state: 'locked' },
      { id: 8, title: '特殊規則',   state: 'locked' },
    ],
  },
  {
    id: 2, num: '二', glyph: '♝', title: '戰術基礎', sub: '戰術組合 · 棋子配合',
    progress: 0, total: 8, active: false,
    lessons: [
      { id: 1, title: '捉雙戰術',   state: 'locked' },
      { id: 2, title: '穿線戰術',   state: 'locked' },
      { id: 3, title: '閃擊戰術',   state: 'locked' },
      { id: 4, title: '抽將戰術',   state: 'locked' },
    ],
  },
  {
    id: 3, num: '三', glyph: '♛', title: '開局理論', sub: '控制中心 · 快速發展',
    progress: 0, total: 6, active: false,
    lessons: [
      { id: 1, title: '控制中心',   state: 'locked' },
      { id: 2, title: '發展棋子',   state: 'locked' },
    ],
  },
  {
    id: 4, num: '四', glyph: '♞', title: '殘局技術', sub: '王兵殘局 · 車兵殘局',
    progress: 0, total: 5, active: false,
    lessons: [],
  },
];

// ── LearnChapterSheet ──────────────────────────────────────────
// Bottom-sheet preview for locked chapters.
// Rendered by App.jsx outside the scroll container so it covers the tab bar.
// position:absolute inside PhoneFrame (position:relative).
function LearnChapterSheet({ chapter, onClose }) {
  return (
    <>
      {/* Backdrop */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 290,
        background: 'rgba(0,0,0,.45)',
      }} onClick={onClose}/>

      {/* Sheet */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 291,
        background: 'var(--surface-card)',
        borderRadius: '18px 18px 0 0',
        borderTop: '1px solid rgba(255,255,255,.9)',
        boxShadow: '0 -8px 28px rgba(61,34,16,.18)',
        padding: '0 16px 40px',
      }}>
        {/* Handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 14px' }}>
          <div style={{ width: 34, height: 4, borderRadius: 999, background: 'var(--line)' }}/>
        </div>

        {/* Chapter identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', background: 'var(--surface-raised)',
            boxShadow: '0 0 0 2px var(--line)', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 24, color: 'var(--ink-faint)', lineHeight: 1 }}>{chapter.glyph}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', color: 'var(--ink-muted)', textTransform: 'uppercase', marginBottom: 2 }}>第{chapter.num}章</div>
            <div style={{ fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif", fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>{chapter.title}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--surface-raised)', borderRadius: 999, padding: '5px 10px' }}>
            <IconLock size={11} stroke="var(--ink-muted)"/>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--ink-muted)', fontWeight: 600 }}>鎖定</span>
          </div>
        </div>

        {/* Lesson preview */}
        <div style={{ background: 'var(--surface-raised)', borderRadius: 10, border: '1px solid var(--line-subtle)', overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, fontWeight: 700, color: 'var(--ink-muted)', padding: '7px 12px', letterSpacing: '.06em', textTransform: 'uppercase', borderBottom: '1px solid var(--line-subtle)' }}>課程預覽</div>
          {chapter.lessons.slice(0, 3).map(ls => (
            <div key={ls.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderBottom: '1px solid var(--line-subtle)' }}>
              <IconLock size={10} stroke="var(--ink-faint)"/>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-muted)' }}>{ls.title}</span>
            </div>
          ))}
          {chapter.total > chapter.lessons.length && (
            <div style={{ padding: '7px 12px', fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--ink-faint)' }}>…還有 {chapter.total - chapter.lessons.length} 課</div>
          )}
        </div>

        <div style={{ textAlign: 'center', fontFamily: 'var(--font-sans)', fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
          完成「第一章 {CHAPTERS[0].title}」後自動解鎖
        </div>
      </div>
    </>
  );
}

// ── LearnScreen ───────────────────────────────────────────────
function LearnScreen({ go, onChapterPreview }) {
  const active   = CHAPTERS.find(c => c.active);
  const locked   = CHAPTERS.filter(c => !c.active);
  const done     = CHAPTERS.reduce((s, c) => s + c.progress, 0);
  const totalAll = CHAPTERS.reduce((s, c) => s + c.total, 0);

  return (
    <div style={{ background: 'var(--surface-base)', minHeight: '100%', paddingBottom: 24 }}>

      {/* Overall progress */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--line-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
          <div style={{ fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif", fontSize: 17, fontWeight: 700, color: 'var(--ink)' }}>棋藝課程</div>
          <span style={{ fontFamily: 'var(--font-num)', fontSize: 12, color: 'var(--ink-muted)' }}>{done} / {totalAll} 課</span>
        </div>
        <div style={{ height: 5, background: 'var(--line-subtle)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${(done / totalAll) * 100}%`, height: '100%', background: 'var(--primary)', borderRadius: 999, transition: 'width var(--duration-base) var(--ease-standard)' }}/>
        </div>
      </div>

      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* ── Active chapter: always expanded ── */}
        <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: '0 6px 20px rgba(10,30,24,.28)' }}>
          {/* Header */}
          <DarkPanel style={{ borderRadius: 0, padding: '13px 14px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
              <ChapterBadge glyph={active.glyph} size={42}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700, letterSpacing: '.1em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 2 }}>第{active.num}章</div>
                <div style={{ fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif", fontSize: 15, fontWeight: 700, color: 'var(--ink-on-deep)', lineHeight: 1.2 }}>{active.title}</div>
                <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--ink-on-deep-dim)', marginTop: 1 }}>{active.sub}</div>
              </div>
              <span style={{ fontFamily: 'var(--font-num)', fontSize: 10, color: 'var(--ink-on-deep-dim)', flexShrink: 0 }}>{active.progress}/{active.total}</span>
            </div>
            <div style={{ height: 3, background: 'rgba(255,255,255,.12)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: `${(active.progress / active.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#3AB894,#F8B500)', borderRadius: 999 }}/>
            </div>
          </DarkPanel>

          {/* Lesson list */}
          <div style={{ background: 'var(--surface-card)' }}>
            {active.lessons.map((ls, i) => (
              <div
                key={ls.id}
                className={ls.state === 'current' ? 'g-press' : ''}
                onClick={ls.state === 'current' ? () => go('lesson') : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 14px',
                  borderBottom: i < active.lessons.length - 1 ? '1px solid rgba(0,0,0,.04)' : 'none',
                  background: ls.state === 'current' ? 'linear-gradient(90deg,#FAF2DC,#FDF9EE)' : undefined,
                  cursor: ls.state === 'current' ? 'pointer' : 'default',
                }}
              >
                {/* State dot */}
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: ls.state === 'done' ? 'var(--primary-soft)' : ls.state === 'current' ? 'linear-gradient(150deg,var(--accent-light),var(--accent))' : 'var(--surface-raised)',
                  boxShadow: ls.state === 'current' ? '0 0 6px rgba(248,181,0,.4)' : 'none',
                }}>
                  {ls.state === 'done'    && <IconCheck size={9} stroke="var(--primary)" sw={3.5}/>}
                  {ls.state === 'current' && <span style={{ fontSize: 8, fontWeight: 700, color: 'var(--accent-ink)', fontFamily: 'monospace' }}>{ls.id}</span>}
                  {ls.state === 'locked'  && <IconLock size={8} stroke="var(--ink-faint)" sw={2.5}/>}
                </div>

                {/* Title */}
                <span style={{
                  flex: 1,
                  fontFamily: 'var(--font-sans)', fontSize: 12,
                  fontWeight: ls.state === 'current' ? 700 : 400,
                  color: ls.state === 'done' ? 'var(--ink-faint)' : ls.state === 'current' ? 'var(--ink)' : 'var(--ink-faint)',
                  textDecoration: ls.state === 'done' ? 'line-through' : 'none',
                  textDecorationColor: 'rgba(168,140,118,.35)',
                }}>{ls.title}</span>

                {ls.state === 'current' && (
                  <span style={{ background: 'linear-gradient(180deg,var(--accent-light),var(--accent))', color: 'var(--accent-ink)', fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999 }}>繼續</span>
                )}
                {ls.state === 'done' && (
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--ink-faint)' }}>完成</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Locked chapters ── */}
        {locked.map(ch => (
          <div
            key={ch.id}
            className="g-press"
            onClick={() => onChapterPreview && onChapterPreview(ch)}
            style={{
              display: 'flex', alignItems: 'center', gap: 11,
              padding: '12px 14px',
              background: 'var(--surface-raised)', borderRadius: 14,
              border: '1px solid var(--line)', opacity: .68, cursor: 'pointer',
            }}
          >
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--surface-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: 21, color: 'var(--ink-faint)', lineHeight: 1 }}>{ch.glyph}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: 'var(--ink-faint)', marginBottom: 2 }}>第{ch.num}章</div>
              <div style={{ fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif", fontSize: 14, fontWeight: 700, color: 'var(--ink-muted)' }}>{ch.title}</div>
              <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'var(--ink-faint)', marginTop: 1 }}>{ch.total} 課</div>
            </div>
            <IconChevR size={14} stroke="var(--ink-faint)"/>
          </div>
        ))}

      </div>
    </div>
  );
}

Object.assign(window, { LearnScreen, LearnChapterSheet });
