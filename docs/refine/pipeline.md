# 细化方案：开发流程九阶段（pipeline）

> 模块 id：`pipeline` ｜ 方案日期：2026-10-07 ｜ 性质：增量补丁（不推倒、不改版式）
> 约束遵守：只增不删不改既有 DB 键与字段；新增 CSS 类前缀 `mjx-pipeline-`；新增 JS 标识符前缀 `mjxPipeline`；不动 index.html / sw.js / 公共设施；全部补丁代码合计约 75 行。

## 一、现状盘点

**模块构成（已逐行核对实际代码）**：

| 组成 | 位置 | 说明 |
|---|---|---|
| `DB.pipeline` | `js/data.js:39-194` | 9 个阶段对象，字段统一为 `{ no, ico, name, en, time, goal, do[], tools[], output, pitfalls[] }` |
| `DB.pipelineTpl` | `js/data.js:196-260` | 9 张「产出物模板」，字段 `{ no, t, text }`，由详情页"复制即用"消费 |
| 模块视图 `pipeline()` | `js/app.js:473-477` | 仅渲染 9 格阶段条（`.pipe-strip`）+ 空容器 `#pipeDetail` |
| 详情渲染 `renderPipeDetail(no)` | `js/app.js:1563-1581` | 消费 `do/tools/output/pitfalls/goal/time` + `pipeTplBlock`（1549-1554，读 pipelineTpl）+ `pipeCkGate`（1555-1561，读 `DB.checklist[no-1]`） |
| 事件与挂载 | `js/app.js:234`（进模块默认渲染阶段1）、`js/app.js:2041-2044`（`data-stage`/`.pipe-step` 全局委托） | 公共设施，本方案不动 |

**体量统计（脚本实测，见文末"已跑验证"）**：do 合计 52 条、pitfalls 合计 29 条、tools 合计 49 个、模板 9 张。

**哪里最薄（do 条目数）**：阶段3 分镜脚本 4 条、阶段5 图像生成 4 条、阶段9 发布运营 4 条；阶段9 的 pitfalls 只有 3 条且全部是国内合规向。阶段2（8 条）与阶段6（9 条）已很厚实，不动。

**缺什么（对照 research/ 全库）**：
1. **对标拆解方法论缺席**——research/12 §四的"拉片拆解法"（听花岛按秒拆解、拉片表字段、AI 自动化拉片）是分镜阶段的核心前置技能，模块内一字未提（`grep 拉片 js/data.js` 仅命中研究日志）；
2. **长剧一致性降本打法缺席**——research/19 §B4 的《有山灵》蒙太奇法、统一角色库、自动审片+自动重抽工具链（可用率 90%+）未进入阶段5；
3. **发布阶段没有出海动作**——research/13 的"货架商品 4 打法"与 42 频道亏损案例在数据层无正文条目（仅研究日志一句话）；
4. **纯浏览、无学习闭环**——与"学习平台"定位不匹配：没有进度记忆、也没有把整阶段要点带走的方式（模板只有产出物模板可复制，阶段要点不能整组复制）。

**已有的交互**（保留）：点格切阶段、上一/下一阶段、模板复制、跳转制作清单。

## 二、变更清单（逐条，含出处）

**A. 数据加深（js/data.js，`pipeline` 区内追加 10 条，字段结构与同区条目完全一致）**

| # | 落点 | 新增内容（摘要） | 出处 |
|---|---|---|---|
| C1 | 阶段1 `do` +1 | 女频复合题材叠加公式（穿书+女扮男装+校园甜宠+炮灰逆袭） | research/02-开发流程与爆款方法论.md §阶段1（第11行） |
| C2 | 阶段1 `do` +1 | 出海通用题材四件套（霸总甜宠/契约婚姻/重生复仇/萌宝助攻） | research/02-开发流程与爆款方法论.md §阶段1（第12行） |
| C3 | 阶段1 `do` +1 | 版权路径优先级：番茄版权中台免费改编权（万妖零版权起步）→ 阅文/书旗授权库 → 原创自持 | research/16-连载化形态与万妖案例拆解.md §八第4条（第87行）+ §二（第21-22行） |
| C4 | 阶段3 `do` +1 | 拉片拆解法：听花岛按秒拆解；拉片表字段与 11 字段分镜表的差集=「机位」列 | research/12-剧本创作与网文改编实操.md §四（第38-39行） |
| C5 | 阶段3 `do` +1 | AI 自动化拉片：Agent 数小时→10 分钟；火山引擎"视频转分镜" | research/12-剧本创作与网文改编实操.md §四（第41行） |
| C6 | 阶段5 `do` +1 | 自动审片+自动重抽工具链可用率 90%+（对照一般工具 7 张约 3 张像同一人） | research/19-数字人口型表演与美术风格进阶.md §B4（第261行） |
| C7 | 阶段5 `do` +1 | 《有山灵》蒙太奇法 + 统一角色库/人物卡减少重复抽卡 | research/19-数字人口型表演与美术风格进阶.md §B4（第264行②③） |
| C8 | 阶段8 `do` +1 | 成片自查"PPT感"：观众 3 秒可分辨 PPT 漫与动态漫；4-15 倍价差被数据验证值得 | research/19-数字人口型表演与美术风格进阶.md §B6（第277-279行） |
| C9 | 阶段9 `do` +1 | 出海"货架商品"4 打法 + 播放列表连载组织 + Shorts 导流 | research/13-出海频道运营与YouTube打法.md §三（第24-30行）+ §五（第38-40行） |
| C10 | 阶段9 `pitfalls` +1 | 反面案例：42 频道矩阵广告分成不够付 AI 工具成本，纯搬运矩阵 ROI 极低 | research/13-出海频道运营与YouTube打法.md §四（第32-34行） |

