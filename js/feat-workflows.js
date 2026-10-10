/* ============================================================
   漫剧研究学习平台 · 外挂模块：工业化 SOP 工作流库（workflows）
   —— 沉淀 4 套成熟的漫剧生产流水线，支持个人与团队直接套用：
      1. 【零门槛极速流】（DeepSeek + 即梦一站式 + 剪映，0-20元/集）
      2. 【高性价比跑量流】（Kimi + 即梦图 + 可灵 3.0 Omni + 剪映批处理，40-70元/集）
      3. 【工业级高精流】（ChatGPT + Midjourney + ComfyUI LoRA + 可灵4.0 + 达芬奇，120-200元/集）
      4. 【出海全英文流】（Claude + 欧美厚涂 + Veo 3.1 + ElevenLabs，150-260元/集）
   包含工具链图谱、5阶段 SOP 拆解、成本核算表与避坑对策。
   通过 window.MJ.addModule 自注册。
   ============================================================ */
(function () {
  'use strict';

  var MOD_ID = 'workflows';
  var ctx = null;
  var DBX = (typeof DB !== 'undefined') ? DB : null;

  var currentWfId = 'wf-rapid';

  /* 渲染主容器 */
  function render(container, mjCtx) {
    ctx = mjCtx || window.MJ;
    var workflows = (DBX && DBX.workflows) || [];
    var cur = workflows.find(function (w) { return w.id === currentWfId; }) || workflows[0] || {};

    var html = '';
    html += '<div class="workflows-wrap">';

    /* 顶部 Hero 卡片 */
    html += '<div class="card wf-hero-card">';
    html += '  <div class="wf-badge"><span class="pulse-dot"></span> 工业化标准化生产体系</div>';
    html += '  <h2 class="wf-title">AI 漫剧 4 大工业化 SOP 生产流水线</h2>';
    html += '  <p class="wf-desc">告别作坊式摸索。本模块沉淀了经过数万集真实商业实战验证的 4 套工业级 SOP：从个人零门槛快速出片，到工作室日更批量跑量、头部精品 S 级大片与高客单出海变现，每个流程均明确工具链、工时、成本与交付节点。</p>';
    html += '</div>';

    /* 4 大工作流切换选择器 */
    html += '<div class="wf-nav-tabs">';
    workflows.forEach(function (w) {
      var isAct = w.id === cur.id;
      html += '<button class="wf-tab-card' + (isAct ? ' active' : '') + '" data-wf-id="' + w.id + '">';
      html += '  <div class="wtc-badge">' + ctx.esc(w.badge) + '</div>';
      html += '  <h4 class="wtc-name">' + ctx.esc(w.name.split('】')[0] ? w.name.split('】')[0] + '】' : w.name) + '</h4>';
      html += '  <div class="wtc-meta">';
      html += '    <span>成本：<b>' + ctx.esc(w.costPerEp) + '</b></span> · ';
      html += '    <span>周期：<b>' + ctx.esc(w.timePerEp) + '</b></span>';
      html += '  </div>';
      html += '</button>';
    });
    html += '</div>';

    /* 主工作流展示面板 */
    html += '<div class="wf-content-panel">';

    /* 1. 流程概要指示卡 */
    html += '<div class="card wf-summary-card">';
    html += '  <div class="wsc-header">';
    html += '    <div class="wsc-title-wrap">';
    html += '      <span class="pill pill-glow">' + ctx.esc(cur.badge) + '</span>';
    html += '      <h3 class="wsc-title">' + ctx.esc(cur.name) + '</h3>';
    html += '      <p class="wsc-tagline">' + ctx.esc(cur.tagline) + '</p>';
    html += '    </div>';
    html += '    <div class="wsc-actions">';
    var copySopText = exportSopText(cur);
    var copyId = ctx.regCopy(copySopText);
    html += '      <button class="btn pri btn-sm btn-copy" data-copy="' + copyId + '" data-copy-id="' + copyId + '">📋 复制本流水线 SOP</button>';
    html += '      <button class="btn ghost btn-sm" data-go="calc">🧮 去计算器算回本 →</button>';
    html += '    </div>';
    html += '  </div>';

    /* 核心指标 KPI 仪表盘 */
    html += '  <div class="wsc-kpi-grid">';
    html += '    <div class="kpi-box">';
    html += '      <span class="kpi-label">单集制作成本</span>';
    html += '      <span class="kpi-val text-accent">' + ctx.esc(cur.costPerEp) + '</span>';
    html += '      <span class="kpi-sub">含算力/工具/配音</span>';
    html += '    </div>';
    html += '    <div class="kpi-box">';
    html += '      <span class="kpi-label">单集耗时周期</span>';
    html += '      <span class="kpi-val">' + ctx.esc(cur.timePerEp) + '</span>';
    html += '      <span class="kpi-sub">熟练流水线节奏</span>';
    html += '    </div>';
    html += '    <div class="kpi-box">';
    html += '      <span class="kpi-label">成片品质评级</span>';
    html += '      <span class="kpi-val">' + ctx.esc(cur.qualityGrade.split(' ')[0]) + '</span>';
    html += '      <span class="kpi-sub">' + ctx.esc(cur.qualityGrade.split(' ')[1] || '') + '</span>';
    html += '    </div>';
    html += '    <div class="kpi-box">';
    html += '      <span class="kpi-label">推荐团队规模</span>';
    html += '      <span class="kpi-val">' + ctx.esc(cur.teamSize) + '</span>';
    html += '      <span class="kpi-sub">人员协作模式</span>';
    html += '    </div>';
    html += '    <div class="kpi-box">';
    html += '      <span class="kpi-label">主力发布阵地</span>';
    html += '      <span class="kpi-val font-sm">' + ctx.esc(cur.platform.split('/')[0]) + '</span>';
    html += '      <span class="kpi-sub">' + ctx.esc(cur.platform) + '</span>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>'; /* /wf-summary-card */

    /* 2. 工具链拓扑图谱 (Toolchain Architecture) */
    html += '<div class="card wf-toolchain-card">';
    html += '  <div class="card-head-line">';
    html += '    <h4 class="c-title">🔗 工业工具链拓扑搭配 (Toolchain Stack)</h4>';
    html += '    <span class="c-sub">五大核心生产环节无缝闭环</span>';
    html += '  </div>';
    html += '  <div class="tc-flow-grid">';
    var tc = cur.toolchain || {};

    html += '    <div class="tc-node">';
    html += '      <div class="tc-node-step">STEP 1 · 剧本拆解</div>';
    html += '      <div class="tc-node-tool">📜 ' + ctx.esc(tc.script || '') + '</div>';
    html += '    </div>';
    html += '    <div class="tc-arrow">➔</div>';

    html += '    <div class="tc-node">';
    html += '      <div class="tc-node-step">STEP 2 · 视觉生图</div>';
    html += '      <div class="tc-node-tool">🎨 ' + ctx.esc(tc.image || '') + '</div>';
    html += '    </div>';
    html += '    <div class="tc-arrow">➔</div>';

    html += '    <div class="tc-node">';
    html += '      <div class="tc-node-step">STEP 3 · 视频生成</div>';
    html += '      <div class="tc-node-tool">🎥 ' + ctx.esc(tc.video || '') + '</div>';
    html += '    </div>';
    html += '    <div class="tc-arrow">➔</div>';

    html += '    <div class="tc-node">';
    html += '      <div class="tc-node-step">STEP 4 · 声音口型</div>';
    html += '      <div class="tc-node-tool">🎙️ ' + ctx.esc(tc.audio || '') + '</div>';
    html += '    </div>';
    html += '    <div class="tc-arrow">➔</div>';

    html += '    <div class="tc-node">';
    html += '      <div class="tc-node-step">STEP 5 · 剪辑合成</div>';
    html += '      <div class="tc-node-tool">✂️ ' + ctx.esc(tc.assembly || '') + '</div>';
    html += '    </div>';

    html += '  </div>'; /* /tc-flow-grid */
    html += '</div>'; /* /card */

    /* 3. 5 阶段作业 SOP 拆解 (Step-by-Step SOP) */
    html += '<div class="card wf-sop-card">';
    html += '  <div class="card-head-line">';
    html += '    <h4 class="c-title">🛠️ 五阶段详细执行作业规范 (Phase-by-Phase SOP)</h4>';
    html += '    <span class="c-sub">输入物、执行工具、操作动作与交付标准</span>';
    html += '  </div>';

    html += '  <div class="sop-steps-list">';
    (cur.steps || []).forEach(function (s, idx) {
      html += '    <div class="sop-phase-item">';
      html += '      <div class="spi-head">';
      html += '        <div class="spi-phase-tag">' + ctx.esc(s.phase) + '</div>';
      html += '        <div class="spi-tools-badge">使用工具：<b>' + ctx.esc(s.tools) + '</b></div>';
      html += '      </div>';
      html += '      <div class="spi-grid">';
      html += '        <div class="spi-row"><span class="spi-lbl">📥 输入准备：</span><span class="spi-val">' + ctx.esc(s.input) + '</span></div>';
      html += '        <div class="spi-row"><span class="spi-lbl">⚙️ 操作要点：</span><span class="spi-val">' + ctx.esc(s.action) + '</span></div>';
      html += '        <div class="spi-row highlight"><span class="spi-lbl">📤 交付产出：</span><span class="spi-val"><b>' + ctx.esc(s.output) + '</b></span></div>';
      html += '      </div>';
      html += '    </div>';
    });
    html += '  </div>'; /* /sop-steps-list */
    html += '</div>'; /* /card */

    /* 4. 成本核算明细与避坑指南 (Cost & Pitfalls) */
    html += '<div class="wf-bottom-grid">';

    /* 成本明细表 */
    html += '<div class="card wf-cost-card">';
    html += '  <div class="card-head-line">';
    html += '    <h4 class="c-title">💰 生产成本详细测算表</h4>';
    html += '  </div>';
    html += '  <div class="tbl-wrap">';
    html += '  <table class="wf-cost-table">';
    html += '    <thead><tr><th>成本科目</th><th>单集预估</th><th>备注说明</th></tr></thead>';
    html += '    <tbody>';
    (cur.costs || []).forEach(function (c) {
      html += '      <tr>';
      html += '        <td><b>' + ctx.esc(c.item) + '</b></td>';
      html += '        <td class="text-accent"><b>' + ctx.esc(c.cost) + '</b></td>';
      html += '        <td><span class="text-muted">' + ctx.esc(c.note) + '</span></td>';
      html += '      </tr>';
    });
    html += '    </tbody>';
    html += '  </table>';
    html += '  </div>';
    html += '</div>';

    /* 核心卡点与避坑对策 */
    html += '<div class="card wf-pitfalls-card">';
    html += '  <div class="card-head-line">';
    html += '    <h4 class="c-title">⚠️ 本路线高频卡点与避坑对策</h4>';
    html += '  </div>';
    html += '  <ul class="wf-pitfall-list">';
    (cur.pitfalls || []).forEach(function (p) {
      html += '    <li><span class="pit-icon">🚨</span><span class="pit-txt">' + ctx.esc(p) + '</span></li>';
    });
    html += '  </ul>';
    html += '</div>';

    html += '</div>'; /* /wf-bottom-grid */

    html += '</div>'; /* /wf-content-panel */

    html += '</div>'; /* /workflows-wrap */

    container.innerHTML = html;
    bindEvents(container);
  }

  /* 组装导出整条 SOP 文本 */
  function exportSopText(wf) {
    var lines = [];
    lines.push('====================================================');
    lines.push('【工业化漫剧 SOP】' + wf.name);
    lines.push('定位：' + wf.tagline);
    lines.push('单集成本：' + wf.costPerEp + ' | 耗时周期：' + wf.timePerEp + ' | 团队：' + wf.teamSize);
    lines.push('====================================================\n');

    lines.push('【一、工具链搭配】');
    var tc = wf.toolchain || {};
    lines.push('· 剧本：' + tc.script);
    lines.push('· 生图：' + tc.image);
    lines.push('· 视频：' + tc.video);
    lines.push('· 声音：' + tc.audio);
    lines.push('· 剪辑：' + tc.assembly + '\n');

    lines.push('【二、五阶段标准作业 SOP】');
    (wf.steps || []).forEach(function (s, idx) {
      lines.push((idx + 1) + '. ' + s.phase);
      lines.push('   工具：' + s.tools);
      lines.push('   输入：' + s.input);
      lines.push('   操作：' + s.action);
      lines.push('   交付物：' + s.output + '\n');
    });

    lines.push('【三、避坑提示】');
    (wf.pitfalls || []).forEach(function (p, idx) {
      lines.push((idx + 1) + '. ' + p);
    });

    return lines.join('\n');
  }

  /* 事件绑定 */
  function bindEvents(container) {
    if (!container) return;

    container.addEventListener('click', function (e) {
      var tabBtn = e.target.closest('.wf-tab-card');
      if (tabBtn) {
        currentWfId = tabBtn.dataset.wfId;
        render(container, ctx);
        return;
      }
    });
  }

  /* 自注册模块定义 */
  var mod = {
    id: MOD_ID,
    icon: '🏭',
    name: '工业化工作流',
    cnt: '4大SOP',
    after: 'tools',
    hub: 'hub3',
    sub: [
      '工业化 SOP 工作流库 · 标准流水线',
      '沉淀 4 大标准化生产流：零门槛极速流（0-20元/集）、高性价比跑量流（40-70元/集）、工业级高精流（120-200元/集）与出海全英文流（150-260元/集），包含工具链、5阶段作业规范、成本表与避坑指南。'
    ],
    search: [
      { tit: '工业化 SOP 工作流库', txt: 'AI 漫剧 4 大标准生产流水线：零门槛极速流、高性价比跑量流、工业级高精流、出海全英文流' },
      { tit: '零门槛极速流 SOP', txt: 'DeepSeek + 即梦一站式 + 剪映，单集成本 0-20 元，2-4 小时成片，适合个人新手' },
      { tit: '高性价比跑量流 SOP', txt: 'Kimi + 即梦图 + 可灵 3.0 Omni + 剪映批处理，单集成本 40-70 元，适合工作室批量更新' },
      { tit: '工业级高精流 SOP', txt: 'Midjourney 三视图 + ComfyUI LoRA + 可灵 4.0 + 达芬奇，单集 120-200 元，适合 S 级院线大片' }
    ],
    render: render
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod);
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod);
  }
})();
