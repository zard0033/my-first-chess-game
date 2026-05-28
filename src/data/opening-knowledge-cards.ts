export interface KnowledgeCard {
  eco: string;
  name: string;
  body: string;
}

// ECO codes are matched against chess-openings@0.1.1 return values.
// Confirm exact codes during integration (lookupSync may return sub-variants).
export const OPENING_CARDS: Readonly<Record<string, KnowledgeCard>> = {
  C50: {
    eco: 'C50',
    name: 'Italian Game',
    body:
      'White develops the bishop to c4, pointing it at f7 — a square defended only by the king at the start. ' +
      'The plan is to control the center and use the bishop\'s pressure to build kingside attacking chances. ' +
      'Black\'s main task is finding active counterplay, often by challenging the center with **d5** or rerouting to c5. ' +
      'The key pattern to recognize: watch for **Ng5** ideas targeting f7 once development is complete.',
  },

  C65: {
    eco: 'C65',
    name: 'Ruy Lopez',
    body:
      'White plays **Bb5**, pinning the knight that defends e5 and indirectly pressuring Black\'s central pawn. ' +
      'The long-term plan is to build a strong pawn center and keep Black slightly cramped — this is a slow, positional squeeze. ' +
      'Black typically responds with **a6** to push the bishop away, then seeks counterplay on the queenside with b5 and c5. ' +
      'Knowing that White aims for positional pressure rather than quick tactics helps make sense of White\'s quiet-looking moves.',
  },

  B20: {
    eco: 'B20',
    name: 'Sicilian Defense',
    body:
      'Black answers 1.e4 with **c5**, challenging White\'s control of d4 without mirroring the central pawn setup. ' +
      'This creates an unbalanced position: White often gets a space advantage in the center while Black gets a half-open c-file for queenside counterplay. ' +
      'Many Sicilian games become sharp battles where White attacks on the kingside and Black simultaneously counterattacks on the queenside. ' +
      'The key idea: Black is fighting for a win, not just equality — the Sicilian is a fighting defense from move one.',
  },

  C00: {
    eco: 'C00',
    name: 'French Defense',
    body:
      'Black plays **e6**, planning to follow with d5 to challenge White\'s center on move two — a solid but slightly passive setup. ' +
      'The trade-off is that the c8 bishop can be hard to activate because e6 blocks its diagonal. ' +
      'White often builds a large pawn center and attacks; Black\'s plan is to undermine that center with **c5** and create counterplay. ' +
      'The tension between White\'s space advantage and Black\'s solid structure is what gives the French its distinctive character.',
  },

  B10: {
    eco: 'B10',
    name: 'Caro-Kann Defense',
    body:
      'Black plays **c6**, preparing to advance d5 and challenge e4 with solid piece support from the very start. ' +
      'Unlike the French, Black\'s c8 bishop stays active because c6 doesn\'t block it — a key structural advantage. ' +
      'The Caro-Kann typically leads to solid, slightly quieter positions where Black builds a healthy pawn structure and looks for endgame counterplay. ' +
      'Recognizing that Black\'s goal is sound, methodical development — not early tactics — helps explain its careful piece placement.',
  },

  D02: {
    eco: 'D02',
    name: 'London System',
    body:
      'White builds a reliable setup with **Nf3** and **Bf4**, forming a solid foundation before committing central pawns. ' +
      'The London is a system White can use against almost any Black response — the plan is consistent: control e5, castle kingside, coordinate pieces. ' +
      'Black has many ways to play, often setting up with Nf6, e6, and d5 to create a solid pawn chain of their own. ' +
      'The London\'s strength is flexibility and fewer sharp tactical lines to memorize; piece coordination and pawn structure matter most here.',
  },

  B01: {
    eco: 'B01',
    name: 'Scandinavian Defense',
    body:
      'Black immediately challenges White\'s e4 pawn with **d5** on move one — an aggressive and direct approach. ' +
      'After 2.exd5, Black usually recaptures with the queen, which must move again after Nc3 — a tempo spent, but Black gets quick piece activity in return. ' +
      'The Scandinavian leads to open, active positions where Black\'s pieces find good squares early. ' +
      'The key plan for Black: develop all pieces rapidly and use the active queen as a coordination anchor, not just an attacker.',
  },

  D30: {
    eco: 'D30',
    name: 'Queen\'s Gambit Declined',
    body:
      'White offers the c4 pawn; Black declines with **e6**, choosing a solid central setup over accepting the pawn and stepping away from the center. ' +
      'The game revolves around who controls the d4 and e5 squares — White builds central dominance while Black aims for a solid, reliable structure. ' +
      'Black\'s main challenge is activating the c8 bishop, which e6 temporarily blocks; plans involving **b6**, **Ba6**, or **dxc4** plus **b5** are common solutions. ' +
      'The Queen\'s Gambit rewards understanding pawn structure over memorizing long lines.',
  },

  A10: {
    eco: 'A10',
    name: 'English Opening',
    body:
      'White begins with **c4**, controlling d5 and keeping central pawn placement flexible — a quiet but purposeful start. ' +
      'The English often transposes into other openings, making it a versatile system that can be used against many Black setups. ' +
      'White\'s typical plan involves Nc3, g3, Bg2, and Nf3 — building a fianchettoed bishop that controls the long diagonal. ' +
      'Piece coordination and long-term pawn structure matter more here than forcing early piece exchanges.',
  },

  C42: {
    eco: 'C42',
    name: 'Petrov Defense',
    body:
      'Black mirrors White\'s knight development with **Nf6**, immediately counterattacking e4 rather than defending e5. ' +
      'The Petrov often leads to symmetrical, balanced positions — Black\'s aim is solid equality and safe development from the very start. ' +
      'White must choose between accepting symmetry or trying to unbalance with more aggressive tries; both sides need to be precise to maintain their plans. ' +
      'Knowing that Black is aiming for a rock-solid, drawish structure explains the careful, methodical style of this defense.',
  },
} as const;
