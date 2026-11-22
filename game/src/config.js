// Night at the Vault — shared tuning constants for the whole game.
// Everything visual or numeric that more than one file needs lives here.
var CFG = {
  W: 1280,            // canvas width in pixels
  H: 800,             // canvas height in pixels
  HUD_H: 64,          // height of the top status strip

  thiefSpeed: 205,    // thief movement, pixels per second
  thiefRadius: 15,

  guardSpeed: 78,     // patrol speed, pixels per second
  guardRadius: 16,
  guardSight: 185,    // vision cone length
  guardHalfAngle: 0.62, // vision cone half angle, radians

  camSight: 165,      // camera cone length
  camHalfAngle: 0.46,
  camSweepSpeed: 0.55,  // radians per second of sweep oscillation
  camSweepArc: 0.85,    // how far a camera swings from its centre bearing

  alarmRise: 46,      // alarm points per second while spotted
  alarmFall: 16,      // alarm points per second while hidden
  alarmMax: 100,

  lootValues: { gem: 500, painting: 400, gold: 300 },

  colors: {
    floor: '#232838',
    floorAlt: '#262c3f',
    wall: '#0d0f16',
    wallTrim: '#c9a227',
    caseBody: '#3a415c',
    caseGlass: '#7fb2d9',
    hud: '#12141d',
    text: '#e8e4d8',
    dim: '#9a958a',
    thief: '#15151c',
    thiefTrim: '#e8e4d8',
    guard: '#7a1f1f',
    guardTrim: '#e0b64f',
    coneGuard: 'rgba(240, 200, 80, 0.20)',
    coneCam: 'rgba(110, 190, 255, 0.16)',
    alarm: '#e23b3b',
    door: '#2e7d4f',
    doorGlow: '#57d992'
  }
};
