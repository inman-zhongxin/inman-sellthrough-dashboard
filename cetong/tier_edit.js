/* ============================================================
   主推梯队在线编辑 v1.0  (2026-10-19)
   点「主推梯队」单元格 → 弹出档位面板 → 选中即改并直连 GitHub 保存
   依赖页面提供：window.__TIER_CFG = {store, path, repo}
   依赖全局：__TIER / __TIER_RANK / __TIER_NOTE / currentData / render()
   ============================================================ */
(function () {
'use strict';

var CFG     = window.__TIER_CFG || {};
var STORE   = CFG.store  || 'POP';
var PATH    = CFG.path   || 'cetong/tier_data.js';
var REPO    = CFG.repo   || 'inman-zhongxin/inman-sellthrough-dashboard';
var BRANCH  = 'gh-pages';
var RANK    = { 'TOP1-5': 3, 'TOP6-10': 2, 'TOP11-20': 1 };
var TIERS   = ['TOP1-5', 'TOP6-10', 'TOP11-20'];
var TOKEN_KEY = 'gh_tier_token_v1';
var NONE_LABEL = '未入梯队';

/* 注入前先兜底，防止 data.js 里没有该变量 */
if (typeof window.__TIER === 'undefined')      window.__TIER = {};
if (typeof window.__TIER_RANK === 'undefined') window.__TIER_RANK = RANK;
if (typeof window.__TIER_NOTE === 'undefined') window.__TIER_NOTE = {};

var CSS = `
.te-pop{position:fixed;z-index:99990;background:#fff;border:1px solid #d8e0e6;border-radius:10px;
  box-shadow:0 10px 30px rgba(16,40,60,.22);padding:5px;min-width:158px;
  font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;animation:teIn .12s ease-out}
@keyframes teIn{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:none}}
.te-pop .te-hd{font-size:11px;color:#8b98a3;padding:4px 8px 6px;border-bottom:1px solid #eef2f5;
  margin-bottom:3px;white-space:nowrap;display:flex;justify-content:space-between;gap:10px}
.te-pop .te-hd b{color:#1f4e79;font-weight:600}
.te-opt{display:flex;align-items:center;gap:8px;padding:6px 9px;border-radius:6px;font-size:12px;
  cursor:pointer;color:#2b3a47;white-space:nowrap;user-select:none}
.te-opt:hover{background:#f1f7fa}
.te-opt .te-dot{width:11px;height:11px;border-radius:50%;border:1.5px solid #c6d0d9;flex:none;box-sizing:border-box}
.te-opt.cur{font-weight:700;color:#1f4e79;background:#f1f7fa}
.te-opt.cur .te-dot{border-color:#1f4e79;background:#1f4e79;box-shadow:inset 0 0 0 2.5px #fff}
.te-opt.cur::after{content:"当前";margin-left:auto;font-size:9px;color:#8fa0ad;font-weight:400}
.te-opt.te-none{color:#8b98a3;border-top:1px solid #eef2f5;margin-top:3px;padding-top:7px;border-radius:0 0 6px 6px}
.te-opt.te-none .te-dot{border-style:dashed;border-color:#b9c4cd}
.te-opt.te-cfg{color:#9aa6b0;font-size:11px;border-top:1px solid #eef2f5;margin-top:2px;border-radius:0 0 6px 6px}
.te-tip{position:fixed;z-index:99999;left:50%;transform:translateX(-50%);bottom:36px;padding:9px 18px;
  border-radius:20px;font-size:12.5px;color:#fff;background:rgba(31,78,121,.95);
  box-shadow:0 8px 24px rgba(0,0,0,.26);opacity:0;transition:opacity .2s;pointer-events:none;
  max-width:82vw;line-height:1.5;font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.te-tip.show{opacity:1}
.te-tip.ok{background:rgba(22,120,80,.96)}
.te-tip.err{background:rgba(186,48,48,.96)}
.te-tk{position:fixed;inset:0;z-index:99998;background:rgba(18,32,42,.45);display:flex;
  align-items:center;justify-content:center;font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif}
.te-tk-box{background:#fff;border-radius:12px;padding:20px 22px;width:min(430px,90vw);
  box-shadow:0 18px 50px rgba(0,0,0,.32)}
.te-tk-box h4{margin:0 0 7px;font-size:14.5px;color:#1f3a4d}
.te-tk-box p{margin:0 0 11px;font-size:11.5px;color:#7b8794;line-height:1.7}
.te-tk-box code{background:#f2f6f9;padding:1px 4px;border-radius:3px;font-size:11px}
.te-tk-box input{width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #cfdae2;
  border-radius:7px;font-size:12px;outline:none;font-family:inherit}
.te-tk-box input:focus{border-color:#1f4e79;box-shadow:0 0 0 3px rgba(31,78,121,.1)}
.te-tk-btns{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}
.te-tk-btns button{border:none;border-radius:7px;padding:7px 17px;font-size:12px;cursor:pointer;font-family:inherit}
.te-tk-btns .ok{background:#1f4e79;color:#fff}
.te-tk-btns .ok:hover{background:#173d5e}
.te-tk-btns .no{background:#eef2f5;color:#5b6b78}
`;

function injectCss() {
  if (document.getElementById('teStyle')) return;
  var s = document.createElement('style');
  s.id = 'teStyle';
  s.textContent = CSS;
  document.head.appendChild(s);
}

/* ---------- 轻提示 ---------- */
function tip(msg, kind, ms) {
  var el = document.getElementById('teTip');
  if (!el) {
    el = document.createElement('div');
    el.id = 'teTip';
    el.className = 'te-tip';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'te-tip show' + (kind ? ' ' + kind : '');
  if (el._timer) clearTimeout(el._timer);
  el._timer = setTimeout(function () { el.className = 'te-tip'; }, ms || 2400);
}

/* ---------- 弹层 ---------- */
var popEl = null, curItem = '', curTier = '';

function closePop() {
  if (popEl && popEl.parentNode) popEl.parentNode.removeChild(popEl);
  popEl = null;
}

function openPop(anchor, item, tier) {
  closePop();
  curItem = item; curTier = tier || '';

  var box = document.createElement('div');
  box.className = 'te-pop';

  var h = '<div class="te-hd"><b>' + item + '</b><span>' + STORE + '</span></div>';
  TIERS.forEach(function (v) {
    h += '<div class="te-opt' + (v === curTier ? ' cur' : '') + '" data-v="' + v + '">' +
         '<span class="te-dot"></span>' + v + '</div>';
  });
  h += '<div class="te-opt te-none' + (curTier ? '' : ' cur') + '" data-v="">' +
       '<span class="te-dot"></span>' + NONE_LABEL + '</div>';
  h += '<div class="te-opt te-cfg" data-cfg="1"><span class="te-dot" style="border:none"></span>⚙ 同步设置</div>';
  box.innerHTML = h;
  document.body.appendChild(box);

  /* 定位：优先在下方，空间不够翻到上方 */
  var rc = anchor.getBoundingClientRect();
  var bw = box.offsetWidth, bh = box.offsetHeight;
  var left = rc.left - 6;
  var top  = rc.bottom + 6;
  if (left + bw > window.innerWidth - 8) left = window.innerWidth - bw - 8;
  if (left < 8) left = 8;
  if (top + bh > window.innerHeight - 8) top = rc.top - bh - 6;
  box.style.left = left + 'px';
  box.style.top = Math.max(8, top) + 'px';

  popEl = box;
}

/* ---------- 改档 ---------- */
function applyTier(item, v) {
  if (!item) return;

  /* 1) 内存映射（切日期范围重建 currentData 时会重新挂载，必须同步） */
  if (v) { window.__TIER[item] = v; window.__TIER_RANK[v] = RANK[v]; }
  else   { delete window.__TIER[item]; }

  /* 2) 当前主表行 */
  if (typeof currentData !== 'undefined' && currentData && currentData.length) {
    for (var i = 0; i < currentData.length; i++) {
      var r = currentData[i];
      if (r.item === item) {
        r.tier      = v || '';
        r.tier_rank = v ? RANK[v] : 0;
        r.tier_note = (window.__TIER_NOTE && window.__TIER_NOTE[item]) || '';
      }
    }
  }

  /* 3) 重渲染 */
  try { if (typeof render === 'function') render(); } catch (e) { console.warn('[tier] render', e); }

  /* 4) 写回线上 */
  saveAll(item, v);
  tip('本地已改为 ' + (v || NONE_LABEL) + '，正在写入线上…', '', 1800);
}

/* ---------- 序列化 ---------- */
function buildContent() {
  var tier = {}, note = {};
  var T = window.__TIER || {};
  Object.keys(T).sort().forEach(function (k) { tier[k] = T[k]; });
  var N = window.__TIER_NOTE || {};
  Object.keys(N).sort().forEach(function (k) { note[k] = N[k]; });
  return 'var __TIER=' + JSON.stringify(tier) + ';\n' +
         'var __TIER_RANK=' + JSON.stringify(RANK) + ';\n' +
         'var __TIER_NOTE=' + JSON.stringify(note) + ';\n' +
         '/* ' + STORE + ' tier saved ' + new Date().toISOString() + ' */\n';
}

/* ---------- 保存 ---------- */
function saveAll(item, v) {
  var token = '';
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}
  if (!token) { askToken(function () { saveAll(item, v); }); return; }
  doPut(buildContent(), token, false);
}

function doPut(content, token, retried) {
  var api = 'https://api.github.com/repos/' + REPO + '/contents/' + PATH;
  var H = {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github+json'
  };

  fetch(api + '?ref=' + BRANCH + '&_=' + Date.now(), { headers: H, cache: 'no-store' })
  .then(function (g) {
    if (g.status === 401 || g.status === 403) {
      try { localStorage.removeItem(TOKEN_KEY); } catch (e) {}
      tip('Token 无效或无写权限，已清除，请重新填写', 'err', 4200);
      return null;
    }
    if (!g.ok) { tip('读取线上文件失败（' + g.status + '）', 'err', 3600); return null; }
    return g.json().then(function (j) {
      var b64;
      try { b64 = btoa(unescape(encodeURIComponent(content))); }
      catch (e) { tip('内容编码失败：' + e.message, 'err', 3600); return null; }
      var body = {
        message: 'tier(' + STORE + '): 页面端调整梯队',
        content: b64,
        branch: BRANCH
      };
      if (j && j.sha) body.sha = j.sha;
      return fetch(api, {
        method: 'PUT',
        headers: Object.assign({ 'Content-Type': 'application/json' }, H),
        body: JSON.stringify(body)
      }).then(function (p) {
        if (p.status === 409 && !retried) { return doPut(content, token, true); }
        if (!p.ok) {
          return p.json().then(function (ej) {
            tip('保存失败 ' + p.status + '：' + ((ej && ej.message) || ''), 'err', 4600);
          }).catch(function () { tip('保存失败 ' + p.status, 'err', 3600); });
        }
        tip('✅ 已写入线上，约 1–3 分钟生效（刷新即可看到）', 'ok', 3600);
      });
    });
  })
  .catch(function (e) { tip('网络异常：' + (e && e.message ? e.message : e), 'err', 4200); });
}

/* ---------- Token 设置 ---------- */
function askToken(cb) {
  if (document.getElementById('teTk')) return;
  var cur = '';
  try { cur = localStorage.getItem(TOKEN_KEY) || ''; } catch (e) {}

  var m = document.createElement('div');
  m.id = 'teTk';
  m.className = 'te-tk';
  m.innerHTML =
    '<div class="te-tk-box">' +
      '<h4>配置 GitHub Token（只需一次）</h4>' +
      '<p>页面上改的梯队要写回线上，需要一个对该仓库有 <b>Contents 读写</b> 权限的细粒度 Token。' +
      'Token 只保存在本机浏览器，不会发给任何第三方。<br>' +
      '生成路径：GitHub → Settings → Developer settings → Fine-grained tokens → ' +
      'Repository access 选 <code>inman-sellthrough-dashboard</code>，' +
      'Permissions → Contents 设为 <b>Read and write</b>。</p>' +
      '<input id="teTkInput" type="password" autocomplete="off" placeholder="github_pat_... 或 ghp_..." value="' + cur.replace(/"/g, '&quot;') + '" />' +
      '<div class="te-tk-btns">' +
        '<button class="no" id="teTkNo">取消</button>' +
        '<button class="ok" id="teTkOk">保存并使用</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(m);

  var inp = m.querySelector('#teTkInput');
  setTimeout(function () { try { inp.focus(); inp.select(); } catch (e) {} }, 60);

  m.querySelector('#teTkNo').onclick = function () { m.remove(); };
  m.querySelector('#teTkOk').onclick = function () {
    var v = (inp.value || '').trim();
    if (!v) { inp.focus(); return; }
    try { localStorage.setItem(TOKEN_KEY, v); } catch (e) {}
    m.remove();
    tip('Token 已保存', 'ok', 1500);
    if (cb) setTimeout(cb, 120);
  };
  inp.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') m.querySelector('#teTkOk').click();
  });
}

/* ---------- 事件绑定 ---------- */
function bind() {
  document.addEventListener('click', function (ev) {
    var t = ev.target;

    /* 1) 点在面板里 */
    if (popEl && popEl.contains(t)) {
      var cfg = t.closest ? t.closest('.te-cfg') : null;
      if (cfg) { closePop(); askToken(null); ev.stopPropagation(); return; }
      var opt = t.closest ? t.closest('.te-opt') : null;
      if (opt) {
        var v = opt.getAttribute('data-v') || '';
        var item = curItem;
        closePop();
        if (v !== curTier) applyTier(item, v);
        ev.stopPropagation();
        return;
      }
      ev.stopPropagation();
      return;
    }
    if (popEl) closePop();

    /* 2) 点在梯队单元格 */
    var pill = (t.closest ? t.closest('#tableBody .tier-pill') : null);
    if (pill) {
      ev.preventDefault();
      ev.stopPropagation();
      var tv = pill.getAttribute('data-tv') || '';
      openPop(pill, pill.getAttribute('data-item') || '', tv === '__none__' ? '' : tv);
      return;
    }
  }, true);

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Escape') { closePop(); var m = document.getElementById('teTk'); if (m) m.remove(); }
  });
  window.addEventListener('scroll', function () { closePop(); }, true);
  window.addEventListener('resize', function () { closePop(); });
}

/* ---------- 启动 ---------- */
function boot() {
  injectCss();
  bind();
  /* 便于排查：暴露内部方法 */
  window.__TE = { apply: applyTier, save: saveAll, build: buildContent, rank: RANK };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}

})();
