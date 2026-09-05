/* Address autocomplete widget (CartoCiudad via /api/geocode). Self-hosted so it
 * passes the CSP (script-src 'self'). The dropdown is appended to <body> with
 * position:fixed so no ancestor stacking context / sibling card can clip or
 * cover it. Usage:  RLAddress.attach(inputEl, { onSelect(result) {} })
 * Idempotent per element. Used on the admin (#d-addr) and the intake form. */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  // The --th-* tokens are channel numbers for rgb(... / alpha) overlays, NOT
  // solid colors — so give the dropdown an explicit OPAQUE, theme-aware bg.
  var styleInjected = false;
  function ensureStyle() {
    if (styleInjected) return;
    styleInjected = true;
    var css =
      '.rl-ac-box{background:#0d0d1a;border:1px solid rgba(140,150,165,.28)}' +
      '.rl-ac-item{color:#f0f2f7}.rl-ac-sub{color:#8a93a0}' +
      ':root[data-theme="light"] .rl-ac-box{background:#fff;border-color:rgba(0,0,0,.12)}' +
      ':root[data-theme="light"] .rl-ac-item{color:#0d0d1a}:root[data-theme="light"] .rl-ac-sub{color:#666}' +
      '@media (prefers-color-scheme: light){' +
      ':root:not([data-theme="dark"]) .rl-ac-box{background:#fff;border-color:rgba(0,0,0,.12)}' +
      ':root:not([data-theme="dark"]) .rl-ac-item{color:#0d0d1a}' +
      ':root:not([data-theme="dark"]) .rl-ac-sub{color:#666}}';
    var s = document.createElement('style');
    s.id = 'rl-ac-style';
    s.textContent = css;
    document.head.appendChild(s);
  }

  function attach(input, opts) {
    opts = opts || {};
    if (!input || input.dataset.acWired) return;
    input.dataset.acWired = '1';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');
    ensureStyle();

    // Clean up any dropdown whose input was removed by a re-render (the admin
    // rebuilds the order detail on every open) so boxes never pile up on body.
    var stale = document.querySelectorAll('.rl-ac-box');
    for (var i = 0; i < stale.length; i++) {
      if (stale[i].__forInput && !stale[i].__forInput.isConnected) stale[i].remove();
    }

    var box = document.createElement('div');
    box.setAttribute('role', 'listbox');
    box.className = 'rl-ac-box';
    box.__forInput = input;
    box.style.cssText = 'position:fixed;z-index:2147483000;border-radius:12px;overflow:hidden;' +
      'overflow-y:auto;display:none;box-shadow:0 14px 36px rgba(0,0,0,.5);max-height:min(320px,45vh)';
    document.body.appendChild(box);

    var timer = null, items = [], active = -1;

    function place() {
      if (!input.isConnected) { box.remove(); return; }
      var r = input.getBoundingClientRect();
      box.style.left = r.left + 'px';
      box.style.width = r.width + 'px';
      var below = window.innerHeight - r.bottom;
      if (below < 220 && r.top > below) { // not enough room below → flip up
        box.style.top = 'auto';
        box.style.bottom = (window.innerHeight - r.top + 4) + 'px';
      } else {
        box.style.bottom = 'auto';
        box.style.top = (r.bottom + 4) + 'px';
      }
    }
    function onReflow() { if (box.style.display !== 'none') place(); }

    function close() {
      box.style.display = 'none'; box.innerHTML = ''; items = []; active = -1;
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    }
    function openBox() {
      place(); box.style.display = 'block';
      window.addEventListener('scroll', onReflow, true);
      window.addEventListener('resize', onReflow);
    }

    function highlight() {
      var rows = box.querySelectorAll('[data-i]');
      for (var i = 0; i < rows.length; i++) rows[i].style.background = i === active ? 'rgba(120,140,170,.18)' : 'transparent';
    }

    function choose(i) {
      var r = items[i];
      if (!r) return;
      input.value = r.label;
      close();
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      if (opts.onSelect) try { opts.onSelect(r); } catch (e) {}
      input.focus();
    }

    function render(results) {
      items = results || [];
      if (!items.length) { close(); return; }
      box.innerHTML = items.map(function (r, i) {
        var sub = [r.postalCode, r.muni, r.province].filter(Boolean).join(' · ');
        return '<div data-i="' + i + '" role="option" style="padding:10px 12px;cursor:pointer;' +
          'border-bottom:1px solid rgba(140,150,165,.12)">' +
          '<div class="rl-ac-item" style="font-size:14px;line-height:1.3">' + esc(r.label) + '</div>' +
          (sub ? '<div class="rl-ac-sub" style="font-size:11px;margin-top:1px">' + esc(sub) + '</div>' : '') +
          '</div>';
      }).join('');
      openBox();
      var rows = box.querySelectorAll('[data-i]');
      for (var k = 0; k < rows.length; k++) {
        (function (el) {
          el.addEventListener('mousedown', function (e) { e.preventDefault(); choose(Number(el.dataset.i)); });
          el.addEventListener('mouseenter', function () { active = Number(el.dataset.i); highlight(); });
        })(rows[k]);
      }
    }

    async function run() {
      var q = input.value.trim();
      if (q.length < 3) { close(); return; }
      try {
        var res = await fetch('/api/geocode?q=' + encodeURIComponent(q));
        var d = await res.json();
        if (d && d.ok) render(d.results); else close();
      } catch (e) { close(); }
    }

    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 300); });
    input.addEventListener('focus', function () { if (items.length) openBox(); });
    input.addEventListener('blur', function () { setTimeout(close, 150); });
    input.addEventListener('keydown', function (e) {
      if (box.style.display === 'none') return;
      if (e.key === 'ArrowDown') { active = Math.min(active + 1, items.length - 1); highlight(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { active = Math.max(active - 1, 0); highlight(); e.preventDefault(); }
      else if (e.key === 'Enter') { if (active >= 0) { choose(active); e.preventDefault(); } }
      else if (e.key === 'Escape') close();
    });
  }

  window.RLAddress = { attach: attach };
})();
