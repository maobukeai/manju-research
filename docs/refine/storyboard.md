# 细化方案：分镜板

> 目标模块：`storyboard`（分镜板工作台）· 唯一改动文件：`js/feat-storyboard.js`（外挂模块，558 行）
> 补丁体量：+211 行 / −6 行（6 行均为 1:1 原位改写），完整代码块合计约 340 行，可审可落地。
> 本版为**复核修订版（v2）**。已在临时副本上重新验证：`node --check` 语法通过；`git diff --no-index` 审计确认差异仅含本方案改动（+211/−6，6 行均为 1:1 原位改写）；针对真实 `js/data.js` 跑通 35 项断言（复核落点静态核对 5 项 / 模板数据完整性与 segs 镜数区间 14 项 / 护栏逻辑 8 项 / 台词表与交接单文本 5 项 / matchCamera 回归 1 项 / 模块注册与 search 口径 2 项），全部通过。验证脚本为一次性临时文件、未入库——复核方可按第三节锚点装配补丁后用 `node --check` 与 `git diff` 自行复验。

## 一、现状盘点

**模块形态**：`js/feat-storyboard.js` 单 IIFE 自注册外挂（`id: 'storyboard'`，`after: 'llm'`），是「大模型应用」静态分镜 JSON 模板的工作台化。编辑器型模块（`cnt: '编辑器'`），不设传统条目列表，其「数据区」= 模块内常量 + 注册元数据。

**既有能力**（8 个动作）：添加镜头 / 上移 / 下移 / 删除 / 载入示例分镜 / 导出 JSON / 清空（二次确认）/ 卡头折叠；每镜 4 字段（运镜 / 时长 / 台词 / 画面描述）+ fold；实时统计区（总镜数、总时长、98 秒六段分布条、逐段「计划 vs 参考」、超 98s 红警）；`manju_storyboard_v1` 本地持久化；导出对齐 `DB.llm.jsonExample` 的 shot 级核心 5 字段（shot_id / camera_move / duration_sec / action / dialogue）。

**消费的 DB 数据**（均有依赖，全部不动）：`DB.cameras` 21 档（16 基础运镜 + 5 个对话戏专用档，m 键有复用）、`DB.camRules` 6 条、`DB.camTalkRules` 8 条、`DB.camEmoMap` 8 条、`DB.llm.fullEpisode` 10 镜 92 秒完整示例、`DB.llm.jsonExample`、`DB.hot.episodeMap`（total 98 + segs 6 段，各段镜数参考区间：钩子 1-2 / 冲突 4-6 / 铺垫 10-14 / 反转 3-5 / 爽点 6-9 / 卡点 3-5）。

**模块自身数据区现状**：仅 `CAM_ALIAS` 16 组运镜别名 + `mod.search` 3 条。——这是全模块最薄处：工作台内部没有任何可学习的参考内容与口径护栏，用户必须自己记住散落在「运镜宝典」「爆款心法」「数字人口型表演」等模块里的口径（单镜 2-6 秒、台词单句≤15 字、相邻镜号避免相同景别……），编辑时零反馈。

**缺口清单**（按严重度）：
1. **无口径护栏**：编辑时对超长镜、超字台词、相邻同景别、台词镜配重运镜等一律不提示——研究档案里的避坑口径没有被工具化；
2. **缺「景别」字段**：分镜表核心字段（research/02 §阶段3：分镜表 11 字段含景别；避坑「不标景别→PPT感」），板内也无法做相邻景别自查；
3. **缺面向工序的轻量交接物**：导出 JSON 面向机器；「先配音后驱动画面」的配音工序（research/19 §A1.2）和多人交接（research/18 §2.4 分镜表交接）都没有可复制的文本产物；
4. **空板起步成本高**：示例只有「战神归来」整装一集，没有按六段结构逐段起步的骨架模板。

**交互层现状**：render-once + section 内事件委托，结构清晰；增强空间集中在工具条与统计区，不动公共设施即可完成。注意一处既有行为：`onEdit`（js/feat-storyboard.js:425-427）只对 dur/cam 编辑调 `refreshStats()`，line/desc 编辑仅 `persist()`——本补丁新增的护栏与复制按钮依赖 line/size 字段，故必须同步该分支（见变更⑦）。

## 二、变更清单（逐条，含出处）

**复核修订记录（相对初版 v1）**：① 变更⑦新增 onEdit else 分支补 `refreshStats()`——否则台词/景别/画面编辑后护栏与两个复制按钮不更新（台词表按钮在空板搭板流程中不可达、已启用时复制到陈旧内容）；② 段落模板扩到 segs 镜数参考区间内（递进铺垫 5→10 镜、爽点释放 3→6 镜，整集骨架 20镜52.5s→**28镜76.5s**），代码注释与全部文案改为如实口径；③ actAdd/actSample 镜头对象补 `size: ''`（与 restore/模板插入同构）；④ 「接缝补1-2帧」出处由 §A1.2 改挂 §A6 行动清单1（research/19:166）；⑤ 护栏④注明为「从严可执行化」（原文仅禁快速环绕）；⑥ 六段速查块移出统计容器静态挂载，避免 `refreshStats` 重建 innerHTML 丢失 `<details>` 展开态。

