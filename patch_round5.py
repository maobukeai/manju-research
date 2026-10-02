# -*- coding: utf-8 -*-
# Round-5 patch: TOC / search grouping / scene switch — atomic apply with uniqueness asserts
import io

P = 'js/app.js'
s = io.open(P, encoding='utf-8', newline='').read()

reps = []

# 1. camDemo: SCENE_CITY map + applyScene + scene button
old1 = """  const SCENE_KEYS = ['dusk', 'forest', 'snow', 'neon'];

  function camDemo(c, scene) {
    const sc = scene || 'dusk';
    const city = sc === 'forest' ? TREES_SVG : sc === 'snow' ? MOUNT_SVG : sc === 'neon' ? NEON_SVG : CITY_SVG;
    return '<div class="cam-demo" data-motion="' + c.m + '" data-scene="' + sc + '">' +
      '<div class="cam-scene"><div class="cam-sky"></div><div class="cam-moon"></div>' +
      '<div class="cam-city">' + city + '</div><div class="cam-ground"></div>' +
      '<div class="cam-char">' + CHAR_SVG + '</div></div>' +
      (sc === 'snow' ? '<div class="cam-snow"></div>' : '') +
      (sc === 'forest' ? '<div class="cam-fire"></div>' : '') +
      '<div class="cam-tag">' + c.n + ' · ' + c.en.split('/')[0].trim() + '</div>' +
      '<div class="cam-live">● 演示中</div>' +
      '<div class="cam-ctl">' +
      '<button class="cam-btn" data-camact="toggle" title="暂停 / 播放">⏸</button>' +
      '<button class="cam-btn" data-camact="spd" data-v="0.5" title="0.5倍速">½×</button>' +
      '<button class="cam-btn on" data-camact="spd" data-v="1" title="1倍速">1×</button>' +
      '<button class="cam-btn" data-camact="spd" data-v="2" title="2倍速">2×</button>' +
      '</div></div>';
  }"""
new1 = """  const SCENE_KEYS = ['dusk', 'forest', 'snow', 'neon'];
  const SCENE_CITY = {};

  function applyScene(demo, sc) {
    demo.dataset.scene = sc;
    demo.querySelector('.cam-city').innerHTML = SCENE_CITY[sc] || CITY_SVG;
    demo.querySelectorAll('.cam-snow,.cam-fire').forEach((n) => n.remove());
    if (sc === 'snow') demo.insertAdjacentHTML('beforeend', '<div class="cam-snow"></div>');
    if (sc === 'forest') demo.insertAdjacentHTML('beforeend', '<div class="cam-fire"></div>');
  }

  function camDemo(c, scene) {
    const sc = scene || 'dusk';
    const city = sc === 'forest' ? TREES_SVG : sc === 'snow' ? MOUNT_SVG : sc === 'neon' ? NEON_SVG : CITY_SVG;
    SCENE_CITY[sc] = city;
    return '<div class="cam-demo" data-motion="' + c.m + '" data-scene="' + sc + '">' +
      '<div class="cam-scene"><div class="cam-sky"></div><div class="cam-moon"></div>' +
      '<div class="cam-city">' + city + '</div><div class="cam-ground"></div>' +
      '<div class="cam-char">' + CHAR_SVG + '</div></div>' +
      (sc === 'snow' ? '<div class="cam-snow"></div>' : '') +
      (sc === 'forest' ? '<div class="cam-fire"></div>' : '') +
      '<div class="cam-tag">' + c.n + ' · ' + c.en.split('/')[0].trim() + '</div>' +
      '<div class="cam-live">● 演示中</div>' +
      '<div class="cam-ctl">' +
      '<button class="cam-btn" data-camact="scene" title="切换演示场景">🎨</button>' +
      '<button class="cam-btn" data-camact="toggle" title="暂停 / 播放">⏸</button>' +
      '<button class="cam-btn" data-camact="spd" data-v="0.5" title="0.5倍速">½×</button>' +
      '<button class="cam-btn on" data-camact="spd" data-v="1" title="1倍速">1×</button>' +
      '<button class="cam-btn" data-camact="spd" data-v="2" title="2倍速">2×</button>' +
      '</div></div>';
  }"""
