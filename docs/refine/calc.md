# 细化方案：互动计算器（calc）

> 涉及文件：`js/data.js`（calc 数据区 3 处增量插入）+ `js/app.js`（calc() 渲染函数整体替换）。
> 本轮补丁本身只写本文档；上述两个 js 文件当前一律只读，代码块为待应用补丁（已通过 node 内存打补丁 + 迷你 DOM 端到端自验，见第三节末尾）。基线：`js/data.js:1769-1792`（calc 数据区，24 行）、`js/app.js:856-879`（渲染函数）、`js/app.js:1712-1743`（calcCompute 计算函数）。

## 一、现状盘点

**有什么（逐键清点，实测自 js/data.js:1769-1792，经 node require 原始 data.js 断言）：**

| 数据键 | 条目数 | 结构 | 备注 |
|---|---|---|---|
| costDefaults | 11 参数 | `{ eps, minPerEp, shotsPerEp, imgUnit, usableRate, vidUnit, retries, voicePerEp, team, daily, days }` | 默认=12集试播季口径（3人×300元×14天） |
| costLabels | 11 | `{ 键: 中文名 }` | 与上表一一对应 |
| costNotes | 5 | 字符串数组 | 口径说明；第5条（data.js:1778）已是被压成一句的 190 字价格带长句 |
| revDefaults | 2 | `{ views: 300, unit: 15 }` | 月播放量/万播单价 |
| revTiers | 3 | `{ n, unit, d }` | 尾部5/中位15/头部30，被 `[data-unit]` chip 消费 |
| revNotes | 4 | 字符串数组 | 毛收入/爆款分布/出海IAP/口径警示 |

合计 **36 条目/字段**，全站最薄的模块数据区之一。渲染层 `app.js:856-879`（24 行）：左右双卡（制作成本计算器 + 收益模拟器）纯字符串拼接；计算逻辑唯一入口 `calcCompute()`（app.js:1712-1743，32 行）。交互全部依赖既有公共委托：路由进入时重算（app.js:244）、收益档 chip `[data-unit]`（app.js:2037-2038）、`#sec-calc` 内输入即时重算（app.js:2062-2063）。外围挂点：NAV（app.js:113）、SECTION_SUB（app.js:136）、全局搜索（app.js:160）、首页模块卡（app.js:445/468）；**data.js 全站共 18 处引用「互动计算器」**（grep 计数）；「模拟沙盘」直读 `DB.calc` 作种子参数（feat-mcsim.js:9、30、608、686）。

**缺什么 / 哪里最薄（均经读取与 grep 验证）：**

1. **口径断链（最刺眼）**：data.js:1517（「第一部成片」避坑）与 data.js:2127（「接单实操包」幕后证据）都写着"健康线图像≥30%/视频≥20%，**见「互动计算器」口径**"——但 calc 数据区（1769-1792）根本没有这条口径，被 18 处引用的模块名下缺了最核心的底牌。
2. **两个最难的输入零参考**：11 个参数里"单张成品图成本 / 单条视频成本"最难估，界面上却没有任何价格参考——research/21 §2.1/§2.2 的 7 行分模型秒单价核验表（可灵/即梦/Wan/第三方渠道）一条都没进模块；人力三参数（team/daily/days）同样零锚点，research/18 §2.2/§5.3 的编制与月薪数据未入库。
3. **回本播放量算出来没有对照组**：research/23 §一有现成基准——"平均播放量仅几十万到两三百万、大部分项目不回本（澎湃测算）"+ 破千万率 5.8%，正好用来判断"1,113 万播放"这个输出是红灯还是绿灯；结算账期 1-3 个月（research/23 §三）也没提，"回本≠到账"。
4. **呈现薄**：11 个输入无分组（生成参数与人力参数混排）；5 条口径说明全部平铺在输出框下；页尾零跳转桥——monetize/earnpath/orders/mcsim 都有按钮通向这里，这里却不通向任何地方。
5. **模块分工既定**：不确定性归「模拟沙盘」（蒙特卡洛）、路径决策归「收益决策树」、报价归「接单实操包」——本模块的空档就是"把参数填对"，即**单价与人力锚点**。