| # | 变更 | 类型 | 出处 |
|---|---|---|---|
| ① | 文件头注释同步（补「景别」、shots 结构注释） | 文档性 | 本方案 |
| ② | 新增 8 个 `mjxStoryboard*` 工具函数：景别选项 / 护栏检查 / 护栏渲染块 / 六段速查块 / 模板时长 / 模板插入 / 台词表文本 / 交接单文本 | 交互+实用度 | 见第三节与第四节逐条 |
| ③ | 新增模块级数据区：`mjxStoryboardSizes`（景别四档）、`mjxStoryboardSegTpl`（六段整集骨架模板，**28镜76.5s**，各段镜数落在 segs「X-Y镜」参考区间内）+ 2 个复制内容缓存变量 | 内容加深 | 景别四档：research/02 §阶段3 + data.js:913；模板：data.js:1121-1126 segs（镜数区间/段窗/cams/task）+ research/02「节奏公式」+ research/12 §二§三（逐镜出处见第四节） |
| ④ | `restore()` 增加 `size` 字段（旧档自动补空串，向后兼容） | 交互 | research/02 §阶段3（分镜表含景别） |
| ⑤ | `fieldsHTML()` 每镜增加「景别」下拉 | 交互 | 同上 |
| ⑥ | 统计区新增**护栏检查**块（五项口径实时体检；④为从严可执行化，见第五节#4） | 实用度 | ①单镜2-6秒：data.js:922/1049；②台词单句≤15字：research/12 §五 + data.js:898，长句拆2-3段：research/19 §A1.2/§A6；③相邻镜号避免相同景别：research/12 §四 + data.js:1123；④台词镜头只用安全运镜：data.js:446 + research/19 §A2.1 防崩七步（原文仅禁快速环绕，从严说明见第五节#4）；⑤甩镜一集≤3次：data.js:458（原文自带【经验】标注） |
| ⑦ | `refreshStats()` 挂台词表/交接单按钮的可用态与复制内容同步；**onEdit else 分支补 `refreshStats()`**（line/size/desc 编辑即时刷新护栏与按钮；refreshStats 不重绘 #sbList，textarea 焦点不受影响） | 交互（复核修订） | 本方案（修复复核意见#1） |
| ⑧ | `bindEvents()` 增加模板插入分支 | 交互 | 本方案 |
| ⑨ | `injectStyle()` 新增 21 条 CSS（全部 `mjx-storyboard-` 前缀） | 交互 | 本方案（配色取自 css/style.css 既有变量与同色系 rgba） |
| ⑩ | `mod.search` 由 3 条增至 5 条（同结构 `{tit, txt}`，口径 28镜76.5s） | 内容加深 | 对应上述新增功能 |
| ⑪ | `mod.render` 整函数替换：工具条加模板选择器与两个复制按钮；**六段速查块挂载在统计容器之后**（静态 DB 内容渲染一次，不随 `refreshStats` 重建，展开态不丢）；导出说明补一句 | 交互 | data.js:1121-1126（速查块数据源）；本方案（速查挂载位置修复复核意见#6） |
| ⑫ | `actAdd()` / `actSample()` 镜头对象补 `size: ''`（与 restore/模板插入产出的对象同构） | 结构一致（复核修订） | research/02 §阶段3 |

**护栏口径声明**：五项护栏全部是对站内既有口径的**可执行化**，无一条新造数字；「甩镜一集≤3次」在原出处即标注【经验】，告警文案保留该标注。其中护栏④在代码里无法区分快慢环绕，故对 orbit+台词一律提示——这是按 camTalkRules 第5条前半句「只用安全运镜」的**从严读法**（原文 data.js:446 与 research/19:56 仅禁「快速环绕、甩镜、大幅转头」），已在第五节#4 单列供内容负责人确认。

**导出契约声明**：导出 JSON 仍是核心 5 字段，`景别` 只用于板内自查与交接单、**不进导出**——data.js:1049 compatNote 载明 `shot_size` 属于 LLM 扩写补齐的 6 字段，补丁不破坏该契约（导出说明文案已补一句说明）。

## 三、落点与代码

以下 12 处改动全部落在 **`js/feat-storyboard.js`**。每处给出：锚点（改动前的现有代码，精确匹配）→ 完整可粘贴代码。除下列 12 处外不得改动该文件其他任何内容；`js/`、`css/`、`index.html`、`sw.js`、`research/` 其余文件一律不动。

### 变更① 文件头注释同步（2 行小改）

锚点 1（第 8 行）：
```js
     ② 逐镜标注运镜 / 时长 / 台词 / 画面描述；
```
改为：
```js
     ② 逐镜标注运镜 / 景别 / 时长 / 台词 / 画面描述；
```

锚点 2（第 20 行）：
```js
  let shots = [];                           // [{ id, cam, dur, line, desc, fold }]
```
改为：
```js
  let shots = [];                           // [{ id, cam, size, dur, line, desc, fold }]
```

### 变更② 新增 8 个工具函数（插在 `idxOf` 之后）

