# 细化方案：模拟沙盘

> 目标文件：`js/feat-mcsim.js`（本方案全部代码改动仅落在这一个文件；除本文档外不改任何文件）
> 基线：feat-mcsim.js 共 696 行，以 `<script src="js/feat-mcsim.js?v=28">` 挂载（index.html:109），已被 sw.js 缓存列表收录（sw.js:5）。

## 一、现状盘点

**有什么（逐区清点，均实测自 js/feat-mcsim.js 全文）：**

| 区块 | 规模 | 说明 |
|---|---|---|
| 常量区（:17-26） | 7 项 | 存储键 `manju_mcsim_v1`、抽样数 N_RUNS=2000、直方图 BINS=28、S 曲线点 CURVE_N=120、档位标签 TIER_LABELS 3 项 |
| 种子参数（:32-50） | DEF 5 项 | `perEpBase()` 按 DB.calc.costDefaults 摊算单集成本，cMin≈×0.75、cMax≈×1.3，vMed=300 万、vVol=120、unit=15——模块声明"不新增研究数字" |
| 滑杆配置 SLIDERS（:53-59） | 5 条 | cMin/cMax/vMed/vVol/unit，各带 hint 口径说明；这是模块内唯一"条目区"，字段 `{k,lab,min,max,step,hint}` |
| 抽样引擎（:82-92、:155-238） | 4 函数 | 三角分布 `tri`、分位 `qtl`、直方图分格 `buildBins`（0 线精确落格线）、保本 S 曲线 `buildCurve`（v50 线性插值）、`runSim`（成本均匀 × 播放量右偏三角 × 单价三角，毛口径利润） |
| 结果渲染（:241-295） | 3 函数 | `renderSummary`（5 行点估计）、`renderResult`（回本概率大卡 + P10/P50/P90 + 期望利润 + 50% 回本播放量）、`buildReport`（复制用 6 行报告） |
| 画布（:298-494） | 直方图+S曲线 | 亏损红/盈利绿、保本线、50% 交点、中位标记、hover/触摸 tooltip（`lastGeo` 反查） |
| 交互层（:497-529、:592-642） | — | 滑杆拖动即时重算点估计并标脏、场景预设 chips（读 DB.calc.revTiers 三档、一键换单价并重跑）、视图切换、重置、报告复制（走 app.js:1957 的 `[data-copy]` 文档级委托） |
| 注入样式（:95-129） | `<style id="mj-mcsim-style">` | 全部 `#sec-mcsim` 作用域、`mcs-` 类前缀，颜色取既有 CSS 变量 |
| 注册元数据（:675-690） | mod.search 3 条 | 自注册 `window.MJ.addModule`，`after: 'calc'` |
| 引用数据 | js/data.js:1770-1792 | DB.calc：costDefaults 12 字段、costNotes 5 条、revTiers 3 档、revNotes 4 条 |

**缺什么（最薄的三处）：**

1. **结果只有数字，没有"然后呢"（最薄）**：跑出回本概率 23% 之后用户该干什么，模块一个字没有——`probColor`（:80）已经有 60%/30% 两道档位色线，却没有任何对应的行动文案；research/23 §一"按组合期望而非单品爆款做预算"、§三"分账作彩票不作主食"，research/10 §六完播率基准，research/16 §三"连载算力账算不平就停更"——这些成体系的决策知识一条都没进模块。
2. **滑杆两侧没有研究锚点**：成本区间默认来自三本账公式（:44-50），但用户把 cMin/cMax 拖到哪一档才算"真实产线"，research/21 §2.2 的单集成本带（Seedance 75-105 元/集、第三方渠道 11.5-15 元/集等）在模块里零呈现；vVol=120 的"右偏长尾"背后是 research/24 §1.1 的流量池机制，也没有展示。
3. **场景预设只有"万播单价"一维**：三档 chips（:545-547）只能换 unit 一个滑杆；而研究档案里恰好有可整组映射的真实账本（澎湃"最低成本三五千元/部"、废太子"每部剧 AI 视频成本约 1 万元"、快手"1000-2500 元/分钟"）——"把行业口径变成可拖动感知的概率"这个模块宗旨，缺的正是这类一键载入的剧本。

