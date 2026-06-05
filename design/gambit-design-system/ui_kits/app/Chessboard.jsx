// Chessboard.jsx — wood tray frame (Option 01 only, no filigree).
// Full-width capable: pass size={368} and place in a 0-horizontal-padding container.
// NOTE: production uses /board/wood12.jpg + Gioco Wood SVG pieces.
// Those assets were not provided — mocked with CSS wood tones + Unicode glyphs.

const GLYPH = { k:'♚', q:'♛', r:'♜', b:'♝', n:'♞', p:'♟' };

function parseFEN(fen) {
  const rows = fen.split(' ')[0].split('/');
  return rows.map(row => {
    const cells = [];
    for (const ch of row) {
      if (/\d/.test(ch)) { for (let i = 0; i < +ch; i++) cells.push(null); }
      else cells.push({ type: ch.toLowerCase(), white: ch === ch.toUpperCase() });
    }
    return cells;
  });
}

function Piece({ p, size }) {
  if (!p) return null;
  return (
    <span style={{
      fontSize: size * 0.82, lineHeight: 1, userSelect: 'none',
      color: p.white ? '#F4E7CE' : '#2E2016',
      textShadow: p.white
        ? '0 1px 1px rgba(60,38,18,0.55), 0 0 1px rgba(60,38,18,0.7)'
        : '0 1px 1px rgba(0,0,0,0.35)',
      WebkitTextStroke: p.white ? '1px rgba(74,48,28,0.7)' : '0.6px rgba(0,0,0,0.4)',
    }}>{GLYPH[p.type]}</span>
  );
}

function Chessboard({ fen, size = 320, coords = true, highlights = {}, flip = false }) {
  const board = parseFEN(fen);
  const files = ['a','b','c','d','e','f','g','h'];
  const TRAY = 8; // tray padding each side
  const cell = (size - TRAY * 2) / 8;
  const light = '#EEDFC0', dark = '#B07848';
  const hlColor = {
    gold:   'rgba(248,181,0,0.55)',
    seiji:  'rgba(126,190,165,0.6)',
    played: 'rgba(136,142,126,0.45)',
  };
  const ranks = flip ? [...board].reverse() : board;

  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      borderRadius: 12, padding: TRAY,
      background: 'radial-gradient(ellipse 60% 40% at 20% 15%, rgba(255,220,160,0.12) 0%, transparent 60%), linear-gradient(145deg, #4A2E12 0%, #2E1C0A 40%, #3C2410 100%)',
      boxShadow: '0 8px 24px rgba(0,0,0,0.3), 0 3px 8px rgba(0,0,0,0.2), inset 2px 2px 0 rgba(255,210,140,0.15), inset -2px -2px 0 rgba(0,0,0,0.35)',
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 6, overflow: 'hidden',
        display: 'grid', gridTemplateColumns: `repeat(8, 1fr)`,
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(0,0,0,0.2)',
      }}>
        {ranks.map((row, r) => {
          const rankNum = flip ? r + 1 : 8 - r;
          const cells = flip ? [...row].reverse() : row;
          return cells.map((p, c) => {
            const fileLetter = flip ? files[7 - c] : files[c];
            const sq = fileLetter + rankNum;
            const isDark = (r + c) % 2 === 1;
            const hl = highlights[sq];
            return (
              <div key={sq} style={{
                width: '100%', aspectRatio: '1 / 1', position: 'relative',
                background: isDark ? dark : light,
                backgroundImage: isDark
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.06))'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.18), rgba(0,0,0,0.03))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {hl && <span style={{ position: 'absolute', inset: 0, background: hlColor[hl] }}/>}
                {coords && c === 0 && (
                  <span style={{
                    position: 'absolute', top: 2, left: 3, fontSize: cell * 0.18, fontWeight: 700,
                    fontFamily: 'var(--font-num)', color: isDark ? '#EEDFC0' : '#7A4F2C',
                  }}>{rankNum}</span>
                )}
                {coords && r === 7 && (
                  <span style={{
                    position: 'absolute', bottom: 1, right: 3, fontSize: cell * 0.18, fontWeight: 700,
                    fontFamily: 'var(--font-num)', color: isDark ? '#EEDFC0' : '#7A4F2C',
                  }}>{fileLetter}</span>
                )}
                <span style={{ position: 'relative', zIndex: 1 }}><Piece p={p} size={cell}/></span>
              </div>
            );
          });
        })}
      </div>
    </div>
  );
}

Object.assign(window, { Chessboard });