锚点（第 46 行）：
```js
  function idxOf(uid) { return uid ? shots.findIndex((s) => s.id === uid) : -1; }
```
在该行之后插入（原行保留）：
```js

  /* ---------- 增补：景别选项 / 护栏检查 / 段落模板 / 交接文本（细化补丁 2026-10） ---------- */
  function mjxStoryboardSizeOptions(sel) {
    let h = '<option value=""' + (sel ? '' : ' selected') + '>景别 · 未标注</option>';
    mjxStoryboardSizes.forEach((z) => {
      h += '<option value="' + z + '"' + (sel === z ? ' selected' : '') + '>' + z + '</option>';
    });
    return h;
  }
  function mjxStoryboardGuards() {
    const out = [];
    let whipN = 0;
    shots.forEach((s, i) => {
      const no = '镜' + (i + 1);
      const d = clampDur(s.dur);
      if (d > 6) out.push(no + ' 时长 ' + fmtDur(d) + '：超出单镜 2-6 秒区间——拆镜或压时长，超长镜易漂移');
      const ln = String(s.line || '').trim();
      if (ln) {
        const k = ln.indexOf('：') >= 0 ? '：' : (ln.indexOf(':') >= 0 ? ':' : '');
        const body = k ? ln.slice(ln.indexOf(k) + k.length) : ln;
        if (body.trim().length > 15) out.push(no + ' 台词单句超 15 字：「先配音后驱动画面」流程下，长句先拆 2-3 段');
        if (s.cam === 'whip' || s.cam === 'orbit') out.push(no + ' 有台词却配甩镜/环绕：台词镜头只用安全运镜（慢推、轻微视差、微手持）');
      }
      if (s.cam === 'whip') whipN++;
      if (s.size && i > 0 && shots[i - 1].size === s.size) out.push('镜' + i + '→' + no + ' 景别相同（' + s.size + '）：相邻镜号避免相同景别，否则「PPT感」');
    });
    if (whipN > 3) out.push('甩镜共 ' + whipN + ' 次：一集别超 3 次【经验口径】，重音多了会钝');
    return out;
  }
  function mjxStoryboardGuardsBlock() {
    if (!shots.length) return '';
    const list = mjxStoryboardGuards();
    return '<div class="mjx-storyboard-guards">' +
      '<div class="mjx-storyboard-guardst">护栏检查 <span class="sub">口径：单镜2-6秒 · 台词单句≤15字 · 相邻镜号避免相同景别 · 台词镜头只用安全运镜 · 甩镜一集≤3次</span></div>' +
      (list.length
        ? list.map((g) => '<div class="mjx-storyboard-guard">⚠ ' + ctx.esc(g) + '</div>').join('')
        : '<div class="mjx-storyboard-guard ok">✓ 五项护栏全部通过</div>') +
      '</div>';
  }
  function mjxStoryboardCheatHTML() {
    return '<details class="mjx-storyboard-cheat"><summary>六段拍摄速查 · 每段的常用运镜与要点（运行时取自「爆款心法」结构沙盘，本页不另存口径）</summary>' +
      DB.hot.episodeMap.segs.map((sg) =>
        '<div class="mjx-storyboard-cheatrow"><b>' + ctx.esc(sg.n) + '</b><span class="t">' + ctx.esc(sg.t) + '</span>' +
        '<span class="c">常用运镜：' + ctx.esc(sg.cams) + '</span><span class="k">' + ctx.esc(sg.tip) + '</span></div>').join('') +
      '</details>';
  }
  function mjxStoryboardTplDur(which) {
    const gs = which === 'all' ? mjxStoryboardSegTpl : [mjxStoryboardSegTpl[which]];
    return fmtDur(gs.reduce((a, g) => a + g.shots.reduce((x, s) => x + clampDur(s.dur), 0), 0));
  }
  function mjxStoryboardInsertTpl() {
    const sel = root.querySelector('#mjxStoryboardTplSel');
    if (!sel || sel.value === '') { ctx.toast('先在下拉里选一段模板（或整集骨架）'); return; }
    const groups = sel.value === 'all' ? mjxStoryboardSegTpl : [mjxStoryboardSegTpl[+sel.value]];
    if (!groups || !groups.length) { ctx.toast('模板数据异常'); return; }
    const added = [];
    groups.forEach((g) => g.shots.forEach((t) => {
      if (!DB.cameras.some((c) => c.m === t.cam)) return;
      added.push({
        id: newUid(), cam: t.cam,
        size: mjxStoryboardSizes.indexOf(t.size) >= 0 ? t.size : '',
        dur: clampDur(t.dur), line: '', desc: t.desc, fold: false,
      });
    }));
    if (!added.length) { ctx.toast('模板运镜档位异常，未插入'); return; }
    shots = shots.concat(added);
    persist(); renderAll();
    ctx.toast('已插入「' + (sel.value === 'all' ? '整集骨架' : groups[0].name) + '」模板 ' + added.length + ' 镜——追加在末尾，时长与描述可继续改');
    try {
      const list = root.querySelector('#sbList');
      if (list && list.lastElementChild) list.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } catch (e) { /* 忽略滚动 */ }
  }
  function mjxStoryboardDialogueText() {
    const rows = [];
    shots.forEach((s, i) => {
      const ln = String(s.line || '').trim();
      if (!ln) return;
      const k = ln.indexOf('：') >= 0 ? '：' : (ln.indexOf(':') >= 0 ? ':' : '');
      const sp = k ? ln.slice(0, ln.indexOf(k)).trim() : '';
      const tx = k ? ln.slice(ln.indexOf(k) + k.length).trim() : ln;
      rows.push('S' + (i + 1 < 10 ? '0' : '') + (i + 1) + '｜' + (sp || '（未标说话人）') + '｜' + tx);
    });
    if (!rows.length) return '';
    return ['【台词表】共 ' + rows.length + ' 句 · 供「先配音、后驱动画面」使用（长句拆2-3段、接缝补1-2帧）']
      .concat(rows).join('\n');
  }
  function mjxStoryboardShotlistText() {
    if (!shots.length) return '';
    const rows = shots.map((s, i) => 'S' + (i + 1 < 10 ? '0' : '') + (i + 1) +
      '｜' + (camName(s.cam) || '未指定') +
      '｜' + fmtDur(clampDur(s.dur)) +
      '｜' + (s.size || '—') +
      '｜' + String(s.desc || '').replace(/\s*\n\s*/g, ' '));
    return ['【分镜交接单】' + shots.length + ' 镜 · 合计 ' + fmtDur(totalDur()) + ' · 字段：镜号｜运镜｜时长｜景别｜画面（13字段分镜表的轻量交接版）']
      .concat(rows).join('\n');
  }
```

### 变更③ 新增模块级数据区（插在 `CAM_ALIAS` 之后）