查重说明（均已 `grep js/data.js` 核实为站内正文首次出现）：拉片/白模之辨见"六、不做的事"；"画风系数""在投 4000 部""前3集定生死"等候选条目因已被变现运营/爆款心法/术语表收录而**主动放弃**，避免跨模块重复。

**B. 交互增强（只动本模块自己的两个渲染函数）**

| # | 落点 | 内容 |
|---|---|---|
| J1 | `js/app.js:473-477` `pipeline()` | 阶段条下方增加学习打卡进度条容器 `#mjxPipelineProgress`（填充由 J3 完成） |
| J2 | `js/app.js:1562` 注释后插入 | 三个模块私有助手：`mjxPipelineDoneKey` / `mjxPipelineDoneSet()`（localStorage 打卡读写，复用既有 `store`）、`mjxPipelineProgressHTML()`、`mjxPipelineBrief()`（整组速览文本） |
| J3 | `js/app.js:1563-1581` `renderPipeDetail()` | ① 同步进度条与阶段格"✓"打卡态；② pd-meta 新增「☑️ 标记本阶段已学完」打卡按钮（可撤销，九阶段全过有通关提示）；③ 新增「📋 复制本阶段速览」一键复制整组（目标+怎么做+工具+产出物+避坑，走既有 `regCopy`+`data-copy` 全局委托，js/app.js:1958-1960） |

**C. 样式（css/style.css）**

| # | 内容 |
|---|---|
| S1 | 追加 9 行 `mjx-pipeline-*` 样式（进度条容器/段块/当前段描边/打卡对钩），全部使用站内既有 CSS 变量 |

## 三、落点与代码

> 应用方式建议按锚点匹配（每处锚点文本在全文件唯一，已用脚本核验唯一性）；行号为当前文件行号，插入后自然顺延。

### 3.1 js/data.js — 阶段1「立项选题」`do` 数组末尾（锚点：第48行 `算清"三本账"…先算账再立项`，之后、`tools:` 行之前插入）

```js
      `女频红海突围用复合题材叠加公式：穿书+女扮男装+校园甜宠+炮灰逆袭——单题材内卷时先拆对标作的标签组合再定自己的题材`,
      `出海立项直接套通用题材四件套：霸总甜宠/契约婚姻/重生复仇/萌宝助攻——目标市场（国内红果 vs 出海IAP）在选题阶段就定下来`,
      `版权路径优先级：番茄小说版权中台免费改编权（《万妖图录传》零版权成本起步）→ 阅文/书旗授权库 → 原创自持——先走官方免费链路，私改网文=侵权`,
```

### 3.2 js/data.js — 阶段3「分镜脚本」`do` 数组末尾（锚点：第83行 `即梦可导入剧本自动拆分镜`，之后插入）

```js
      `拉片是分镜第一课（听花岛"按秒拆解法"）：对标爆款不是"看片"是"拆片"——拉片表字段=镜号/景别/运镜/机位/时长/情绪点/钩子/台词，比11字段分镜表多"机位"一列，连机位一起抄`,
      `AI自动化拉片：Agent工作流把数小时对标拆解压到10分钟；火山引擎"视频转分镜"可自动生成3-5分钟拆解记录——先机器拆再人工改，拆解不占编剧整段时间`,
```

### 3.3 js/data.js — 阶段5「图像生成」`do` 数组末尾（锚点：第114行 `规格1080P起，横竖屏双版本`，之后插入）

