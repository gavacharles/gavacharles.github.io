(function () {
  var root = document.documentElement;

  // theme toggle (dark is default; choice remembered per browser)
  var tb = document.getElementById('theme');
  if (tb) tb.addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // project filters
  var filters = document.getElementById('filters');
  if (filters) filters.addEventListener('click', function (e) {
    var b = e.target.closest('[data-f]'); if (!b) return;
    filters.querySelectorAll('.chip').forEach(function (c) { c.classList.toggle('on', c === b); });
    var f = b.dataset.f;
    document.querySelectorAll('#plist .card').forEach(function (c) {
      c.hidden = f && (c.dataset.topics || '').split(' ')[0] !== f;
    });
  });

  // search
  var box = document.getElementById('search'), q = document.getElementById('q'),
      out = document.getElementById('results'), data = null, sel = 0;
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }
  function load() {
    if (data) return Promise.resolve(data);
    return fetch(window.BASE + 'search.json').then(function (r) { return r.json(); }).then(function (d) { return (data = d); });
  }
  function open() { box.hidden = false; q.value = ''; render(); q.focus(); load().then(render); }
  function close() { box.hidden = true; }
  function render() {
    var terms = q.value.toLowerCase().split(/\s+/).filter(Boolean), res = [];
    (data || []).forEach(function (d) {
      var hay = (d.t + ' ' + d.s + ' ' + d.x).toLowerCase(), title = d.t.toLowerCase(), score = 0;
      for (var i = 0; i < terms.length; i++) {
        if (hay.indexOf(terms[i]) < 0) return;
        score += title.indexOf(terms[i]) >= 0 ? 3 : 1;
      }
      res.push([score + (d.k === 'Topic' ? 0.5 : 0), d]);
    });
    res.sort(function (a, b) { return b[0] - a[0]; });
    sel = 0;
    out.innerHTML = res.slice(0, 20).map(function (r, i) {
      var d = r[1];
      return '<li><a href="' + d.u + '"' + (i === 0 ? ' class="sel"' : '') + '><span class="k">' + d.k + '</span>' +
        esc(d.t) + '<small>' + esc(d.s) + '</small></a></li>';
    }).join('') || (data ? '<li class="muted" style="padding:12px 14px">No matches.</li>' : '');
  }
  if (box) {
    document.getElementById('search-open').addEventListener('click', open);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    q.addEventListener('input', render);
    q.addEventListener('keydown', function (e) {
      var links = out.querySelectorAll('a');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!links.length) return;
        links[sel].classList.remove('sel');
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
        links[sel].classList.add('sel'); links[sel].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && links[sel]) { location.href = links[sel].href; }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) close();
      else if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && box.hidden &&
               !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); open(); }
    });
  }
})();