**风格说明（与任务提示的差异，以实际代码为准）**：任务模板提示"沿用反引号模板字符串风格"，但本模块全文使用**单引号字符串 + `+` 拼接**（SLIDERS :53-59、样式串 :100-127、render 模板 :553-573 全区如此），反引号风格属 js/data.js 数据层。本方案新增代码一律沿用模块自身的单引号风格，不引入第二风格（与 docs/refine/framesim.md、picker.md 的处理一致）。

## 二、变更清单（逐条，含出处）

| # | 变更 | 落点 | 出处 |
|---|---|---|---|
| 1 | 新增数据区 `mjxMcsimGuide`：读数指南 12 条（`{g,n,d}`，g=分组小标题），分「读数三步 / 成本锚点 / 播放量先验 / 概率之后的决策」四组 | 插入"样式注入"注释行（:94）之前 | research/23 §一/§三、research/24 §1.1、research/10 §六、research/21 §2.2/§四、research/16 §三、research/03 v2.0、data.js revNotes/costNotes（逐条对照见 §四） |
| 2 | 新增数据区 `mjxMcsimScenarios`：沙盘剧本 4 套（`{n,tag,src,p}`，p 为五滑杆参数集、键与 SLIDERS 的 k 一致） | 同 #1（同一插入块） | research/23 §一、research/16 §三、research/08 v1.1、data.js revTiers；案例数字→五滑杆的映射均为【推断】，已在每条 src 字段内标注（见 §五第 1 条） |
| 3 | 新增 4 个辅助：`mjxMcsimInjectStyle()`（`<style id="mjxMcsimStyle">`，10 条 `.mjx-mcsim-*` 规则）、`mjxMcsimGuideText()`（整组导出纯文本）、`mjxMcsimGuideHtml(r)`（动态行动行 + 分组渲染 + 一键复制整组）、`mjxMcsimMountScenarios()`（往"场景预设"行下挂剧本 chips 并绑定点击） | 同 #1（同一插入块） | 纯交互增强；行动行阈值 60%/30% 复用模块既有 `probColor` 口径（:80），无新增研究数字 |
| 4 | `renderResult` 整函数替换：结果卡尾部追加「📖 读数指南」`<details>`（当前概率 → 绿/黄/红灯行动行 + 四组 12 条 + 复制按钮），原有输出逐字保留 | 整函数替换（:261-283） | 交互增强；数据同 #1 |
| 5 | `buildReport` 整函数替换：复制报告增一行「读数：绿灯/黄灯/红灯 + 一句话行动」，原有 6 行逐字保留 | 整函数替换（:284-295） | 交互增强；阈值同 #3 |
| 6 | `render()` 内插 1 行：`bindCanvas();`（:644）之后调 `mjxMcsimMountScenarios()`——在"场景预设"行与点估计摘要之间插入「沙盘剧本」chips 行，点击 → 整组换参 + `syncSliders/syncTierChips/renderSummary/runSim` + toast（行为对齐既有 tierChips 点击链路 :609-621） | 1 行插入（:644 之后） | 交互增强（一键载入整组参数） |
| 7 | `mod.search` 增 1 条「沙盘剧本」搜索条目 | 1 行插入（:686 之后） | 元数据同步（模块自身注册对象，非公共设施） |

不改动：DB 零改动；`SLIDERS`/`DEF`/`EPS_N` 及滑杆 min/max/step 不动；`S.res` 结构、存储键 `manju_mcsim_v1` 与 `loadState` 校验不动；`runSim`/`buildBins`/`buildCurve`/`drawHist`/`drawCurve`/tooltip/`bindCanvas`/`persist` 不动；既有 `mcs-` 前缀类不重命名。所有新增 JS 标识符以 `mjxMcsim` 前缀、新增 CSS 类以 `mjx-mcsim-` 前缀（已 grep 确认全站 js/ css/ 零占用）。补丁完整代码合计 **126 行**（预算 ~350 行内），已通过语法与冒烟校验（见 §三末尾）。

## 三、落点与代码

以下改动均在 `js/feat-mcsim.js`。行号以**未打补丁的当前文件**为准，**请自底向上（先改大行号处）应用**，避免插入使后续锚点移位。代码块均为完整可粘贴最终形态，无省略。

### 改动 1（#7）：`mod.search` 增 1 条

- **锚点**：mod 对象内 search 数组第 3 条（当前 686 行）：

