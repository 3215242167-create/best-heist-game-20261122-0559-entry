// Boot and game loop. With no query string this runs the live game;
// with ?scene=N it stages one fixed frame (used for the screenshots).
(function () {
  var canvas = document.getElementById('stage');
  var ctx = canvas.getContext('2d');
  Input.init();

  var state = World.freshState();
  var sceneMatch = /[?&]scene=(\d)/.exec(window.location.search);
  if (sceneMatch) {
    World.applyScene(state, parseInt(sceneMatch[1], 10));
    Render.draw(ctx, state);
    return; // a staged frame never animates, so every capture is identical
  }

  var last = null;
  function frame(now) {
    if (last === null) last = now;
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (state.mode === 'title' && (Input.wasPressed('enter') || Input.wasPressed(' '))) {
      state = World.freshState();
      state.mode = 'play';
    } else if ((state.mode === 'caught' || state.mode === 'win') && Input.wasPressed('r')) {
      state = World.freshState();
      state.mode = 'play';
    }
    World.update(state, dt);
    Input.clearPressed();
    Render.draw(ctx, state);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
