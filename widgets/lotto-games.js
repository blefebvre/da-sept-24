/*
 * Game settings shared by the lotto draw widgets (winning-numbers, jackpot).
 * Keyed by the authored game code (`?game=lotto649`). Add an entry to reuse the widgets on
 * another lotto page; anything left out simply isn't rendered.
 */

const ALC = 'https://www.alc.ca';
const TILES = `${ALC}/content/dam/alc/images/static/game-tiles`;

export const ALC_ASSETS = {
  sprites: `${ALC}/content/dam/alc/images/static/sprites/winning-numbers-sprites.png`,
  whiteBall: `${ALC}/content/dam/alc/images/lotto/lotto649_white_ball.png`,
  goldBall: `${ALC}/content/dam/alc/images/lotto/lotto649_gold_ball.png`,
};

const GAMES = {
  lotto649: {
    name: 'Lotto 6/49',
    logo: `${TILES}/Lotto649_en.png/_jcr_content/renditions/cq5dam.thumbnail.319.319.png`,
    // draw days (0 = Sunday), in Atlantic time
    drawDays: [3, 6],
    mainLabel: 'CLASSIC DRAW',
    tag: true,
    // guaranteed prize draw under the main numbers; `goldBall` switches to the Gold Ball layout
    guaranteedLabel: 'GOLD BALL DRAW',
    goldBall: true,
    // jackpot panel
    classicJackpot: 5000000,
    classicJackpotLabel: 'CLASSIC JACKPOT',
    goldBallJackpotLabel: 'GOLD BALL JACKPOT',
    guaranteedPrizeLabel: 'OR THE GUARANTEED $1M',
    // companion game shown in the collapsible bar, drawn on the same dates
    secondary: 'atlantic49',
  },
  atlantic49: {
    name: 'Atlantic 49',
    logo: `${TILES}/Atlantic49_en.png/jcr:content/renditions/cq5dam.thumbnail.319.319.png`,
    drawDays: [3, 6],
    mainLabel: 'MAIN DRAW',
    tag: true,
    guaranteedLabel: 'GUARANTEED PRIZE DRAW:',
  },
};

/**
 * Settings for a game code; unknown games get a minimal config so the widgets still render.
 * @param {string} game Authored game code
 * @returns {Object}
 */
export function getGameConfig(game) {
  const key = String(game || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  return GAMES[key] ? { key, ...GAMES[key] } : {
    key, name: game || '', drawDays: [0, 1, 2, 3, 4, 5, 6], mainLabel: 'MAIN DRAW',
  };
}