reps.append((old1, new1))

# 2. camact handler: scene branch
old2 = """      if (cam.dataset.camact === 'toggle') {
        const paused = demo.classList.toggle('paused');
        cam.textContent = paused ? '▶' : '⏸';
        const live = demo.querySelector('.cam-live');
        if (live) live.textContent = paused ? '❚❚ 已暂停' : '● 演示中';
      } else {
        demo.style.setProperty('--spd', cam.dataset.v);
        cam.parentElement.querySelectorAll('[data-camact="spd"]').forEach((b) => b.classList.toggle('on', b === cam));
      }"""
new2 = """      if (cam.dataset.camact === 'toggle') {
        const paused = demo.classList.toggle('paused');
        cam.textContent = paused ? '▶' : '⏸';
        const live = demo.querySelector('.cam-live');
        if (live) live.textContent = paused ? '❚❚ 已暂停' : '● 演示中';
      } else if (cam.dataset.camact === 'scene') {
        const cur = Math.max(0, SCENE_KEYS.indexOf(demo.dataset.scene || 'dusk'));
        applyScene(demo, SCENE_KEYS[(cur + 1) % SCENE_KEYS.length]);
      } else {
        demo.style.setProperty('--spd', cam.dataset.v);
        cam.parentElement.querySelectorAll('[data-camact="spd"]').forEach((b) => b.classList.toggle('on', b === cam));
      }"""
reps.append((old2, new2))

# 3. search grouping
old3 = """    hlList = hits; hlIdx = -1;
    drop.innerHTML = hits.length
      ? hits.map((x, i) => '<div class="sd-item" data-go="' + x.go + '"><div class="sd-sec">' + esc(x.sec) + '</div><div class="sd-tit">' + hlMark(x.tit, q) + '</div><div class="sd-txt">' + hlMark(x.txt.slice(0, 90), q) + '</div></div>').join('') +
        '<div class="sd-foot"><span>↑↓ 选择</span><span>↵ 打开</span><span>Esc 关闭</span></div>'
      : '<div class="sd-empty">没有找到「' + esc(q) + '」相关内容</div>';
    drop.classList.add('show');"""
new3 = """    hlList = hits; hlIdx = -1;
    const seen = {}; let grouped = '';
    hits.forEach((x) => {
      if (!seen[x.sec]) { seen[x.sec] = true; grouped += '<div class="sd-group">' + esc(x.sec) + '</div>'; }
      grouped += '<div class="sd-item" data-go="' + x.go + '"><div class="sd-tit">' + hlMark(x.tit, q) + '</div><div class="sd-txt">' + hlMark(x.txt.slice(0, 90), q) + '</div></div>';
    });
    drop.innerHTML = hits.length
      ? grouped +
        '<div class="sd-foot"><span>↑↓ 选择</span><span>↵ 打开</span><span>Esc 关闭</span></div>'
      : '<div class="sd-empty">没有找到「' + esc(q) + '」相关内容</div>';
    drop.classList.add('show');"""
reps.append((old3, new3))

# 4. route: buildTOC call + TOC functions after enhanceTables
old4 = """    reveal(sec);
    enhanceTables(sec);
    const rec = store.get(RECENT_KEY, []).filter((x) => x !== id);
    rec.unshift(id); store.set(RECENT_KEY, rec.slice(0, 6));
  }

  /* ---------- 宽表格增强：需要横向滚动时显示右侧渐隐提示 ---------- */
  function enhanceTables(sec) {
    sec.querySelectorAll('.tbl-wrap').forEach((w) => {
      if (w.scrollWidth > w.clientWidth + 8) w.classList.add('scrollable');
      else w.classList.remove('scrollable');
    });
  }"""
