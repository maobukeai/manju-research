/* ============================================================
   漫剧研究学习平台 · 外挂模块：角色一致性实验室（consistency）
   —— 攻克 AI 漫剧“换镜头就换脸、服饰发型突变”的头号行业顽疾：
      1. 三视图与 6 视角 Prompt 实时生成器（Midjourney / 即梦双格式）
      2. 5 大一致性技术方案全景横评与实施 SOP
      3. 角色翻车自诊器（常见畸变原因、参数对策与局部重绘方案）
   通过 window.MJ.addModule 自注册。
   ============================================================ */
(function () {
  'use strict';

  var MOD_ID = 'consistency';
  var ctx = null;
  var DBX = (typeof DB !== 'undefined') ? DB : null;

  /* 默认表单状态 */
  var state = {
    tab: 'generator', /* generator | methods | troubleshoot */
    format: 'mj',     /* mj | cn */
    gender: '男主 (Male Protagonist)',
    style: '国风修仙玄幻 (Cultivation Xianxia)',
    hair: '银白凌乱长发 (Messy Silver Long Hair)',
    hairColor: '银白色 (Silver/White)',
    eyeColor: '猩红血瞳 (Crimson Eyes)',
    feature: '横跨鼻梁战损伤疤 (Battle scar across nose)',
    outfit: '玄黑金丝龙纹长袍 (Black robe with golden dragon embroidery)',
    prop: '悬浮身后的古朴长剑 (Ancient glowing sword floating behind)',
    customName: '林锋 (Lin Feng)',
    activeTbId: 'tb-face-shift'
  };

  /* 组装英文提示词 */
  function buildMjPrompt(viewKey, st) {
    var views = (DBX && DBX.consistency && DBX.consistency.views) || [];
    var vObj = views.find(function (v) { return v.id === viewKey; }) || views[0];

    var genderWord = st.gender.indexOf('男') >= 0 ? 'handsome male hero' : st.gender.indexOf('女') >= 0 ? 'stunning female heroine' : 'imposing villain';
    var styleWord = st.style.split('(')[1] ? st.style.split('(')[1].replace(')', '') : 'anime aesthetic';
    var hairWord = st.hair.split('(')[1] ? st.hair.split('(')[1].replace(')', '') : 'silver hair';
    var eyesWord = st.eyeColor.split('(')[1] ? st.eyeColor.split('(')[1].replace(')', '') : 'crimson eyes';
    var featureWord = st.feature.split('(')[1] ? st.feature.split('(')[1].replace(')', '') : 'battle scar';
    var outfitWord = st.outfit.split('(')[1] ? st.outfit.split('(')[1].replace(')', '') : 'black robe';
    var propWord = st.prop.split('(')[1] ? st.prop.split('(')[1].replace(')', '') : 'glowing sword';

    var viewSnippet = vObj ? vObj.mjTpl.split(', --')[0] : 'portrait, front view';

    return viewSnippet + ', ' + genderWord + ', ' + styleWord + ', ' + hairWord + ', ' + eyesWord + ', ' + featureWord + ', wearing ' + outfitWord + ', ' + propWord + ', 8k resolution, cinematic lighting, masterpiece, character consistency anchor, --ar 9:16 --v 6.1 --cw 80 --cref [角色母图URL]';
  }

  /* 组装中文提示词 */
  function buildCnPrompt(viewKey, st) {
    var views = (DBX && DBX.consistency && DBX.consistency.views) || [];
    var vObj = views.find(function (v) { return v.id === viewKey; }) || views[0];

    var genderZh = st.gender.split(' ')[0];
    var styleZh = st.style.split(' ')[0];
    var hairZh = st.hair.split(' ')[0];
    var eyesZh = st.eyeColor.split(' ')[0];
    var featZh = st.feature.split(' ')[0];
    var outfitZh = st.outfit.split(' ')[0];
    var propZh = st.prop.split(' ')[0];

    var viewZh = vObj ? vObj.cnTpl.replace('9:16竖屏。', '').trim() : '正面立绘，全身镜头，';

    return viewZh + '，' + genderZh + '角色（' + st.customName + '），' + styleZh + '画风，' + hairZh + '，' + eyesZh + '，' + featZh + '，身着' + outfitZh + '，搭配' + propZh + '，面部细节极致逼真，电影感高级光影，9:16竖屏。@' + st.customName;
  }

  /* 渲染主容器 */
  function render(container, mjCtx) {
    ctx = mjCtx || window.MJ;
    var data = (DBX && DBX.consistency) || {};

    var html = '';
    html += '<div class="consistency-wrap">';

    /* 顶部 Hero 卡片 */
    html += '<div class="card cs-hero-card">';
    html += '  <div class="cs-badge"><span class="pulse-dot"></span> 工业级角色一致性工程实验室</div>';
    html += '  <h2 class="cs-title">角色视觉 DNA 锚定与多视角提示词矩阵</h2>';
    html += '  <p class="cs-desc">解决 AI 漫剧“换镜头就换脸、服饰发型突变”的头号行业顽疾。通过标准化多视角母图矩阵、5 大工业级方案对比与交互式翻车自诊器，实现从单镜到全剧的极致面容稳定性。</p>';
    html += '</div>';

    /* 选项卡导航 */
    html += '<div class="cs-tabs-bar">';
    html += '  <button class="cs-tab-btn' + (state.tab === 'generator' ? ' active' : '') + '" data-tab="generator">📐 三视图与多角度生成器</button>';
    html += '  <button class="cs-tab-btn' + (state.tab === 'methods' ? ' active' : '') + '" data-tab="methods">⚖️ 5大一致性方案全景横评</button>';
    html += '  <button class="cs-tab-btn' + (state.tab === 'troubleshoot' ? ' active' : '') + '" data-tab="troubleshoot">🩺 角色翻车自诊与抢救</button>';
    html += '</div>';

    /* Tab 1: 三视图与多视角生成器 */
    html += '<div class="cs-tab-content' + (state.tab === 'generator' ? ' active' : '') + '" id="tab-generator">';
    html += renderGeneratorTab(data);
    html += '</div>';

    /* Tab 2: 5大方案横评 */
    html += '<div class="cs-tab-content' + (state.tab === 'methods' ? ' active' : '') + '" id="tab-methods">';
    html += renderMethodsTab(data);
    html += '</div>';

    /* Tab 3: 翻车自诊器 */
    html += '<div class="cs-tab-content' + (state.tab === 'troubleshoot' ? ' active' : '') + '" id="tab-troubleshoot">';
    html += renderTroubleshootTab(data);
    html += '</div>';

    html += '</div>'; /* /consistency-wrap */

    container.innerHTML = html;
    bindEvents(container);
  }

  /* 渲染生成器面板 */
  function renderGeneratorTab(data) {
    var attr = data.attributes || {};
    var views = data.views || [];

    var html = '<div class="cs-gen-grid">';

    /* 左侧：角色 DNA 配置面板 */
    html += '<div class="card cs-config-card">';
    html += '  <div class="card-head-line">';
    html += '    <h3 class="c-title">⚙️ 角色不可变视觉 DNA 设定</h3>';
    html += '    <button class="btn ghost btn-sm" id="btnRandomDna">🎲 随机人设</button>';
    html += '  </div>';

    html += '  <div class="cfg-form">';
    /* 角色代号 */
    html += '    <div class="cfg-item">';
    html += '      <label>角色代号 / 姓名：</label>';
    html += '      <input type="text" id="inpCharName" value="' + ctx.esc(state.customName) + '" placeholder="如：林锋、顾长歌">';
    html += '    </div>';

    /* 性别人设 */
    html += '    <div class="cfg-item">';
    html += '      <label>性别人设：</label>';
    html += '      <select id="selGender">';
    (attr.genders || []).forEach(function (g) {
      html += '        <option value="' + ctx.esc(g) + '"' + (state.gender === g ? ' selected' : '') + '>' + ctx.esc(g) + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    /* 艺术风格 */
    html += '    <div class="cfg-item">';
    html += '      <label>艺术风格：</label>';
    html += '      <select id="selStyle">';
    (attr.styles || []).forEach(function (s) {
      html += '        <option value="' + ctx.esc(s) + '"' + (state.style === s ? ' selected' : '') + '>' + ctx.esc(s) + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    /* 发型发色 */
    html += '    <div class="cfg-item">';
    html += '      <label>发型设定：</label>';
    html += '      <select id="selHair">';
    (attr.hairstyles || []).forEach(function (h) {
      html += '        <option value="' + ctx.esc(h) + '"' + (state.hair === h ? ' selected' : '') + '>' + ctx.esc(h) + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    /* 瞳孔眼色 */
    html += '    <div class="cfg-item">';
    html += '      <label>瞳色眼眸：</label>';
    html += '      <select id="selEye">';
    (attr.eyeColors || []).forEach(function (e) {
      html += '        <option value="' + ctx.esc(e) + '"' + (state.eyeColor === e ? ' selected' : '') + '>' + ctx.esc(e) + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    /* 专属面部标志 */
    html += '    <div class="cfg-item">';
    html += '      <label>标志性特征（视觉锚点）：</label>';
    html += '      <select id="selFeature">';
    (attr.features || []).forEach(function (f) {
      html += '        <option value="' + ctx.esc(f) + '"' + (state.feature === f ? ' selected' : '') + '>' + ctx.esc(f) + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    /* 服饰袍装 */
    html += '    <div class="cfg-item">';
    html += '      <label>服装款式：</label>';
    html += '      <select id="selOutfit">';
    (attr.outfits || []).forEach(function (o) {
      html += '        <option value="' + ctx.esc(o) + '"' + (state.outfit === o ? ' selected' : '') + '>' + ctx.esc(o) + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    /* 武器配饰 */
    html += '    <div class="cfg-item">';
    html += '      <label>专属武器 / 道具：</label>';
    html += '      <select id="selProp">';
    (attr.props || []).forEach(function (p) {
      html += '        <option value="' + ctx.esc(p) + '"' + (state.prop === p ? ' selected' : '') + '>' + ctx.esc(p) + '</option>';
    });
    html += '      </select>';
    html += '    </div>';

    html += '  </div>'; /* /cfg-form */

    /* 导出格式切换 */
    html += '  <div class="cfg-format-box">';
    html += '    <span class="fmt-label">输出格式：</span>';
    html += '    <div class="fmt-pills">';
    html += '      <button class="chip' + (state.format === 'mj' ? ' active' : '') + '" data-fmt="mj">Midjourney 英文增强版</button>';
    html += '      <button class="chip' + (state.format === 'cn' ? ' active' : '') + '" data-fmt="cn">即梦 / 可灵 中文自然语言</button>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="cfg-foot-action">';
    html += '    <button class="btn pri btn-block" id="btnCopyAllAngles">📋 一键打包复制 6 视角全套 Prompt</button>';
    html += '  </div>';
    html += '</div>'; /* /card */

    /* 右侧：6 大视角 Prompt 矩阵卡片 */
    html += '<div class="cs-views-panel">';
    views.forEach(function (v) {
      var promptText = state.format === 'mj' ? buildMjPrompt(v.id, state) : buildCnPrompt(v.id, state);
      var copyId = ctx.regCopy(promptText);

      html += '<div class="card view-item-card" id="vcard-' + v.id + '">';
      html += '  <div class="vc-head">';
      html += '    <div class="vc-title-row">';
      html += '      <span class="vc-badge">视角 ' + v.name.split(' ')[0] + '</span>';
      html += '      <h4 class="vc-name">' + ctx.esc(v.name) + '</h4>';
      html += '    </div>';
      html += '    <button class="btn ghost btn-sm btn-copy" data-copy="' + copyId + '" data-copy-id="' + copyId + '">复制本视角</button>';
      html += '  </div>';
      html += '  <p class="vc-desc">' + ctx.esc(v.desc) + '</p>';
      html += '  <div class="vc-code-box">';
      html += '    <code>' + ctx.esc(promptText) + '</code>';
      html += '  </div>';
      html += '</div>';
    });
    html += '</div>'; /* /cs-views-panel */

    html += '</div>'; /* /cs-gen-grid */
    return html;
  }

  /* 渲染 5 大方案横评 */
  function renderMethodsTab(data) {
    var methods = data.methods || [];
    var html = '<div class="methods-deck">';

    methods.forEach(function (m) {
      html += '<div class="card method-card" id="mcard-' + m.id + '">';
      html += '  <div class="mc-head">';
      html += '    <div class="mc-left">';
      html += '      <div class="mc-badge">' + ctx.esc(m.badge) + '</div>';
      html += '      <h3 class="mc-title">' + ctx.esc(m.name) + '</h3>';
      html += '      <div class="mc-meta">';
      html += '        <span>技术路线：<b>' + ctx.esc(m.techType) + '</b></span> · ';
      html += '        <span>主力工具：<b>' + ctx.esc(m.tools) + '</b></span>';
      html += '      </div>';
      html += '    </div>';
      html += '    <div class="mc-score" title="稳定性与表现评级">' + m.score + '</div>';
      html += '  </div>';

      html += '  <div class="mc-pros-cons-grid">';
      html += '    <div class="mc-pc-box pros">';
      html += '      <b>✅ 核心优势：</b>' + ctx.esc(m.pros);
      html += '    </div>';
      html += '    <div class="mc-pc-box cons">';
      html += '      <b>⚠️ 局限与成本：</b>' + ctx.esc(m.cons);
      html += '    </div>';
      html += '  </div>';

      html += '  <div class="mc-best-for">';
      html += '    <b>🎯 最佳适用场景：</b>' + ctx.esc(m.bestFor);
      html += '  </div>';

      html += '  <div class="mc-sop-box">';
      html += '    <div class="sop-head">🛠️ 标准实操 4 步走：</div>';
      html += '    <ol class="sop-ol">';
      (m.sop || []).forEach(function (s) {
        html += '      <li>' + ctx.esc(s) + '</li>';
      });
      html += '    </ol>';
      html += '  </div>';

      html += '  <div class="mc-tip-callout">';
      html += '    <b>💡 实战秘籍：</b>' + ctx.esc(m.tips);
      html += '  </div>';

      html += '</div>'; /* /card */
    });

    html += '</div>'; /* /methods-deck */
    return html;
  }

  /* 渲染翻车自诊器 */
  function renderTroubleshootTab(data) {
    var tbList = data.troubleshoots || [];
    var cur = tbList.find(function (t) { return t.id === state.activeTbId; }) || tbList[0];

    var html = '<div class="tb-layout">';

    /* 左侧症状选择器 */
    html += '<div class="tb-symptom-list">';
    html += '  <div class="tb-list-title">🚨 常见翻车症状（点击诊断）</div>';
    tbList.forEach(function (t) {
      var isAct = t.id === cur.id;
      html += '<button class="tb-symptom-btn' + (isAct ? ' active' : '') + '" data-tb-id="' + t.id + '">';
      html += '  <span class="tb-btn-icon">' + (isAct ? '👉' : '⚠️') + '</span>';
      html += '  <span class="tb-btn-text">' + ctx.esc(t.symptom) + '</span>';
      html += '</button>';
    });
    html += '</div>';

    /* 右侧诊断与对策详情 */
    html += '<div class="card tb-detail-card">';
    html += '  <div class="tbd-head">';
    html += '    <div class="tbd-tag">诊断报告编号：' + cur.id + '</div>';
    html += '    <h3 class="tbd-title">' + ctx.esc(cur.symptom) + '</h3>';
    html += '  </div>';

    html += '  <div class="tbd-section cause-sec">';
    html += '    <div class="sec-label">🔍 根因深度剖析：</div>';
    html += '    <p class="sec-p">' + ctx.esc(cur.cause) + '</p>';
    html += '  </div>';

    html += '  <div class="tbd-section fix-sec">';
    html += '    <div class="sec-label">⚡ 应急抢救方案 (Quick Fix)：</div>';
    html += '    <p class="sec-p">' + ctx.esc(cur.quickFix) + '</p>';
    html += '  </div>';

    html += '  <div class="tbd-section prompt-sec">';
    html += '    <div class="sec-label">✍️ 提示词修正公式：</div>';
    html += '    <div class="tbd-code-box">';
    html += '      <code>' + ctx.esc(cur.promptAdjustment) + '</code>';
    var cpId = ctx.regCopy(cur.promptAdjustment);
    html += '      <button class="btn ghost btn-sm btn-copy tbd-cp-btn" data-copy="' + cpId + '" data-copy-id="' + cpId + '">复制修正词</button>';
    html += '    </div>';
    html += '  </div>';

    html += '  <div class="tbd-section param-sec">';
    html += '    <div class="sec-label">🎛️ 推荐参数微调数值：</div>';
    html += '    <div class="param-badge-row">';
    cur.paramSettings.split('|').forEach(function (p) {
      html += '      <span class="pill pill-sm">' + ctx.esc(p.trim()) + '</span>';
    });
    html += '    </div>';
    html += '  </div>';

    html += '</div>'; /* /tb-detail-card */

    html += '</div>'; /* /tb-layout */
    return html;
  }

  /* 事件绑定 */
  function bindEvents(container) {
    if (!container) return;

    /* 选项卡切换 */
    container.addEventListener('click', function (e) {
      var tabBtn = e.target.closest('.cs-tab-btn');
      if (tabBtn) {
        var t = tabBtn.dataset.tab;
        state.tab = t;
        container.querySelectorAll('.cs-tab-btn').forEach(function (b) { b.classList.remove('active'); });
        tabBtn.classList.add('active');
        container.querySelectorAll('.cs-tab-content').forEach(function (c) { c.classList.remove('active'); });
        var targetContent = document.getElementById('tab-' + t);
        if (targetContent) targetContent.classList.add('active');
        return;
      }

      /* 格式切换 */
      var fmtBtn = e.target.closest('[data-fmt]');
      if (fmtBtn) {
        state.format = fmtBtn.dataset.fmt;
        container.querySelectorAll('[data-fmt]').forEach(function (b) { b.classList.remove('active'); });
        fmtBtn.classList.add('active');
        updateViewsDisplay(container);
        return;
      }

      /* 翻车自诊器切换症状 */
      var tbBtn = e.target.closest('[data-tb-id]');
      if (tbBtn) {
        state.activeTbId = tbBtn.dataset.tbId;
        var tabTrouble = document.getElementById('tab-troubleshoot');
        if (tabTrouble) {
          tabTrouble.innerHTML = renderTroubleshootTab((DBX && DBX.consistency) || {});
        }
        return;
      }

      /* 随机人设 */
      if (e.target.id === 'btnRandomDna') {
        randomizeDna(container);
        return;
      }

      /* 一键打包复制全部 6 视角 */
      if (e.target.id === 'btnCopyAllAngles') {
        copyAllAngles();
        return;
      }
    });

    /* 表单输入变化实时更新预览 */
    container.addEventListener('change', function (e) {
      if (e.target.id === 'inpCharName') state.customName = e.target.value.trim() || '主角';
      if (e.target.id === 'selGender') state.gender = e.target.value;
      if (e.target.id === 'selStyle') state.style = e.target.value;
      if (e.target.id === 'selHair') state.hair = e.target.value;
      if (e.target.id === 'selEye') state.eyeColor = e.target.value;
      if (e.target.id === 'selFeature') state.feature = e.target.value;
      if (e.target.id === 'selOutfit') state.outfit = e.target.value;
      if (e.target.id === 'selProp') state.prop = e.target.value;
      updateViewsDisplay(container);
    });

    container.addEventListener('input', function (e) {
      if (e.target.id === 'inpCharName') {
        state.customName = e.target.value.trim() || '主角';
        updateViewsDisplay(container);
      }
    });
  }

  /* 更新右侧 6 视角代码预览 */
  function updateViewsDisplay(container) {
    var views = (DBX && DBX.consistency && DBX.consistency.views) || [];
    views.forEach(function (v) {
      var card = document.getElementById('vcard-' + v.id);
      if (card) {
        var promptText = state.format === 'mj' ? buildMjPrompt(v.id, state) : buildCnPrompt(v.id, state);
        var codeEl = card.querySelector('code');
        if (codeEl) codeEl.textContent = promptText;
        var copyBtn = card.querySelector('.btn-copy');
        if (copyBtn) {
          var copyId = ctx.regCopy(promptText);
          copyBtn.dataset.copy = copyId;
          copyBtn.dataset.copyId = copyId;
        }
      }
    });
  }

  /* 随机化人设 */
  function randomizeDna(container) {
    var attr = (DBX && DBX.consistency && DBX.consistency.attributes) || {};
    function pick(arr) { return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''; }

    var names = ['楚渊 (Chu Yuan)', '洛离 (Luo Li)', '夜玄 (Ye Xuan)', '萧炎 (Xiao Yan)', '白浅 (Bai Qian)', '沈夜 (Shen Ye)'];
    state.customName = pick(names);
    if (attr.genders) state.gender = pick(attr.genders);
    if (attr.styles) state.style = pick(attr.styles);
    if (attr.hairstyles) state.hair = pick(attr.hairstyles);
    if (attr.eyeColors) state.eyeColor = pick(attr.eyeColors);
    if (attr.features) state.feature = pick(attr.features);
    if (attr.outfits) state.outfit = pick(attr.outfits);
    if (attr.props) state.prop = pick(attr.props);

    /* 重新渲染 generator tab */
    var tabGen = document.getElementById('tab-generator');
    if (tabGen) {
      tabGen.innerHTML = renderGeneratorTab((DBX && DBX.consistency) || {});
    }
    if (ctx && ctx.toast) ctx.toast('🎲 已生成随机人设：' + state.customName);
  }

  /* 打包复制全部 6 视角 Prompt */
  function copyAllAngles() {
    var views = (DBX && DBX.consistency && DBX.consistency.views) || [];
    var lines = [];
    lines.push('/* ============================================================');
    lines.push('   角色「' + state.customName + '」6 视角工业一致性 Prompt 矩阵');
    lines.push('   生成格式：' + (state.format === 'mj' ? 'Midjourney 英文增强' : '即梦/可灵 中文自然语言'));
    lines.push('   ============================================================ */\n');

    views.forEach(function (v, idx) {
      var p = state.format === 'mj' ? buildMjPrompt(v.id, state) : buildCnPrompt(v.id, state);
      lines.push('【视角 ' + (idx + 1) + ' · ' + v.name + '】\n' + p + '\n');
    });

    var allText = lines.join('\n');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(allText).then(function () {
        if (ctx && ctx.toast) ctx.toast('✓ 已复制全套 6 视角 Prompt 矩阵到剪贴板！');
      }).catch(function () { fallbackCopy(allText); });
    } else {
      fallbackCopy(allText);
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      if (ctx && ctx.toast) ctx.toast('✓ 已复制全套 6 视角 Prompt 矩阵！');
    } catch (e) {
      if (ctx && ctx.toast) ctx.toast('复制失败，请手动选择');
    }
    document.body.removeChild(ta);
  }

  /* 自注册模块定义 */
  var mod = {
    id: MOD_ID,
    icon: '🎭',
    name: '一致性实验室',
    cnt: '角色锚定',
    after: 'hot',
    hub: 'hub2',
    sub: [
      '角色一致性实验室 · 工业化面容锚定',
      '攻克换镜头变脸、衣服变形与画风漂移：三视图/6视角 Prompt 实时生成器、5大一致性方案横评与角色翻车自诊救场指南。'
    ],
    search: [
      { tit: '角色一致性实验室', txt: 'AI 漫剧角色锚定：三视图 6 视角生成器、5 大一致性方案（即梦智能体/--cref/LoRA/InstantID/垫图）、翻车自诊' },
      { tit: '三视图多角度 Prompt 生成器', txt: '一键生成正面立绘、45度微侧、正侧、背后、特写微表情、动态打斗 6 视角中英文双格式提示词矩阵' },
      { tit: '5大角色一致性方案横评', txt: '即梦智能体角色库、Midjourney --cref+--cw 权重、ComfyUI LoRA 微调、InstantID 单图换脸与画布尾帧链' },
      { tit: '角色翻车自诊器', txt: '换角度五官崩坏、手部多指畸变、衣服颜色漂移、背景穿帮、双人串脸的局部重绘 Inpainting 解决方案' }
    ],
    render: render
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod);
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod);
  }
})();