```js
      { tit: '场景预设：尾部IAA / 中位 / 头部出海IAP', txt: '万播单价5/15/30元三档一键换参并自动重跑模拟，档位与描述取自「互动计算器」收益档（DB.calc.revTiers）' },
```

- 该行**之后**插入以下 1 行（该行自身保留不动）：

```js
      { tit: '沙盘剧本：研究案例参数映射', txt: '新手最低成本试水/废太子连载算力账/快手新政中档成本/头部对照破亿量级——四组研究档案真实账本一键载入并重跑模拟，出处与推断映射逐条标注' },
```

### 改动 2（#6）：`render()` 内插 1 行调用

- **锚点**（当前 644 行）：

```js
    bindCanvas();
```

- 该行**之后**插入以下 1 行（该行自身保留不动）：

```js
    mjxMcsimMountScenarios(); // 增补（细化补丁）：挂载「沙盘剧本」chips 行
```

### 改动 3（#5）：`buildReport` 整函数替换

- **锚点**：当前 284-295 行的整个 `buildReport` 函数，替换为以下完整函数体（原 6 行报告内容逐字保留，仅新增 `verdict` 一行）：

```js
  function buildReport(r) {
    const v50 = r.curve && isFinite(r.curve.v50) ? r.curve.v50 : null;
    const verdict = r.prob >= 0.6 ? '绿灯·可按计划推进（现金垫按P10准备）' : r.prob >= 0.3 ? '黄灯·先压成本区间或换更稳变现线再复跑' : '红灯·别急着开机：按组合期望做预算、商单养沙盘';
    const lines = [
      '【模拟沙盘 · 蒙特卡洛报告】（抽样 ' + r.n + ' 次 · 毛口径）',
      '参数：单集成本 ' + money(r.params.cMin) + '~' + money(r.params.cMax) + ' × ' + EPS_N + '集 · 全片播放中位 ' + wan(r.params.vMed) + '（波动 ' + r.params.vVol + '%）· 万播单价 ¥' + r.params.unit,
      '回本概率 ' + pctf(r.prob) + ' · 期望利润 ' + money(r.mean),
      '利润分位：P10 ' + money(r.p10) + ' / P50 ' + money(r.p50) + ' / P90 ' + money(r.p90),
      v50 ? '50% 回本需全片播放约 ' + wan(v50) + (r.params.vMed > 0 ? '（当前中位的 ' + (v50 / r.params.vMed).toFixed(1) + ' 倍）' : '') : null,
      '读数：' + verdict + '（档位线 60%/30%，行动细则见「读数指南」）',
      '口径：毛收入未扣投流（投流通常吃掉销售费用的80-90%，净利再打1-3折）· 爆款分布极端（2026H1 破亿率仅0.47%）· 种子参数与档位同「互动计算器」DB.calc 口径',
    ];
    return lines.filter(Boolean).join('\n');
  }
```

### 改动 4（#4）：`renderResult` 整函数替换

- **锚点**：当前 261-283 行的整个 `renderResult` 函数，替换为以下完整函数体（原输出逐字保留，仅在 stale 行之后追加指南）：

```js
  function renderResult() {
    const r = S.res;
    if (refs.report) refs.report.setAttribute('data-copy', MJX.regCopy(r ? buildReport(r) : '尚未跑模拟：请在「模拟沙盘」点「跑 ' + N_RUNS + ' 次模拟」。'));
    if (!r) {
      refs.resBox.innerHTML = '<div class="mcs-empty">🎲 还没有模拟结果——点上方「跑 ' + N_RUNS + ' 次模拟」开始抽样。<br>' +
        '<span>参数与最近一次结果会自动保存在本机浏览器，刷新后恢复。</span></div>';
      return;
    }
    const v50 = r.curve && isFinite(r.curve.v50) ? r.curve.v50 : null;
    const ratio = v50 && r.params.vMed > 0 ? (v50 / r.params.vMed).toFixed(1) : null;
    refs.resBox.innerHTML =
      '<div class="mcs-res">' +
      '<div class="mcs-big"><b style="color:' + probColor(r.prob) + '">' + pctf(r.prob) + '</b>' +
      '<span>回本概率 · ' + r.n + ' 次抽样中利润 ≥ 0 的占比（毛口径）</span></div>' +
      '<div class="mcs-side">' +
      '<div class="mcs-quant">' + qCard('P10 悲观', r.p10) + qCard('P50 中位', r.p50) + qCard('P90 乐观', r.p90) + '</div>' +
      '<div class="mcs-rows">' +
      '<div class="calc-res-row"><span>期望利润 E[利润]</span><b style="color:' + signColor(r.mean) + '">' + money(r.mean) + '</b></div>' +
      '<div class="calc-res-row"><span>50% 回本需全片播放' + (ratio ? '（当前中位的 ' + ratio + ' 倍）' : '') + '</span><b>' + (v50 ? wan(v50) : '—') + '</b></div>' +
      '<div class="calc-res-row"><span>播放量抽样区间（右偏三角）</span><b>' + wan(r.vLo) + ' ~ ' + wan(r.vHi) + '</b></div>' +
      '</div></div></div>' +
      '<div class="mcs-stale' + (resDirty ? ' show' : '') + '" id="mcStale">⚠️ 上图对应调整前的参数——点「跑 ' + N_RUNS + ' 次模拟」重跑后更新。</div>' +
      mjxMcsimGuideHtml(r);
  }
```