锚点（第 65-67 行）：
```js
    ['static', ['固定', '静止', '机位']],
  ];
  function matchCamera(raw) {
```
改为（前三行保留，中间插入数据区）：
```js
    ['static', ['固定', '静止', '机位']],
  ];

  /* ---------- 增补数据区（细化补丁 2026-10）----------
     mjxStoryboardSizes：景别四档，取自 DB.llm.promptTemplate「特写|近景|中景|远景」（data.js:913）；
     mjxStoryboardSegTpl：段落模板——把 DB.hot.episodeMap.segs 六段结构固化成可一键插入的整集骨架：
     每段镜数取 segs「X-Y镜」参考区间内（钩子2∈1-2 / 冲突4∈4-6 / 铺垫10∈10-14 / 反转3∈3-5 /
     爽点6∈6-9 / 卡点3∈3-5，合计28镜），秒数取段窗口内的编排值（铺垫10镜×3s恰好铺满30s段窗，
     全骨架76.5s＜98s预算，余量留给用户加镜/加秒）；运镜取 segs.cams 档位，描述为 segs.task 的执行化改写。
     来源：research/02-开发流程与爆款方法论.md「节奏公式」；research/12-剧本创作与网文改编实操.md §二§三。 */
  let mjxStoryboardLastLines = '';          // 台词表复制内容缓存（去重注册 regCopy）
  let mjxStoryboardLastList = '';           // 交接单复制内容缓存
  const mjxStoryboardSizes = ['特写', '近景', '中景', '远景'];
  const mjxStoryboardSegTpl = [
    { name: '黄金钩子', shots: [
      { cam: 'zoom', size: '特写', dur: 1.5, desc: '钩子主画面：身份错位/利益威胁/视觉冲击三选一，直接砸脸进冲突' },
      { cam: 'whip', size: '中景', dur: 1.5, desc: '甩镜接环境交代：谁、在哪、什么危机已经发生' },
    ]},
    { name: '冲突建立', shots: [
      { cam: 'static', size: '远景', dur: 3, desc: '对峙定场：交代主角处境与被压迫关系——让观众知道「谁欠了什么」' },
      { cam: 'follow', size: '中景', dur: 3, desc: '跟拍主角入场/回到压迫现场' },
      { cam: 'static', size: '特写', dur: 3, desc: '固定机位反应特写：主角隐忍，蓄住第一口情绪' },
      { cam: 'truck', size: '中景', dur: 3, desc: '横移：压迫方逼近或双方同行，关系张力可视化' },
    ]},
    { name: '递进铺垫', shots: [
      { cam: 'push', size: '近景', dur: 3, desc: '压迫升级：新威胁落到主角身上，情绪再压一格' },
      { cam: 'rack', size: '特写', dur: 3, desc: '伏笔①：道具/细节特写，埋一颗 45-60 秒能回收的种子' },
      { cam: 'push', size: '中景', dur: 3, desc: '推镜蓄力：对峙逼近，情绪再压一格' },
      { cam: 'rack', size: '远景', dur: 3, desc: '插入空镜：环境/物件反应，给一拍呼吸感' },
      { cam: 'push', size: '近景', dur: 3, desc: '关系恶化：盟友动摇/敌人加码（台词单句≤15字）' },
      { cam: 'rack', size: '特写', dur: 3, desc: '伏笔②：另一个可回收细节，反转前最后一次给镜头' },
      { cam: 'push', size: '中景', dur: 3, desc: '逼到墙角：冲突推到爆点前最后一格' },
      { cam: 'rack', size: '近景', dur: 3, desc: '暗示：移焦把观众注意力引向真正的底牌' },
      { cam: 'push', size: '远景', dur: 3, desc: '大势压顶：主角被逼入绝境的全景定场' },
      { cam: 'rack', size: '近景', dur: 3, desc: '伏笔收口：最后一次确认道具/细节（观众已能预感反转）' },
    ]},
    { name: '黄金反转', shots: [
      { cam: 'zoom', size: '特写', dur: 0.5, desc: '反转重音：0.5 秒瞳孔地震式特写，砸在 45-60 秒黄金分割点' },
      { cam: 'dollyzoom', size: '近景', dur: 3, desc: '世界观崩塌具象化：身份/利益/关系三大反转模式选一' },
      { cam: 'whip', size: '中景', dur: 2, desc: '甩镜收全场反应：震惊传导给围观者' },
    ]},
    { name: '爽点释放', shots: [
      { cam: 'truck', size: '近景', dur: 3, desc: '逆袭执行：低角度横移近景，主角开始碾压实景' },
      { cam: 'fpv', size: '远景', dur: 3, desc: '高光奇观：FPV 穿越或子弹时间，纯爽点一镜' },
      { cam: 'truck', size: '中景', dur: 3, desc: '逐个击破：压迫方节节败退，音效重音跟打点' },
      { cam: 'orbit', size: '特写', dur: 3, desc: 'hero shot 环绕定格：音效重音落在运镜落点' },
      { cam: 'truck', size: '近景', dur: 3, desc: '全场臣服：横移扫过俯首的人群' },
      { cam: 'fpv', size: '远景', dur: 3, desc: '收尾高光：一记大场面奇观收住爽点段' },
    ]},
    { name: '卡点留钩', shots: [
      { cam: 'pull', size: '中景', dur: 4, desc: '情绪余韵：台词落地后缓拉，把主角留在空画面里' },
      { cam: 'craneUp', size: '远景', dur: 3, desc: '摇臂升起：新一轮危机/悬念入场' },
      { cam: 'static', size: '特写', dur: 1, desc: '卡点：固定机位定格下一集钩子画面，黑场前最后一格' },
    ]},
  ];
  function matchCamera(raw) {
```

### 变更④ `restore()` 整函数替换（+size 字段，旧档自动补空）

锚点：现有 `function restore() { ... }` 全函数（第 115-133 行），整体替换为：
```js
  function restore() {
    const saved = ctx.store.get(KEY, null);
    const list = saved && Array.isArray(saved.shots) ? saved.shots : [];
    const seen = {};
    shots = list.map((s) => {
      if (!s || typeof s !== 'object') return null;
      let id = String(s.id || '');
      if (!id || seen[id]) id = newUid();
      seen[id] = true;
      return {
        id: id,
        cam: DB.cameras.some((c) => c.m === s.cam) ? s.cam : '',
        size: mjxStoryboardSizes.indexOf(s.size) >= 0 ? s.size : '',
        dur: clampDur(s.dur),
        line: String(s.line || ''),
        desc: String(s.desc || ''),
        fold: !!s.fold,
      };
    }).filter(Boolean);
  }
```

### 变更⑤ `fieldsHTML()` 整函数替换（+景别行）

锚点：现有 `function fieldsHTML(s) { ... }` 全函数（第 188-194 行），整体替换为：
```js
  function fieldsHTML(s) {
    return '<label class="sb-f"><span class="sb-fl">运镜</span><select data-sb-field="cam">' + camOptions(s.cam) + '</select></label>' +
      '<label class="sb-f"><span class="sb-fl">景别</span><select data-sb-field="size">' + mjxStoryboardSizeOptions(s.size) + '</select></label>' +
      '<label class="sb-f sb-f-dur"><span class="sb-fl">时长</span><span class="sb-dur-wrap">' +
      '<input type="number" data-sb-field="dur" min="0" step="0.5" value="' + ctx.esc(String(clampDur(s.dur))) + '"><i>秒</i></span></label>' +
      '<label class="sb-f"><span class="sb-fl">台词</span><textarea data-sb-field="line" rows="2" placeholder="说话人：台词 —— 用「：」分隔说话人，导出时拆为 speaker / line">' + ctx.esc(s.line) + '</textarea></label>' +
      '<label class="sb-f"><span class="sb-fl">画面描述</span><textarea data-sb-field="desc" rows="3" placeholder="这一镜的动作、表情与构图要点（导出为 action 字段）">' + ctx.esc(s.desc) + '</textarea></label>';
  }
```
说明：`onEdit` 的字段分发见变更⑦（else 分支须同步刷新）；`persist()` 存整对象，新字段自动入库，旧存档经变更④补默认值。

### 变更⑥ 统计区接入护栏块（statsHTML 尾部）

