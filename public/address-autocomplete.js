/* Address autocomplete widget (CartoCiudad via /api/geocode). Self-hosted so it
 * passes the CSP (script-src 'self'); styled with inline CSS vars (--th-*) that
 * exist on every page, so Tailwind purging never strips it. Usage:
 *   RLAddress.attach(inputEl, { onSelect(result) {} })
 * Idempotent per element. Works on the admin (#d-addr) and the intake form. */
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function attach(input, opts) {
    opts = opts || {};
    if (!input || input.dataset.acWired) return;
    input.dataset.acWired = '1';
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('spellcheck', 'false');

    var wrap = document.createElement('div');
    wrap.style.position = 'relative';
    wrap.style.flex = input.classList.contains('flex-1') ? '1' : '';
    input.parentNode.insertBefore(wrap, input);
    wrap.appendChild(input);
    input.style.width = '100%'; // fill the wrapper (it no longer flexes itself)

    var box = document.createElement('div');
    box.setAttribute('role', 'listbox');
    box.style.cssText = 'position:absolute;z-index:70;left:0;right:0;top:calc(100% + 3px);' +
      'background:var(--th-surface,#14181d);border:1px solid rgba(140,150,165,.25);border-radius:12px;' +
      'overflow:hidden;display:none;box-shadow:0 12px 32px rgba(0,0,0,.45);max-height:300px;overflow-y:auto';
    wrap.appendChild(box);

    var timer = null, items = [], active = -1;

    function close() { box.style.display = 'none'; box.innerHTML = ''; items = []; active = -1; }

    function highlight() {
      var rows = box.querySelectorAll('[data-i]');
      for (var i = 0; i < rows.length; i++) rows[i].style.background = i === active ? 'rgba(120,140,170,.16)' : 'transparent';
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
          'border-bottom:1px solid rgba(140,150,165,.10)">' +
          '<div style="font-size:14px;color:var(--th-heading,#eef);line-height:1.3">' + esc(r.label) + '</div>' +
          (sub ? '<div style="font-size:11px;color:var(--th-faint,#8a93a0);margin-top:1px">' + esc(sub) + '</div>' : '') +
          '</div>';
      }).join('');
      box.style.display = 'block';
      active = -1;
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
    input.addEventListener('focus', function () { if (items.length) box.style.display = 'block'; });
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