### 改动 5（#1+#2+#3）：插入增补数据区与辅助函数（一个整块）

- **锚点**：单行注释 `  /* ---------- 样式注入（全部作用域限定 #sec-mcsim，颜色取既有 CSS 变量） ---------- */`（当前 94 行）。该行保留，在其**之前**插入以下整块：

```js
  /* ---------- 增补数据区（细化补丁）：读数指南 12 条 + 沙盘剧本 4 套 ----------
     出处逐条对照 docs/refine/mcsim.md §四；剧本参数映射含【推断】，已在 src 字段内标注。
     guide 条目 {g,n,d}（g=分组小标题）；scenario 条目 {n,tag,src,p}，p 的键与 SLIDERS 的 k 一致。 */
  const mjxMcsimGuide = [
    { g: '读数三步', n: 'P10是存活线', d: 'P10=10%分位：10%的抽样比它更惨。期望利润被爆款长尾拉高，垫进去的现金按 P10 亏空准备，别按期望值准备。' },
    { g: '读数三步', n: '概率档位行动线', d: '≥60%绿灯：可按计划推进；30%-60%黄灯：先压成本区间或换更稳变现线再复跑；＜30%红灯：别急着开机——按"组合期望"而非"单品爆款"做预算（2026H1 AI漫剧爆款率不足0.1%）。' },
    { g: '读数三步', n: '毛概率≠净概率', d: '模拟利润是毛口径（未扣投流与平台分成）：投流通常吃掉销售费用的80-90%、净利再打1-3折；红果结算周期1→3个月、首期回款约35%——真实回本概率只会更低。' },
    { g: '成本锚点', n: '视频生成单集成本带', d: '50秒/集口径：可灵Flash 720P约300灵感值/集；Seedance 2.5官方75-105元/集 vs 第三方Agent渠道11.5-15元/集（上界约20元）；Wan3.0约15元/集（480P，720P约30元）——单集成本滑杆落在哪一档，先看用哪条产线。' },
    { g: '成本锚点', n: '重抽2-3倍另计', d: '宣传价"每秒几毛钱"默认要乘2-3倍重抽系数；两家头部模型均无权威废片率公开数据——张口就报废片百分比的横评要留个心眼。' },
    { g: '成本锚点', n: '样片模式省38%', d: '即梦网页版"样片模式"：480P草稿抽卡→原生升清1080P，升清成本约直出的1/8，实测整链省约38%（3分钟以上不支持）——压成本下限的合规手段。' },
    { g: '成本锚点', n: '人力才是大头', d: '三本账人力=人数×日薪×工期：默认参数 3人×300元×14天=1.26万，常高于算力——用Agent流水线（小云雀/novelvids）压缩工期是最直接的降本杠杆。' },
    { g: '播放量先验', n: '流量池决定右偏', d: '八级流量池经验口径：初始池300-500播放→二级约3000→四级10万-15万→五级40万-80万→六级以上百万级，90%创作者卡在500播放门槛（第三方经验值，官方从未公开分级数字）——少数剧进大池、多数沉底，播放量天然右偏长尾。' },
    { g: '播放量先验', n: '完播率是门票', d: '完播率30%以下基本没流量；15秒目标90%+、60秒目标50%+——中位播放量填的是同类完播水平下的量，不是心愿值。' },
    { g: '播放量先验', n: '大盘基准对照', d: '爆款率双口径：2025全年漫剧破亿率0.16%（60946部/96部）、2026H1全网AI短剧0.47%（22.19万部/1055部、其中AI漫剧不足0.1%）；30集成本3-8万元、回本需300万-1600万播放（30集口径，与沙盘12集核算单元勿直接对比）——跑出的低概率不是bug，是大盘真相。' },
    { g: '概率之后的决策', n: '分账作彩票不作主食', d: '商单/承制是确定性收入（30-50%定金、交付即回款），播放收益是波动收入——用商单现金流养"彩票仓"，只投可归零的钱进自制剧。' },
    { g: '概率之后的决策', n: '连载按季重跑', d: '《废太子饲养手册之救赎》第四季停更：6人团队单季AI视频成本约1万元、收益远未回本；对照《万妖图录传》初创3人半年十二季（媒体测算利润600万-2000万，非官方）——系列化摊薄单季成本，但每一季都要重新过一遍沙盘。' },
  ];
  const mjxMcsimScenarios = [
    { n: '新手·最低成本试水', tag: '预期读数：概率≈0（"大部分项目不回本"）', src: 'research/23 §一：AI漫剧最低成本三五千元/部（澎湃2026-09/10）→÷12集≈250-420元/集【推断取整250-450】；平均播放几十万-两三百万取中位150万【推断】；万播5元=「互动计算器」尾部档', p: { cMin: 250, cMax: 450, vMed: 150, vVol: 120, unit: 5 } },
    { n: '废太子·连载算力账', tag: '预期读数：概率≈0（"算不平就停更"）', src: 'research/16 §三：6人团队每部剧AI视频成本约1万元→÷12集≈833元/集【推断取650-1000，仅含AI视频成本、未含人力配音，视为下界映射】；收益远未回本、第四季停更（2026-08）', p: { cMin: 650, cMax: 1000, vMed: 100, vVol: 120, unit: 5 } },
    { n: '快手新政·中档成本', tag: '预期读数：概率约2%（中位单价也要近千万播放）', src: 'research/08 v1.1：AI将漫剧制作成本压缩至每分钟1000-2500元→50秒/集≈833-2083元/集【推断取整850-2100】；播放量与单价沿用「互动计算器」默认收益档（300万/15元）', p: { cMin: 850, cMax: 2100, vMed: 300, vVol: 120, unit: 15 } },
    { n: '头部对照·破亿量级', tag: '预期读数：概率约99%（同样的成本带，账只在头部量级成立）', src: '与上一剧本同成本带，仅把播放量挪至头部门槛量级（2026H1破亿率仅0.47%，3000万为接近破亿量级【推断】）、单价挪至头部档30元（「互动计算器」头部=S级+平台激励口径）——演示概率对播放量假设的极端敏感', p: { cMin: 850, cMax: 2100, vMed: 3000, vVol: 120, unit: 30 } },
  ];

  /* ---------- 增补辅助（细化补丁）：指南样式 / 指南渲染 / 剧本挂载 ---------- */
  function mjxMcsimInjectStyle() {
    if (document.getElementById('mjxMcsimStyle')) return;
    const st = document.createElement('style');
    st.id = 'mjxMcsimStyle';
    st.textContent =
      '#sec-mcsim details.mjx-mcsim-guide{margin-top:12px;border:1px solid var(--line);border-radius:12px;background:var(--panel2);padding:10px 14px}' +
      '#sec-mcsim details.mjx-mcsim-guide summary{cursor:pointer;font-size:12.5px;color:var(--tx);user-select:none}' +
      '#sec-mcsim .mjx-mcsim-gact{font-size:12px;line-height:1.65;margin-top:8px;padding:8px 10px;border-radius:8px;background:var(--panel);border:1px solid var(--line2)}' +
      '#sec-mcsim .mjx-mcsim-gact b{font-variant-numeric:tabular-nums}' +
      '#sec-mcsim .mjx-mcsim-gt{font-size:11px;color:var(--gold);letter-spacing:.06em;margin:10px 0 4px}' +
      '#sec-mcsim .mjx-mcsim-gi{display:flex;gap:8px;padding:3px 0;font-size:12px;line-height:1.6}' +
      '#sec-mcsim .mjx-mcsim-gi b{flex:0 0 96px;color:var(--tx)}' +
      '#sec-mcsim .mjx-mcsim-gi span{color:var(--tx2)}' +
      '#sec-mcsim .mjx-mcsim-copy{margin-top:10px}' +
      '@media(max-width:700px){#sec-mcsim .mjx-mcsim-gi b{flex-basis:84px}}';
    document.head.appendChild(st);
  }
  function mjxMcsimGuideText() {
    return ['【模拟沙盘 · 读数指南】'].concat(mjxMcsimGuide.map((e) => '· [' + e.g + '] ' + e.n + '：' + e.d)).join('\n');
  }
  function mjxMcsimGuideHtml(r) {
    const act = r.prob >= 0.6
      ? '<b style="color:var(--ok)">' + pctf(r.prob) + '</b> 绿灯：可按计划推进——现金垫按 P10 亏空准备，P90 作扩张上限参照。'
      : r.prob >= 0.3
        ? '<b style="color:var(--gold)">' + pctf(r.prob) + '</b> 黄灯：先压成本区间（cMin/cMax）或换更稳的变现线，再复跑模拟。'
        : '<b style="color:var(--hot)">' + pctf(r.prob) + '</b> 红灯：别急着开机——按"组合期望"做预算，用商单现金流养沙盘（见下方"概率之后的决策"）。';
    let html = '<details class="mjx-mcsim-guide"><summary>📖 读数指南：' + pctf(r.prob) + ' 的概率意味着什么？</summary>' +
      '<div class="mjx-mcsim-gact">' + act + '</div>';
    let g = '';
    mjxMcsimGuide.forEach((e) => {
      if (e.g !== g) { g = e.g; html += '<div class="mjx-mcsim-gt">—— ' + g + ' ——</div>'; }
      html += '<div class="mjx-mcsim-gi"><b>' + e.n + '</b><span>' + e.d + '</span></div>';
    });
    html += '<button class="copy-btn mjx-mcsim-copy" data-copy="' + MJX.regCopy(mjxMcsimGuideText()) + '">📋 复制全部读数规则</button></details>';
    return html;
  }
  function mjxMcsimMountScenarios() {
    mjxMcsimInjectStyle();
    const anchor = elRef.querySelector('#mcSummary');
    if (!anchor || elRef.querySelector('[data-mcscen]')) return; // 幂等保护
    const row = document.createElement('div');
    row.className = 'tool-filters';
    row.style.cssText = 'margin:10px 0 4px;align-items:center';
    row.innerHTML = '<span class="mini-note" style="margin:0">沙盘剧本（research 案例参数映射）：</span>' +
      mjxMcsimScenarios.map((s, i) =>
        '<span class="chip" data-mcscen="' + i + '" title="' + MJX.esc(s.src) + '">🎲 ' + MJX.esc(s.n) + '</span>').join('');
    anchor.parentNode.insertBefore(row, anchor);
    row.querySelectorAll('[data-mcscen]').forEach((ch) => {
      ch.addEventListener('click', () => {
        const s = mjxMcsimScenarios[parseInt(ch.getAttribute('data-mcscen'), 10)];
        if (!s) return;
        Object.keys(s.p).forEach((k) => { S[k] = s.p[k]; });
        syncSliders();
        syncTierChips();
        renderSummary();
        runSim();
        MJX.toast('已载入剧本「' + s.n + '」· ' + s.tag);
      });
    });
  }

```