锚点（第 259-270 行，`let verdict;` 起、`return` 结尾）：
```js
    let verdict;
    if (!shots.length) verdict = '<span class="sb-verdict zero">尚无镜头 —— 添加或载入示例后，这里实时汇总并映射六段结构</span>';
    else if (over) verdict = '<span class="sb-verdict over">⚠ 总时长 ' + fmtDur(plan.total) + '，超出 ' + BUDGET + ' 秒基准 ' + fmtDur(plan.total - BUDGET) + '——按「爆款心法」压回 98 秒-2 分钟区间</span>';
    else verdict = '<span class="sb-verdict ok">✓ 在 ' + BUDGET + ' 秒预算内，余 ' + fmtDur(BUDGET - plan.total) + '</span>';
    return '<h5>实时统计 <span class="sub">总时长按秒映射「' + ctx.esc(String(DB.hot.episodeMap.total)) + '秒单集六段结构」· 对照「爆款心法」结构沙盘</span></h5>' +
      '<div class="sb-stats-row">' +
      '<span class="sb-stat"><b>' + shots.length + '</b>镜</span>' +
      '<span class="sb-stat' + (over ? ' over' : '') + '"><b>' + fmtDur(plan.total) + '</b>/' + BUDGET + 's</span>' +
      verdict + '</div>' +
      '<div class="sb-tl">' + zones + '</div>' +
      '<div class="sb-tl-cap"><span>0s</span><span>' + (over ? BUDGET + 's 基准 → 超出 ' + fmtDur(plan.total - BUDGET) : BUDGET + 's') + '</span></div>' +
      '<div class="sb-seg-rows">' + rows + '</div>';
```
改为：
```js
    let verdict;
    if (!shots.length) verdict = '<span class="sb-verdict zero">尚无镜头 —— 添加或载入示例后，这里实时汇总并映射六段结构</span>';
    else if (over) verdict = '<span class="sb-verdict over">⚠ 总时长 ' + fmtDur(plan.total) + '，超出 ' + BUDGET + ' 秒基准 ' + fmtDur(plan.total - BUDGET) + '——按「爆款心法」压回 98 秒-2 分钟区间</span>';
    else verdict = '<span class="sb-verdict ok">✓ 在 ' + BUDGET + ' 秒预算内，余 ' + fmtDur(BUDGET - plan.total) + '</span>';
    const guards = mjxStoryboardGuardsBlock();
    return '<h5>实时统计 <span class="sub">总时长按秒映射「' + ctx.esc(String(DB.hot.episodeMap.total)) + '秒单集六段结构」· 对照「爆款心法」结构沙盘</span></h5>' +
      '<div class="sb-stats-row">' +
      '<span class="sb-stat"><b>' + shots.length + '</b>镜</span>' +
      '<span class="sb-stat' + (over ? ' over' : '') + '"><b>' + fmtDur(plan.total) + '</b>/' + BUDGET + 's</span>' +
      verdict + '</div>' +
      '<div class="sb-tl">' + zones + '</div>' +
      '<div class="sb-tl-cap"><span>0s</span><span>' + (over ? BUDGET + 's 基准 → 超出 ' + fmtDur(plan.total - BUDGET) : BUDGET + 's') + '</span></div>' +
      '<div class="sb-seg-rows">' + rows + '</div>' + guards;
```
说明：护栏随 `refreshStats` 重建（依赖变更⑦的 onEdit 同步，台词/景别编辑后护栏②③即时更新）。**六段速查 `<details>` 不放进 #sbStats**——`refreshStats` 每次编辑都整块重建 `box.innerHTML`（js/feat-storyboard.js:275），放里面展开态会丢；速查块改为静态挂载，见变更⑪。

### 变更⑦ `refreshStats()` 整函数替换 + onEdit 同步刷新（复核修订）

锚点 1：现有 `function refreshStats() { ... }` 全函数（第 272-295 行），整体替换为：
```js
  function refreshStats() {
    const plan = computePlan();
    const box = root.querySelector('#sbStats');
    if (box) box.innerHTML = statsHTML(plan);
    const sub = root.querySelector('#sbListSub');
    if (sub) sub.textContent = shots.length ? '共 ' + shots.length + ' 镜 · 合计 ' + fmtDur(plan.total) + '（点击卡头折叠/展开）' : '尚无镜头';
    /* 时长/运镜编辑不重绘列表（保住输入焦点），各卡头的摘要与时段标签在这里同步刷新 */
    const bounds = plan.bounds;
    let acc = 0;
    shots.forEach((s) => {
      const card = root.querySelector('[data-sb-uid="' + s.id + '"]');
      if (card) {
        const sum = card.querySelector('.sb-sum');
        if (sum) sum.textContent = sumText(s);
        const tag = card.querySelector('.sb-segtag');
        if (tag) {
          const si = segIdxOf(acc, bounds);
          tag.textContent = si < 0 ? '超 98s' : DB.hot.episodeMap.segs[si].n;
          tag.classList.toggle('over', si < 0);
        }
      }
      acc += clampDur(s.dur);
    });
    /* 增补：台词表 / 交接单按钮的复制内容与可用态随编辑实时刷新（细化补丁 2026-10） */
    const lb = root.querySelector('#mjxStoryboardLinesBtn');
    if (lb) {
      const lt = mjxStoryboardDialogueText();
      lb.disabled = !lt;
      if (!lt) { mjxStoryboardLastLines = ''; lb.removeAttribute('data-copy'); }
      else if (lt !== mjxStoryboardLastLines) { mjxStoryboardLastLines = lt; lb.dataset.copy = ctx.regCopy(lt); }
    }
    const ob = root.querySelector('#mjxStoryboardListBtn');
    if (ob) {
      const ot = mjxStoryboardShotlistText();
      ob.disabled = !ot;
      if (!ot) { mjxStoryboardLastList = ''; ob.removeAttribute('data-copy'); }
      else if (ot !== mjxStoryboardLastList) { mjxStoryboardLastList = ot; ob.dataset.copy = ctx.regCopy(ot); }
    }
  }
```
锚点 2（onEdit else 分支，第 427 行；此为复核意见#1 的必改落点——不改则台词/景别/画面编辑后护栏与两个复制按钮均不更新，空板搭板流程中台词表按钮始终禁用、已启用时复制到陈旧内容）：
```js
      else { shots[i][field] = f.value; persist(); }
```
改为：
```js
      else { shots[i][field] = f.value; persist(); refreshStats(); }
```
说明：`refreshStats` 只重建 `#sbStats` 与卡头摘要，不重绘 `#sbList`（js/feat-storyboard.js:272-295 无 `#sbList` 写入），正在输入的 textarea 焦点不受影响，与 dur/cam 分支行为一致。复制内容经 `regCopy` 注册并按文本变化去重，避免每次击键重复注册；空板时按钮禁用并摘除 `data-copy`，防止 `+"" === 0` 误复制注册表 0 号内容。

