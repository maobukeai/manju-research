/* ============================================================
   漫剧研究学习平台 · 外挂模块：提示词工坊（promptgen）
   —— 可视化“积木拼装”式 AI 漫剧提示词生成器：
      1. 经典爆款配方一键载入（仙侠/都市/赛博/女频/科幻/武侠）
      2. 画风、景别机位、光影氛围、情绪神态 4 大积木自由组合
      3. 实时输出多引擎格式（中文通用、Midjourney 英文增强、负面词）
      4. 一键复制与本地提示词收藏库（manju_promptgen_favs_v1）
   通过 window.MJ.addModule 自注册。
   ============================================================ */
(function () {
  'use strict';

  var MOD_ID = 'promptgen';
  var FAV_KEY = 'manju_promptgen_favs_v1';
  var ctx = null;
  var DBX = (typeof DB !== 'undefined') ? DB : null;

  /* 工坊积木状态 */
  var st = {
    styleId: 'ps-xianxia',
    shotId: 'shot-cu',
    lightingId: 'light-rembrandt',
    emotionId: 'emo-smirk',
    subject: '白发青衣年轻剑尊，手持古朴长剑，眼神凌厉如电',
    action: '凌空拔剑挥出一道雷电剑芒，衣袍在狂风中烈烈翻飞',
    environment: '残破古仙殿悬崖绝壁，雷云翻滚，碎石漂浮在半空',
    aspect: '9:16',
    activeTab: 'builder', /* builder | favs */
  };

  /* 获取收藏列表 */
  function getFavs() {
    if (ctx && ctx.store) return ctx.store.get(FAV_KEY, []) || [];
    try {
      var v = localStorage.getItem(FAV_KEY);
      return v ? JSON.parse(v) : [];
    } catch (e) {
      return [];
    }
  }

  /* 保存收藏列表 */
  function saveFavs(favs) {
    if (ctx && ctx.store) ctx.store.set(FAV_KEY, favs);
    else {
      try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch (e) {}
    }
  }

  /* 组装中文提示词 */
  function assembleCnPrompt() {
    var pStudio = (DBX && DBX.promptStudio) || {};
    var styles = pStudio.styles || [];
    var shots = pStudio.shots || [];
    var lights = pStudio.lighting || [];
    var emos = pStudio.emotions || [];

    var sObj = styles.find(function (x) { return x.id === st.styleId; }) || styles[0] || {};
    var shObj = shots.find(function (x) { return x.id === st.shotId; }) || shots[0] || {};
    var lObj = lights.find(function (x) { return x.id === st.lightingId; }) || lights[0] || {};
    var eObj = emos.find(function (x) { return x.id === st.emotionId; }) || emos[0] || {};

    var parts = [];
    if (shObj.name) parts.push(shObj.name.split(' ')[0] + '机位');
    if (sObj.name) parts.push(sObj.name + '画风');
    if (st.subject) parts.push(st.subject);
    if (eObj.name) parts.push('神态：' + eObj.name);
    if (st.action) parts.push('动作：' + st.action);
    if (lObj.name) parts.push('光影：' + lObj.name);
    if (st.environment) parts.push('背景环境：' + st.environment);
    parts.push('极致细节，电影级质感，8K分辨率，' + st.aspect + '竖屏');

    return parts.join('，') + '。';
  }

  /* 组装英文 Midjourney 提示词 */
  function assembleEnPrompt() {
    var pStudio = (DBX && DBX.promptStudio) || {};
    var styles = pStudio.styles || [];
    var shots = pStudio.shots || [];
    var lights = pStudio.lighting || [];
    var emos = pStudio.emotions || [];

    var sObj = styles.find(function (x) { return x.id === st.styleId; }) || styles[0] || {};
    var shObj = shots.find(function (x) { return x.id === st.shotId; }) || shots[0] || {};
    var lObj = lights.find(function (x) { return x.id === st.lightingId; }) || lights[0] || {};
    var eObj = emos.find(function (x) { return x.id === st.emotionId; }) || emos[0] || {};

    var parts = [];
    if (shObj.en) parts.push(shObj.en);
    if (sObj.en) parts.push(sObj.en + ' aesthetic');
    if (eObj.en) parts.push(eObj.en);
    if (lObj.keywords) parts.push(lObj.keywords);

    /* 简单的中英主体动作映射 */
    var coreEn = 'masterpiece anime character, ' + (st.action.indexOf('剑') >= 0 ? 'wielding ancient sword with lightning particles' : 'dynamic posture with intense atmosphere');
    parts.push(coreEn);
    parts.push('intricate detailed facial features, cinematic dramatic lighting, 8k resolution');

    var mjParam = sObj.mjParams || '--ar 9:16 --v 6.1 --style raw';
    if (st.aspect !== '9:16') {
      mjParam = mjParam.replace('--ar 9:16', '--ar ' + st.aspect);
    }

    return parts.join(', ') + ' ' + mjParam;
  }

  /* 组装负面提示词 */
  function assembleNegativePrompt() {
    var pStudio = (DBX && DBX.promptStudio) || {};
    var styles = pStudio.styles || [];
    var sObj = styles.find(function (x) { return x.id === st.styleId; }) || styles[0] || {};

    var baseNeg = 'extra fingers, mutated hands, poorly drawn hands, missing limbs, malformed limbs, fused fingers, distorted face, blurry, low quality, pixelated, watermark, text, signature';
    if (sObj.negatives) {
      baseNeg += ', ' + sObj.negatives;
    }
    return baseNeg;
  }

  /* 渲染主容器 */
  function render(container, mjCtx) {
    ctx = mjCtx || window.MJ;
    var pStudio = (DBX && DBX.promptStudio) || {};

    var html = '';
    html += '<div class="promptgen-wrap">';

    /* 顶部 Hero 卡片 */
    html += '<div class="card pg-hero-card">';
    html += '  <div class="pg-badge"><span class="pulse-dot"></span> 工业级视觉提示词构建中心</div>';
    html += '  <h2 class="pg-title">AI 漫剧提示词积木工坊 (Prompt Studio)</h2>';
    html += '  <p class="pg-desc">不懂写提示词？通过可视化的艺术风格、景别机位、光影氛围与情绪神态积木式拼装，一键输出符合即梦、可灵与 Midjourney 规范的专业电影感 Prompt。</p>';
    html += '</div>';

    /* 模式切换栏（积木构建 / 我的收藏） */
    html += '<div class="pg-top-bar">';
    html += '  <div class="pg-tabs">';
    html += '    <button class="pg-tab-btn' + (st.activeTab === 'builder' ? ' active' : '') + '" data-pgtab="builder">🧱 积木拼装工作台</button>';
    var favs = getFavs();
    html += '    <button class="pg-tab-btn' + (st.activeTab === 'favs' ? ' active' : '') + '" data-pgtab="favs">⭐ 我的提示词收藏 (' + favs.length + ')</button>';
    html += '  </div>';
    html += '  <div class="pg-quick-actions">';
    html += '    <button class="btn ghost btn-sm" id="btnRollDice">🎲 随机灵感配方</button>';
    html += '    <button class="btn ghost btn-sm" id="btnResetBlocks">🧹 一键清空</button>';
    html += '  </div>';
    html += '</div>';

    if (st.activeTab === 'builder') {
      html += renderBuilder(pStudio);
    } else {
      html += renderFavorites(favs);
    }

    html += '</div>'; /* /promptgen-wrap */

    container.innerHTML = html;
    bindEvents(container);
  }

  /* 渲染工作台构建器 */
  function renderBuilder(pStudio) {
    var recipes = pStudio.recipes || [];
    var styles = pStudio.styles || [];
    var shots = pStudio.shots || [];
    var lights = pStudio.lighting || [];
    var emos = pStudio.emotions || [];

    var html = '';

    /* 1. 经典爆款配方一键加载 */
    html += '<div class="card pg-section-card">';
    html += '  <div class="pg-sec-head">';
    html += '    <h3 class="pg-sec-title">⚡ 经典爆款配方 (1-Click Presets)</h3>';
    html += '    <span class="pg-sec-sub">点击直接载入大师级漫剧镜头模版</span>';
    html += '  </div>';
    html += '  <div class="recipe-chips-grid">';
    recipes.forEach(function (rec) {
      html += '    <button class="recipe-btn" data-load-recipe="' + rec.id + '">';
      html += '      <span class="rb-name">' + ctx.esc(rec.name) + '</span>';
      html += '      <span class="rb-arrow">→ 载入</span>';
      html += '    </button>';
    });
    html += '  </div>';
    html += '</div>';

    /* 主布局：左侧 4 大积木与表单 + 右侧实时输出 Deck */
    html += '<div class="pg-main-grid">';

    /* 左侧：积木选择器 */
    html += '<div class="pg-blocks-col">';

    /* 积木 1：画风选择 */
    html += '<div class="card pg-section-card">';
    html += '  <div class="pg-sec-head">';
    html += '    <h4 class="pg-sec-title">🎨 1. 艺术风格预设 (Style)</h4>';
    html += '  </div>';
    html += '  <div class="block-items-grid cols-4">';
    styles.forEach(function (s) {
      var isAct = s.id === st.styleId;
      html += '    <div class="block-card' + (isAct ? ' active' : '') + '" data-block-type="style" data-block-id="' + s.id + '">';
      html += '      <div class="bc-name">' + ctx.esc(s.name) + '</div>';
      html += '      <div class="bc-badge">' + ctx.esc(s.badge) + '</div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    /* 积木 2：景别机位选择 */
    html += '<div class="card pg-section-card">';
    html += '  <div class="pg-sec-head">';
    html += '    <h4 class="pg-sec-title">🎥 2. 景别与机位视角 (Shot & Angle)</h4>';
    html += '  </div>';
    html += '  <div class="block-items-grid cols-4">';
    shots.forEach(function (sh) {
      var isAct = sh.id === st.shotId;
      html += '    <div class="block-card' + (isAct ? ' active' : '') + '" data-block-type="shot" data-block-id="' + sh.id + '">';
      html += '      <div class="bc-name">' + ctx.esc(sh.name.split(' ')[0]) + '</div>';
      html += '      <div class="bc-desc">' + ctx.esc(sh.purpose.slice(0, 16)) + '…</div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    /* 积木 3：光影氛围选择 */
    html += '<div class="card pg-section-card">';
    html += '  <div class="pg-sec-head">';
    html += '    <h4 class="pg-sec-title">💡 3. 光影与电影氛围 (Lighting)</h4>';
    html += '  </div>';
    html += '  <div class="block-items-grid cols-4">';
    lights.forEach(function (lt) {
      var isAct = lt.id === st.lightingId;
      html += '    <div class="block-card' + (isAct ? ' active' : '') + '" data-block-type="lighting" data-block-id="' + lt.id + '">';
      html += '      <div class="bc-name">' + ctx.esc(lt.name.split(' ')[0]) + '</div>';
      html += '      <div class="bc-desc">' + ctx.esc(lt.atmosphere.slice(0, 16)) + '…</div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    /* 积木 4：情绪神态选择 */
    html += '<div class="card pg-section-card">';
    html += '  <div class="pg-sec-head">';
    html += '    <h4 class="pg-sec-title">🎭 4. 面部情绪与神态 (Emotion)</h4>';
    html += '  </div>';
    html += '  <div class="block-items-grid cols-4">';
    emos.forEach(function (em) {
      var isAct = em.id === st.emotionId;
      html += '    <div class="block-card' + (isAct ? ' active' : '') + '" data-block-type="emotion" data-block-id="' + em.id + '">';
      html += '      <div class="bc-name">' + ctx.esc(em.name) + '</div>';
      html += '      <div class="bc-desc">' + ctx.esc(em.visualCue.slice(0, 16)) + '…</div>';
      html += '    </div>';
    });
    html += '  </div>';
    html += '</div>';

    /* 主体角色与动作定制表单 */
    html += '<div class="card pg-section-card">';
    html += '  <div class="pg-sec-head">';
    html += '    <h4 class="pg-sec-title">✍️ 5. 主体角色、动作与环境定制</h4>';
    html += '  </div>';
    html += '  <div class="pg-custom-form">';

    html += '    <div class="pg-form-group">';
    html += '      <label>主体角色描述：</label>';
    html += '      <input type="text" id="inpSubject" value="' + ctx.esc(st.subject) + '" placeholder="如：银白长发年轻剑尊，身着墨黑龙纹长袍">';
    html += '      <div class="tag-shortcuts">';
    html += '        <span class="tag-sc" data-fill-sub="身着玄黑龙纹长袍的剑修主角">剑修男主</span>';
    html += '        <span class="tag-sc" data-fill-sub="戴着战术面具的高冷刺客">暗黑刺客</span>';
    html += '        <span class="tag-sc" data-fill-sub="头戴凤冠点翠的冷艳黑化贵妃">黑化贵妃</span>';
    html += '        <span class="tag-sc" data-fill-sub="身穿剪裁西装的冷酷霸道总裁">都市霸总</span>';
    html += '      </div>';
    html += '    </div>';

    html += '    <div class="pg-form-group">';
    html += '      <label>核心动态动作：</label>';
    html += '      <input type="text" id="inpAction" value="' + ctx.esc(st.action) + '" placeholder="如：凌空拔剑挥出百丈雷电剑芒">';
    html += '      <div class="tag-shortcuts">';
    html += '        <span class="tag-sc" data-fill-act="拔剑劈下带起漫天剑气与狂暴风压">剑气斩击</span>';
    html += '        <span class="tag-sc" data-fill-act="居高临下冰冷蔑视，单手捏碎手中茶杯">捏碎茶杯</span>';
    html += '        <span class="tag-sc" data-fill-act="周身环绕狂暴雷电灵气，双拳紧握青筋暴起">气场爆发</span>';
    html += '        <span class="tag-sc" data-fill-act="嘴角带着一丝残忍冷笑，眼神充满压迫感">冷笑对峙</span>';
    html += '      </div>';
    html += '    </div>';

    html += '    <div class="pg-form-group">';
    html += '      <label>背景场景环境：</label>';
    html += '      <input type="text" id="inpEnv" value="' + ctx.esc(st.environment) + '" placeholder="如：残破古仙殿悬崖绝壁，雷云翻滚">';
    html += '      <div class="tag-shortcuts">';
    html += '        <span class="tag-sc" data-fill-env="九天玄雷悬崖绝巅，漂浮的古仙大阵碎石">仙崖绝巅</span>';
    html += '        <span class="tag-sc" data-fill-env="暴雨磅礴的霓虹赛博高楼顶层玻璃幕墙">赛博雨夜</span>';
    html += '        <span class="tag-sc" data-fill-env="幽暗昏黄的深宫寝殿，烛火摇曳帷幔低垂">深宫寝殿</span>';
    html += '        <span class="tag-sc" data-fill-env="狂风黄沙弥漫的苍茫废土战场，外星异形骸骨">末日废土</span>';
    html += '      </div>';
    html += '    </div>';

    html += '  </div>'; /* /pg-custom-form */
    html += '</div>'; /* /card */

    html += '</div>'; /* /pg-blocks-col */

    /* 右侧：实时输出 Deck (Sticky) */
    html += '<div class="pg-deck-col">';
    html += '  <div class="card pg-deck-card">';
    html += '    <div class="deck-head">';
    html += '      <h3 class="deck-title">🚀 实时生成 Prompt 成果台</h3>';
    html += '      <button class="btn pri btn-sm" id="btnSaveToFav">💾 保存到收藏</button>';
    html += '    </div>';

    /* 中文输出卡片 */
    var cnPrompt = assembleCnPrompt();
    var cnCopyId = ctx.regCopy(cnPrompt);
    html += '    <div class="deck-output-box">';
    html += '      <div class="dob-head">';
    html += '        <span class="dob-badge">即梦 / 可灵 / 豆包 中文通用格式</span>';
    html += '        <button class="btn ghost btn-sm btn-copy" data-copy="' + cnCopyId + '" data-copy-id="' + cnCopyId + '">复制中文词</button>';
    html += '      </div>';
    html += '      <div class="dob-code" id="boxCnPrompt">' + ctx.esc(cnPrompt) + '</div>';
    html += '    </div>';

    /* 英文 Midjourney 输出卡片 */
    var enPrompt = assembleEnPrompt();
    var enCopyId = ctx.regCopy(enPrompt);
    html += '    <div class="deck-output-box">';
    html += '      <div class="dob-head">';
    html += '        <span class="dob-badge">Midjourney 英文增强格式 (含参数)</span>';
    html += '        <button class="btn ghost btn-sm btn-copy" data-copy="' + enCopyId + '" data-copy-id="' + enCopyId + '">复制 MJ 词</button>';
    html += '      </div>';
    html += '      <div class="dob-code" id="boxEnPrompt">' + ctx.esc(enPrompt) + '</div>';
    html += '    </div>';

    /* 负面提示词卡片 */
    var negPrompt = assembleNegativePrompt();
    var negCopyId = ctx.regCopy(negPrompt);
    html += '    <div class="deck-output-box">';
    html += '      <div class="dob-head">';
    html += '        <span class="dob-badge">通用防翻车负面词 (Negative)</span>';
    html += '        <button class="btn ghost btn-sm btn-copy" data-copy="' + negCopyId + '" data-copy-id="' + negCopyId + '">复制负面词</button>';
    html += '      </div>';
    html += '      <div class="dob-code text-muted" id="boxNegPrompt">' + ctx.esc(negPrompt) + '</div>';
    html += '    </div>';

    html += '  </div>'; /* /pg-deck-card */
    html += '</div>'; /* /pg-deck-col */

    html += '</div>'; /* /pg-main-grid */

    return html;
  }

  /* 渲染我的收藏列表 */
  function renderFavorites(favs) {
    var html = '<div class="card pg-favs-card">';
    html += '  <div class="card-head-line">';
    html += '    <h3 class="c-title">⭐ 我的自制提示词配方库 (' + favs.length + ')</h3>';
    html += '    <button class="btn ghost btn-sm" id="btnClearFavs">清空收藏夹</button>';
    html += '  </div>';

    if (!favs || !favs.length) {
      html += '<div class="empty-tip-box" style="padding: 40px 20px; text-align: center; color: var(--tx3);">';
      html += '  <div style="font-size: 32px; margin-bottom: 8px;">📭</div>';
      html += '  <div>暂无保存的提示词，快去「积木拼装工作台」制作并点击“保存到收藏”吧！</div>';
      html += '</div>';
    } else {
      html += '<div class="favs-grid">';
      favs.forEach(function (f, idx) {
        var copyId = ctx.regCopy(f.cn);
        html += '  <div class="card fav-item-card">';
        html += '    <div class="fic-head">';
        html += '      <div class="fic-title">配方 #' + (idx + 1) + ' · ' + ctx.esc(f.name || '自制漫剧镜头') + '</div>';
        html += '      <div class="fic-actions">';
        html += '        <button class="btn ghost btn-sm btn-copy" data-copy="' + copyId + '" data-copy-id="' + copyId + '">复制</button>';
        html += '        <button class="btn ghost btn-sm btn-del-fav" data-del-idx="' + idx + '">删除</button>';
        html += '      </div>';
        html += '    </div>';
        html += '    <div class="fic-content">' + ctx.esc(f.cn) + '</div>';
        html += '    <div class="fic-meta"><span class="pill pill-sm">' + ctx.esc(f.time || '') + '</span></div>';
        html += '  </div>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /* 事件绑定 */
  function bindEvents(container) {
    if (!container) return;

    container.addEventListener('click', function (e) {
      /* 切换工作台/收藏夹 Tab */
      var tabBtn = e.target.closest('[data-pgtab]');
      if (tabBtn) {
        st.activeTab = tabBtn.dataset.pgtab;
        render(container, ctx);
        return;
      }

      /* 积木卡片点击选择 */
      var blkCard = e.target.closest('.block-card');
      if (blkCard) {
        var bType = blkCard.dataset.blockType;
        var bId = blkCard.dataset.blockId;
        if (bType === 'style') st.styleId = bId;
        if (bType === 'shot') st.shotId = bId;
        if (bType === 'lighting') st.lightingId = bId;
        if (bType === 'emotion') st.emotionId = bId;

        /* 更新高亮 */
        blkCard.parentElement.querySelectorAll('.block-card').forEach(function (c) { c.classList.remove('active'); });
        blkCard.classList.add('active');
        refreshOutputDeck();
        return;
      }

      /* 载入经典爆款配方 */
      var recBtn = e.target.closest('[data-load-recipe]');
      if (recBtn) {
        loadRecipe(recBtn.dataset.loadRecipe, container);
        return;
      }

      /* 快捷填入标签 */
      var tagSub = e.target.closest('[data-fill-sub]');
      if (tagSub) {
        st.subject = tagSub.dataset.fillSub;
        var inpSub = document.getElementById('inpSubject');
        if (inpSub) inpSub.value = st.subject;
        refreshOutputDeck();
        return;
      }

      var tagAct = e.target.closest('[data-fill-act]');
      if (tagAct) {
        st.action = tagAct.dataset.fillAct;
        var inpAct = document.getElementById('inpAction');
        if (inpAct) inpAct.value = st.action;
        refreshOutputDeck();
        return;
      }

      var tagEnv = e.target.closest('[data-fill-env]');
      if (tagEnv) {
        st.environment = tagEnv.dataset.fillEnv;
        var inpEnv = document.getElementById('inpEnv');
        if (inpEnv) inpEnv.value = st.environment;
        refreshOutputDeck();
        return;
      }

      /* 随机灵感掷骰子 */
      if (e.target.id === 'btnRollDice') {
        rollDice(container);
        return;
      }

      /* 清空重置 */
      if (e.target.id === 'btnResetBlocks') {
        st.subject = '';
        st.action = '';
        st.environment = '';
        var isub = document.getElementById('inpSubject'); if (isub) isub.value = '';
        var iact = document.getElementById('inpAction'); if (iact) iact.value = '';
        var ienv = document.getElementById('inpEnv'); if (ienv) ienv.value = '';
        refreshOutputDeck();
        if (ctx && ctx.toast) ctx.toast('已清空主体与动作描述');
        return;
      }

      /* 保存到收藏夹 */
      if (e.target.id === 'btnSaveToFav') {
        saveCurrentToFav();
        return;
      }

      /* 删除单个收藏 */
      var delBtn = e.target.closest('.btn-del-fav');
      if (delBtn) {
        var idx = +delBtn.dataset.delIdx;
        var favList = getFavs();
        favList.splice(idx, 1);
        saveFavs(favList);
        render(container, ctx);
        if (ctx && ctx.toast) ctx.toast('已删除该提示词收藏');
        return;
      }

      /* 清空所有收藏 */
      if (e.target.id === 'btnClearFavs') {
        if (confirm('确定要清空全部自制提示词收藏吗？')) {
          saveFavs([]);
          render(container, ctx);
          if (ctx && ctx.toast) ctx.toast('已清空全部收藏');
        }
        return;
      }
    });

    /* 文本输入框监听 */
    container.addEventListener('input', function (e) {
      if (e.target.id === 'inpSubject') st.subject = e.target.value;
      if (e.target.id === 'inpAction') st.action = e.target.value;
      if (e.target.id === 'inpEnv') st.environment = e.target.value;
      refreshOutputDeck();
    });
  }

  /* 刷新右侧成果预览 */
  function refreshOutputDeck() {
    var boxCn = document.getElementById('boxCnPrompt');
    var boxEn = document.getElementById('boxEnPrompt');
    var boxNeg = document.getElementById('boxNegPrompt');

    var cnText = assembleCnPrompt();
    var enText = assembleEnPrompt();
    var negText = assembleNegativePrompt();

    if (boxCn) boxCn.textContent = cnText;
    if (boxEn) boxEn.textContent = enText;
    if (boxNeg) boxNeg.textContent = negText;

    /* 更新复制按钮 */
    if (boxCn && boxCn.parentElement) {
      var btnCn = boxCn.parentElement.querySelector('.btn-copy');
      if (btnCn) {
        var idCn = ctx.regCopy(cnText);
        btnCn.dataset.copy = idCn;
        btnCn.dataset.copyId = idCn;
      }
    }
    if (boxEn && boxEn.parentElement) {
      var btnEn = boxEn.parentElement.querySelector('.btn-copy');
      if (btnEn) {
        var idEn = ctx.regCopy(enText);
        btnEn.dataset.copy = idEn;
        btnEn.dataset.copyId = idEn;
      }
    }
    if (boxNeg && boxNeg.parentElement) {
      var btnNeg = boxNeg.parentElement.querySelector('.btn-copy');
      if (btnNeg) {
        var idNeg = ctx.regCopy(negText);
        btnNeg.dataset.copy = idNeg;
        btnNeg.dataset.copyId = idNeg;
      }
    }
  }

  /* 载入经典配方 */
  function loadRecipe(recId, container) {
    var pStudio = (DBX && DBX.promptStudio) || {};
    var recipes = pStudio.recipes || [];
    var rec = recipes.find(function (r) { return r.id === recId; });
    if (!rec) return;

    st.styleId = rec.style;
    st.shotId = rec.shot;
    st.lightingId = rec.lighting;
    st.emotionId = rec.emotion;
    st.subject = rec.subject;
    st.action = rec.action;
    st.environment = rec.bg;

    render(container, ctx);
    if (ctx && ctx.toast) ctx.toast('✨ 已载入经典配方：' + rec.name);
  }

  /* 随机灵感掷骰子 */
  function rollDice(container) {
    var pStudio = (DBX && DBX.promptStudio) || {};
    function pick(arr) { return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }

    var s = pick(pStudio.styles);
    var sh = pick(pStudio.shots);
    var l = pick(pStudio.lighting);
    var em = pick(pStudio.emotions);

    if (s) st.styleId = s.id;
    if (sh) st.shotId = sh.id;
    if (l) st.lightingId = l.id;
    if (em) st.emotionId = em.id;

    var subjects = [
      '银白凌乱碎发少年剑客，眼眸如寒冰，手执无鞘古剑',
      '身披墨黑风衣的赛博刺客，半边面孔覆盖战术全息义体',
      '一袭素白华丽长裙的女帝，头戴琉璃凤冠，眼波流转带杀意',
      '浴血重装铠甲的巨盾守卫，满脸伤疤与烟尘，死守城门'
    ];
    var actions = [
      '凌空挥剑斩出漫天雷暴，剑气在半空中撕开虚空裂缝',
      '冷酷斜睨一眼倒地的敌人，随手将刀刃归入鞘中',
      '双手合十催动万丈法阵，刺目光华在掌心爆发',
      '从倾斜的霓虹高楼顶端纵身跃下，展开黑羽滑翔翼'
    ];
    var envs = [
      '残破悬崖绝壁上的九天雷云，天崩地裂的碎石漂浮在半空',
      '暴雨如注的未来赛博贫民窟街道，霓虹倒映在深浅积水里',
      '静谧而充满杀机的深宫白玉台阶，落雪飘零如柳絮',
      '浩瀚无垠的金色黄沙大漠，巨兽骸骨在残阳下拉出长影'
    ];

    st.subject = pick(subjects);
    st.action = pick(actions);
    st.environment = pick(envs);

    render(container, ctx);
    if (ctx && ctx.toast) ctx.toast('🎲 已为您摇出一套高张力全新灵感组合！');
  }

  /* 保存当前配方到本地收藏 */
  function saveCurrentToFav() {
    var cnPrompt = assembleCnPrompt();
    var enPrompt = assembleEnPrompt();
    var pStudio = (DBX && DBX.promptStudio) || {};
    var sObj = (pStudio.styles || []).find(function (x) { return x.id === st.styleId; }) || {};

    var favItem = {
      name: (sObj.name || '自制') + ' · ' + (st.subject.slice(0, 10) || '特写镜头'),
      cn: cnPrompt,
      en: enPrompt,
      time: new Date().toLocaleDateString()
    };

    var favs = getFavs();
    favs.unshift(favItem);
    if (favs.length > 50) favs = favs.slice(0, 50);
    saveFavs(favs);

    if (ctx && ctx.toast) ctx.toast('⭐ 成功存入「我的提示词收藏」！');
  }

  /* 自注册模块定义 */
  var mod = {
    id: MOD_ID,
    icon: '🪄',
    name: '提示词工坊',
    cnt: '积木拼装',
    after: 'consistency',
    hub: 'hub2',
    sub: [
      'AI漫剧提示词工坊 · 视觉积木构建',
      '可视化选择画风、景别机位、光影氛围与情绪神态，一键输出即梦/可灵中文通用版与 Midjourney 英文专业版，支持经典配方与个人收藏。'
    ],
    search: [
      { tit: '提示词工坊 · 积木构建', txt: 'AI 漫剧提示词生成器：画风预设、景别机位、光影氛围、面部神态、主体动作拼装与多平台导出' },
      { tit: '经典爆款提示词配方', txt: '仙侠一剑开天、都市龙王打脸、赛博雨夜潜行、深宫黑化复仇、废土机甲单挑经典模板' },
      { tit: 'Midjourney 英文增强 Prompt', txt: '自动组装 --ar 9:16 --v 6.1 --style raw 参数，电影级体积光、伦勃朗侧光、特写微表情' }
    ],
    render: render
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    window.MJ.addModule(mod);
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod);
  }
})();
