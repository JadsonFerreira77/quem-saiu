/* Quem Saiu? — Modo rápido
 * Roda no instagram.com (logado), no SEU navegador. Não envia nada para fora do Instagram.
 * Só leitura por padrão. Deixar de seguir: 1 clique por pessoa, com intervalo mínimo e limite diário.
 * Código aberto: https://github.com/JadsonFerreira77/quem-saiu
 */
(function () { try { (function () {
  'use strict';
  if (window.__quemSaiuAberto) { return; }

  var TTP = null;
  try { if (window.trustedTypes && trustedTypes.createPolicy) { TTP = trustedTypes.createPolicy('quemsaiu', { createHTML: function (x) { return x; } }); } } catch (e) { TTP = null; }
  function decEnt(t) { return t.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, function (_, k) { return { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", nbsp: '\u00a0' }[k]; }); }
  function parseH(el, html) {
    var VOID = { br: 1, img: 1, input: 1, hr: 1, meta: 1, link: 1 };
    var stack = [el], re = /<\/?([a-zA-Z][\w-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>|([^<]+)/g, m;
    while ((m = re.exec(html))) {
      var top = stack[stack.length - 1];
      if (m[3] !== undefined) { top.appendChild(document.createTextNode(decEnt(m[3]))); continue; }
      var tag = m[1].toLowerCase();
      if (m[0].charAt(1) === '/') { for (var k = stack.length - 1; k > 0; k--) { if (stack[k].tagName.toLowerCase() === tag) { stack.length = k; break; } } continue; }
      var e = document.createElement(tag), ar = /([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g, a;
      while ((a = ar.exec(m[2]))) { if (/^on/i.test(a[1])) continue; e.setAttribute(a[1], decEnt(a[2] !== undefined ? a[2] : a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : '')); }
      top.appendChild(e);
      if (!VOID[tag] && !/\/\s*$/.test(m[2])) stack.push(e);
    }
  }
  function setH(el, html) {
    html = String(html);
    try { el.innerHTML = TTP ? TTP.createHTML(html) : html; return; } catch (e) { }
    while (el.firstChild) el.removeChild(el.firstChild);
    parseH(el, html);
  }
  if (!/(^|\.)instagram\.com$/.test(location.hostname)) {
    alert('Quem Saiu?: abra o instagram.com no navegador, entre na sua conta e toque no favorito de novo.');
    return;
  }
  function cookie(n) { var m = document.cookie.match('(?:^|; )' + n + '=([^;]*)'); return m ? decodeURIComponent(m[1]) : null; }
  var uid = cookie('ds_user_id');
  if (!uid) { alert('Quem Saiu?: você não está logado no instagram.com. Entre na sua conta e tente de novo.'); return; }
  window.__quemSaiuAberto = true;

  var APP_ID = '936619743392459';
  var PAGE = 50;                 // pessoas por consulta
  var DELAY_MIN = 900, DELAY_MAX = 2000; // pausa aleatória entre consultas (ms)
  var PAUSA_LONGA_CADA = 15;     // a cada 15 consultas...
  var PAUSA_LONGA = 8000;        // ...pausa de ~8 s
  var ESPERA_429 = 90000;        // se o Instagram pedir para esperar: 1,5 min (dobra se repetir)
  var MAX_TENTATIVAS = 3;
  var UNF_INTERVALO = 40000;     // mínimo 40 s entre "deixar de seguir"
  var UNF_LIMITE_DIA = 100;      // máximo por dia
  var KEY_SNAP = 'quemsaiu_snap_' + uid, KEY_UNF = 'quemsaiu_unf_' + uid;
  var parar = false;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function rnd(a, b) { return a + Math.floor(Math.random() * (b - a)); }
  function hoje() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function lsGet(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def; } catch (e) { return def; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- UI ---------- */
  var css = '#qs-ov{position:fixed;inset:0;z-index:2147483647;background:#0B0B14;color:#F4F4F8;font:15px/1.4 -apple-system,"Segoe UI",Roboto,Inter,sans-serif;display:flex;flex-direction:column}' +
    '#qs-ov *{box-sizing:border-box}#qs-hd{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid #22222f;background:#12121c}' +
    '#qs-hd b{font-size:18px;background:linear-gradient(90deg,#a78bfa,#f472b6,#fbbf24);-webkit-background-clip:text;background-clip:text;color:#f472b6;-webkit-text-fill-color:transparent}' +
    '#qs-hd .sp{flex:1}.qs-btn{border:0;border-radius:999px;padding:10px 14px;min-height:40px;font-weight:700;cursor:pointer;color:#fff;background:linear-gradient(90deg,#7C3AED,#EC4899,#F59E0B)}' +
    '.qs-gh{background:#1c1c28;border:1px solid #2c2c3a;color:#F4F4F8}#qs-body{flex:1;overflow:auto;padding:14px}' +
    '.qs-card{background:#151520;border:1px solid #24243a;border-radius:16px;padding:14px;margin-bottom:12px}' +
    '.qs-bar{height:8px;border-radius:9px;background:#24243a;overflow:hidden;margin-top:8px}.qs-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#7C3AED,#EC4899,#F59E0B);transition:width .3s}' +
    '.qs-mut{color:#A1A1B5;font-size:13px}.qs-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}@media(min-width:700px){.qs-stats{grid-template-columns:repeat(4,1fr)}}' +
    '.qs-stat{background:#151520;border:1px solid #24243a;border-radius:14px;padding:10px}.qs-stat b{font-size:22px;display:block}' +
    '#qs-tabs{display:flex;gap:6px;overflow-x:auto;padding:10px 0}.qs-tab{white-space:nowrap;border-radius:999px;padding:8px 12px;min-height:40px;border:1px solid #2c2c3a;background:#1c1c28;color:#F4F4F8;cursor:pointer;font-weight:600}' +
    '.qs-tab.on{background:linear-gradient(90deg,#7C3AED,#EC4899);border-color:transparent}' +
    '.qs-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #1f1f2c}.qs-row img,.qs-av{width:40px;height:40px;flex:0 0 40px;border-radius:50%;object-fit:cover;background:#2a2a3a}' +
    '.qs-av{display:flex;align-items:center;justify-content:center;font-weight:800;color:#fff;background:linear-gradient(135deg,#7C3AED,#EC4899,#F59E0B)}' +
    '.qs-row .nm{flex:1;min-width:0}.qs-row .nm a{color:#F4F4F8;font-weight:700;text-decoration:none}.qs-row .nm div{color:#A1A1B5;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.qs-row.done{opacity:.45}.qs-row.done a{text-decoration:line-through}.qs-sm{padding:8px 12px;min-height:36px;font-size:13px}' +
    '#qs-q{width:100%;padding:10px 12px;border-radius:12px;border:1px solid #2c2c3a;background:#12121c;color:#F4F4F8;font-size:15px}' +
    '.qs-warn{background:#2a2210;border:1px solid #6b5313;color:#fde68a;border-radius:12px;padding:10px;font-size:13px;margin:8px 0}' +
    '#qs-toast{position:fixed;left:50%;bottom:20px;transform:translateX(-50%);background:#22222f;color:#fff;padding:10px 16px;border-radius:999px;display:none;z-index:2147483647}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var ov = document.createElement('div'); ov.id = 'qs-ov';
  setH(ov, '<div id="qs-hd"><b>Quem Saiu?</b><span class="qs-mut">modo rápido</span><span class="sp"></span><button class="qs-btn qs-gh" id="qs-x">Fechar</button></div><div id="qs-body"></div><div id="qs-toast"></div>');
  document.body.appendChild(ov);
  var body = ov.querySelector('#qs-body');
  ov.querySelector('#qs-x').onclick = function () { parar = true; ov.remove(); st.remove(); window.__quemSaiuAberto = false; };
  function toast(t) { var e = ov.querySelector('#qs-toast'); e.textContent = t; e.style.display = 'block'; clearTimeout(toast.t); toast.t = setTimeout(function () { e.style.display = 'none'; }, 2500); }

  setH(body, '<div class="qs-card"><b>Lendo suas listas com calma</b><div class="qs-mut" id="qs-st">Começando…</div><div class="qs-bar"><i id="qs-pb"></i></div>' +
    '<p class="qs-mut">Isso pode levar alguns minutos: o Quem Saiu? faz pausas para não parecer robô. Deixe esta aba aberta.</p>' +
    '<button class="qs-btn qs-gh" id="qs-stop">Parar</button></div>' +
    '<div class="qs-card qs-cur"><div class="qs-mut">💡 Você sabia?</div><div id="qs-cur" style="margin-top:6px;font-size:16px"></div></div>');
  body.querySelector('#qs-stop').onclick = function () { parar = true; };
  var CURIOSIDADES = [
    'O polvo tem três corações e sangue azul.',
    'Mel não estraga: já acharam mel comestível em tumbas do Egito antigo.',
    'Um dia em Vênus dura mais que um ano em Vênus.',
    'A Amazônia tem cerca de 390 bilhões de árvores.',
    'O Brasil é o único país onde se fala português na América do Sul.',
    'Os tubarões existem há mais tempo que as árvores.',
    'A Torre Eiffel fica uns 15 cm mais alta no verão, por causa do calor.',
    'Bananas são levemente radioativas, por causa do potássio.',
    'O corpo humano tem cerca de 206 ossos.',
    'Uma colher de chá de estrela de nêutrons pesaria bilhões de toneladas.',
    'Os flamingos são rosa por causa do que comem.',
    'O Monte Everest cresce alguns milímetros por ano.',
    'As vacas têm melhores amigas e ficam estressadas quando são separadas.',
    'A luz do Sol leva cerca de 8 minutos para chegar à Terra.',
    'Os coalas dormem até 20 horas por dia.',
    'O Rio Amazonas despeja no mar mais água que qualquer outro rio do mundo.',
    'O Instagram foi lançado em 6 de outubro de 2010.',
    'Você pode seguir no máximo 7.500 contas no Instagram.',
    'As formigas não dormem como nós: tiram centenas de cochilos de 1 minuto por dia.',
    'Um raio é cerca de 5 vezes mais quente que a superfície do Sol.'
  ];
  var curI = rnd(0, CURIOSIDADES.length);
  function trocaCur() { var c = body.querySelector('#qs-cur'); if (!c) { clearInterval(curT); return; } c.textContent = CURIOSIDADES[curI++ % CURIOSIDADES.length]; }
  trocaCur(); var curT = setInterval(trocaCur, 8000);
  var t0 = Date.now();
  function status(t, pct) { var s = body.querySelector('#qs-st'); if (s) s.textContent = t; var p = body.querySelector('#qs-pb'); if (p && pct != null) p.style.width = Math.min(100, pct) + '%'; }

  /* ---------- Leitura ---------- */
  var consultas = 0;
  async function getJSON(url) {
    for (var t = 0; t < MAX_TENTATIVAS; t++) {
      if (parar) throw new Error('parado');
      var r;
      try { r = await fetch(url, { credentials: 'include', headers: { 'X-IG-App-ID': APP_ID, 'X-Requested-With': 'XMLHttpRequest' } }); }
      catch (e) { await sleep(10000); continue; }
      if (r.ok) { return r.json(); }
      if (r.status === 429 || r.status === 400 || r.status === 401 || r.status === 560) {
        var fim = Date.now() + ESPERA_429 * (t + 1);
        while (Date.now() < fim) { if (parar) throw new Error('parado'); status('O Instagram pediu uma pausa. Retomando em ' + Math.ceil((fim - Date.now()) / 1000) + ' s…'); await sleep(1000); }
        continue;
      }
      throw new Error('HTTP ' + r.status);
    }
    throw new Error('limite');
  }
  async function lerLista(tipo, total, base, peso) {
    var out = [], max = '', nome = tipo === 'followers' ? 'seguidores' : 'seguindo';
    while (true) {
      if (parar) throw new Error('parado');
      var url = '/api/v1/friendships/' + uid + '/' + tipo + '/?count=' + PAGE + (max ? '&max_id=' + encodeURIComponent(max) : '') + (tipo === 'followers' ? '&search_surface=follow_list_page' : '');
      var j = await getJSON(url);
      (j.users || []).forEach(function (u) { out.push({ id: String(u.pk_id || u.pk || u.id), u: String(u.username).toLowerCase(), n: u.full_name || '', p: u.profile_pic_url || '', v: !!u.is_verified }); });
      var pct = total ? out.length / total : 0;
      var gpct = base + Math.min(1, pct) * peso, seg = (Date.now() - t0) / 1000, resta = gpct > 0.05 ? Math.round(seg / gpct - seg) : 0;
      status('Lendo ' + nome + ': ' + out.length + (total ? ' de ' + total : '') + (resta > 0 ? ' · falta ~' + (resta >= 90 ? Math.round(resta / 60) + ' min' : resta + ' s') : ''), gpct * 100);
      max = j.next_max_id;
      if (!max) break;
      consultas++;
      await sleep(rnd(DELAY_MIN, DELAY_MAX));
      if (consultas % PAUSA_LONGA_CADA === 0) { status('Pausa curta para não parecer robô…'); await sleep(PAUSA_LONGA + rnd(0, 5000)); }
    }
    var seen = {}; return out.filter(function (x) { if (seen[x.u]) return false; seen[x.u] = 1; return true; });
  }

  var dados = {};
  (async function () {
    try {
      var info = null;
      try { var pj = await getJSON('/api/v1/users/' + uid + '/info/'); info = pj.user; } catch (e) {}
      var nF = info ? info.follower_count : 0, nG = info ? info.following_count : 0;
      if (info) status('Conta @' + info.username + ': ' + nF + ' seguidores, ' + nG + ' seguindo', 2);
      var peso = (nF + nG) ? nF / (nF + nG) : 0.5;
      dados.followers = await lerLista('followers', nF, 0, peso);
      await sleep(rnd(1500, 3000));
      dados.following = await lerLista('following', nG, peso, 1 - peso);
      mostrar();
    } catch (e) {
      if (e.message === 'parado') { status('Parado. Toque em Fechar.'); return; }
      status('Não deu para terminar agora (' + e.message + '). Espere uns 30 minutos e tente de novo.');
    }
  })();

  /* ---------- Resultados ---------- */
  function mostrar() {
    var F = {}, G = {}; dados.followers.forEach(function (x) { F[x.u] = x; }); dados.following.forEach(function (x) { G[x.u] = x; });
    var prev = lsGet(KEY_SNAP, null);
    var listas = {
      nao: dados.following.filter(function (x) { return !F[x.u]; }),
      fas: dados.followers.filter(function (x) { return !G[x.u]; }),
      sairam: prev ? prev.f.filter(function (x) { return !F[x.u]; }) : null,
      novos: null
    };
    if (prev) { var P = {}; prev.f.forEach(function (x) { P[x.u] = 1; }); listas.novos = dados.followers.filter(function (x) { return !P[x.u]; }); }
    lsSet(KEY_SNAP, { d: new Date().toISOString(), f: dados.followers.map(function (x) { return { u: x.u, n: x.n, id: x.id }; }) });
    var desde = prev ? new Date(prev.d).toLocaleString('pt-BR') : null;
    var feitos = {};
    var abas = [['nao', 'Não me seguem de volta'], ['fas', 'Eu não sigo de volta'], ['sairam', 'Deixaram de me seguir'], ['novos', 'Novos seguidores']];
    var atual = 'nao';
    setH(body, '<div class="qs-stats">' +
      '<div class="qs-stat"><b>' + dados.followers.length + '</b><span class="qs-mut">Seguidores</span></div>' +
      '<div class="qs-stat"><b>' + dados.following.length + '</b><span class="qs-mut">Seguindo</span></div>' +
      '<div class="qs-stat"><b>' + listas.nao.length + '</b><span class="qs-mut">Não te seguem de volta</span></div>' +
      '<div class="qs-stat"><b>' + (listas.sairam ? listas.sairam.length : '–') + '</b><span class="qs-mut">Deixaram de seguir' + (desde ? ' desde ' + esc(desde) : '') + '</span></div></div>' +
      '<div id="qs-tabs"></div><input id="qs-q" placeholder="Buscar @usuário"><div class="qs-mut" id="qs-info" style="margin:8px 0"></div>' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="qs-btn qs-gh qs-sm" id="qs-copy">Copiar lista</button><button class="qs-btn qs-gh qs-sm" id="qs-csv">Baixar CSV</button></div>' +
      '<div id="qs-warn"></div><div id="qs-list"></div>');
    var tabs = body.querySelector('#qs-tabs');
    abas.forEach(function (a) {
      var b = document.createElement('button'); b.className = 'qs-tab'; b.dataset.k = a[0];
      b.textContent = a[1] + ' ' + (listas[a[0]] ? listas[a[0]].length : '–');
      b.onclick = function () { atual = a[0]; render(); }; tabs.appendChild(b);
    });
    body.querySelector('#qs-q').oninput = render;
    function visiveis() { var q = body.querySelector('#qs-q').value.trim().toLowerCase().replace(/^@/, ''); return (listas[atual] || []).filter(function (x) { return !q || x.u.indexOf(q) >= 0 || (x.n || '').toLowerCase().indexOf(q) >= 0; }); }
    body.querySelector('#qs-copy').onclick = function () { var t = visiveis().map(function (x) { return '@' + x.u; }).join('\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast('Lista copiada!'); }, function () { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); toast('Lista copiada!'); }); };
    body.querySelector('#qs-csv').onclick = function () { var t = 'usuario,link\n' + visiveis().map(function (x) { return x.u + ',https://www.instagram.com/' + x.u + '/'; }).join('\n'); var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/csv' })); a.download = 'quem-saiu-' + atual + '.csv'; a.click(); };
    function render() {
      [].forEach.call(tabs.children, function (b) { b.classList.toggle('on', b.dataset.k === atual); });
      var L = body.querySelector('#qs-list'), info = body.querySelector('#qs-info'), w = body.querySelector('#qs-warn');
      setH(w, atual === 'nao' ? '<div class="qs-warn">Para não ser bloqueado: o botão "Deixar de seguir" espera ' + (UNF_INTERVALO / 1000) + ' s entre um e outro e para em ' + UNF_LIMITE_DIA + ' por dia. Você também pode abrir o perfil e deixar de seguir pelo app.</div>' : '');
      if (!listas[atual]) { info.textContent = ''; setH(L, '<div class="qs-card qs-mut">Esta é a sua primeira leitura. Na próxima vez que usar o modo rápido neste navegador, aqui aparece quem deixou de te seguir e quem começou.</div>'); return; }
      var v = visiveis(); info.textContent = v.length + ' pessoas';
      setH(L, v.slice(0, 1000).map(function (x) {
        return '<div class="qs-row' + (feitos[x.u] ? ' done' : '') + '" data-u="' + esc(x.u) + '">' + (x.p ? '<img src="' + esc(x.p) + '" alt="" loading="lazy" data-l="' + esc(x.u.charAt(0).toUpperCase()) + '">' : '<span class="qs-av">' + esc(x.u.charAt(0).toUpperCase()) + '</span>') +
          '<div class="nm"><a href="https://www.instagram.com/' + esc(x.u) + '/" target="_blank" rel="noopener">@' + esc(x.u) + (x.v ? ' ✔' : '') + '</a><div>' + esc(x.n) + '</div></div>' +
          (atual === 'nao' ? '<button class="qs-btn qs-sm" data-unf="' + esc(x.id) + '"' + (feitos[x.u] ? ' disabled' : '') + '>' + (feitos[x.u] ? 'Feito' : 'Deixar de seguir') + '</button>' : '') + '</div>';
      }).join('') + (v.length > 1000 ? '<div class="qs-mut">Mostrando 1000. Use a busca para achar os outros.</div>' : ''));
    }
    body.addEventListener('error', function (ev) {
      var im = ev.target; if (!im || im.tagName !== 'IMG' || im.dataset.f) return; im.dataset.f = '1';
      var sp = document.createElement('span'); sp.className = 'qs-av'; sp.textContent = im.dataset.l || '?'; im.replaceWith(sp);
    }, true);
    async function deixar(id) {
      var h = { 'X-IG-App-ID': APP_ID, 'X-CSRFToken': cookie('csrftoken') || '', 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded' };
      var claim = sessionStorage.getItem('www-claim-v2'); if (claim) h['X-IG-WWW-Claim'] = claim;
      var tent = [
        ['/api/v1/friendships/destroy/' + id + '/', 'container_module=profile&nav_chain=&user_id=' + encodeURIComponent(id)],
        ['/web/friendships/' + id + '/unfollow/', '']
      ], ult = 0;
      for (var i = 0; i < tent.length; i++) {
        var r = await fetch(tent[i][0], { method: 'POST', credentials: 'include', headers: h, body: tent[i][1] });
        ult = r.status;
        if (r.status === 429) return { s: 429 };
        if (r.ok) {
          var j = null; try { j = await r.json(); } catch (e) {}
          if (!j || j.status === 'ok' || (j.friendship_status && j.friendship_status.following === false)) return { s: 200 };
        }
      }
      // confere se deixou mesmo
      try { var c = await fetch('/api/v1/friendships/show/' + id + '/', { credentials: 'include', headers: { 'X-IG-App-ID': APP_ID } }); var cj = await c.json(); if (cj.following === false) return { s: 200 }; } catch (e) {}
      return { s: ult || 0 };
    }
    body.addEventListener('click', async function (ev) {
      var b = ev.target.closest('[data-unf]'); if (!b) return;
      var row = b.closest('.qs-row'), u = row.dataset.u;
      var reg = lsGet(KEY_UNF, { d: hoje(), c: 0, t: 0 }); if (reg.d !== hoje()) reg = { d: hoje(), c: 0, t: 0 };
      if (reg.c >= UNF_LIMITE_DIA) { toast('Limite de hoje atingido (' + UNF_LIMITE_DIA + '). Continue amanhã.'); return; }
      var falta = reg.t + UNF_INTERVALO + rnd(0, 10000) - Date.now();
      if (falta > 0) { toast('Aguarde ' + Math.ceil(falta / 1000) + ' s para o próximo.'); return; }
      if (!confirm('Deixar de seguir @' + u + '?')) return;
      b.disabled = true; b.textContent = '…';
      try {
        var r = await deixar(b.dataset.unf);
        if (r.s === 429) { reg.t = Date.now() + 3600000; lsSet(KEY_UNF, reg); toast('O Instagram pediu uma pausa. Espere pelo menos 1 hora.'); b.disabled = false; b.textContent = 'Deixar de seguir'; return; }
        if (r.s !== 200) throw new Error('código ' + r.s);
        reg.c++; reg.t = Date.now(); lsSet(KEY_UNF, reg); feitos[u] = 1; row.classList.add('done'); b.textContent = 'Feito';
        toast('Pronto. Hoje: ' + reg.c + ' de ' + UNF_LIMITE_DIA + '.');
      } catch (e) { b.disabled = false; b.textContent = 'Deixar de seguir'; alert('Quem Saiu?: o Instagram não aceitou deixar de seguir @' + u + ' (' + (e && e.message) + '). Mande um print disso. Por enquanto, abra o perfil e deixe de seguir por lá.'); }
    });
    render();
  }
})(); } catch (e) { alert('Quem Saiu?: erro ao abrir (' + (e && e.message) + '). Mande um print disso.'); } })();