### 变更⑧ `bindEvents()` 增加模板插入分支

锚点（第 405-406 行）：
```js
        else if (act === 'clear') actClear(btn);
        return;
```
改为：
```js
        else if (act === 'clear') actClear(btn);
        else if (act === 'tpl') mjxStoryboardInsertTpl();
        return;
```

### 变更⑨ `injectStyle()` 新增 CSS（插在既有 `@media` 数组项之前）

锚点（injectStyle 数组内，第 492 行）：
```js
      '@media(max-width:700px){',
```
在该行之前插入以下数组项（原行保留）：
```js
      '/* —— 细化补丁 2026-10：段落模板 / 护栏 / 速查 / 工具条（新增类一律 mjx-storyboard- 前缀） —— */',
      '.mjx-storyboard-tplwrap{display:inline-flex;gap:6px;align-items:center}',
      '.mjx-storyboard-tplsel{background:var(--panel2);border:1px solid var(--line);color:var(--tx);border-radius:12px;font-size:13px;font-family:inherit;padding:9px 10px;outline:none;max-width:220px;cursor:pointer;transition:border-color .14s}',
      '.mjx-storyboard-tplsel:focus{border-color:var(--p1)}',
      '.sb-toolbar .btn.ghost:disabled{opacity:.4;cursor:not-allowed;transform:none}',
      '.mjx-storyboard-guards{margin-top:10px;display:grid;gap:5px}',
      '.mjx-storyboard-guardst{font-size:12.5px;font-weight:800;color:var(--tx)}',
      '.mjx-storyboard-guardst .sub{font-weight:400;font-size:11px;color:var(--tx3)}',
      '.mjx-storyboard-guard{font-size:11.8px;color:#fb7f95;background:rgba(244,63,94,.07);border:1px solid rgba(244,63,94,.25);border-radius:8px;padding:5px 9px;line-height:1.55}',
      '.mjx-storyboard-guard.ok{color:var(--ok);background:rgba(52,211,153,.07);border-color:rgba(52,211,153,.3)}',
      '.mjx-storyboard-cheat{margin-top:10px;border:1px dashed var(--line2);border-radius:10px;overflow:hidden}',
      '.mjx-storyboard-cheat summary{cursor:pointer;padding:8px 12px;font-size:12px;color:var(--tx2);user-select:none;background:var(--panel2)}',
      '.mjx-storyboard-cheat summary:hover{color:var(--tx)}',
      '.mjx-storyboard-cheatrow{display:flex;gap:8px;align-items:baseline;padding:6px 12px;font-size:11.6px;color:var(--tx2);border-top:1px dashed var(--line);flex-wrap:wrap}',
      '.mjx-storyboard-cheatrow b{color:var(--tx);flex:0 0 58px}',
      '.mjx-storyboard-cheatrow .t{color:var(--tx3);font-variant-numeric:tabular-nums;flex:0 0 48px}',
      '.mjx-storyboard-cheatrow .c{color:#5fd4e8;flex:0 0 auto}',
      '.mjx-storyboard-cheatrow .k{flex:1;min-width:160px;color:var(--tx3)}',
      '@media(max-width:700px){',
      '  .mjx-storyboard-tplsel{max-width:150px;flex:1 1 auto}',
      '}',
```

### 变更⑩ `mod.search` 增 2 条（3→5）

锚点（第 518-519 行）：
```js
      { tit: '分镜板工作台 · 六段结构对照', txt: '黄金钩子0-3s、冲突建立3-15s、递进铺垫15-45s、黄金反转45-60s、爽点释放60-80s、卡点留钩80-98s；按镜头秒数画出分布条，逐段对照计划与参考时长。' },
    ],
```
改为：
```js
      { tit: '分镜板工作台 · 六段结构对照', txt: '黄金钩子0-3s、冲突建立3-15s、递进铺垫15-45s、黄金反转45-60s、爽点释放60-80s、卡点留钩80-98s；按镜头秒数画出分布条，逐段对照计划与参考时长。' },
      { tit: '分镜板工作台 · 段落模板与整集骨架', txt: '六段结构一键插入起步镜头组：黄金钩子/冲突建立/递进铺垫/黄金反转/爽点释放/卡点留钩各配推荐运镜、景别与执行要点；整集骨架28镜76.5s，各段镜数落在98秒六段结构参考区间内，余量留给加镜/加秒补足98s。' },
      { tit: '分镜板工作台 · 护栏检查与交接单', txt: '实时护栏五项：单镜2-6秒、台词单句≤15字、相邻镜号避免相同景别、台词镜头只用安全运镜（慢推/轻微视差/微手持）、甩镜一集≤3次；一键复制台词表（先配音后驱动画面）与分镜交接单（镜号/运镜/时长/景别/画面）。' },
    ],
```

### 变更⑪ `mod.render` 整函数替换（工具条 + 复制按钮 + 速查块静态挂载）

