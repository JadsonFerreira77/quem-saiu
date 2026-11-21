/* Quem Saiu? — favorito curto para o celular.
 * O Chrome do celular corta favoritos com mais de 5.000 caracteres. Este favorito é pequeno:
 * na primeira vez, você cola o código completo do modo rápido numa caixa; ele fica salvo neste
 * navegador (no próprio instagram.com) e nas próximas vezes abre direto.
 */
(function () {
  try {
    var K = 'quemsaiu_code';
    if (!/(^|\.)instagram\.com$/.test(location.hostname)) { alert('Quem Saiu?: abra o instagram.com, entre na sua conta e toque no favorito de novo.'); return; }
    if (window.__quemSaiuAberto) return;
    var P = null;
    try { if (window.trustedTypes && trustedTypes.createPolicy) P = trustedTypes.createPolicy('quemsaiuL', { createScriptURL: function (x) { return x; } }); } catch (e) { P = null; }
    function run(c) {
      c = String(c || '').trim();
      if (/^javascript:/i.test(c)) { try { c = decodeURIComponent(c.slice(11)); } catch (e) { c = c.slice(11); } }
      if (c.indexOf('__quemSaiuAberto') < 0 || c.length < 3000) { alert('Quem Saiu?: esse não é o código completo do modo rápido. No site, toque em "Copiar código completo" e cole de novo.'); return false; }
      try { localStorage.setItem(K, c); } catch (e) {}
      var u = URL.createObjectURL(new Blob([c], { type: 'text/javascript' })), s = document.createElement('script');
      s.onerror = function () { alert('Quem Saiu?: o Instagram bloqueou o código. Mande um print disso.'); };
      s.src = P ? P.createScriptURL(u) : u;
      (document.head || document.documentElement).appendChild(s);
      return true;
    }
    var salvo = null; try { salvo = localStorage.getItem(K); } catch (e) {}
    if (salvo) { run(salvo); return; }
    function el(t, css, txt) { var e = document.createElement(t); if (css) e.style.cssText = css; if (txt) e.textContent = txt; return e; }
    var BTN = 'border:0;border-radius:999px;padding:12px 16px;font-weight:700;font-size:15px;color:#fff;background:linear-gradient(90deg,#7C3AED,#EC4899,#F59E0B);margin-right:8px';
    var ov = el('div', 'position:fixed;inset:0;z-index:2147483647;background:#0B0B14;color:#F4F4F8;font:15px/1.4 -apple-system,Roboto,sans-serif;padding:18px;overflow:auto');
    ov.appendChild(el('div', 'font-size:20px;font-weight:800;margin-bottom:6px', 'Quem Saiu? – primeira vez'));
    ov.appendChild(el('div', 'color:#A1A1B5;margin-bottom:12px', '1) Toque em Pegar código e depois em Copiar. 2) Volte para esta aba, toque em Colar e em Abrir. Só precisa fazer isso uma vez.'));
    var ta = el('textarea', 'width:100%;height:140px;border-radius:12px;border:1px solid #2c2c3a;background:#12121c;color:#F4F4F8;padding:10px;font-size:13px;box-sizing:border-box');
    ta.placeholder = 'Toque e segure aqui > Colar';
    ov.appendChild(ta);
    var row = el('div', 'margin-top:12px');
    var bPeg = el('button', BTN, 'Pegar código');
    bPeg.style.display = 'block'; bPeg.style.marginBottom = '12px';
    ov.insertBefore(bPeg, ta);
    bPeg.onclick = function () { window.open('https://quemsaiu.vercel.app/#copiar', '_blank'); };
    var bCol = el('button', BTN.replace(/background:[^;]+/, 'background:#1c1c28'), 'Colar');
    var bAbr = el('button', BTN, 'Abrir');
    var bX = el('button', BTN.replace(/background:[^;]+/, 'background:#1c1c28'), 'Fechar');
    row.appendChild(bCol); row.appendChild(bAbr); row.appendChild(bX); ov.appendChild(row);
    bCol.onclick = function () { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(function (t) { ta.value = t; }, function () { alert('Toque e segure na caixa e escolha Colar.'); }); else alert('Toque e segure na caixa e escolha Colar.'); };
    bAbr.onclick = function () { if (run(ta.value)) ov.remove(); };
    bX.onclick = function () { ov.remove(); };
    document.body.appendChild(ov);
  } catch (e) { alert('Quem Saiu?: erro ao abrir (' + (e && e.message) + '). Mande um print disso.'); }
})();