```js
      `抽卡可用率天花板在工具链：一般工具7张图约3张像同一人（OSChina横评）；带自动审片+自动重抽的工具链可把可用率提到90%以上——把"人工挑图"升级为"工具链质检"再量产`,
      `长剧降本两招：①《有山灵》法——同一动作拆多分镜保一致、再蒙太奇剪辑规避AI不稳；②统一角色库/人物卡锁定立绘与换装，减少重复抽卡`,
```

### 3.4 js/data.js — 阶段8「剪辑成片」`do` 数组末尾（锚点：第170行 `输出1080P双版本（9:16+16:9）+ 每集封面帧`，之后插入）

```js
      `成片自查"PPT感"：观众3秒即可分辨PPT漫（角色像贴纸、只有嘴动）与动态漫（呼吸感/微表情/肢体动作），动态漫完播显著更优、4-15倍制作价差被数据验证值得——导出前做一遍"3秒盲测"复查呼吸感`,
```

### 3.5 js/data.js — 阶段9「发布运营」`do` 数组末尾（锚点：第185行 `复盘：盯完播率与流失点`，之后插入）

```js
      `出海把整部剧当"货架商品"经营：标题可换（按数据反复优化）/封面可测（AB测点击率）/章节可补（按剧集切分长视频）/播放列表可挪（按连载组织，每集标题统一前缀+编号）；剪出的Shorts持续导流回正片`,
```

### 3.6 js/data.js — 阶段9 `pitfalls` 数组末尾（锚点：第192行 `备案：投资≥80万需总局备案`，之后插入）

```js
      `别复制"42频道矩阵"：42个频道日更AI译制剧、半年播放几千万，广告分成却不够付AI工具成本——纯搬运矩阵ROI极低，出海必须精细化运营+深度本地化`,
```

### 3.7 js/app.js — 整体替换模块视图函数（原 js/app.js:473-477）

```js
    pipeline() {
      const strip = DB.pipeline.map((p) =>
        '<div class="pipe-step" data-stage="' + p.no + '"><div class="p-num">STAGE ' + p.no + '</div><div class="p-ico">' + p.ico + '</div><div class="p-name">' + p.name + '</div><div class="p-time">⏱ ' + p.time + '</div></div>').join('');
      return '<div class="pipe-strip">' + strip + '</div><div class="mjx-pipeline-progress" id="mjxPipelineProgress"></div><div id="pipeDetail"></div>';
    },
```

### 3.8 js/app.js — 在 `/* ---------- 流程详情 ---------- */` 注释行（原 js/app.js:1562）之后、`function renderPipeDetail` 之前插入助手

```js
  /* mjxPipeline：开发流程模块学习打卡与整组复制（只服务本模块渲染） */
  const mjxPipelineDoneKey = 'manju_pipe_done_v1';
  function mjxPipelineDoneSet() { return new Set(store.get(mjxPipelineDoneKey, [])); }
  function mjxPipelineProgressHTML(cur, done) {
    const segs = DB.pipeline.map((p) => '<i class="mjx-pipeline-seg' + (done.has(p.no) ? ' on' : '') + (p.no === cur ? ' cur' : '') + '" title="STAGE ' + p.no + ' ' + p.name + '"></i>').join('');
    return '<span class="mjx-pipeline-plabel">📚 学习打卡 <b>' + done.size + ' / ' + DB.pipeline.length + '</b> 阶段</span><span class="mjx-pipeline-segs">' + segs + '</span>';
  }
  function mjxPipelineBrief(p) {
    return '【开发流程 STAGE ' + p.no + ' · ' + p.name + '（典型耗时 ' + p.time + '）】\n' +
      '目标：' + p.goal + '\n\n怎么做：\n' + p.do.map((d, i) => (i + 1) + '. ' + d).join('\n') +
      '\n\n推荐工具：' + p.tools.join(' / ') +
      '\n产出物：' + p.output +
      '\n\n避坑：\n' + p.pitfalls.map((d) => '· ' + d).join('\n') +
      '\n\n—— 摘自「漫剧研究学习平台」开发流程九阶段';
  }
```

### 3.9 js/app.js — 整体替换 `renderPipeDetail` 函数（原 js/app.js:1563-1581，完整函数体如下）