锚点：`mod` 对象内现有 `render: function (el, mj) { ... },` 全函数（第 520-550 行），整体替换为：
```js
    render: function (el, mj) {
      ctx = mj;
      root = el;
      injectStyle();
      restore();
      const hasShots = shots.length > 0;
      el.innerHTML =
        '<div class="callout blue"><b>分镜板工作台：</b>「大模型应用」里的分镜 JSON 模板在这里变成可操作的流水线工件——' +
        '增删 / 排序 / 折叠镜头卡，逐镜标注运镜与时长，总时长实时对照 ' + DB.hot.episodeMap.total + ' 秒单集六段结构，' +
        '超时变红告警，最后一键导出可直接喂给生图 / 生视频流水线的 JSON。</div>' +
        '<div class="insp-bar sb-toolbar">' +
        '<button type="button" class="btn pri" data-sb-act="add">＋ 添加镜头</button>' +
        '<span class="mjx-storyboard-tplwrap">' +
        '<select id="mjxStoryboardTplSel" class="mjx-storyboard-tplsel" title="把「爆款心法」六段结构一键插入为起步镜头组">' +
        '<option value="">📐 插入段落模板…</option>' +
        '<option value="all">全部六段 · 整集骨架（' + mjxStoryboardTplDur('all') + '）</option>' +
        mjxStoryboardSegTpl.map((t, i) =>
          '<option value="' + i + '">' + ctx.esc(t.name) + ' · ' + t.shots.length + '镜' + mjxStoryboardTplDur(i) + '</option>').join('') +
        '</select>' +
        '<button type="button" class="btn ghost" data-sb-act="tpl" title="把选中段落模板的镜头追加到分镜板末尾">插入</button>' +
        '</span>' +
        '<button type="button" class="btn ghost" data-sb-act="sample">📥 载入示例分镜</button>' +
        '<button type="button" class="btn ghost" data-sb-act="export">📤 导出 JSON</button>' +
        '<button type="button" class="btn ghost copy-btn" id="mjxStoryboardLinesBtn" disabled title="按镜号顺序复制台词表——「先配音、后驱动画面」工序用">🗒 台词表</button>' +
        '<button type="button" class="btn ghost copy-btn" id="mjxStoryboardListBtn" disabled title="复制轻量交接单：镜号｜运镜｜时长｜景别｜画面">📋 交接单</button>' +
        '<button type="button" class="btn ghost sb-btn-danger" data-sb-act="clear">🗑 清空</button>' +
        '<span class="mini-note" style="margin:0">变更即自动保存 · 刷新无损恢复</span>' +
        '</div>' +
        '<div class="chart-box sb-stats" id="sbStats"></div>' +
        mjxStoryboardCheatHTML() +
        '<h4 class="block-t">分镜卡 <span class="sub" id="sbListSub"></span></h4>' +
        '<div id="sbList"></div>' +
        '<div id="sbExportWrap"' + (hasShots ? '' : ' hidden') + '>' +
        '<h4 class="block-t">导出预览 <span class="sub">镜头数组 · 字段对齐「大模型应用」分镜 JSON 模板</span></h4>' +
        '<div class="codebox"><div class="cb-bar"><span id="sbExpMeta">' + (hasShots ? shots.length + ' 镜 · 合计 ' + fmtDur(totalDur()) + ' · episode 数组' : '') + '</span>' +
        '<button type="button" class="copy-btn" id="sbExpCopy" data-copy="' + (hasShots ? ctx.regCopy(buildExportText()) : '') + '">复制</button></div>' +
        '<pre id="sbExpPre">' + (hasShots ? ctx.esc(buildExportText()) : '') + '</pre></div>' +
        '<p class="mini-note">导出为镜头数组：shot_id / camera_move / duration_sec / action / dialogue{speaker, line}，与「大模型应用」jsonExample 模板同名字段；台词按第一个「：」拆分说话人，无台词导出 null。景别仅用于板内排布自查与交接单，不进导出契约。</p>' +
        '</div>';
      bindEvents(el);
      renderList();
      refreshStats();
    },
```
说明：① 速查块是纯静态 DB 内容（data.js:1121-1126 的 n/t/cams/tip），挂在 `#sbStats` 之后的独立节点、只在 render 时构建一次——`refreshStats` 重建 `#sbStats` 不影响它，`<details>` 展开态不丢（复核意见#6）；② 台词表/交接单按钮**不带** `data-sb-act`，点击冒泡到 app.js 文档级 `[data-copy]` 委托完成复制（app.js:1958-1959，与导出预览「复制」按钮同一机制）；`data-copy` 值由变更⑦在 `refreshStats` 里维持最新。

### 变更⑫ `actAdd()` / `actSample()` 镜头对象补 `size: ''`（结构一致，复核修订）

锚点 1（actAdd 内，第 322 行）：
```js
    const s = { id: newUid(), cam: '', dur: 4, line: '', desc: '', fold: false };
```
改为：
```js
    const s = { id: newUid(), cam: '', size: '', dur: 4, line: '', desc: '', fold: false };
```

锚点 2（actSample 内，第 375-382 行）：
```js
    shots = data.shots.map((s) => ({
      id: newUid(),
      cam: matchCamera(s && s.camera_move),
      dur: clampDur(s && s.duration_sec),
      line: toLine(s && s.dialogue),
      desc: String((s && s.action) || ''),
      fold: false,
    }));
```
改为：
```js
    shots = data.shots.map((s) => ({
      id: newUid(),
      cam: matchCamera(s && s.camera_move),
      size: '',
      dur: clampDur(s && s.duration_sec),
      line: toLine(s && s.dialogue),
      desc: String((s && s.action) || ''),
      fold: false,
    }));
```
说明：读侧本有兜底（`mjxStoryboardSizeOptions` 的 sel 为 undefined 时选中「未标注」、交接单 `s.size || '—'`、护栏 `s.size` 真值判断），此改动使新建/载入/恢复/模板插入四条路径产出的镜头对象同构。

## 四、来源对照表

