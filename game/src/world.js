// World: the museum vault room, its people and loot, and every rule that
// moves them. Rendering lives in render.js; this file only keeps state.
var World = {

  // ---- static room geometry -------------------------------------------------
  // Interior obstacles: glass display cases and marble pillars. Each one
  // blocks movement and blocks sight lines.
  obstacles: [
    { x: 150, y: 210, w: 190, h: 54, kind: 'case' },
    { x: 560, y: 196, w: 160, h: 54, kind: 'case' },
    { x: 940, y: 210, w: 190, h: 54, kind: 'case' },
    { x: 300, y: 430, w: 56, h: 130, kind: 'pillar' },
    { x: 924, y: 430, w: 56, h: 130, kind: 'pillar' },
    { x: 520, y: 470, w: 240, h: 54, kind: 'case' }
  ],
  room: { x: 24, y: CFG.HUD_H + 16, w: CFG.W - 48, h: CFG.H - CFG.HUD_H - 40 },
  door: { x: CFG.W / 2 - 52, y: CFG.H - 24, w: 104, h: 24 },

  lootDefs: [
    { id: 'gem', name: 'Star Sapphire', x: 245, y: 168 },
    { id: 'painting', name: 'Gilded Portrait', x: 1035, y: 168 },
    { id: 'gold', name: 'Vault Gold Bars', x: 640, y: 428 }
  ],

  guardRoutes: [
    [{ x: 130, y: 340 }, { x: 620, y: 340 }, { x: 620, y: 620 }, { x: 130, y: 620 }],
    [{ x: 1150, y: 640 }, { x: 700, y: 640 }, { x: 700, y: 330 }, { x: 1150, y: 330 }]
  ],

  cameraDefs: [
    { x: 40, y: 96, centre: 0.65 },    // top-left corner, sweeps the west hall
    { x: 1240, y: 96, centre: 2.49 }   // top-right corner, sweeps the east hall
  ],

  // ---- state ----------------------------------------------------------------
  freshState: function () {
    var s = {
      mode: 'title',        // title | play | caught | win
      time: 0,
      elapsed: 0,
      alarm: 0,
      spotted: false,
      thief: { x: CFG.W / 2, y: 690, angle: -Math.PI / 2 },
      guards: [],
      cameras: [],
      loot: [],
      score: 0,
      message: ''
    };
    for (var i = 0; i < this.guardRoutes.length; i++) {
      var p = this.guardRoutes[i][0];
      s.guards.push({ x: p.x, y: p.y, angle: 0, route: this.guardRoutes[i], leg: 0 });
    }
    for (var j = 0; j < this.cameraDefs.length; j++) {
      var c = this.cameraDefs[j];
      s.cameras.push({ x: c.x, y: c.y, centre: c.centre, angle: c.centre, phase: j * 1.7 });
    }
    for (var k = 0; k < this.lootDefs.length; k++) {
      var d = this.lootDefs[k];
      s.loot.push({ id: d.id, name: d.name, x: d.x, y: d.y, taken: false });
    }
    return s;
  },

  // ---- geometry helpers -------------------------------------------------------
  clampToRoom: function (p, r) {
    var rm = this.room;
    p.x = Math.max(rm.x + r, Math.min(rm.x + rm.w - r, p.x));
    p.y = Math.max(rm.y + r, Math.min(rm.y + rm.h - r, p.y));
  },

  // Push a circle out of every obstacle rectangle it overlaps.
  pushOutOfObstacles: function (p, r) {
    for (var i = 0; i < this.obstacles.length; i++) {
      var o = this.obstacles[i];
      var nx = Math.max(o.x, Math.min(o.x + o.w, p.x));
      var ny = Math.max(o.y, Math.min(o.y + o.h, p.y));
      var dx = p.x - nx, dy = p.y - ny;
      var d2 = dx * dx + dy * dy;
      if (d2 < r * r) {
        if (d2 === 0) { p.y = o.y - r; continue; }
        var d = Math.sqrt(d2);
        p.x = nx + (dx / d) * r;
        p.y = ny + (dy / d) * r;
      }
    }
  },

  // Does segment a->b cross any obstacle? Used for sight lines.
  sightBlocked: function (ax, ay, bx, by) {
    for (var i = 0; i < this.obstacles.length; i++) {
      var o = this.obstacles[i];
      if (segHitsRect(ax, ay, bx, by, o)) return true;
    }
    return false;
  },

  // Is point p inside the cone of an observer at o facing `facing`?
  inCone: function (ox, oy, facing, range, half, px, py) {
    var dx = px - ox, dy = py - oy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > range || dist < 1) return false;
    var ang = Math.atan2(dy, dx);
    var diff = angDiff(ang, facing);
    if (Math.abs(diff) > half) return false;
    return !this.sightBlocked(ox, oy, px, py);
  },

  anyoneSeesThief: function (s) {
    var t = s.thief;
    for (var i = 0; i < s.guards.length; i++) {
      var g = s.guards[i];
      if (this.inCone(g.x, g.y, g.angle, CFG.guardSight, CFG.guardHalfAngle, t.x, t.y)) return true;
    }
    for (var j = 0; j < s.cameras.length; j++) {
      var c = s.cameras[j];
      if (this.inCone(c.x, c.y, c.angle, CFG.camSight, CFG.camHalfAngle, t.x, t.y)) return true;
    }
    return false;
  },

  allLootTaken: function (s) {
    for (var i = 0; i < s.loot.length; i++) if (!s.loot[i].taken) return false;
    return true;
  },

  lootScore: function (s) {
    var total = 0;
    for (var i = 0; i < s.loot.length; i++) {
      if (s.loot[i].taken) total += CFG.lootValues[s.loot[i].id];
    }
    return total;
  },

  // ---- per-tick update ---------------------------------------------------------
  update: function (s, dt) {
    s.time += dt;
    if (s.mode !== 'play') return;
    s.elapsed += dt;

    // Thief movement.
    var mv = Input.moveVector();
    if (mv.x !== 0 || mv.y !== 0) {
      s.thief.x += mv.x * CFG.thiefSpeed * dt;
      s.thief.y += mv.y * CFG.thiefSpeed * dt;
      s.thief.angle = Math.atan2(mv.y, mv.x);
    }
    this.clampToRoom(s.thief, CFG.thiefRadius);
    this.pushOutOfObstacles(s.thief, CFG.thiefRadius);

    // Guards walk their waypoint loops.
    for (var i = 0; i < s.guards.length; i++) {
      var g = s.guards[i];
      var target = g.route[(g.leg + 1) % g.route.length];
      var dx = target.x - g.x, dy = target.y - g.y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 4) { g.leg = (g.leg + 1) % g.route.length; }
      else {
        g.angle = Math.atan2(dy, dx);
        g.x += Math.cos(g.angle) * CFG.guardSpeed * dt;
        g.y += Math.sin(g.angle) * CFG.guardSpeed * dt;
      }
      // A guard who touches the thief ends the run at once.
      var tx = s.thief.x - g.x, ty = s.thief.y - g.y;
      if (tx * tx + ty * ty < Math.pow(CFG.guardRadius + CFG.thiefRadius - 2, 2)) {
        s.mode = 'caught';
        s.message = 'A guard grabbed you!';
      }
    }

    // Cameras sweep back and forth.
    for (var j = 0; j < s.cameras.length; j++) {
      var c = s.cameras[j];
      c.angle = c.centre + Math.sin(s.time * CFG.camSweepSpeed + c.phase) * CFG.camSweepArc;
    }

    // Alarm rises while any cone holds the thief, falls while hidden.
    s.spotted = this.anyoneSeesThief(s);
    if (s.spotted) s.alarm = Math.min(CFG.alarmMax, s.alarm + CFG.alarmRise * dt);
    else s.alarm = Math.max(0, s.alarm - CFG.alarmFall * dt);
    if (s.alarm >= CFG.alarmMax) {
      s.mode = 'caught';
      s.message = 'The alarm hit full — the vault sealed shut!';
    }

    // Walking over a pedestal pockets the piece.
    for (var k = 0; k < s.loot.length; k++) {
      var l = s.loot[k];
      if (!l.taken) {
        var lx = s.thief.x - l.x, ly = s.thief.y - l.y;
        if (lx * lx + ly * ly < 34 * 34) l.taken = true;
      }
    }

    // With every piece pocketed, reaching the exit door wins the night.
    if (this.allLootTaken(s)) {
      var d = this.door;
      if (s.thief.x > d.x && s.thief.x < d.x + d.w && s.thief.y > d.y - 26) {
        s.mode = 'win';
        var timeBonus = Math.max(0, 600 - Math.floor(s.elapsed) * 2);
        s.score = this.lootScore(s) + timeBonus;
      }
    }
  },

  // ---- staged scenes for screenshots -------------------------------------------
  // Fixed arrangements so `?scene=N` renders the same frame every time.
  applyScene: function (s, n) {
    if (n === 2) { s.mode = 'title'; return; }
    s.mode = 'play';
    s.elapsed = 47;
    s.thief.x = 470; s.thief.y = 385; s.thief.angle = 0.35;
    s.guards[0].x = 560; s.guards[0].y = 340; s.guards[0].angle = 0.5;
    s.guards[1].x = 900; s.guards[1].y = 610; s.guards[1].angle = -2.2;
    s.cameras[0].angle = 0.95;
    s.cameras[1].angle = 2.35;
    s.loot[2].taken = true;               // gold already pocketed
    if (n === 1) {
      s.alarm = 60;
      s.spotted = true;
      s.thief.x = 610; s.thief.y = 390;   // squarely inside guard one's cone
    } else if (n === 3) {
      s.mode = 'caught';
      s.alarm = 100;
      s.spotted = true;
      s.message = 'The alarm hit full — the vault sealed shut!';
      s.thief.x = 520; s.thief.y = 360;
      s.guards[0].x = 585; s.guards[0].y = 345; s.guards[0].angle = 2.9;
    } else if (n === 4) {
      s.mode = 'win';
      s.alarm = 22;
      for (var i = 0; i < s.loot.length; i++) s.loot[i].taken = true;
      s.score = this.lootScore(s) + Math.max(0, 600 - Math.floor(s.elapsed) * 2);
      s.thief.x = CFG.W / 2; s.thief.y = 745;
    }
  }
};

// Smallest signed difference between two angles, in (-PI, PI].
function angDiff(a, b) {
  var d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Segment vs axis-aligned rectangle: true if they touch or cross.
function segHitsRect(ax, ay, bx, by, r) {
  if (ax > r.x && ax < r.x + r.w && ay > r.y && ay < r.y + r.h) return true;
  if (bx > r.x && bx < r.x + r.w && by > r.y && by < r.y + r.h) return true;
  return segSeg(ax, ay, bx, by, r.x, r.y, r.x + r.w, r.y) ||
         segSeg(ax, ay, bx, by, r.x + r.w, r.y, r.x + r.w, r.y + r.h) ||
         segSeg(ax, ay, bx, by, r.x + r.w, r.y + r.h, r.x, r.y + r.h) ||
         segSeg(ax, ay, bx, by, r.x, r.y + r.h, r.x, r.y);
}

function segSeg(ax, ay, bx, by, cx, cy, dx, dy) {
  var d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  var d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  var d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  var d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0) !== (d2 > 0)) && ((d3 > 0) !== (d4 > 0));
}
