// ProfileScreen.jsx — user profile (replaces ComingSoon in me tab).

function ProfileScreen({ go }) {

  const stats = [
    { val: '12', label: '勝' },
    { val: '3',  label: '和' },
    { val: '8',  label: '負' },
    { val: '5',  label: '連勝' },
  ];

  const menuGroups = [
    {
      title: '我的',
      rows: [
        { Icon: IconBarChart, label: '對局紀錄', badge: '5 局',    action: 'history' },
        { Icon: IconTrophy,   label: '成就勳章', badge: '3 枚',    action: null },
        { Icon: IconBook,     label: '開局資料庫', badge: '即將推出', action: null, locked: true },
      ],
    },
    {
      title: '設定',
      rows: [
        { Icon: IconShield,   label: '帳號安全',  badge: null, action: null },
        { Icon: IconGear,     label: '偏好設定',  badge: null, action: null },
        { Icon: IconUser,     label: '登出',       badge: null, action: 'signin', destructive: true },
      ],
    },
  ];

  return (
    <div style={{ paddingBottom: 28 }}>

      {/* Hero — DarkPanel flush to top */}
      <DarkPanel style={{ borderRadius: 0, padding: '22px 18px 20px' }}>

        {/* Avatar + identity */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 18 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            background: 'var(--primary)',
            border: '2.5px solid var(--accent)',
            boxShadow: '0 0 18px rgba(248,181,0,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 34, lineHeight: 1,
          }}>♚</div>
          <div>
            <div style={{
              fontFamily: 'var(--font-sans)', fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', color: 'var(--accent)', textTransform: 'uppercase',
              marginBottom: 3,
            }}>玩家</div>
            <div style={{
              fontFamily: "'BIZ UDPMincho','Noto Serif TC',serif",
              fontSize: 22, fontWeight: 700, color: 'var(--ink-on-deep)', lineHeight: 1.15,
              marginBottom: 6,
            }}>Eason</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: 'rgba(0,0,0,0.22)', borderRadius: 999,
                padding: '4px 10px',
                fontFamily: 'var(--font-num)', fontSize: 13, fontWeight: 700,
                color: 'var(--accent)',
              }}>
                <IconStar size={11} stroke="var(--accent)"/> 1240
              </span>
              <span style={{
                fontFamily: 'var(--font-sans)', fontSize: 11,
                color: 'var(--ink-on-deep-dim)',
              }}>Elo 評分</span>
            </div>
          </div>
        </div>

        {/* Quick stats strip */}
        <div style={{
          display: 'flex',
          background: 'rgba(0,0,0,0.20)',
          borderRadius: 10, overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              flex: 1, textAlign: 'center', padding: '10px 0',
              borderRight: i < stats.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none',
            }}>
              <div style={{
                fontFamily: 'var(--font-num)', fontSize: 18, fontWeight: 700,
                color: 'var(--ink-on-deep)', lineHeight: 1,
              }}>{s.val}</div>
              <div style={{
                fontFamily: 'var(--font-sans)', fontSize: 10,
                color: 'var(--ink-on-deep-dim)', marginTop: 4,
              }}>{s.label}</div>
            </div>
          ))}
        </div>

      </DarkPanel>

      {/* Menu groups */}
      {menuGroups.map(group => (
        <div key={group.title} style={{ padding: '16px 18px 0' }}>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700,
            color: 'var(--ink-muted)', letterSpacing: '0.06em',
            textTransform: 'uppercase', marginBottom: 8,
          }}>{group.title}</div>

          <div style={{
            background: 'var(--surface-card)', borderRadius: 14,
            border: '1px solid var(--line-subtle)',
            boxShadow: 'var(--shadow-card)', overflow: 'hidden',
          }}>
            {group.rows.map((row, i) => (
              <div
                key={row.label}
                className={row.action && !row.locked ? 'g-press' : ''}
                onClick={() => row.action && !row.locked && go(row.action)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '14px 16px',
                  borderBottom: i < group.rows.length - 1 ? '1px solid var(--line-subtle)' : 'none',
                  cursor: row.action && !row.locked ? 'pointer' : 'default',
                  opacity: row.locked ? 0.48 : 1,
                }}
              >
                {/* Icon pill */}
                <div style={{
                  width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                  background: row.destructive ? 'var(--danger-light)' : 'var(--surface-raised)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: row.destructive ? 'var(--danger)' : 'var(--primary)',
                }}>
                  <row.Icon size={17}/>
                </div>

                <span style={{
                  flex: 1,
                  fontFamily: 'var(--font-sans)', fontSize: 15, fontWeight: 500,
                  color: row.destructive ? 'var(--danger)' : 'var(--ink)',
                }}>{row.label}</span>

                {row.badge && (
                  <span style={{
                    fontFamily: 'var(--font-sans)', fontSize: 12,
                    color: 'var(--ink-muted)',
                    background: 'var(--surface-mid)',
                    borderRadius: 999, padding: '2px 9px',
                  }}>{row.badge}</span>
                )}
                {row.action && !row.locked && !row.destructive && (
                  <IconChevR size={15} stroke="var(--ink-faint)"/>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

    </div>
  );
}

Object.assign(window, { ProfileScreen });