| 新增内容 | 出处（research 档案 / 站内数据层） |
|---|---|
| 景别四档「特写/近景/中景/远景」 | research/02-开发流程与爆款方法论.md「阶段3 分镜脚本」（分镜表 11 字段含景别；避坑「不标景别→PPT感」）；data.js:913 `promptTemplate`「特写\|近景\|中景\|远景」 |
| 护栏① 单镜 2-6 秒 | data.js:922 `fullEpisodeNote`「单镜2-6秒」、data.js:1049 `compatNote`「单镜时长守2-6秒」（站内既有口径，不改）；告警文案「拆镜」出自 research/12-剧本创作与网文改编实操.md §四「一个镜头塞两个以上事件就要拆镜」 |
| 护栏② 台词单句≤15字 | research/12 §五「台词润色（单句≤15字）」；data.js:898 `promptTemplate` 任务5「台词口语化、单句≤15字」；告警文案「长句先拆 2-3 段」出自 research/19-数字人口型表演与美术风格进阶.md §A1.2「长台词拆 2-3 句再生成」（research/19:29）+ §A6 行动清单1「长句拆 2-3 段」（research/19:166） |
| 护栏③ 相邻镜号避免相同景别 | research/12 §四 镜头连续性规则（CSDN）「相邻镜号避免相同景别」；research/02 §阶段3 避坑；DB.hot.episodeMap.segs 递进铺垫 tip（data.js:1123） |
| 护栏④ 台词镜头只用安全运镜 | data.js:446 `camTalkRules` 第5条「台词镜头只用安全运镜：慢推、轻微视差、微手持；快速环绕、甩镜、大幅转头在角色稳定前禁用」；research/19 §A2.1 防崩七步第2步（research/19:56，同口径）。**执行为从严口径：代码无法区分快慢环绕，orbit+台词一律提示**（原文仅禁「快速环绕」），见第五节#4 |
| 护栏⑤ 甩镜一集≤3次 | data.js:458 `camEmoMap`「反转揭示」tip「甩镜当快切替代品，一集别超3次【经验】」（保留【经验】标注） |
| 段落模板·段名/时间窗/镜数区间/常用运镜 | data.js:1121-1126 `hot.episodeMap.segs`（n/t/shots/cams/task/tip）；research/02-开发流程与爆款方法论.md「节奏公式：黄金3秒钩子+45-60秒反转+卡点留钩」。各段镜数取区间内值：钩子2∈1-2、冲突4∈4-6、铺垫10∈10-14、反转3∈3-5、爽点6∈6-9、卡点3∈3-5（合计28镜，经脚本断言）；铺垫 10镜×3s=30s 恰铺满 15-45s 段窗 |
| 模板·钩子「身份错位/利益威胁/视觉冲击」 | research/12 §二「开场15秒三要素」 |
| 模板·反转「身份/利益/关系三大反转模式」 | research/12 §三「反转三大模式」 |
| 模板·反转 0.5 秒特写 | data.js:1124 segs 黄金反转「反转镜头可短至0.5秒」；research/02 §阶段3「反转点可0.5秒」 |
| 模板·伏笔「45-60 秒能回收的种子」 | data.js:1123 segs 递进铺垫 task「为反转埋至少1个可回收的伏笔」+ data.js:1124「必须回收铺垫段埋的伏笔」 |
| 模板·铺垫段空镜用「插入空镜」档 | data.js:424-427 `DB.cameras` n=插入空镜（use：插物体/环境空镜掩护口型、外化情绪）；segs 递进铺垫 cams「环境空镜（呼吸感）」 |
| 模板·爽点段 orbit（环绕） | data.js:380-383 `DB.cameras` orbit.use「觉醒定格环绕/龙傲天登场/hero shot」（该段 segs.cams 未列环绕，依据 cameras.use 补入，见第五节#2） |
| 模板·卡点「黑场前最后一格」 | data.js:1126 segs 卡点留钩 task「黑场前留一个“下一集必须看”的画面」 |
| 台词表（先配音、后驱动画面） | research/19 §A1.2「先配音、后驱动画面，顺序不能反」（research/19:28）；表头文案「长句拆2-3段、接缝补1-2帧」出自 §A6 行动清单1（research/19:166）；data.js:447 `camTalkRules` 第6条「先配音后驱动画面：顺序不能反」 |
| 分镜交接单（镜号｜运镜｜时长｜景别｜画面） | research/18-工作室协作资产管理与多语种出海发行.md §2.4「13字段分镜表」交接思路（轻量 5 字段版）；research/02 §阶段3 分镜表 11 字段 |
| 六段拍摄速查块 | 运行时直读 data.js:1121-1126 `hot.episodeMap.segs` 的 n/t/cams/tip，本页不另存口径 |
| mod.search 新增 2 条 | 描述对象即上述新增功能 |

## 五、需人工核实

1. **模板单镜秒数的编排取值**：段落模板各镜的具体秒数（0.5/1/1.5/2/3/4s）是段窗口**之内**的编排值——镜数已由脚本断言落在 segs「X-Y镜」区间内（钩子2/冲突4/铺垫10/反转3/爽点6/卡点3），整集骨架 76.5s＜98s 为刻意留量（供用户加镜/加秒补足）；但单镜秒数本身不是 research 原文数字，属补丁作者编排，请内容负责人过目。
2. **爽点段的 orbit（环绕）**：segs 爽点释放 cams 未列「环绕」，依据 DB.cameras orbit.use（hero shot/觉醒定格）补入，非该段 cams 原文——保留理由见第四节，请确认。
3. **台词表的格式约定**：分隔符「｜」与「（未标说话人）」占位为补丁作者的格式设计，非研究档案内容（不涉及事实口径）。
4. **护栏④为从严可执行化**：原文（data.js:446、research/19:56）仅禁「快速环绕、甩镜、大幅转头」，代码无法区分快慢环绕，故 orbit+台词一律告警（camEmoMap「威严登场」还推荐慢速环绕做 hero shot）。如需放宽，可将 `mjxStoryboardGuards` 中 `s.cam === 'orbit'` 条件移除或仅对台词镜头保留 whip——请内容负责人确认取舍，勿按「其余无」直接签收本条。
5. 其余无。

## 六、不做的事

- **不加 JSON 粘贴导入入口**：data.js:1049 compatNote 明示「目前工作台无粘贴任意JSON的导入入口」；实现需容错解析与字段对齐策略，超出本次「小步增强」范围，建议作为后续独立项。
- **不改导出契约**：导出仍是核心 5 字段；`shot_size` 等扩写字段维持由 LLM 扩写补齐的既定链路（data.js:1049），景别只做板内自查与交接单。
- **不动公共设施**：路由、命令面板、全局搜索、收藏系统、`sw.js`、`index.html`、`css/style.css` 一律不碰；`mod.sub`、`cnt`、`after` 等注册元数据不改。
- **不改任何既有数字口径**：`BUDGET=98`、六段时间窗与镜数区间、示例分镜 10 镜 92 秒、cameras/camRules/camTalkRules/camEmoMap、`KEY='manju_storyboard_v1'` 等全部原样。
- **不重命名/删除任何现有键、字段、类名、函数名**：`sb-*` 类与既有函数原样保留；新增 JS 标识符一律 `mjxStoryboard*` 前缀，新增 CSS 类一律 `mjx-storyboard-` 前缀（已核对全仓 0 冲突）。
- **不新建模块、不新建 CSS/JS 文件**，全部增量落在 `js/feat-storyboard.js` 内部。