## 二、变更清单（逐条，含出处）

| # | 变更 | 落点 | 出处 |
|---|---|---|---|
| 1 | costNotes 追加 3 条：抽卡健康线口径（补全站内交叉引用的出处）、单集算力预算带（50-200元跑量档对照）、人力月薪参考与日薪换算 | js/data.js:1778 行后（数组收尾 `],` 前） | research/02 阶段5（可用率<30%→模板问题；跑量档单集算力80-100元）、research/10 §一（个人向单集算力50-200元）、research/18 §6.1（基线20%-30%/盲抽7-10次/预演再生成压到2-3次）、research/19 §B4（自动审片+重抽工具链90%+）、research/21 §三（废片率无权威数据）、research/18 §2.2/§5.3（编制与月薪）、data.js:1517/2127 既有引用身份 |
| 2 | revNotes 追加 2 条：「回本对照基准」（澎湃平均播放量+破千万率5.8%）、「回本≠到账」（结算账期/投流占比/承制垫资/赚到钱不足1%） | js/data.js:1790 行后（数组收尾 `],` 前） | research/23 §一（澎湃测算、DataEye 破千万1.2万部=5.8%）、§三路径1/路径3、research/18 §5.4（保底取消、不到1%） |
| 3 | calc 对象新增 2 键：`vidPriceRef`（7 行视频生成单集成本速查：模型/规格/秒单价/50秒折算/折算vidUnit）+ `vidPriceNote`（对口型单列+折算公式说明） | js/data.js:1791 `],` 与 1792 `},` 之间（纯新增键，grep 原文件 0 命中） | research/21 §2.1/§2.2 全量价格核验（可灵4.0 Flash 6灵感值/秒、3.0网页端6/8/9-12、Turbo API 0.8/1.0元/秒、整体均价0.43元/秒→21.5元/集、Seedance 2.5官方1.5-2.1元/秒→75-105元/集+样片模式省38%、2.0 API 1元/秒、渠道0.23-0.3元/秒+0.4上界、Wan 0.3/0.6/1.2元/秒分档、对口型1灵感值/秒与0.5积分/5秒、2.5较2.0涨约50%、免费积分收缩至30/日）；「折算元/条」列=秒单价×3秒/镜（默认参数 2分钟×60÷40镜）的编排性算术，非新事实 |
| 4 | calc() 渲染函数整体替换：输入分两组小标题（①生成参数/②人力与工期）+ 口径说明 `<details>` 折叠 + 新增第三张全宽卡「视频生成单集成本速查」（表格 + 行级「填入」按钮一键写入 vidUnit 并即时重算 + 一键复制纯文本速查表）+ 页尾三跳转桥（模拟沙盘/收益决策树/第一部成片） | js/app.js:856-879 | 无新数据。分组=既有 11 参数的语义编排；「填入」经 `window.mjxCalcApplyVid`（mjxCalc 前缀，函数体内定义）写 `#cf-vidUnit` 后调用既有 `calcCompute()` 与 `toast()`；复制复用既有 `regCopy`/`[data-copy]` 委托（app.js:46-64、1958-1959）；跳转复用既有 `[data-go]` 委托（app.js:2039-2040，mcsim 为 feat 自注册模块 id，feat-mcsim.js:676） |

新增合计 **5 条注记 + 1 张结构化速查表（7 行 × 5 字段）+ 1 条表注 ≈ 等价 12 条高质量条目**；既有 6 键 36 条目经 harness 逐字段断言一字未动。

## 三、落点与代码

### 改动 1：js/data.js — costNotes 追加 3 条

