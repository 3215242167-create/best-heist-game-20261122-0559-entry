// Render: every pixel of the game is drawn here with canvas calls.
// Nothing is loaded from outside; the art is all hand-drawn shapes.
var Render = {

  draw: function (ctx, s) {
    this.drawRoom(ctx, s);
    this.drawLoot(ctx, s);
    this.drawDoor(ctx, s);
    // Vision cones sit above the floor but below the people.
    for (var i = 0; i < s.cameras.length; i++) {
      var c = s.cameras[i];
      this.drawCone(ctx, c.x, c.y, c.angle, CFG.camSight, CFG.camHalfAngle, CFG.colors.coneCam);
    }
    for (var j = 0; j < s.guards.length; j++) {
      var g = s.guards[j];
      this.drawCone(ctx, g.x, g.y, g.angle, CFG.guardSight, CFG.guardHalfAngle, CFG.colors.coneGuard);
    }
    for (var k = 0; k < s.cameras.length; k++) this.drawCamera(ctx, s.cameras[k], s);
    for (var m = 0; m < s.guards.length; m++) this.drawGuard(ctx, s.guards[m]);
    this.drawThief(ctx, s.thief, s.spotted);
    this.drawHud(ctx, s);
    if (s.mode === 'title') this.drawTitle(ctx, s);
    else if (s.mode === 'caught') this.drawEndPanel(ctx, s, false);
    else if (s.mode === 'win') this.drawEndPanel(ctx, s, true);
  },

  // ---- room -----------------------------------------------------------------
  drawRoom: function (ctx, s) {
    var rm = World.room;
    ctx.fillStyle = '#0a0b10';
    ctx.fillRect(0, 0, CFG.W, CFG.H);
    // Chequered marble floor.
    var tile = 46;
    for (var y = rm.y; y < rm.y + rm.h; y += tile) {
      for (var x = rm.x; x < rm.x + rm.w; x += tile) {
        var odd = ((x / tile | 0) + (y / tile | 0)) % 2 === 0;
        ctx.fillStyle = odd ? CFG.colors.floor : CFG.colors.floorAlt;
        ctx.fillRect(x, y, Math.min(tile, rm.x + rm.w - x), Math.min(tile, rm.y + rm.h - y));
      }
    }
    // A deep red carpet down the middle hall.
    ctx.fillStyle = 'rgba(122, 31, 31, 0.35)';
    ctx.fillRect(CFG.W / 2 - 90, rm.y + 8, 180, rm.h - 16);
    // Walls: gold-trimmed border.
    ctx.strokeStyle = CFG.colors.wallTrim;
    ctx.lineWidth = 4;
    ctx.strokeRect(rm.x - 3, rm.y - 3, rm.w + 6, rm.h + 6);
    ctx.strokeStyle = CFG.colors.wall;
    ctx.lineWidth = 10;
    ctx.strokeRect(rm.x - 10, rm.y - 10, rm.w + 20, rm.h + 20);
    // Obstacles.
    for (var i = 0; i < World.obstacles.length; i++) {
      var o = World.obstacles[i];
      if (o.kind === 'case') {
        ctx.fillStyle = CFG.colors.caseBody;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = 'rgba(127, 178, 217, 0.5)';
        ctx.fillRect(o.x + 7, o.y + 7, o.w - 14, o.h - 14);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.fillRect(o.x + 12, o.y + 10, o.w * 0.4, 6);
        ctx.strokeStyle = CFG.colors.wallTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      } else {
        ctx.fillStyle = '#4a4f66';
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = '#5b617c';
        ctx.fillRect(o.x + 5, o.y + 5, o.w - 10, o.h - 10);
        ctx.strokeStyle = CFG.colors.wallTrim;
        ctx.lineWidth = 2;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      }
    }
  },

  drawDoor: function (ctx, s) {
    var d = World.door;
    var open = World.allLootTaken(s);
    ctx.fillStyle = open ? CFG.colors.doorGlow : CFG.colors.door;
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = CFG.colors.wallTrim;
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#0d0f16';
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(open ? 'EXIT — GO!' : 'EXIT', d.x + d.w / 2, d.y + 17);
  },

  // ---- loot -------------------------------------------------------------------
  drawLoot: function (ctx, s) {
    for (var i = 0; i < s.loot.length; i++) {
      var l = s.loot[i];
      // Pedestal.
      ctx.fillStyle = l.taken ? '#2c3044' : '#565d7d';
      ctx.beginPath();
      ctx.arc(l.x, l.y, 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = CFG.colors.wallTrim;
      ctx.lineWidth = 2;
      ctx.stroke();
      if (l.taken) {
        ctx.fillStyle = CFG.colors.dim;
        ctx.font = '11px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('TAKEN', l.x, l.y + 4);
      } else if (l.id === 'gem') {
        ctx.fillStyle = '#3f8fe0';
        ctx.beginPath();
        ctx.moveTo(l.x, l.y - 15);
        ctx.lineTo(l.x + 11, l.y - 3);
        ctx.lineTo(l.x, l.y + 14);
        ctx.lineTo(l.x - 11, l.y - 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#bfe0ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(l.x - 11, l.y - 3); ctx.lineTo(l.x + 11, l.y - 3);
        ctx.moveTo(l.x, l.y - 15); ctx.lineTo(l.x, l.y + 14);
        ctx.stroke();
      } else if (l.id === 'painting') {
        ctx.fillStyle = '#8a6d1f';
        ctx.fillRect(l.x - 15, l.y - 13, 30, 26);
        ctx.fillStyle = '#274b63';
        ctx.fillRect(l.x - 11, l.y - 9, 22, 18);
        ctx.fillStyle = '#e0b64f';
        ctx.beginPath();
        ctx.arc(l.x, l.y - 1, 5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#d9a92c';
        ctx.fillRect(l.x - 13, l.y + 1, 26, 8);
        ctx.fillRect(l.x - 10, l.y - 7, 20, 8);
        ctx.fillStyle = '#f2cd5a';
        ctx.fillRect(l.x - 13, l.y + 1, 26, 3);
        ctx.fillRect(l.x - 10, l.y - 7, 20, 3);
      }
      // Name label under each untouched piece.
      if (!l.taken) {
        ctx.fillStyle = CFG.colors.text;
        ctx.font = '11px Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText(l.name, l.x, l.y + 40);
      }
    }
  },

  // ---- vision cones ---------------------------------------------------------------
  // Cast a fan of rays; each stops at the first obstacle or the room wall.
  drawCone: function (ctx, ox, oy, facing, range, half, fill) {
    var steps = 26;
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    for (var i = 0; i <= steps; i++) {
      var a = facing - half + (2 * half * i) / steps;
      var len = this.rayLength(ox, oy, a, range);
      ctx.lineTo(ox + Math.cos(a) * len, oy + Math.sin(a) * len);
    }
    ctx.closePath();
    ctx.fill();
  },

  rayLength: function (ox, oy, ang, maxLen) {
    var dx = Math.cos(ang), dy = Math.sin(ang);
    var best = maxLen;
    for (var i = 0; i < World.obstacles.length; i++) {
      var t = rayRectEntry(ox, oy, dx, dy, World.obstacles[i]);
      if (t !== null && t < best) best = t;
    }
    var exit = rayRectExit(ox, oy, dx, dy, World.room);
    if (exit !== null && exit < best) best = exit;
    return best;
  },

  // ---- people and cameras ------------------------------------------------------------
  drawGuard: function (ctx, g) {
    ctx.fillStyle = CFG.colors.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, CFG.guardRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CFG.colors.guardTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Cap brim pointing the way he faces.
    ctx.fillStyle = CFG.colors.guardTrim;
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * 10, g.y + Math.sin(g.angle) * 10, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2e3c2';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 6, 0, Math.PI * 2);
    ctx.fill();
  },

  drawCamera: function (ctx, c, s) {
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.angle);
    ctx.fillStyle = '#1c1e28';
    ctx.fillRect(-4, -7, 20, 14);
    ctx.fillStyle = '#3d4bff';
    ctx.fillRect(14, -3, 5, 6);
    ctx.restore();
    ctx.fillStyle = (Math.floor(s.time * 2) % 2 === 0) ? '#ff4040' : '#7a1414';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CFG.colors.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.stroke();
  },

  drawThief: function (ctx, t, spotted) {
    // Loot sack on his back.
    ctx.fillStyle = '#6b5320';
    ctx.beginPath();
    ctx.arc(t.x - Math.cos(t.angle) * 13, t.y - Math.sin(t.angle) * 13, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = CFG.colors.thief;
    ctx.beginPath();
    ctx.arc(t.x, t.y, CFG.thiefRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = spotted ? '#ff5050' : CFG.colors.thiefTrim;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Hood and mask stripe.
    ctx.fillStyle = '#2c2c3a';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e8e4d8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x - 6, t.y - 1);
    ctx.lineTo(t.x + 6, t.y - 1);
    ctx.stroke();
  },

  // ---- HUD and overlays ------------------------------------------------------------------
  drawHud: function (ctx, s) {
    ctx.fillStyle = CFG.colors.hud;
    ctx.fillRect(0, 0, CFG.W, CFG.HUD_H);
    ctx.strokeStyle = CFG.colors.wallTrim;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, CFG.HUD_H);
    ctx.lineTo(CFG.W, CFG.HUD_H);
    ctx.stroke();

    ctx.fillStyle = CFG.colors.text;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('NIGHT AT THE VAULT', 20, 40);

    // Alarm meter.
    var ax = 330, aw = 330, ay = 22, ah = 20;
    ctx.fillStyle = '#2a0f0f';
    ctx.fillRect(ax, ay, aw, ah);
    var frac = s.alarm / CFG.alarmMax;
    ctx.fillStyle = frac > 0.75 ? '#ff2d2d' : (frac > 0.4 ? '#e2703b' : '#c9a227');
    ctx.fillRect(ax, ay, aw * frac, ah);
    ctx.strokeStyle = CFG.colors.wallTrim;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ax, ay, aw, ah);
    ctx.fillStyle = CFG.colors.text;
    ctx.font = 'bold 13px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText(s.spotted ? 'ALARM — SPOTTED!' : 'ALARM', ax, ay - 6);
    ctx.font = '12px Georgia, serif';
    ctx.fillText(Math.floor(s.alarm) + '%', ax + aw + 8, ay + 15);

    // Loot tally and clock.
    var taken = 0;
    for (var i = 0; i < s.loot.length; i++) if (s.loot[i].taken) taken++;
    ctx.fillStyle = CFG.colors.text;
    ctx.font = 'bold 17px Georgia, serif';
    ctx.textAlign = 'right';
    ctx.fillText('Loot ' + taken + ' / ' + s.loot.length, CFG.W - 170, 40);
    var mm = Math.floor(s.elapsed / 60), ss = Math.floor(s.elapsed % 60);
    ctx.fillText((mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss, CFG.W - 24, 40);
  },

  drawTitle: function (ctx, s) {
    ctx.fillStyle = 'rgba(6, 6, 12, 0.72)';
    ctx.fillRect(0, CFG.HUD_H, CFG.W, CFG.H - CFG.HUD_H);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#e0b64f';
    ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText('NIGHT AT THE VAULT', CFG.W / 2, 330);
    ctx.fillStyle = CFG.colors.text;
    ctx.font = '22px Georgia, serif';
    ctx.fillText('Sneak past the guards and cameras. Pocket the sapphire, the portrait and the gold.', CFG.W / 2, 385);
    ctx.fillText('Fill the alarm and the vault seals — you are caught.', CFG.W / 2, 418);
    ctx.fillStyle = '#57d992';
    ctx.font = 'bold 26px Georgia, serif';
    ctx.fillText('Press ENTER to start — WASD or arrow keys to move', CFG.W / 2, 478);
  },

  drawEndPanel: function (ctx, s, won) {
    ctx.fillStyle = 'rgba(6, 6, 12, 0.66)';
    ctx.fillRect(0, CFG.HUD_H, CFG.W, CFG.H - CFG.HUD_H);
    ctx.textAlign = 'center';
    if (won) {
      ctx.fillStyle = '#57d992';
      ctx.font = 'bold 56px Georgia, serif';
      ctx.fillText('CLEAN GETAWAY!', CFG.W / 2, 320);
      ctx.fillStyle = CFG.colors.text;
      ctx.font = '24px Georgia, serif';
      var mm = Math.floor(s.elapsed / 60), ss = Math.floor(s.elapsed % 60);
      ctx.fillText('Time: ' + mm + ':' + (ss < 10 ? '0' : '') + ss + '   Loot: $' + World.lootScore(s), CFG.W / 2, 375);
      ctx.fillStyle = '#e0b64f';
      ctx.font = 'bold 30px Georgia, serif';
      ctx.fillText('TOTAL SCORE: ' + s.score, CFG.W / 2, 425);
    } else {
      ctx.fillStyle = '#ff5050';
      ctx.font = 'bold 56px Georgia, serif';
      ctx.fillText('CAUGHT!', CFG.W / 2, 320);
      ctx.fillStyle = CFG.colors.text;
      ctx.font = '24px Georgia, serif';
      ctx.fillText(s.message, CFG.W / 2, 375);
      ctx.fillText('Loot pocketed: $' + World.lootScore(s), CFG.W / 2, 412);
    }
    ctx.fillStyle = CFG.colors.dim;
    ctx.font = '20px Georgia, serif';
    ctx.fillText('Press R to try again', CFG.W / 2, 478);
  }
};

// Distance from a ray's origin to where it enters rect r, or null.
function rayRectEntry(ox, oy, dx, dy, r) {
  var tmin = -Infinity, tmax = Infinity, t;
  if (Math.abs(dx) < 1e-9) { if (ox < r.x || ox > r.x + r.w) return null; }
  else {
    var t1 = (r.x - ox) / dx, t2 = (r.x + r.w - ox) / dx;
    tmin = Math.max(tmin, Math.min(t1, t2));
    tmax = Math.min(tmax, Math.max(t1, t2));
  }
  if (Math.abs(dy) < 1e-9) { if (oy < r.y || oy > r.y + r.h) return null; }
  else {
    var t3 = (r.y - oy) / dy, t4 = (r.y + r.h - oy) / dy;
    tmin = Math.max(tmin, Math.min(t3, t4));
    tmax = Math.min(tmax, Math.max(t3, t4));
  }
  if (tmax < tmin || tmax < 0) return null;
  t = tmin >= 0 ? tmin : tmax;
  return t;
}

// Distance from a ray's origin (inside rect r) to where it leaves, or null.
function rayRectExit(ox, oy, dx, dy, r) {
  var tmax = Infinity;
  if (Math.abs(dx) < 1e-9) { if (ox < r.x || ox > r.x + r.w) return null; }
  else {
    var t1 = (r.x - ox) / dx, t2 = (r.x + r.w - ox) / dx;
    tmax = Math.min(tmax, Math.max(t1, t2));
  }
  if (Math.abs(dy) < 1e-9) { if (oy < r.y || oy > r.y + r.h) return null; }
  else {
    var t3 = (r.y - oy) / dy, t4 = (r.y + r.h - oy) / dy;
    tmax = Math.min(tmax, Math.max(t3, t4));
  }
  return tmax === Infinity ? null : tmax;
}