**校验记录（本会话实际执行）**：
- 语法与冒烟：从本文档自动提取全部补丁代码块（改动 1-5），连同模块既有辅助的逐字副本（money/wan/pctf/signColor/probColor/qCard，取自 feat-mcsim.js:76-80、:258-260）与环境桩拼进 IIFE 骨架：`node --check` 通过；冒烟断言全绿——`renderResult()` 对 prob=0.021/0.989/0.45 分别产出红/绿/黄行动行、指南 details 追加成功、原结果卡与 `mcStale` 行逐字保留、空态文案不受影响；`buildReport` 输出 7 行且含「读数：黄灯」行；`mjxMcsimGuideText()` 返回 12 条；guide=12 条/scenario=4 套；4 套剧本参数全部落在滑杆界内且 cMax≥cMin+50；`mjxMcsimMountScenarios()` 在锚点缺失时安全返回（幂等保护生效）。`data-copy` 属性值为 `regCopy` 返回的序号（app.js:48 `regCopy` 返回 `copySeq++`，与既有 `refs.report` 用法 :263 一致；点击走 app.js:1957 文档级委托 `doCopy(+cp.dataset.copy)`，动态插入的按钮零新监听）。校验用临时文件写在系统 TEMP，未在项目内落任何文件。
- 前缀：`grep -rn "mjxMcsim\|mjx-mcsim" js/ css/` 零命中后再写入，无冲突。
- 剧本读数：以模块 `runSim` 同式（feat-mcsim.js:207-223）在 node 中复算（20000 次/组）：S1=0.0%、S2=0.0%、S3=2.1%、S4=98.9%、默认三本账参数=0.9%——默认值与 data.js 变更日志口径"默认参数回本概率约0.3%-1%"（data.js:2279）互洽；S3→S4 同成本带仅动播放量与单价两滑杆，概率 2.1%→98.9%，即剧本 tag 的预期读数来源。注意：cmd.exe 内联 `node -e` 会把脚本中的 `<` 解析为重定向导致三角抽样返回 NaN，首次复算结果全部失真已作废——上表数字来自写入系统临时文件的脚本，未在项目内落任何文件。
- 未运行浏览器端 DOM 冒烟（`mjxMcsimMountScenarios` 的插入路径依赖真实布局），已如实标注为未执行；该函数有幂等保护与锚点空值保护。

