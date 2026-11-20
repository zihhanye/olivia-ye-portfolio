(function () {
  var root = document.documentElement;
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Pages ---------- */
  var pages = Array.prototype.slice.call(document.querySelectorAll('.page'));
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('[data-nav]'));
  var names = pages.map(function (p) { return p.dataset.page; });
  var current = null;

  function show(name, first) {
    if (names.indexOf(name) < 0) name = 'home';
    if (name === current) return;
    var swap = function () {
      pages.forEach(function (p) { p.hidden = p.dataset.page !== name; });
      navLinks.forEach(function (a) {
        if (a.dataset.nav === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
      });
      current = name;
      if (!first) {
        window.scrollTo(0, 0);
        var h = document.querySelector('.page[data-page="' + name + '"] h1');
        if (h) h.focus({ preventScroll: true });
      }
    };
    if (!first && !calm && document.startViewTransition) document.startViewTransition(swap); else swap();
  }
  window.addEventListener('hashchange', function () { show(location.hash.replace('#', ''), false); });
  show(location.hash.replace('#', ''), true);
  setTimeout(function () { root.classList.remove('intro-play'); }, 3400);

  /* ---------- Portrait: the photo as data points ---------- */
  var fig = document.getElementById('portrait');
  if (!fig) return;
  var frame = fig.querySelector('.portrait-frame');
  var img = fig.querySelector('img');
  var cv = fig.querySelector('canvas');
  var ctx = cv.getContext && cv.getContext('2d');
  if (!ctx) return;

  var COLS = 46, rows = 0, cell = 0, W = 0, H = 0, dpr = 1, lum = null;
  var live = false;

  function token(name) { return getComputedStyle(root).getPropertyValue(name).trim(); }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function sample() {
    var r = cv.getBoundingClientRect();
    if (!r.width || !img.naturalWidth) return false;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cell = W / COLS; rows = Math.ceil(H / cell);
    var off = document.createElement('canvas');
    off.width = COLS; off.height = rows;
    var o = off.getContext('2d');
    o.drawImage(img, 0, 0, COLS, rows);
    var d;
    try { d = o.getImageData(0, 0, COLS, rows).data; } catch (e) { return false; }
    lum = new Float32Array(COLS * rows);
    for (var i = 0; i < COLS * rows; i++) {
      lum[i] = (0.2126 * d[i * 4] + 0.7152 * d[i * 4 + 1] + 0.0722 * d[i * 4 + 2]) / 255;
    }
    return true;
  }

  // grow: 0..1 how far the dots have spread from the face; alpha: layer opacity; lens: optional circle
  function draw(grow, alpha, lens) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!lum || alpha <= 0) return;
    var dark = getComputedStyle(root).colorScheme.indexOf('dark') >= 0;
    ctx.save();
    if (lens) { ctx.beginPath(); ctx.arc(lens.x, lens.y, lens.r, 0, 6.2832); ctx.clip(); }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = token('--accent-soft');
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = token('--accent');
    var cx = W / 2, cy = H * 0.42, far = Math.sqrt(W * W + H * H) * 0.7;
    for (var y = 0; y < rows; y++) {
      for (var x = 0; x < COLS; x++) {
        var px = (x + 0.5) * cell, py = (y + 0.5) * cell;
        if (lens) {
          var dx = px - lens.x, dy = py - lens.y;
          if (dx * dx + dy * dy > (lens.r + cell) * (lens.r + cell)) continue;
        }
        var v = lum[y * COLS + x];
        if (!dark) v = 1 - v;
        var g = 1;
        if (grow < 1) {
          var wait = Math.sqrt((px - cx) * (px - cx) + (py - cy) * (py - cy)) / far * 0.6;
          g = clamp01((grow - wait) / 0.4);
          g = 1 - (1 - g) * (1 - g);
        }
        var rad = v * cell * 0.54 * g;
        if (rad < 0.35) continue;
        ctx.beginPath(); ctx.arc(px, py, rad, 0, 6.2832); ctx.fill();
      }
    }
    ctx.restore();
  }

  function intro() {
    var t0 = performance.now();
    function step(now) {
      var t = (now - t0) / 1000;
      if (t < 1.5) draw(t / 1.3, 1, null);
      else if (t < 2.4) draw(1, 1 - (t - 1.5) / 0.9, null);
      else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); live = true; return; }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function begin() {
    var early = performance.now() < 1200;
    if (root.classList.contains('intro-play') && early && sample()) intro(); else live = true;
  }
  if (img.complete && img.naturalWidth) begin(); else img.addEventListener('load', begin);

  // Lens: under the pointer, the photo turns back into data points
  var lens = { x: 0, y: 0, r: 0, target: 0 }, raf = 0;
  function tick() {
    raf = 0;
    lens.r += (lens.target - lens.r) * 0.2;
    if (Math.abs(lens.target - lens.r) < 0.6) lens.r = lens.target;
    if (lens.r > 1) draw(1, 1, lens); else { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); }
    if (lens.r !== lens.target) raf = requestAnimationFrame(tick);
  }
  function queue() { if (!raf) raf = requestAnimationFrame(tick); }
  frame.addEventListener('pointerenter', function () { if (live) sample(); });
  frame.addEventListener('pointermove', function (e) {
    if (!live || calm) return;
    if (!lum && !sample()) return;
    var r = cv.getBoundingClientRect();
    lens.x = e.clientX - r.left; lens.y = e.clientY - r.top;
    lens.target = Math.min(W, H) * 0.3;
    queue();
  });
  frame.addEventListener('pointerleave', function () { lens.target = 0; queue(); });
})();