- **锚点**：js/data.js:1778（"单集50秒漫剧纯生成成本带…"长行，整行保留不动；其串『废片率无权威数据`,\n  ],』经 grep 全文唯一）。在该行**之后**（`  ],` 之前）插入以下 3 行：

```js
    `健康线口径（「第一部成片」「接单实操包」按"图像≥30%/视频≥20%"引用本模块，此处补全出处）：图像抽卡可用率低于30%说明提示词模板有问题，先改模板再量产（research/02 阶段5）；研究侧基线：早期画面可用率仅20%-30%、复杂镜头平均盲抽7-10次，"先预演再生成"可把尝试压到2-3次（research/18 §6.1），带自动审片+自动重抽的工具链可把可用率提到90%以上（research/19 §B4）；视频废片率无权威数据（research/21 §三），按重抽系数2-3倍保守计`,
    `算力预算带：个人向AI漫剧单集算力可压到50-200元（research/10 §一）、流水线跑量档单集算力80-100元（research/02 阶段5）——把左侧"图像+视频+配音"三项总成本除以集数对照：落在带内=跑量档；明显高于带顶200元/集=精品档，转按800-1200元/分钟全成本口径检查人力占比是否失控`,
    `人力月薪参考（research/18 §2.2/§5.3）：成熟剪辑制作约7000元/月起、编导12000-15000元/月、抽卡师4000-7000元/月、入门生图岗约5000元/月；三人组合计税前约2.6-2.9万/月、含社保约3.3-3.8万/月——按22个工作日折算日薪约300-700元，左表默认（3人×300元×14天）即"三人组短周期试播季"下限口径`,
```

### 改动 2：js/data.js — revNotes 追加 2 条

- **锚点**：js/data.js:1790（"口径警示：国内平台万播5-10元…"长行，整行保留不动）。在该行**之后**（`  ],` 之前）插入以下 2 行：

```js
    `回本对照基准：澎湃测算——最低成本三五千元的AI漫剧，按万播5元需约100万播放才回本，而平均播放量仅几十万到两三百万，大部分项目不回本（research/23 §一）；且2026H1新剧破千万率仅5.8%（1.2万部/22.19万部，DataEye）——上面算出的"回本播放量"若远超这个平均播放量基准，先压成本/集数，或把变现主力换成商单（见「接单实操包」）`,
    `回本≠到账：平台分账结算周期1-3个月、投流占流水80%+（research/23 §三路径1）；外包承制交付即回款（1-2个月/单）但净利仅5-8%、可能垫资（research/23 §三路径3）；"保底取消、万播5-10元"之下半年22万部里赚到钱的不到1%（research/18 §5.4）——分账路线请预留3个月以上现金缓冲再开机`,
```

### 改动 3：js/data.js — calc 对象新增 vidPriceRef / vidPriceNote 两键

- **锚点**：js/data.js:1791-1792 的 `  ],` + `},` 两行（连同 1790 行构成的三行串经 grep 全文唯一）。在 `  ],` **之后**、`},` **之前**插入以下 10 行：

```js
  vidPriceRef: [
    { n: `可灵 4.0 Flash（先行）`, spec: `720P · 3-20秒 · 仅首帧图生视频`, sec: `实测约6灵感值/秒`, perEp: `50秒≈300灵感值/集`, vid: null, note: `正式版计费未公布（截至2026-10-02）；黑金档26000灵感值/月折算约86集/月理论产能【推断】` },
    { n: `可灵 3.0 网页端`, spec: `720P无音频 / 1080P / 原生音频`, sec: `约6 / 8 / 9-12灵感值/秒`, perEp: `整体均价约0.43元/秒→50秒约21.5元/集`, vid: 1.3, note: `0.43元/秒系腾讯新闻2026-04-25实测折算口径` },
    { n: `可灵 3.0 Turbo API`, spec: `720P（有声）/ 1080P`, sec: `0.8元/秒 / 1.0元/秒`, perEp: `50秒约40-50元/集`, vid: 2.4, note: `官方API计费文档口径` },
    { n: `即梦 Seedance 2.5 官方`, spec: `720P`, sec: `约1.5-2.1元/秒`, perEp: `50秒约75-105元/集`, vid: 5.4, note: `「样片模式」480P草稿抽卡→升清1080P实测省约38%（99元 vs 直抽156元）；C端每日免费积分已收缩至30（2026-09下旬口径）` },
    { n: `Seedance 2.0 API`, spec: `火山引擎口径`, sec: `约1元/秒`, perEp: `50秒约50元/集`, vid: 3, note: `官方2.5定价较2.0涨约50%` },
    { n: `第三方Agent渠道`, spec: `LibTV 0.3 / OiiOii折后0.27 / TapNow 0.24 / Flova 0.23元/秒`, sec: `0.23-0.3元/秒（上界0.4）`, perEp: `50秒约11.5-15元/集（上界约20元）`, vid: 0.8, note: `渠道低价系贴钱甩卖，服务与账号风险自担——量产主线别压在渠道价上` },
    { n: `Wan 3.0（阿里）`, spec: `480P / 720P / 1080P`, sec: `0.3 / 0.6 / 1.2元/秒`, perEp: `50秒约15 / 30 / 60元/集`, vid: 1.8, note: `折算入成本账必须注明分辨率档位（15元为480P口径）` },
  ],
  vidPriceNote: `对口型成本单列：可灵网页端约1灵感值/秒、API 0.5积分/5秒（research/21 §2.1），别混进「单条视频成本」。「折算元/条」按默认参数（每集2分钟×60秒÷40镜=3秒/镜）乘秒单价估算——你改了集参数请按「秒单价×每镜秒数」重算；点「填入」写入左侧输入框并即时重算`,