## 四、来源对照表

| 补丁条目 | 站内出处 | 原文依据（摘引） |
|---|---|---|
| 指南·概率档位行动线 | research/23 §一；feat-mcsim.js:80 | "按'组合期望'而非'单品爆款'做预算"；"2026H1全网新上线AI短剧超22.19万部、破亿仅1055部（0.47%），其中AI漫剧爆款率不足0.1%"；60%/30% 阈值=模块既有 `probColor` 口径，非新增 |
| 指南·毛概率≠净概率 | data.js:1787 revNotes[0]；research/08 §二表+更新v1.1；data.js:2000 pitfalls[1] | "投流通常吃掉销售费用的80-90%，净利要再打1-3折"；"结算周期1→3个月、首期回款约35%" |
| 指南·视频生成单集成本带 | research/21 §2.2（= data.js:1778 costNotes[4] 同口径） | "Seedance 2.5官方75-105元/集 vs 第三方Agent渠道11.5-15元/集（36氪8-31文内另存0.4元/秒标价口径，上界约20元/集）、Wan3.0约15元/集（480P口径，720P约30元/集）"；"可灵Flash 720P约300灵感值/集" |
| 指南·重抽2-3倍另计 | research/21 §2.2 废片系数+核验复核⑦ | "每秒几毛钱的宣传默认要乘2-3倍"；"两家都没有权威的废片率数据，张口就给你报百分比的横评反而要留个心眼" |
| 指南·样片模式省38% | research/21 §四 | "480P草稿抽卡→原生升清1080P，升清成本约1080P直出的1/8；实测……省约38%；3分钟以上不支持" |
| 指南·人力才是大头 | data.js:1771 costDefaults+1776 costNotes[2] | 3×300×14=1.26万为站内默认参数算术；"用Agent流水线（小云雀/novelvids）可显著压缩工期" |
| 指南·流量池决定右偏 | research/24 §1.1 | 初始池300-500→二级约3000→四级10万-15万→五级40万-80万→六至八级百万级以上；"90%的创作者卡在500播放门槛"；档案自带限定"官方从未公开分级数字" |
| 指南·完播率是门票 | research/10 §六数据基准表；research/02 爆款方法论表 | "完播率30%以下基本没流量"；"15秒视频90%+；60秒视频50%+" |
| 指南·大盘基准对照 | research/23 §一 | "2025全年漫剧60,946部、破亿96部（0.16%）"；"2026H1……22.19万部、破亿仅1055部（0.47%）……AI漫剧爆款率不足0.1%"；"30集AI短剧成本3-8万元、回本需300万-1600万播放（CSDN 2026）" |
| 指南·分账作彩票不作主食 | research/23 §三第5/6条+§4.3 | "分账作彩票不作主食"；"商单与承制是确定性收入，播放收益是波动收入"；"先收30%-50%定金→……交付初稿" |
| 指南·连载按季重跑 | research/16 §三；research/03 v2.0 | "6人团队……每部剧AI视频成本约1万元……收益远未回本"；"初创约3人……连出十二季，保守估计利润600万，乐观2000万（36氪（表外表里）……非官方）" |
| 剧本1 新手·最低成本试水 | research/23 §一；data.js:1782 revTiers | "AI漫剧最低成本三五千元"；"平均播放量仅几十万到两三百万"；万播5元=尾部档 |
| 剧本2 废太子·连载算力账 | research/16 §三 | "6人团队（4名正式员工），每部剧AI视频成本约1万元；算力成本成为负担、收益远未回本" |
| 剧本3 快手新政·中档成本 | research/08 更新v1.1（快手节） | "AI将漫剧制作成本压缩至每分钟1000-2500元、周期10-13天" |
| 剧本4 头部对照·破亿量级 | research/23 §一；data.js:1784 revTiers[2] | 破亿率0.47%作头部门槛参照；万播30元="S级内容+平台激励口径" |
| 改动3/4/5 的读数行动文案 | 模块既有口径（feat-mcsim.js:80 probColor）+ research/23 §三 | 档位线与"组合期望/商单养沙盘"建议均不引入新数字 |

