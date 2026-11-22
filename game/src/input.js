// Keyboard state. The world module reads held keys each tick; this file only
// tracks which keys are down and exposes a few named one-shot presses.
var Input = {
  held: {},
  pressed: {},

  init: function () {
    var self = this;
    window.addEventListener('keydown', function (ev) {
      var k = ev.key.toLowerCase();
      if (!self.held[k]) self.pressed[k] = true;
      self.held[k] = true;
      if (k.indexOf('arrow') === 0 || k === ' ') ev.preventDefault();
    });
    window.addEventListener('keyup', function (ev) {
      self.held[ev.key.toLowerCase()] = false;
    });
    window.addEventListener('blur', function () { self.held = {}; });
  },

  // Movement vector from WASD or arrow keys, normalised to length 0 or 1.
  moveVector: function () {
    var x = 0, y = 0;
    if (this.held['a'] || this.held['arrowleft']) x -= 1;
    if (this.held['d'] || this.held['arrowright']) x += 1;
    if (this.held['w'] || this.held['arrowup']) y -= 1;
    if (this.held['s'] || this.held['arrowdown']) y += 1;
    if (x !== 0 && y !== 0) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x: x, y: y };
  },

  // True once per physical press of the named key.
  wasPressed: function (name) {
    if (this.pressed[name]) { this.pressed[name] = false; return true; }
    return false;
  },

  clearPressed: function () { this.pressed = {}; }
};