```js
  function renderPipeDetail(no) {
    const p = DB.pipeline.find((x) => x.no === no) || DB.pipeline[0];
    const done = mjxPipelineDoneSet();
    $$('.pipe-step').forEach((s) => { s.classList.toggle('on', +s.dataset.stage === p.no); s.classList.toggle('mjx-pipeline-done', done.has(+s.dataset.stage)); });
    const prog = $('#mjxPipelineProgress');
    if (prog) prog.innerHTML = mjxPipelineProgressHTML(p.no, done);
    const tools = p.tools.map((t) => '<span class="tag c">' + t + '</span>').join('');
    const dos = p.do.map((d) => '<li>' + d + '</li>').join('');
    const pits = p.pitfalls.map((d) => '<li>' + d + '</li>').join('');
    const copyId = regCopy(mjxPipelineBrief(p));
    $('#pipeDetail').innerHTML = '<div class="pipe-detail">' +
      '<div class="pd-head"><span class="pd-ico">' + p.ico + '</span><h3>' + p.no + '. ' + p.name + '</h3><span class="tag">' + p.en + '</span></div>' +
      '<div class="pd-goal">' + p.goal + '</div>' +
      '<div class="pd-grid"><div class="pd-box"><h5>怎么做</h5><ul>' + dos + '</ul></div>' +
      '<div><div class="pd-box" style="margin-bottom:12px"><h5>推荐工具</h5><div class="pd-tools">' + tools + '</div></div>' +
      '<div class="pd-box warn" style="margin-bottom:12px"><h5>避坑指南</h5><ul>' + pits + '</ul></div>' +
      '<div class="pd-box"><h5>产出物 & 耗时</h5><ul><li>' + p.output + '</li><li>典型耗时：' + p.time + '</li></ul></div></div></div>' +
      pipeTplBlock(p) + pipeCkGate(p.no) +
      '<div class="pd-meta"><span class="pill">阶段 <b>' + p.no + ' / 9</b></span>' +
      '<button class="btn ghost" id="mjxPipelineDoneBtn">' + (done.has(p.no) ? '✅ 已打卡 · 点击撤销' : '☑️ 标记本阶段已学完') + '</button>' +
      '<button class="copy-btn" data-copy="' + copyId + '">📋 复制本阶段速览</button>' +
      (p.no > 1 ? '<button class="btn ghost" data-stage="' + (p.no - 1) + '">← 上一阶段</button>' : '') +
      (p.no < 9 ? '<button class="btn ghost" data-stage="' + (p.no + 1) + '">下一阶段 →</button>' : '<button class="btn pri" data-go="tools">进入工具库 →</button>') +
      '</div></div>';
    const doneBtn = $('#mjxPipelineDoneBtn');
    if (doneBtn) doneBtn.onclick = () => {
      const s = mjxPipelineDoneSet();
      if (s.has(p.no)) { s.delete(p.no); toast('已撤销 STAGE ' + p.no + ' 打卡'); }
      else { s.add(p.no); toast('✅ STAGE ' + p.no + '「' + p.name + '」已打卡' + (s.size === DB.pipeline.length ? '，九阶段全部通关！' : '')); }
      store.set(mjxPipelineDoneKey, Array.from(s));
      renderPipeDetail(p.no);
    };
  }
```

要点说明：打卡按钮用元素级 `onclick`（每次渲染重新绑定，随 `innerHTML` 重建自然销毁），不新增全局委托分支，不触碰 js/app.js:2041-2044 的既有 `[data-stage]`/`.pipe-step` 委托；复制按钮走既有 `data-copy` 全局委托（js/app.js:1958-1960）与 `regCopy`（js/app.js:47），零新公共依赖；localStorage 键 `manju_pipe_done_v1` 沿用站内既有 `manju_*_v1` 键名惯例，经既有 `store`（js/app.js:26-29）读写。

### 3.10 css/style.css — 在 `.pd-meta .pill b` 规则（css/style.css:359）之后追加

```css
/* ===== 开发流程 · 学习打卡进度条（mjx-pipeline- 前缀 · 2026-10 细化） ===== */
.mjx-pipeline-progress{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:-12px 0 18px;padding:10px 14px;background:var(--panel2);border:1px dashed var(--line);border-radius:12px;font-size:12.5px;color:var(--tx2)}
.mjx-pipeline-plabel{color:var(--tx2)}
.mjx-pipeline-plabel b{color:var(--gold)}
.mjx-pipeline-segs{display:inline-flex;gap:5px;flex:1;min-width:180px}
.mjx-pipeline-seg{width:26px;height:6px;border-radius:3px;background:var(--line);transition:background .2s}
.mjx-pipeline-seg.on{background:linear-gradient(90deg,var(--p1),var(--p2))}
.mjx-pipeline-seg.cur{outline:2px solid rgba(139,92,246,.35);outline-offset:2px}
.pipe-step.mjx-pipeline-done .p-name::after{content:" ✓";color:var(--ok)}
```