new4 = """    reveal(sec);
    enhanceTables(sec);
    buildTOC(sec);
    const rec = store.get(RECENT_KEY, []).filter((x) => x !== id);
    rec.unshift(id); store.set(RECENT_KEY, rec.slice(0, 6));
  }

  /* ---------- 宽表格增强：需要横向滚动时显示右侧渐隐提示 ---------- */
  function enhanceTables(sec) {
    sec.querySelectorAll('.tbl-wrap').forEach((w) => {
      if (w.scrollWidth > w.clientWidth + 8) w.classList.add('scrollable');
      else w.classList.remove('scrollable');
    });
  }

  /* ---------- 区块浮动目录（≥1200px 宽屏可用） ---------- */
  let tocEls = [];
  function buildTOC(sec) {
    const btn = $('#tocBtn'), panel = $('#tocPanel');
    if (!btn || !panel) return;
    const items = [];
    const title = sec.querySelector('.sec-head h2');
    if (title) items.push({ el: title, n: '📍 ' + title.textContent });
    sec.querySelectorAll('h4.block-t').forEach((h) => items.push({ el: h, n: h.textContent.replace(/\\s+/g, ' ').trim() }));
    tocEls = items;
    if (items.length < 3) { btn.classList.remove('show'); panel.classList.remove('show'); return; }
    panel.innerHTML = '<div class="toc-title">本页目录</div>' + items.map((it, i) =>
      '<div class="toc-item" data-toc="' + i + '">' + esc(it.n.length > 30 ? it.n.slice(0, 30) + '…' : it.n) + '</div>').join('');
    btn.classList.add('show');
    tocSpy();
  }
  function tocSpy() {
    const panel = $('#tocPanel');
    if (!panel || !panel.classList.contains('show') || !tocEls.length) return;
    let cur = 0;
    tocEls.forEach((it, i) => { if (it.el.getBoundingClientRect().top <= 140) cur = i; });
    panel.querySelectorAll('.toc-item').forEach((n, i) => n.classList.toggle('cur', i === cur));
  }"""
reps.append((old4, new4))

# 5. onScroll: tocSpy
old5 = """    const pb = $('#pbar'); if (pb) pb.style.width = p + '%';
    const tb = $('#topBtn'); if (tb) { tb.classList.toggle('show', y > 520); tb.style.setProperty('--p', Math.round(p)); }
  }"""
new5 = """    const pb = $('#pbar'); if (pb) pb.style.width = p + '%';
    const tb = $('#topBtn'); if (tb) { tb.classList.toggle('show', y > 520); tb.style.setProperty('--p', Math.round(p)); }
    tocSpy();
  }"""
reps.append((old5, new5))

# 6. click delegation: TOC item click (anchor after fav)
old6 = """    const fv = e.target.closest('[data-fav]');
    if (fv) { toggleFav(fv.dataset.fav, fv); return; }"""
new6 = """    const fv = e.target.closest('[data-fav]');
    if (fv) { toggleFav(fv.dataset.fav, fv); return; }
    const ti = e.target.closest('[data-toc]');
    if (ti) { const it = tocEls[+ti.dataset.toc]; if (it) it.el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }"""
reps.append((old6, new6))

# 7. click delegation: outside-close for toc panel
old7 = """    if (!e.target.closest('.search-box')) $('#searchDrop').classList.remove('show');"""
new7 = """    if (!e.target.closest('.search-box')) $('#searchDrop').classList.remove('show');
    if (!e.target.closest('#tocPanel') && !e.target.closest('#tocBtn')) { const tp = $('#tocPanel'); if (tp) tp.classList.remove('show'); }"""
reps.append((old7, new7))

# 8. tocBtn toggle listener
old8 = """  $('#topBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));"""
new8 = """  $('#topBtn').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  $('#tocBtn').addEventListener('click', () => $('#tocPanel').classList.toggle('show'));"""
reps.append((old8, new8))

applied = 0
for i, (old, new) in enumerate(reps, 1):
    n = s.count(old)
    if n != 1:
        print('PATCH %d FAILED: found %d occurrences' % (i, n))
        raise SystemExit(1)
    s = s.replace(old, new)
    applied += 1

io.open(P, 'w', encoding='utf-8', newline='').write(s)
print('ALL %d PATCHES APPLIED' % applied)
