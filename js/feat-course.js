/* ============================================================
   漫剧研究学习平台 · 外挂模块：体系化通关营（course）
   —— 8 阶段递进式学习体系，覆盖从零认知到签约变现全链路：
      前置必修 → 剧本小说 → 角色设定 → 分镜画布 →
      视频生成 → 声音口型 → 工业剪辑 → 商业变现
   包含课时折叠卡、标准 SOP、避坑指南、模块深链与课后实操作业；
   打卡进度实时持久化到 localStorage（manju_course_progress_v1）。
   通过 window.MJ.addModule 自注册。
   ============================================================ */
(function () {
  'use strict';

  var MOD_ID = 'course';
  var STORAGE_KEY = 'manju_course_progress_v1';
  var ctx = null;
  var DBX = (typeof DB !== 'undefined') ? DB : null;

  /* 获取存储的打卡状态对象 */
  function getProgress() {
    if (ctx && ctx.store) return ctx.store.get(STORAGE_KEY, {}) || {};
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v ? JSON.parse(v) : {};
    } catch (e) {
      return {};
    }
  }

  /* 保存打卡状态 */
  function saveProgress(prog) {
    if (ctx && ctx.store) ctx.store.set(STORAGE_KEY, prog);
    else {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prog)); } catch (e) {}
    }
  }

  /* 计算全站课程与各阶段进度 */
  function computeStats(prog) {
    var stages = (DBX && DBX.course) || [];
    var totalLessons = 0;
    var doneLessons = 0;
    var stageStats = [];

    stages.forEach(function (st) {
      var stTotal = st.lessons ? st.lessons.length : 0;
      var stDone = 0;
      (st.lessons || []).forEach(function (ls) {
        totalLessons++;
        if (prog[ls.id]) {
          doneLessons++;
          stDone++;
        }
      });
      stageStats.push({
        id: st.id,
        stage: st.stage,
        total: stTotal,
        done: stDone,
        pct: stTotal > 0 ? Math.round((stDone / stTotal) * 100) : 0
      });
    });

    var totalPct = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
    return {
      total: totalLessons,
      done: doneLessons,
      pct: totalPct,
      stages: stageStats
    };
  }

  /* 渲染主函数 */
  function render(container, mjCtx) {
    ctx = mjCtx || window.MJ;
    var stages = (DBX && DBX.course) || [];
    var prog = getProgress();
    var stats = computeStats(prog);

    var html = '';
    html += '<div class="course-wrap">';

    /* 顶部仪表卡：进度大盘与打卡勋章 */
    html += '<div class="card course-hero-card">';
    html += '  <div class="ch-main">';
    html += '    <div class="ch-info">';
    html += '      <div class="ch-badge"><span class="pulse-dot"></span> 8 阶段系统通关营 · 从零到商业签约</div>';
    html += '      <h2 class="ch-title">AI 漫剧工业化制作 · 体系化全通实战课程</h2>';
    html += '      <p class="ch-desc">告别东拼西凑的零散教程。按照工业级生产顺序组织 8 阶段递进课程，每节课配备核心知识点、标准实操 SOP、高频翻车避坑指南与直达关联工具的深链练习。</p>';
    html += '      <div class="ch-meta-pills">';
    html += '        <span class="pill"><b id="csDoneCount">' + stats.done + '</b> / ' + stats.total + ' 课时已通关</span>';
    html += '        <span class="pill">8 大核心阶段</span>';
    html += '        <span class="pill">打卡进度本地自动保存</span>';
    html += '      </div>';
    html += '    </div>';
    html += '    <div class="ch-progress-circle-wrap">';
    html += '      <div class="ch-circle-num"><span id="csPctText">' + stats.pct + '</span><small>%</small></div>';
    html += '      <div class="ch-circle-sub">通关达成率</div>';
    html += '    </div>';
    html += '  </div>';

    /* 进度条 */
    html += '  <div class="course-bar-track">';
    html += '    <div class="course-bar-fill" id="csBarFill" style="width: ' + stats.pct + '%"></div>';
    html += '  </div>';

    /* 阶段快速直达锚点导航 */
    html += '  <div class="stage-nav-strip">';
    stages.forEach(function (st, idx) {
      var stStat = stats.stages[idx] || { done: 0, total: 0, pct: 0 };
      var isCompleted = stStat.done === stStat.total && stStat.total > 0;
      html += '    <button type="button" class="sns-item' + (isCompleted ? ' completed' : '') + '" data-stage-anchor="' + st.stage + '" title="' + ctx.esc(st.title) + '">';
      html += '      <span class="sns-icon">' + st.icon + '</span>';
      html += '      <span class="sns-label">S' + st.stage + '</span>';
      html += '      <span class="sns-pct">' + stStat.pct + '%</span>';
      html += '    </button>';
    });
    html += '  </div>';
    html += '</div>';

    /* 快捷筛选栏 */
    html += '<div class="course-filter-bar">';
    html += '  <div class="cf-left">';
    html += '    <button class="chip active cf-chip" data-cf="all">全部课时 (' + stats.total + ')</button>';
    html += '    <button class="chip cf-chip" data-cf="todo">未打卡待学</button>';
    html += '    <button class="chip cf-chip" data-cf="done">已打卡完成</button>';
    html += '  </div>';
    html += '  <div class="cf-right">';
    html += '    <button class="btn ghost btn-sm" id="btnExpandAll">全部展开</button>';
    html += '    <button class="btn ghost btn-sm" id="btnCollapseAll">全部收起</button>';
    html += '    <button class="btn ghost btn-sm" id="btnResetCourse">重置打卡</button>';
    html += '  </div>';
    html += '</div>';

    /* 课程主体：8 大阶段渲染 */
    html += '<div class="stage-list" id="stageList">';
    stages.forEach(function (st, sIdx) {
      var stStat = stats.stages[sIdx] || { done: 0, total: 0, pct: 0 };
      var isCompleted = stStat.done === stStat.total && stStat.total > 0;

      html += '<div class="stage-block' + (isCompleted ? ' stage-all-done' : '') + '" id="st-anchor-' + st.stage + '">';
      html += '  <div class="stage-head">';
      html += '    <div class="sh-left">';
      html += '      <div class="sh-icon">' + st.icon + '</div>';
      html += '      <div class="sh-info">';
      html += '        <div class="sh-tag">第 ' + st.stage + ' 阶段</div>';
      html += '        <h3 class="sh-title">' + ctx.esc(st.title) + '</h3>';
      html += '        <p class="sh-desc">' + ctx.esc(st.desc) + '</p>';
      html += '      </div>';
      html += '    </div>';
      html += '    <div class="sh-right">';
      html += '      <div class="sh-stat-badge">';
      html += '        <span class="st-done-num" id="stDone-' + st.stage + '">' + stStat.done + '</span> / ' + stStat.total + ' 已完成';
      html += '      </div>';
      html += '    </div>';
      html += '  </div>';

      /* 课时卡片列表 */
      html += '  <div class="lesson-cards">';
      (st.lessons || []).forEach(function (ls, lIdx) {
        var isDone = !!prog[ls.id];
        html += '    <div class="card lesson-card' + (isDone ? ' is-done' : '') + '" id="card-' + ls.id + '" data-lesson-id="' + ls.id + '">';
        html += '      <div class="lc-header">';
        html += '        <div class="lc-check-wrap">';
        html += '          <button class="lc-check-btn' + (isDone ? ' checked' : '') + '" data-toggle-id="' + ls.id + '" title="' + (isDone ? '取消打卡' : '标记已完成') + '" aria-label="标记完成">';
        html +=              isDone ? '✓' : '';
        html += '          </button>';
        html += '        </div>';
        html += '        <div class="lc-title-wrap" data-expand-id="' + ls.id + '">';
        html += '          <div class="lc-meta-tags">';
        html += '            <span class="lc-no">Lesson ' + st.stage + '.' + (lIdx + 1) + '</span>';
        html += '            <span class="pill pill-sm lc-time">⏱️ ' + ctx.esc(ls.duration) + '</span>';
        html += '            <span class="pill pill-sm lc-level">' + ctx.esc(ls.level) + '</span>';
        html += '          </div>';
        html += '          <h4 class="lc-title">' + ctx.esc(ls.title) + '</h4>';
        html += '        </div>';
        html += '        <div class="lc-chevron" data-expand-id="' + ls.id + '" title="展开/收起">▼</div>';
        html += '      </div>';

        /* 折叠展开的课时详情 */
        html += '      <div class="lc-body" id="body-' + ls.id + '">';
        /* 核心知识点 */
        html += '        <div class="lc-section lc-summary-box">';
        html += '          <div class="lc-sec-title"><span class="icon">💡</span> 核心知识点与认知拆解</div>';
        html += '          <p class="lc-summary-text">' + ctx.esc(ls.summary) + '</p>';
        html += '        </div>';

        /* 标准实操 SOP */
        html += '        <div class="lc-section">';
        html += '          <div class="lc-sec-title"><span class="icon">🛠️</span> 工业化标准实操 SOP (Step-by-Step)</div>';
        html += '          <ol class="lc-sop-list">';
        (ls.sop || []).forEach(function (sopStep) {
          html += '            <li>' + ctx.esc(sopStep) + '</li>';
        });
        html += '          </ol>';
        html += '        </div>';

        /* 避坑指南 */
        if (ls.pitfalls && ls.pitfalls.length) {
          html += '        <div class="lc-section lc-pitfalls-box">';
          html += '          <div class="lc-sec-title"><span class="icon">⚠️</span> 行业翻车避坑指南</div>';
          html += '          <ul class="lc-pitfalls-list">';
          ls.pitfalls.forEach(function (pit) {
            html += '            <li>' + ctx.esc(pit) + '</li>';
          });
          html += '          </ul>';
          html += '        </div>';
        }

        /* 课后实操练习作业 */
        if (ls.homework) {
          html += '        <div class="lc-section lc-homework-box">';
          html += '          <div class="lc-sec-title"><span class="icon">📝</span> 课后实操练习</div>';
          html += '          <p class="lc-homework-text">' + ctx.esc(ls.homework) + '</p>';
          html += '        </div>';
        }

        /* 延伸模块深度跳转 */
        if (ls.deepLinks && ls.deepLinks.length) {
          html += '        <div class="lc-section lc-links-box">';
          html += '          <div class="lc-sec-title"><span class="icon">🔗</span> 平台配套工具与实验室深链</div>';
          html += '          <div class="lc-links-row">';
          ls.deepLinks.forEach(function (lk) {
            html += '            <button class="btn ghost btn-sm" data-go="' + ctx.esc(lk.go) + '">' + ctx.esc(lk.n) + ' →</button>';
          });
          html += '          </div>';
          html += '        </div>';
        }

        /* 底部完成打卡动作条 */
        html += '        <div class="lc-foot-action">';
        html += '          <button class="btn ' + (isDone ? 'ghost' : 'pri') + ' lc-action-btn" data-toggle-id="' + ls.id + '">';
        html +=              isDone ? '✓ 已打卡完成（点击可取消）' : '⛳ 打卡完成本课时';
        html += '          </button>';
        html += '        </div>';

        html += '      </div>'; /* /lc-body */
        html += '    </div>'; /* /card */
      });
      html += '  </div>'; /* /lesson-cards */
      html += '</div>'; /* /stage-block */
    });
    html += '</div>'; /* /stage-list */

    html += '</div>'; /* /course-wrap */

    container.innerHTML = html;
    bindEvents(container);
  }

  /* 事件绑定 */
  function bindEvents(container) {
    if (!container) return;

    /* 展开/收起单个课时 */
    container.addEventListener('click', function (e) {
      /* 阶段快速直达锚点点击（平滑滚动且不破坏 SPA 路由） */
      var anchorBtn = e.target.closest('[data-stage-anchor]');
      if (anchorBtn) {
        e.preventDefault();
        var stg = anchorBtn.dataset.stageAnchor;
        var targetEl = document.getElementById('st-anchor-' + stg);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return;
      }

      var expEl = e.target.closest('[data-expand-id]');
      if (expEl) {
        var id = expEl.dataset.expandId;
        var card = document.getElementById('card-' + id);
        if (card) {
          card.classList.toggle('expanded');
        }
        return;
      }

      /* 打卡勾选按钮切换 */
      var tBtn = e.target.closest('[data-toggle-id]');
      if (tBtn) {
        e.preventDefault();
        e.stopPropagation();
        var id = tBtn.dataset.toggleId;
        toggleLesson(id, container);
        return;
      }

      /* 筛选标签切换 */
      var cfBtn = e.target.closest('.cf-chip');
      if (cfBtn) {
        var mode = cfBtn.dataset.cf;
        container.querySelectorAll('.cf-chip').forEach(function (c) { c.classList.remove('active'); });
        cfBtn.classList.add('active');
        applyFilter(mode, container);
        return;
      }

      /* 全部展开 */
      if (e.target.id === 'btnExpandAll') {
        container.querySelectorAll('.lesson-card').forEach(function (c) { c.classList.add('expanded'); });
        return;
      }

      /* 全部收起 */
      if (e.target.id === 'btnCollapseAll') {
        container.querySelectorAll('.lesson-card').forEach(function (c) { c.classList.remove('expanded'); });
        return;
      }

      /* 重置打卡 */
      if (e.target.id === 'btnResetCourse') {
        if (confirm('确定要清空所有通关打卡进度吗？此操作不可撤销。')) {
          saveProgress({});
          render(container, ctx);
          if (ctx && ctx.toast) ctx.toast('打卡记录已重置');
        }
        return;
      }
    });
  }

  /* 切换打卡完成状态 */
  function toggleLesson(lessonId, container) {
    var prog = getProgress();
    var newState = !prog[lessonId];
    if (newState) prog[lessonId] = true;
    else delete prog[lessonId];
    saveProgress(prog);

    /* 局部刷新该卡片状态 */
    var card = document.getElementById('card-' + lessonId);
    if (card) {
      card.classList.toggle('is-done', newState);
      var chkBtn = card.querySelector('.lc-check-btn');
      if (chkBtn) {
        chkBtn.classList.toggle('checked', newState);
        chkBtn.textContent = newState ? '✓' : '';
      }
      var actBtn = card.querySelector('.lc-action-btn');
      if (actBtn) {
        actBtn.className = 'btn ' + (newState ? 'ghost' : 'pri') + ' lc-action-btn';
        actBtn.textContent = newState ? '✓ 已打卡完成（点击可取消）' : '⛳ 打卡完成本课时';
      }
    }

    /* 重新计算统计并更新大盘与各阶段 */
    var stats = computeStats(prog);
    var countEl = document.getElementById('csDoneCount');
    if (countEl) countEl.textContent = stats.done;
    var pctEl = document.getElementById('csPctText');
    if (pctEl) pctEl.textContent = stats.pct;
    var barEl = document.getElementById('csBarFill');
    if (barEl) barEl.style.width = stats.pct + '%';

    /* 更新阶段小徽章 */
    stats.stages.forEach(function (st) {
      var stNumEl = document.getElementById('stDone-' + st.stage);
      if (stNumEl) stNumEl.textContent = st.done;
      var stageBlock = document.getElementById('st-anchor-' + st.stage);
      if (stageBlock) {
        stageBlock.classList.toggle('stage-all-done', st.done === st.total && st.total > 0);
      }
    });

    if (ctx && ctx.toast) {
      ctx.toast(newState ? '🎉 恭喜完成该课时打卡！' : '已取消该课时打卡');
    }
  }

  /* 筛选过滤展示 */
  function applyFilter(mode, container) {
    var cards = container.querySelectorAll('.lesson-card');
    cards.forEach(function (card) {
      var isDone = card.classList.contains('is-done');
      if (mode === 'all') {
        card.style.display = '';
      } else if (mode === 'done') {
        card.style.display = isDone ? '' : 'none';
      } else if (mode === 'todo') {
        card.style.display = isDone ? 'none' : '';
      }
    });
  }

  /* 自注册模块定义 */
  var mod = {
    id: MOD_ID,
    icon: '🎓',
    name: '通关课程',
    cnt: '8阶段',
    after: 'dashboard',
    hub: 'hub1',
    sub: [
      '体系化通关营 · 8阶段递进课程',
      '从前置认知、网文拆书、角色设定、分镜画布、视频生成、声音工程、剪辑合规到商业接单——包含完整 SOP、避坑指南与打卡机制，打造最硬核的漫剧创作者培育体系。'
    ],
    search: [
      { tit: '通关课程 · 8阶段体系化大纲', txt: '从零到商业签约全流程通关营：认知准备、网文剧本、角色设定、分镜连绘、视频运镜、声音工程、工业剪辑、商业变现' },
      { tit: '网文拆书与 98 秒分镜法', txt: '千万字小说压缩为 10-12 镜分镜表，黄金3秒钩子与反转卡点，大模型批量生成结构化分镜 JSON' },
      { tit: '角色三视图与资产卡规范', txt: '正面立绘、45度微侧、正侧、背面、特写 5 视角标准 Prompt 构建，提取不可变视觉 DNA 与 Seed 锁定' },
      { tit: '声音设计与口型驱动技术', txt: 'TTS 多角色音色定制、LivePortrait 精准口型同步、BGM 闪避 Ducking 与爆点音效毫秒级卡点' },
      { tit: '漫剧商业变现与接单合同', txt: '红果/快手流量分账政策、商单 500-1500 元/分钟四因子报价单、定金 3-4-3 付款节点与防赖账合同' }
    ],
    render: render
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod);
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod);
  }
})();
