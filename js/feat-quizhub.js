/* ============================================================
   漫剧研究学习平台 · 外挂模块：综合测验中心（quizhub）
   —— 聚合全站实战考核工具，提供全流程盲盒题库与结业评级：
      1. 整合运镜速配、分镜节奏、首尾帧挑战快捷入口
      2. 20 道全流程综合实战全能大考（覆盖剧本、运镜、一致性、视频、剪辑与商业）
      3. 成绩单（S/A/B/C/D）、专业评语、错题复盘与合格制作人勋章解锁
      4. 历史最高分与勋章持久化（manju_quiz_comprehensive_best）
   通过 window.MJ.addModule 自注册。
   ============================================================ */
(function () {
  'use strict';

  var MOD_ID = 'quizhub';
  var BEST_KEY = 'manju_quiz_comprehensive_best';
  var ctx = null;
  var DBX = (typeof DB !== 'undefined') ? DB : null;

  /* 答题状态 */
  var quizState = {
    mode: 'idle', /* idle | running | finished */
    curIdx: 0,
    answers: {},  /* { [qId]: selectedOptIndex } */
    revealed: {}, /* { [qId]: boolean } */
    score: 0,
    best: 0,
  };

  /* 读取历史最高分 */
  function getBestScore() {
    if (ctx && ctx.store) return ctx.store.get(BEST_KEY, 0) || 0;
    try {
      var v = localStorage.getItem(BEST_KEY);
      return v ? parseInt(v, 10) : 0;
    } catch (e) {
      return 0;
    }
  }

  /* 保存历史最高分 */
  function saveBestScore(sc) {
    if (ctx && ctx.store) ctx.store.set(BEST_KEY, sc);
    else {
      try { localStorage.setItem(BEST_KEY, sc.toString()); } catch (e) {}
    }
  }

  /* 评级与称号计算 */
  function getGradeInfo(score) {
    if (score >= 90) {
      return { grade: 'S', title: '🏆 AI 漫剧特级主创总监', color: 'var(--p1)', desc: '登峰造极！你已彻底掌握从网文剧本、工业一致性、视频运镜到商业交付的全流程工业体系。' };
    }
    if (score >= 80) {
      return { grade: 'A', title: '⭐ 资深工业化漫剧制作人', color: '#10b981', desc: '实力过硬！你已具备独立统筹或主导商业漫剧项目的成熟实战能力，完全符合工业交付标准。' };
    }
    if (score >= 70) {
      return { grade: 'B', title: '🎖️ 合格商业漫剧创作者', color: '#06b6d4', desc: '基础扎实！掌握了漫剧生产的核心逻辑，但在极端运镜控制或商业合同细节上仍有精进空间。' };
    }
    if (score >= 60) {
      return { grade: 'C', title: '🌱 新晋实战学徒', color: '#f59e0b', desc: '初窥门径！了解基础生图与视频流程，建议回到「通关课程」复习角色一致性与黄金 3 秒法则。' };
    }
    return { grade: 'D', title: '📚 需回炉重造', color: '#ef4444', desc: '及格线外。建议完整学习「8阶段通关课程」后再来挑战，避免实操中踩坑亏损算力。' };
  }

  /* 渲染主容器 */
  function render(container, mjCtx) {
    ctx = mjCtx || window.MJ;
    quizState.best = getBestScore();
    var questions = (DBX && DBX.quizComprehensive) || [];

    var html = '';
    html += '<div class="quizhub-wrap">';

    /* 顶部 Hero 卡片 */
    html += '<div class="card qh-hero-card">';
    html += '  <div class="qh-badge"><span class="pulse-dot"></span> 全流程实战技能鉴定中心</div>';
    html += '  <h2 class="qh-title">AI 漫剧综合实战考核与测验中心</h2>';
    html += '  <p class="qh-desc">检验学习成果、杜绝眼高手低。这里整合了运镜速配、98秒节奏挑战、尾帧链路模拟三大专项练习，并提供包含 20 道严密实战情境考题的「全流程综合大考」。</p>';
    html += '</div>';

    /* 四大多维考核竞技场矩阵 */
    html += '<div class="qh-arenas-grid">';

    /* 专项 1：综合大考 */
    html += '<div class="card arena-card highlight">';
    html += '  <div class="ac-icon">🏆</div>';
    html += '  <h3 class="ac-title">AI 漫剧全流程综合大考</h3>';
    html += '  <p class="ac-desc">20 道精编选择与案例情境题，覆盖剧本、运镜、角色一致性、首尾帧、剪辑与商业合规。答题通过颁发制作人认证勋章。</p>';
    html += '  <div class="ac-meta">';
    html += '    <span class="pill pill-glow">题量：20 题</span>';
    html += '    <span class="pill">历史最高：' + quizState.best + ' 分</span>';
    html += '  </div>';
    if (quizState.mode === 'idle') {
      html += '  <button class="btn pri btn-block" id="btnStartExam">立即开始全能大考 →</button>';
    } else if (quizState.mode === 'running') {
      html += '  <button class="btn pri btn-block" id="btnResumeExam">继续进行大考 (第 ' + (quizState.curIdx + 1) + '/20 题) →</button>';
    } else {
      html += '  <button class="btn ghost btn-block" id="btnRestartExam">再挑战一轮 ↻</button>';
    }
    html += '</div>';

    /* 专项 2：运镜速配 */
    html += '<div class="card arena-card">';
    html += '  <div class="ac-icon">🎥</div>';
    html += '  <h3 class="ac-title">22 种运镜语言速配测验</h3>';
    html += '  <p class="ac-desc">根据剧情叙事目的（如气场压制、悬念揭晓、大军压境），快速选出最契合的运镜动作与提示词。</p>';
    html += '  <div class="ac-meta"><span class="pill">题量：8 题/轮</span><span class="pill">考核镜头手感</span></div>';
    html += '  <button class="btn ghost btn-block" data-go="cameras?quiz=1">进入运镜速配练习 →</button>';
    html += '</div>';

    /* 专项 3：分镜节奏 */
    html += '<div class="card arena-card">';
    html += '  <div class="ac-icon">🎵</div>';
    html += '  <h3 class="ac-title">98 秒分镜节奏卡点挑战</h3>';
    html += '  <p class="ac-desc">随机剧情拍点，判断它属于黄金钩子、冲突建立、递进铺垫、反转释放还是卡点留钩阶段。</p>';
    html += '  <div class="ac-meta"><span class="pill">题量：5 题/轮</span><span class="pill">训练结构感知</span></div>';
    html += '  <button class="btn ghost btn-block" data-go="rhythm">进入节奏练习器 →</button>';
    html += '</div>';

    /* 专项 4：首尾帧衔接 */
    html += '<div class="card arena-card">';
    html += '  <div class="ac-icon">🎞️</div>';
    html += '  <h3 class="ac-title">首尾帧视觉 DNA 衔接模拟</h3>';
    html += '  <p class="ac-desc">同场景锚点、同光线色温、帧差合理性三检查，模拟逐镜连绘与无限画布尾帧链走线。</p>';
    html += '  <div class="ac-meta"><span class="pill">交互连线模拟</span><span class="pill">解决画面突变</span></div>';
    html += '  <button class="btn ghost btn-block" data-go="framesim">进入链路模拟器 →</button>';
    html += '</div>';

    html += '</div>'; /* /qh-arenas-grid */

    /* 大考区域渲染（idle / running / finished） */
    html += '<div class="qh-exam-area" id="qhExamArea">';
    if (quizState.mode === 'idle') {
      html += renderExamIntro();
    } else if (quizState.mode === 'running') {
      html += renderExamRunning(questions);
    } else if (quizState.mode === 'finished') {
      html += renderExamFinished(questions);
    }
    html += '</div>';

    html += '</div>'; /* /quizhub-wrap */

    container.innerHTML = html;
    bindEvents(container);
  }

  /* 考试介绍卡片 */
  function renderExamIntro() {
    var html = '<div class="card qh-intro-card">';
    html += '  <div class="qic-head">';
    html += '    <h3 class="c-title">📝 全能实战大考考核须知</h3>';
    html += '    <span class="pill pill-glow">合格分：80 分</span>';
    html += '  </div>';
    html += '  <div class="qic-body">';
    html += '    <p>本考核由漫剧研究实验室基于 2026 行业一手实战编撰，共 <b>20 道选择题</b>（每题 5 分，满分 100 分）。涵盖：</p>';
    html += '    <ul class="qic-ul">';
    html += '      <li><b>剧本与叙事：</b>黄金 3 秒抓人、网文拆书、反转密度与大模型提示词工程；</li>';
    html += '      <li><b>角色一致性：</b>三视图母图、5大一致性技术方案与局部重绘抢救；</li>';
    html += '      <li><b>运镜与视频：</b>运动强度参数控制、首尾帧过渡链与视频模型选型；</li>';
    html += '      <li><b>剪辑与商业：</b>TTS 角色配音、LivePortrait 口型驱动、三门票合规与商单四因子报价。</li>';
    html += '    </ul>';
    html += '    <p class="qic-tip">答题过程中每题实时给出答案与详尽深度解析；得分达到 <b>80 分</b> 以上可解锁专属「AI 漫剧合格制作人」成就徽章并在全站展示。</p>';
    html += '  </div>';
    html += '  <div class="qic-foot">';
    html += '    <button class="btn pri btn-lg" id="btnStartExamNow">🚀 开启 20 道全能大考</button>';
    html += '  </div>';
    html += '</div>';
    return html;
  }

  /* 答题进行中渲染 */
  function renderExamRunning(questions) {
    var q = questions[quizState.curIdx];
    if (!q) return '';

    var total = questions.length;
    var curNum = quizState.curIdx + 1;
    var pct = Math.round((curNum / total) * 100);
    var isAnswered = quizState.revealed[q.id];
    var userAns = quizState.answers[q.id];

    var html = '<div class="card qh-question-card" id="qcard-' + q.id + '">';

    /* 顶部进度条与题号 */
    html += '  <div class="qqc-top">';
    html += '    <div class="qqc-meta">';
    html += '      <span class="qqc-num">第 ' + curNum + ' / ' + total + ' 题</span>';
    html += '      <span class="pill pill-sm qqc-cat">' + ctx.esc(q.category) + '</span>';
    html += '    </div>';
    html += '    <div class="qqc-pct">' + pct + '% 已完成</div>';
    html += '  </div>';

    html += '  <div class="qqc-pbar"><div class="qqc-pbar-fill" style="width: ' + pct + '%"></div></div>';

    /* 题目主体 */
    html += '  <h3 class="qqc-title">' + ctx.esc(q.q) + '</h3>';

    /* 4 个选项 */
    html += '  <div class="qqc-options-list">';
    (q.opts || []).forEach(function (optText, oIdx) {
      var optClass = 'qqc-opt-btn';
      var isPicked = userAns === oIdx;

      if (isAnswered) {
        if (oIdx === q.ans) optClass += ' correct';
        else if (isPicked) optClass += ' wrong';
        else optClass += ' disabled';
      }

      html += '    <button class="' + optClass + '" data-pick-opt="' + oIdx + '"' + (isAnswered ? ' disabled' : '') + '>';
      html += '      <span class="opt-prefix">' + ['A', 'B', 'C', 'D'][oIdx] + '</span>';
      html += '      <span class="opt-text">' + ctx.esc(optText.replace(/^[A-D]\.\s*/, '')) + '</span>';
      if (isAnswered) {
        if (oIdx === q.ans) html += '      <span class="opt-mark text-ok">✓ 正确</span>';
        else if (isPicked) html += '      <span class="opt-mark text-err">✕ 你的选择</span>';
      }
      html += '    </button>';
    });
    html += '  </div>';

    /* 答案深度解析框（已作答后展开） */
    if (isAnswered) {
      var isCorrect = userAns === q.ans;
      html += '  <div class="qqc-analysis-box' + (isCorrect ? ' is-correct' : ' is-wrong') + '">';
      html += '    <div class="qab-head">';
      html += '      <span class="qab-badge">' + (isCorrect ? '🎉 回答正确 (+5分)' : '🚨 回答错误 (正确选项是 ' + ['A', 'B', 'C', 'D'][q.ans] + ')') + '</span>';
      html += '    </div>';
      html += '    <div class="qab-body">';
      html += '      <b>💡 专家深度解析：</b>' + ctx.esc(q.analysis);
      html += '    </div>';
      html += '  </div>';

      /* 底部下一题动作栏 */
      html += '  <div class="qqc-foot">';
      if (curNum < total) {
        html += '    <button class="btn pri btn-lg" id="btnNextQuestion">下一题 →</button>';
      } else {
        html += '    <button class="btn pri btn-lg" id="btnFinishExam">📊 提交全卷，查看结业报告 →</button>';
      }
      html += '  </div>';
    }

    html += '</div>'; /* /qh-question-card */
    return html;
  }

  /* 结业报告渲染 */
  function renderExamFinished(questions) {
    var totalScore = 0;
    var correctCount = 0;
    var wrongQuestions = [];

    questions.forEach(function (q) {
      if (quizState.answers[q.id] === q.ans) {
        totalScore += 5;
        correctCount++;
      } else {
        wrongQuestions.push(q);
      }
    });

    var grade = getGradeInfo(totalScore);

    /* 刷新历史最高分 */
    if (totalScore > quizState.best) {
      quizState.best = totalScore;
      saveBestScore(totalScore);
    }

    var html = '<div class="card qh-result-card">';

    /* 头部奖状 */
    html += '  <div class="qrc-hero">';
    html += '    <div class="qrc-grade-badge" style="border-color: ' + grade.color + '; color: ' + grade.color + '">';
    html += '      <span class="qrc-grade-letter">' + grade.grade + '</span>';
    html += '      <span class="qrc-grade-sub">评级</span>';
    html += '    </div>';
    html += '    <div class="qrc-info">';
    html += '      <div class="qrc-score-num"><b style="color: ' + grade.color + '">' + totalScore + '</b> <small>/ 100 分</small></div>';
    html += '      <h3 class="qrc-title">' + grade.title + '</h3>';
    html += '      <p class="qrc-desc">' + grade.desc + '</p>';
    html += '    </div>';
    html += '  </div>';

    /* 数据统计指标 */
    html += '  <div class="qrc-stats-row">';
    html += '    <div class="qrc-stat-item"><span>答对题数</span><b>' + correctCount + ' / 20</b></div>';
    html += '    <div class="qrc-stat-item"><span>答错题数</span><b class="text-err">' + (20 - correctCount) + ' 题</b></div>';
    html += '    <div class="qrc-stat-item"><span>正确率</span><b>' + Math.round((correctCount / 20) * 100) + '%</b></div>';
    html += '    <div class="qrc-stat-item"><span>制作人认证</span><b>' + (totalScore >= 80 ? '✅ 已解锁' : '未解锁') + '</b></div>';
    html += '  </div>';

    /* 动作按钮 */
    html += '  <div class="qrc-actions">';
    html += '    <button class="btn pri" id="btnRestartExam">再挑战一轮 ↻</button>';
    html += '    <button class="btn ghost" data-go="studyhub">在「学习仪表盘」查看成就 →</button>';
    html += '  </div>';

    /* 错题深度复盘本 */
    if (wrongQuestions.length > 0) {
      html += '  <div class="qrc-review-box">';
      html += '    <h4 class="qrc-rev-title">📖 错题专攻与复盘解析 (' + wrongQuestions.length + ' 题)</h4>';
      html += '    <div class="qrc-rev-list">';
      wrongQuestions.forEach(function (wq, i) {
        var userPick = quizState.answers[wq.id];
        html += '      <div class="rev-item">';
        html += '        <div class="rev-q"><b>' + (i + 1) + '. ' + ctx.esc(wq.q) + '</b></div>';
        html += '        <div class="rev-opts">';
        html += '          <span class="text-err">你的选择：' + (userPick !== undefined ? ['A', 'B', 'C', 'D'][userPick] + '. ' + ctx.esc(wq.opts[userPick]) : '未作答') + '</span><br>';
        html += '          <span class="text-ok">正确答案：' + ['A', 'B', 'C', 'D'][wq.ans] + '. ' + ctx.esc(wq.opts[wq.ans]) + '</span>';
        html += '        </div>';
        html += '        <div class="rev-why"><b>💡 深度解析：</b>' + ctx.esc(wq.analysis) + '</div>';
        html += '      </div>';
      });
      html += '    </div>';
      html += '  </div>';
    } else {
      html += '  <div class="callout green" style="margin-top: 24px;"><b>💯 满分大满贯！</b>你已经成为 AI 漫剧领域的骨灰级专业制作人！</div>';
    }

    html += '</div>'; /* /qh-result-card */
    return html;
  }

  /* 事件绑定 */
  function bindEvents(container) {
    if (!container) return;

    container.addEventListener('click', function (e) {
      var questions = (DBX && DBX.quizComprehensive) || [];

      /* 开始考试 */
      if (e.target.id === 'btnStartExam' || e.target.id === 'btnStartExamNow' || e.target.id === 'btnRestartExam') {
        quizState.mode = 'running';
        quizState.curIdx = 0;
        quizState.answers = {};
        quizState.revealed = {};
        render(container, ctx);
        var qArea = document.getElementById('qhExamArea');
        if (qArea) qArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      /* 继续未答完的考试 */
      if (e.target.id === 'btnResumeExam') {
        render(container, ctx);
        var qArea2 = document.getElementById('qhExamArea');
        if (qArea2) qArea2.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      /* 选项点击作答 */
      var optBtn = e.target.closest('[data-pick-opt]');
      if (optBtn && quizState.mode === 'running') {
        var curQ = questions[quizState.curIdx];
        if (curQ && !quizState.revealed[curQ.id]) {
          var pickIdx = +optBtn.dataset.pickOpt;
          quizState.answers[curQ.id] = pickIdx;
          quizState.revealed[curQ.id] = true;
          render(container, ctx);
        }
        return;
      }

      /* 下一题 */
      if (e.target.id === 'btnNextQuestion') {
        if (quizState.curIdx < questions.length - 1) {
          quizState.curIdx++;
          render(container, ctx);
        }
        return;
      }

      /* 结业提交 */
      if (e.target.id === 'btnFinishExam') {
        quizState.mode = 'finished';
        render(container, ctx);
        var resEl = document.querySelector('.qh-result-card');
        if (resEl) resEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (ctx && ctx.toast) ctx.toast('🎉 综合实战大考完成！已生成结业报告');
        return;
      }
    });
  }

  /* 自注册模块定义 */
  var mod = {
    id: MOD_ID,
    icon: '🎯',
    name: '测验中心',
    cnt: '实战闯关',
    after: 'rhythm',
    hub: 'hub5',
    sub: [
      '综合测验中心 · 全流程技能鉴定',
      '整合运镜速配、98秒节奏挑战、首尾帧模拟，并提供包含 20 道实战大题的 AI 漫剧全流程综合考核；结业评定 S/A/B/C/D 级并解锁制作人认证勋章。'
    ],
    search: [
      { tit: '综合测验中心 · 实战考核', txt: 'AI 漫剧综合实战大考（20题）：剧本结构、角色一致性、运镜机位、视频控制、声音剪辑与商业合规' },
      { tit: '制作人结业报告与勋章', txt: '答题通过 80 分解锁「AI 漫剧合格制作人」成就勋章，错题解析复盘本，历史最高分持久化' }
    ],
    render: render
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod);
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod);
  }
})();