## 五、需人工核实

1. **沙盘剧本的参数映射均为【推断】**：案例数字（三五千元/部、1万元/部、1000-2500元/分钟）→ 五滑杆参数的 ÷12 集换算、区间取整、vMed 取值，是本方案为"让研究账本可一键载入"所做的推断映射，已在每条 src 与 title 内标注；上线前建议人工复核映射口径（尤其剧本 2 仅含 AI 视频成本、未含人力配音，被明确标为下界映射）。
2. **站内一处既有口径在沙盘公式下不自洽（本方案未引用、未改动，仅上报）**：research/23 §一与 data.js:1994 calcBridge 均录"最低成本三五千元、按万播5元需约100万播放才回本"。按沙盘同一公式复算：5000 元 ÷ 5 元/万播 = **1000 万播放**（3000 元亦需 600 万），与"约100万"差 6-10 倍（原始报道口径可能系"千播"或"三五百元"之误）。本方案剧本 1 因此只引用"三五千元/平均播放几十万-两三百万/大部分项目不回本"三个自洽数字，未引用"100万"。建议核实原始报道后决定是否在站内加注。
3. **"90%创作者卡在500播放门槛"**：research/24 §1.1 所引为海螺社等第三方经验值（该档案自带"官方从未公开分级数字"限定），已带限定语写入指南——引用时勿去掉限定。