（所用变量 `--panel2/--line/--tx2/--gold/--p1/--p2/--ok` 均为 css/style.css:9 既有定义。）

**已跑验证**（本次会话实际执行，均通过）：① `node --check` 基线 js/data.js 与 js/app.js 通过；② 按上述锚点把补丁应用到两文件的临时副本后 `node --check` 再次通过；③ 解析补丁后 `DB`：9 阶段 / pipelineTpl 9 张 / 字段键序无漂移，do 52→61、pitfalls 29→30、tools 49 不变，且逐条断言"既有 do/pitfalls/tools/goal/output/time 与原文件完全一致"；④ 打卡进度 HTML 与整组速览文本用桩环境验证输出正确。

## 四、来源对照表

| 变更 | research 出处（已逐行核对） | 与站内既有内容的关系 |
|---|---|---|
| C1 复合题材叠加 | research/02-开发流程与爆款方法论.md §阶段1 第11行 | 站内正文首现 |
| C2 出海题材四件套 | research/02-开发流程与爆款方法论.md §阶段1 第12行 | 站内正文首现 |
| C3 版权路径优先级 | research/16-连载化形态与万妖案例拆解.md §八第4条 第87行；万妖零版权案例同档 §二 第21-22行 | 阶段1既有 do 只列了授权库清单，优先级链与零版权案例为首现 |
| C4 拉片拆解法 | research/12-剧本创作与网文改编实操.md §四 第38-39行 | 站内正文首现（研究日志仅一句话提及） |
| C5 AI自动化拉片 | research/12-剧本创作与网文改编实操.md §四 第41行 | 站内正文首现 |
| C6 自动审片+自动重抽 90%+ | research/19-数字人口型表演与美术风格进阶.md §B4 第261行 | "可用率90%+""7张约3张"均首现；与既有"可用率<30%先改模板"（阶段5既有 do）互补不冲突 |
| C7 有山灵法+角色库 | research/19-数字人口型表演与美术风格进阶.md §B4 第264行（②SegmentFault、③虎嗅《有山灵》） | 站内正文首现 |
| C8 PPT漫 3秒分辨 | research/19-数字人口型表演与美术风格进阶.md §B6 第277-279行（网易/17173口径） | 站内正文首现 |
| C9 货架商品4打法 | research/13-出海频道运营与YouTube打法.md §三 第24-30行、§五 第38-40行 | YouTube大盘数据在变现运营有收录，但"货架4打法"运营动作本身首现 |
| C10 42频道亏损案例 | research/13-出海频道运营与YouTube打法.md §四 第32-34行 | 案例本身首现（"单频道铺量已失效"结论已有，本条是其论据） |
| J1-J3 学习打卡/整组复制 | —（交互设计，不涉及事实） | 复用既有 `store`/`regCopy`/`data-copy`/`toast` 设施 |

## 五、需人工核实

无。10 条新增数据全部可在 research/ 档案中逐行找到出处（见第四节）；条目内"先拆对标作的标签组合再定题材""导出前做一遍3秒盲测"等仅为行动化措辞，不含任何新事实或新数字。带【存疑】标注的档案内容（如白模工具链厂商名、动态 IP 降险 82% 等）一律未采用。

## 六、不做的事

1. **不改任何既有条目**：9 个阶段的 no/ico/name/en/time/goal/do/tools/output/pitfalls 与 `DB.pipelineTpl` 9 张模板的既有文字、数字口径一律原样保留（脚本已逐条比对）。
2. **不新增 DB 键**：`pipeline`/`pipelineTpl` 结构不变；学习打卡状态存 localStorage（`manju_pipe_done_v1`），不进数据层。
3. **不重复站内已有知识**：①3D 白模预演不进阶段3——已在无限画布模块（js/data.js:693）；②画风系数阶梯不进阶段1——变现运营（1180）、术语表（1647）、题材风向库（1717）三处已收；③流量池/权重/前3集定生死不进阶段9——爆款心法（1068-1077）与 pipelineTpl 第9张模板已覆盖；④"在投漫剧超4000部"不采用为 2026-10 新数据——站内（1180）已注明 2026-10 同口径报告未发布，该数字实为 2025-10 口径。
4. **不动公共设施**：路由、命令面板、全局搜索、收藏系统、`data-stage`/`.pipe-step` 全局事件委托（js/app.js:2041-2044）、`sw.js`、`index.html` 均不改动；不新建模块。
5. **不做大改版**：详情页版式、模板区、检查点区（pipeCkGate）维持原样，只增两个按钮和一条进度条。