```

### 改动 4：js/app.js — calc() 渲染函数整体替换

- **锚点**：js/app.js:856 `    calc() {` 起至 :879 `    },` 止，整函数替换为下块（锚点串 `\n    calc() {` 经 grep 全文唯一）。既有输出板块与顺序逐段保留（成本计算器→收益模拟器→用法 callout）；新增标识符仅 `window.mjxCalcApplyVid` 一个（mjxCalc 前缀、在函数体内定义，闭包持既有 `calcCompute`/`toast`）；「填入」按钮经渲染产物自带的 inline onclick 触发，不触碰全局点击委托本体；复制走既有 `[data-copy]` 委托、跳转走既有 `[data-go]` 委托；无新增 CSS 类（全部复用 `calc-num`/`cn-in`/`calc-out`/`chip`/`tool-filters`/`tbl-wrap`/`tbl`/`copy-btn`/`callout blue`/`mini-note`/`chart-box`/`btn ghost` 与内联样式）：

```js
    calc() {
      const C = DB.calc, d = C.costDefaults;
      /* mjxCalc*：本模块渲染层小增强（参数分组小标题/单集成本速查一键填入/速查表复制/页尾跳转桥）——不动路由、搜索、收藏等公共设施，无新增CSS类 */
      window.mjxCalcApplyVid = (v) => { const inp = document.getElementById('cf-vidUnit'); if (inp) { inp.value = v; calcCompute(); toast('✓ 已填入「单条视频成本」=' + v + ' 元/条，已重算'); } };
      const num = (k, step, suffix) => '<label class="calc-num"><span>' + C.costLabels[k] + '</span><span class="cn-in"><input type="number" id="cf-' + k + '" value="' + d[k] + '" step="' + step + '" min="0">' + (suffix ? '<i>' + suffix + '</i>' : '') + '</span></label>';
      const resRow = (id, label, big) => '<div class="calc-res-row' + (big ? ' big' : '') + '"><span>' + label + '</span><b id="' + id + '">—</b></div>';
      const gt = (t, s) => '<div style="margin:12px 0 6px;font-size:12px;font-weight:700;color:var(--p2)">' + t + (s ? '<span style="font-weight:400;color:var(--tx3)"> · ' + s + '</span>' : '') + '</div>';
      const tiers = C.revTiers.map((t) => '<span class="chip" data-unit="' + t.unit + '" title="' + esc(t.d) + '">' + t.n + ' · ' + t.unit + '元</span>').join('');
      const priceMd = '【视频生成单集成本速查（50秒/集口径 · 出处 research/21 §2.1/§2.2）】\n' +
        C.vidPriceRef.map((r) => '■ ' + r.n + '（' + r.spec + '）：' + r.sec + '；' + r.perEp + (r.vid == null ? '' : '；折算「单条视频成本」≈' + r.vid.toFixed(1) + '元/条（按3秒/镜）') + '。注：' + r.note).join('\n') +
        '\n' + C.vidPriceNote;
      const priceRows = C.vidPriceRef.map((r) => '<tr><td><b>' + r.n + '</b>' +
        '<div style="font-size:11.5px;color:var(--tx3);margin-top:2px">' + r.spec + '</div>' +
        '<div style="font-size:11.5px;color:var(--tx3);margin-top:2px">' + r.note + '</div></td>' +
        '<td style="color:var(--tx2);white-space:nowrap">' + r.sec + '</td>' +
        '<td style="color:var(--tx2)">' + r.perEp + '</td>' +
        '<td>' + (r.vid == null ? '<span style="color:var(--tx3)">—</span>' : '<b>' + r.vid.toFixed(1) + '</b><br><span class="chip" style="cursor:pointer;margin-top:4px;display:inline-block" onclick="mjxCalcApplyVid(' + r.vid.toFixed(1) + ')">填入</span>') + '</td></tr>').join('');
      return '<div class="grid g2">' +
        '<div class="chart-box"><h5>🎬 制作成本计算器 <span class="sub">12集试播季 · 试试改参数</span></h5>' +
        gt('① 生成参数', '视频单价不确定？见下方速查表，点「填入」直接写入') +
        '<div class="calc-grid">' +
        num('eps', 1, '集') + num('minPerEp', 0.5, '分钟') + num('shotsPerEp', 5, '镜/集') +
        num('imgUnit', 0.1, '元/张') + num('usableRate', 5, '%') + num('vidUnit', 0.5, '元/条') +
        num('retries', 0.5, '倍') + num('voicePerEp', 5, '元/集') +
        '</div>' +
        gt('② 人力与工期', '月薪参考见「口径与基准说明」——日薪≈月薪÷22个工作日') +
        '<div class="calc-grid">' +
        num('team', 1, '人') + num('daily', 50, '元/天') + num('days', 1, '天') +
        '</div><div class="calc-out" id="costOut"></div>' +
        '<details style="margin-top:10px"><summary style="cursor:pointer;font-size:12px;color:var(--p2);user-select:none">口径与基准说明（' + C.costNotes.length + '条）▾</summary>' +
        '<p class="mini-note" style="margin-top:8px">' + C.costNotes.join('<br>') + '</p></details></div>' +
        '<div class="chart-box"><h5>💰 收益模拟器 <span class="sub">万播单价 × 播放量</span></h5>' +
        '<div class="calc-grid" style="grid-template-columns:1fr">' +
        '<label class="calc-num"><span>月播放量</span><span class="cn-in"><input type="number" id="rv-views" value="' + C.revDefaults.views + '" step="50" min="0"><i>万</i></span></label>' +
        '<label class="calc-num"><span>万播单价</span><span class="cn-in"><input type="number" id="rv-unit" value="' + C.revDefaults.unit + '" step="1" min="0"><i>元</i></span></label>' +
        '</div><div class="tool-filters" style="margin:10px 0 4px">' + tiers + '</div>' +
        '<div class="calc-out" id="revOut"></div>' +
        '<p class="mini-note">' + C.revNotes.join('<br>') + '</p></div>' +
        '</div>' +
        '<div class="chart-box" style="margin-top:14px"><h5>📺 视频生成单集成本速查 <span class="sub">50秒/集口径 · 数据截至 ' + DB.meta.updated + '</span><button class="copy-btn" data-copy="' + regCopy(priceMd) + '" style="float:right">⧉ 复制速查表</button></h5>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>模型 / 渠道</th><th>秒单价</th><th>50秒/集折算</th><th>折算元/条（3秒/镜）</th></tr></thead><tbody>' +
        priceRows + '</tbody></table></div>' +
        '<p class="mini-note">' + C.vidPriceNote + '</p></div>' +
        '<div class="callout blue"><b>用法：</b>左边改制作参数 → 右下角自动算出"回本播放量"；右边调收益档位 → 对照左边成本，判断这个项目值不值得开。视频单价不确定？在下方速查表点「填入」直接写入。改任意数字即时重算。</div>' +
        '<div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap">' +
        '<button class="btn ghost" data-go="mcsim">平均数算完了，多大把握不亏？→「模拟沙盘」跑2000次风险模拟</button>' +
        '<button class="btn ghost" data-go="earnpath">这个项目该走哪条变现路？→「收益决策树」</button>' +
        '<button class="btn ghost" data-go="firstfilm">还没开机的先跑通流程 →「第一部成片」7天闭环</button></div>';
    },
```

**补丁自验（本轮实际执行，全部通过）**：补丁代码写入仓库外临时目录 `C:\Users\maobu\calc-patch-test\`，用 node 做内存打补丁验证——

- `node patch.mjs`（60 余项断言）：①3 个锚点串在源文件中均全文唯一；②补丁内存应用后 data.js/app.js 均通过 `new Function` 编译；③require 打补丁版 data.js 真实执行，断言 costNotes=8、revNotes=6、vidPriceRef=7（恰 1 行灵感值口径 vid=null），costDefaults/costLabels/revDefaults/revTiers 与 5+4 条既有注记逐字段 JSON 相等（一字未改）、calcCompute() 函数体逐字节未变；④从打补丁版 app.js 提取真实 calc() 函数体，在桩环境（stub document/regCopy/toast/calcCompute）中冒烟执行：输出 9064 字符，「① 生成参数」「② 人力与工期」、8 条口径折叠、6 个「填入」按钮、data-copy/data-go 三跳转等全部标记命中；⑤mjxCalcApplyVid 行为断言（写入 vidUnit + 触发重算 + toast）；⑥卫生断言：进 `data-copy` 属性的速查表文本无 ASCII 双引号、所有新增数据无内嵌 HTML 标签。结果 `ALL CHECKS PASSED`。
- `node verify2.mjs`（端到端）：把 calc() 渲染出的 11+2 个输入默认值灌进迷你 DOM，跑**真实 calcCompute()**——默认参数得图像 ¥1,097 / 视频 ¥2,880 / 人力 ¥12,600 / 全片 ¥16,697 / 每分钟 ¥696（诊断"低于主流区间"）/ 回本播放量 ¥1,113 万，与手工算式逐项核对一致；再模拟点击「填入」5.4（Seedance 2.5 官方折算价）→ vidUnit=5.4、全片重算 ¥19,001、回本播放量 ¥1,267 万，联动正确。结果 `E2E ALL CHECKS PASSED`。
- 两次运行前后 `md5sum js/data.js js/app.js` 一致（bc976e43… / fb0b21d5…），仓库零改动；`git status` 与会话开始快照一致。

**代码量核对**：新增数据 3+2+10=15 行 + 渲染函数整体替换 24→49 行，补丁完整代码合计 **64 行**（远低于 350 行上限），全部为完整可粘贴形态、无省略号；本文档代码块与自验所用临时文件逐字节一致。

## 四、来源对照表

| 新增内容 | 研究档案出处 | 站内互证（既有口径，未改动） |
|---|---|---|
| 图像可用率<30%=提示词模板问题、跑量档单集算力80-100元 | research/02 §阶段5（图像生成） | costNotes[0]/[1] 既有"可用率35%≈每2张废图换1张成图""基准对照AI中档800-1200元/分钟"相容 |
| 个人向单集算力50-200元 | research/10 §一（抽卡可用率提升·基线） | data.js:1452 估算公式同源（图像÷可用率、视频×重抽系数） |
| 早期画面可用率20%-30%、复杂镜头盲抽7-10次、"先预演再生成"压到2-3次 | research/18 §6.1（抽卡可用率：从玄学到工程） | data.js:1517/2127 两处"健康线…见「互动计算器」口径"引用——本补丁使其首次成真 |
| 自动审片+自动重抽工具链可用率90%+（CSDN 2026-09-30） | research/19 §B4（长剧中的风格一致性成本账） | costNotes[2] 既有"Agent流水线可显著压缩工期"同向 |
| 视频废片率无权威数据、默认按重抽2-3倍保守计 | research/21 §三（实测口碑与产能） | costNotes[4] 既有"重抽按2-3倍系数另计，废片率无权威数据"同口径（保留不改，互为印证） |
| 编导12000-15000元/月、成熟剪辑制作7000元/月起、抽卡师4000-7000元/月、入门生图岗约5000元/月、三人组税前2.6-2.9万/含社保3.3-3.8万 | research/18 §2.2（岗位编制三档位）、§5.3（成本端）、§5.1（入门岗） | costDefaults 既有默认（3人×300元×14天）与三人组口径相容，按纪律不改 |
| 澎湃测算：最低成本三五千元、万播5元需约100万播放回本、平均播放量几十万-两三百万、大部分项目不回本；2026H1破千万率5.8%（1.2万/22.19万部） | research/23 §一（收益预期基准·副业大盘冷启动；DataEye 半年报） | revNotes[1] 既有"破亿率仅0.47%"为同一 DataEye 口径族的更高端分位，不冲突 |
| 平台分账结算1-3个月、投流占流水80%+；承制交付即回款1-2个月/单、净利5-8%、可能垫资 | research/23 §三路径1/路径3 | revNotes[0] 既有"投流通常吃掉80-90%"同口径；「收益决策树」「接单实操包」同源交叉（earnpath bench、orders 路径表） |
| "保底取消、万播5-10元"之下赚到钱的不到1%（钛媒体 2026） | research/18 §5.4（毛利画像·修正版） | revTiers 尾部档"万播5元"同区间；earnpath bench"底层70%+"同向 |
| 可灵4.0 Flash 720P约6灵感值/秒（3-20秒/仅首帧/8-bit SDR）、50秒≈300灵感值/集、86集/月【推断】、正式版计费未公布 | research/21 §一/§2.1/§2.2（德里克文9-29+fal.ai 9-30+TechTimes 9-30，黑金档折算） | costNotes[4] 既有"可灵Flash 720P约300灵感值/集（…86集/月理论产能【推断】）"——速查表为其结构化展开，保留原句不改 |
| 可灵3.0网页端 6/8/9-12灵感值/秒、整体均价约0.43元/秒→50秒约21.5元/集、3.0 Turbo API 0.8/1.0元/秒 | research/21 §2.1（kling.ai定价页、官方API计费文档）、§2.2（腾讯新闻2026-04-25实测折算） | 无（首次入库） |
| 即梦 Seedance 2.5 官方1.5-2.1元/秒→75-105元/集；样片模式省约38%（99元 vs 156元）；C端免费积分收缩至30/日；2.5较2.0涨约50% | research/21 §2.1/§2.2/§十⑨（smzdm算力账8-22、冷逸实测9-28经smzdm转引、smzdm 9-30长文） | costNotes[4] 既有"Seedance 2.5官方75-105元/集"同源 |
| Seedance 2.0 API 约1元/秒→50元/集；第三方渠道0.23-0.3元/秒（LibTV 0.3/OiiOii 0.27/TapNow 0.24/Flova 0.23；0.4上界）→11.5-15元/集（上界约20元）、贴钱甩卖风险 | research/21 §2.1/§2.2（火山引擎口径；36氪8-31原文核验） | costNotes[4] 既有"第三方Agent渠道11.5-15元/集（36氪8-31文内另存0.4元/秒标价口径，上界约20元/集）"同口径 |
| Wan 3.0 0.3/0.6/1.2元/秒→50秒15/30/60元/集、折算须注分辨率档 | research/21 §2.1/§2.2（smzdm标题口径+新浪财经8-7公测稿修正） | costNotes[4] 既有"Wan3.0约15元/集（480P口径，720P约30元/集）"同源，1080P 档为增补 |
| 对口型：网页端约1灵感值/秒、API 0.5积分/5秒 | research/21 §2.1（官方API文档"0.5积分（¥0.5）/5秒"逐字） | data.js 约「提示词库/工具库」对口型条目同主题（模块不重复建库，此处仅提示别混账） |
| 「折算元/条」列（1.3/2.4/5.4/3.0/0.8/1.8）与"3秒/镜" | 编排性算术，非新事实：秒单价×3秒/镜（默认参数 每集2分钟×60秒÷40镜），Seedance 2.5 取区间中值1.8元/秒、渠道取中值0.265→0.8、可灵3.0网页端取均价0.43→1.3——表内与 vidPriceNote 均注明换算式 | costDefaults 既有 eps/minPerEp/shotsPerEp 默认值 |

## 五、需人工核实

1. **「视频可用率≥20%」作为独立健康线数值**：站内 data.js:2127 已按"图像≥30%/视频≥20%"引用本模块，但 research/ 侧未检索到视频侧 20% 的独立出处（research/18 §6.1 只给早期画面基线 20%-30% 且偏图像侧，research/21 §三明确"两家都没有权威废片率数据"）。本方案的处理：未把"视频≥20%"作为研究结论写进任何新增代码，仅在口径注记中如实说明其"站内既有引用身份 + 研究侧无权威数据"的现状——建议后续核验该数值或修订上游（data.js:2127）措辞。
2. 其余新增条目均有 research/*.md 章节出处；研究侧自带的弱源/转引/推断属性已随文进代码（86集/月保留【推断】标记、渠道价标注甩卖风险、即梦积分口径标注 2026-09下旬时点）。

## 六、不做的事

1. **不改任何既有条目**：costDefaults 11 参数（3人×300元×14天恰与 research/18 三人组口径相容，仍按"既有数字不改"纪律原样保留）、costLabels、revDefaults、revTiers 3 条、costNotes 5 条、revNotes 4 条经 harness 逐字段断言逐字节未动；不重命名/删除任何 DB 键，vidPriceRef/vidPriceNote 为纯新增键（原文件 grep 0 命中，无冲突；feat-mcsim.js 直读 DB.calc 的既有键不受影响）。
2. **不动 calcCompute()（app.js:1712-1743）**：回本对照、账期等"输出解读"知识全部放注记区，不改计算函数（harness 断言其函数体逐字节未变）；速查表「填入」通过调用该既有函数完成重算，未新增任何全局委托分支。
3. **不新增 CSS 类**：css/ 只读，全部复用既有类与内联样式，故无 mjx-calc- 类产出；新增 JS 标识符仅 window.mjxCalcApplyVid 一个（mjxCalc 前缀）。inline onclick 为本模块渲染产物自带的事件出口，是"渲染函数内部小增强"的最小实现，不触碰全局点击委托（app.js:2037-2058）与输入委托（app.js:2062-2063）本体。
4. **不动公共设施**：路由、命令面板、全局搜索、收藏系统、主题、index.html、sw.js 零改动。仅登记两处实施后建议顺手同步的文案（均在本函数之外，按纪律不改）：app.js:136 SECTION_SUB 与 app.js:445 首页卡片对 calc 的描述未提"视频单集成本速查"。
5. **不重复建库**：模型选型评测归「工具库/选型对比」（DB.videoCompare），收益路径与三分层归「收益决策树」（data.js:1794 起），报价分层与接单渠道归「接单实操包」（data.js:2017 起），风险概率分布归「模拟沙盘」（feat-mcsim.js）——速查表只承担"喂参数"单一职责，不展开评测、不复制他模块数字。
6. **不新建模块、不改版式**：计算器/模拟器双卡布局与全部既有交互（收益档 chip、即时重算）保留；速查表以第三张全宽卡追加在双卡下方，口径说明仅折叠不删减。