## 六、不做的事

1. **不把火龙"成本约40万→分账破2000万"做成剧本**：40 万 ÷ 12 集核算单元 ≈ 3.3 万/集，超出 cMax 滑杆上限 2 万；且火龙结算公式是"有效播放时长×时长单价×类型系数"（research/08 v2.7），非万播口径，硬映射会失真——连载维度已由剧本 2 与指南"连载按季重跑"覆盖。
2. **不把《波斯复仇记》3000元→72h GMV 50万美元做成剧本**：GMV ≠ 万播×单价的分账口径，且属个例彩票（research/03 明示"彩票式个例"），映射只会误导。
3. **不动 EPS_N=12 核算单元与"全片成本（自动）"口径**：研究档案的"30集成本3-8万"按 30 集口径原样呈现在指南里并注明"与沙盘 12 集核算单元勿直接对比"，不换算进滑杆。
4. **不改任何既有数字口径**：SLIDERS 的 min/max/step/hint、DEF、revTiers/revNotes/costNotes、`probColor` 阈值、报告既有 6 行文案全部保留；DB（js/data.js）零改动。
5. **不动公共设施**：路由、命令面板、全局搜索索引机制、收藏系统、index.html、sw.js 均不改；mod.search 仅在模块自身注册对象上增量 1 条。不新建模块、不重命名既有 `mcs-` 类与 `manju_mcsim_v1` 键。
6. **部署提示（集成方动作，本方案不执行）**：改动生效需将 index.html:109 的 `?v=28` 升版并视需要更新 sw.js 缓存版本（sw.js:3 `manju-v3.0`）——两个文件本次按纪律只读。
