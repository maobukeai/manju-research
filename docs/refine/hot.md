# 细化方案：爆款心法（hot）

> 模块 id：`hot` ｜ 数据区：`js/data.js` 第 1052-1175 行（区注释 `/* ================= 爆款心法 ================= */`）｜ 渲染函数：`js/app.js:580-606` 的 `hot()`
> 本方案只做增量加深，不改版式、不推倒重来。补丁完整代码合计约 54 行，全部经 Node 实测校验（见文末「校验记录」）。

## 一、现状盘点

**现有资产**（实际清点于 `js/data.js:1052-1175`）：

| 子键 | 现状 |
|---|---|
| `rules` | 23 条深度条目（黄金3秒/反转/卡点/投流/算法/矩阵/掉池等，2026-09~10 的算法深拆已相当密） |
| `rates` | 34 条量化指标速查（k/v 对） |
| `series` / `formula` / `coverFormula` | 3 段长文案（头部系列化规律 / 爆款总公式 / 封面公式） |
| `episodeMap` | 单集 98 秒六段沙盘（6 segs）+ 连载卡点 50 秒×千集沙盘（serial 5 segs） |
| `titleScorer` | 5 组打分词库 + 长度项 + 反套路警示 + 6 条 playbook + 4 条 AB 流程 |
| `ruleGroups` | 6 个分组（内容结构/连载系列化/算法流量池/投流矩阵/起号运营/标题封面） |

**渲染与事件接线**：`hot()`（`js/app.js:580-606`）输出总公式→分组筛选 chips→规则卡→系列化→双形态结构沙盘→封面公式→标题打分器→变现占比环形图+指标速查；既有交互全部走全局事件委托：`data-hgi` 组筛选（app.js:2011-2012）、`data-epmode`/`data-ep` 沙盘（app.js:2006-2010、1422-1442）、`data-tscore`/`data-tpl` 打分器（app.js:2008、2013-2014）。全局搜索收录 rules（app.js:1790，按索引无关遍历，追加安全）。

**跨模块依赖（红线）**：`js/feat-storyboard.js:84,96,202,225,289` 按索引消费 `DB.hot.episodeMap.segs`、`total`（分镜板 98s 预算）；分镜节奏题库按 segs 索引出题（app.js:1079,1116,1122）。**本轮不碰 episodeMap。**

**缺口（哪里最薄）**：
1. **起号侧只有"打法"没有"门槛与现实"**——规则 11 讲了起号节奏，但挂载门槛（1000粉+10条视频）与新号 3% 涨粉现实（research/10 已有据）未入库；
2. **投流侧有"赛马机制"没有"衰退处置"**——规则 19 讲了衰退三因，但衰退后的四步组合拳（research/24 §5.2）缺位；
3. **rates 缺互动质量类指标**——评论率、综合互动率、投流素材 3 秒完播率均无（research/10 §六已有）；
4. **档期维度零覆盖**——案例库已收《气运三角洲》春节档样本，心法层却没有排播/备货建议；
5. **没有可带走的自检工具**——23 条规则读得懂，但发布前逐条对照的 checklist 化缺失（全站仅「制作检查清单」覆盖制作侧）。

## 二、变更清单（逐条，含出处）

| # | 变更 | 内容 | 出处 |
|---|---|---|---|
| 1 | `rules` 追加第 24 条「档期与排播红利（2026春节档样本）」 | 春节档大盘 25.48 亿次、《气运三角洲》3人5天/29小时破2亿 | research/03-案例库.md §"更新 · 2026-10-01（v1.8）" |
| 2 | `rules` 追加第 25 条「起号现实与挂载门槛（抖音）」 | 挂载门槛 1000粉+≥10条、CPS 1000粉（含500有效粉）【非官方口径】、新号约3%涨到1000粉、2025抖音漫剧TOP100仅1部破10亿 | research/10-实战SOP深化.md §五、§六 |
| 3 | `rules` 追加第 26 条「素材衰退应对组合拳（投流）」 | 上新量减30%、复制爆款计划微调、阶梯压价、冷启动后快衰回调 | research/24-平台算法与流量池机制深拆.md §5.2 |
| 4 | `rates` 追加 5 条：评论率、综合互动率、投流素材3秒完播、新号涨粉现实、矩阵差异化下限 | 0.5%/1%、5%/10%、30-40%、约3%、≥30%（1人3-5号） | research/10-实战SOP深化.md §六"数据基准与矩阵"表及正文 |
| 5 | 新增子键 `preCheck`（12 条发布前自检） | 汇编自本模块既有规则 02/03/04/05/07/08/15/19/23/25/26 + 标题打分器 + 封面公式 + 指标速查（AI标识）+ research/02 §阶段8（字幕/双画幅）；"≥60分"取自站内打分器分级（js/app.js:1537：≥80爆款潜质 / ≥60及格） | 全部为站内既有口径或 research/02-开发流程与爆款方法论.md §阶段8，无外源新数字 |
| 6 | `ruleGroups` 两个分组追加 id（不改组名/顺序/既有 id） | 起号与运营 `ids: [9,11,13]`→`[9,11,13,24,25]`；投流与矩阵 `ids: [7,12,19,20]`→`[7,12,19,20,26]` | 配套改动（渲染层 `giOf` 按索引映射） |
| 7 | `hot()` 渲染函数内交互增强（整函数替换） | ①每个分组 chip 内嵌「📋」一键复制该组全文；②「📋 复制全部心法」；③指标速查「📋 复制」；④新增「发布前自检清单」区（12项+复制整份）——全部复用既有全局 `data-copy` 委托（js/app.js:1958-1959，先于 `data-hgi` 处理，chip 内嵌按钮复制/筛选互不干扰），零新增公共设施改动、零新增 JS 全局标识符（新标识符均 `mjxHot` 前缀、函数内局部） | 交互基础设施为本站既有（regCopy/doCopy，js/app.js:46-64） |

既有 23 条 rules、34 条 rates、episodeMap、titleScorer、series/formula/coverFormula 的**键名、顺序、数字口径一律不动**。

## 三、落点与代码

### 改动 1｜js/data.js — rules 数组尾部追加 3 条

**锚点**（现行代码 js/data.js:1077-1079，实际文件中该锚唯一）：

```js
    { t: `前3集定生死与单集二次推荐`, d: `…（第1077行原文不动）…纯前3秒强刺激、无实质价值的内容会被长效机制惩罚。` },
  ],
  rates: [
```

**粘贴为**（在第 1077 行条目之后、`  ],` 之前插入以下 3 行）：

```js
    { t: `档期与排播红利（2026春节档样本）`, d: `档期是放大器：2026春节档AI漫剧大盘播放量25.48亿次，《气运三角洲》3人团队5天制作、上线29小时播放破2亿——"极小团队+档期红利"的组合样本；春节/国庆等档期大盘流量池放大，备货排播提前对齐"预约蓄水"节奏（见结构沙盘·连载卡点）【推断】。⚠档期只放大已有供给：没备货就没红利。` },
    { t: `起号现实与挂载门槛（抖音）`, d: `挂载是第一道筛选：抖音小程序挂载需达人粉丝>1000+≥10条公开视频（机构入驻另需成立满一年），CPS分销常见1000粉（含500有效粉）起【非官方口径】；现实是新号仅约3%能涨到1000粉——起号期把"1000粉+10条公开视频"当第一里程碑再谈变现；2025年抖音漫剧TOP100仅1部破10亿——矩阵是提高命中概率，不是每号必爆。` },
    { t: `素材衰退应对组合拳（投流）`, d: `素材衰退是常态而非事故（衰退三因见第19条），跑输后打组合拳（艾奇学院《千川投放百宝书》/巨量千川攻略）：①爆量素材复用+裂变变体，上新量主动减30%防原始素材衰退；②复制爆款计划，微调标题/定向/出价再测；③起量后阶梯式压价守ROI；④通过冷启动后快速衰减=承接质量不佳，回调定向/出价/预算。` },
```

字段结构与同区完全一致（`{ t, d }`，反引号模板字符串）。

### 改动 2｜js/data.js — rates 数组尾部追加 5 条

**锚点**（现行代码 js/data.js:1113-1115，实际文件中该锚唯一）：

```js
    { k: `好封面点击率提升（口径）`, v: `约+70%` },
  ],
  series: `2026-09头部规律…（第1115行原文不动）
```

**粘贴为**（在第 1113 行条目之后、`  ],` 之前插入以下 5 行）：

```js
    { k: `评论率及格/良好`, v: `0.5% / 1%` },
    { k: `综合互动率及格/优秀`, v: `5% / 10%` },
    { k: `投流素材3秒完播（有起量潜力）`, v: `30-40%` },
    { k: `新号涨到1000粉比例`, v: `约3%` },
    { k: `矩阵号间内容差异化下限`, v: `≥30%（1人3-5号按题材分工）` },
```

字段结构与同区完全一致（`{ k, v }`）。

### 改动 3｜js/data.js — titleScorer 收尾后新增 `preCheck` 子键

**锚点**（现行代码 js/data.js:1166-1167，实际文件中该锚唯一）：

```js
  },
  ruleGroups: [
```

**粘贴为**：

```js
  },
  preCheck: [
    `前3秒直接进冲突：身份错位/利益威胁/视觉冲击三选一，不放LOGO片花（规则02）`,
    `45-60秒黄金分割点已安排反转，反转镜头可短至0.5秒（规则03）`,
    `反转的伏笔已在铺垫段埋好且被回收，非"为反转而反转"（规则04）`,
    `集尾悬念钩已挂：黑场前有"下一集必须看"的画面（规则05）`,
    `单集总长压在98秒-2分钟（红果口径），前30秒能独立成立（规则08/23）`,
    `标题过打分器≥60分：12-18字、含身份/悬念/数字锚点，无"摔辞职信"类疲劳词（标题打分器）`,
    `封面：人物占1/3-1/2居中偏左不挡脸，大字避开右上角，9:16竖屏（封面公式）`,
    `AI标识已加：显著位置持续≥2秒，发布时勾选"AI生成内容"（指标速查）`,
    `字幕零错别字，导出双画幅+封面帧（开发流程·剪辑阶段口径）`,
    `走挂载变现先达标：账号≥1000粉+≥10条公开视频（规则25）`,
    `发布后7天内不删视频：第4-5天被收藏/回看仍可二次爆流（规则15/23）`,
    `投流先算账：直投ROI约1.1、全域约1.8，按"测试→赛马→阶梯压价"顺序烧钱（规则07/19/26）`,
  ],
  ruleGroups: [
```

新增子键 `preCheck`（增量，不触碰任何既有键）。

### 改动 4｜js/data.js — ruleGroups 两个分组追加 id（整行替换）

**锚点**（现行代码 js/data.js:1171-1172，两行各自唯一）：

```js
    { n: `投流与矩阵`, ico: `💸`, ids: [7, 12, 19, 20] },
    { n: `起号与运营`, ico: `🚀`, ids: [9, 11, 13] },
```

**替换为**：

```js
    { n: `投流与矩阵`, ico: `💸`, ids: [7, 12, 19, 20, 26] },
    { n: `起号与运营`, ico: `🚀`, ids: [9, 11, 13, 24, 25] },
```

只追加 id，不改组名/图标/顺序/既有 id（新规则显示编号 24/25/26 与 `r-num` 一致）。

### 改动 5｜js/app.js — 整体替换 `hot()` 渲染函数（现行 js/app.js:580-606）

**锚点**：函数头 `    hot() {`（js/app.js:580），函数尾紧邻 `    genres() {`（js/app.js:608）。删除现行函数体（580-606 行），整段替换为：

```js
    hot() {
      const GR = DB.hot.ruleGroups || [];
      const giOf = (i) => GR.findIndex((g) => g.ids.includes(i + 1));
      const mjxHotGrpText = (g) => '【' + g.n + '】\n' + g.ids.map((id) => { const r = DB.hot.rules[id - 1]; return r ? '· ' + r.t + '：' + r.d : ''; }).filter(Boolean).join('\n');
      const mjxHotAllText = '【爆款心法 · 全部' + DB.hot.rules.length + '条】\n' + DB.hot.rules.map((r, i) => (i + 1) + '. ' + r.t + '：' + r.d).join('\n');
      const gchips = '<div class="tool-filters" id="hotGrpChips" style="margin-bottom:12px"><span class="chip on" data-hgi="all">全部' + DB.hot.rules.length + '条</span>' +
        GR.map((g, gi) => '<span class="chip" data-hgi="' + gi + '">' + g.ico + ' ' + g.n + ' · ' + g.ids.length + '<button class="copy-btn" data-copy="' + regCopy(mjxHotGrpText(g)) + '" title="复制该组全文">📋</button></span>').join('') +
        '<button class="copy-btn" data-copy="' + regCopy(mjxHotAllText) + '" style="margin-left:auto">📋 复制全部心法</button></div>';
      const rules = gchips + '<div class="grid g4" style="grid-template-columns:repeat(2,1fr)" id="hotRules">' +
        DB.hot.rules.map((r, i) => '<div class="card rule-card" data-hgi="' + giOf(i) + '"><span class="r-num">' + String(i + 1).padStart(2, '0') + '</span><b>' + r.t + '</b><p>' + r.d + '</p></div>').join('') + '</div>';
      const mjxHotPc = DB.hot.preCheck || [];
      const mjxHotPreCheck = mjxHotPc.length ? '<div class="chart-box" style="margin-top:16px"><h5>✅ 发布前自检清单（' + mjxHotPc.length + '项 · 逐条对照本模块规则）</h5>' +
        mjxHotPc.map((s, i) => '<div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px dashed var(--line)"><b style="color:var(--gold);flex-shrink:0">' + String(i + 1).padStart(2, '0') + '</b><span style="color:var(--tx2);font-size:13px">' + s + '</span></div>').join('') +
        '<button class="copy-btn" data-copy="' + regCopy(mjxHotPc.map((s, i) => (i + 1) + '. ' + s).join('\n')) + '" style="margin-top:10px">📋 复制整份清单</button></div>' : '';
      const rates = '<div class="chart-box"><h5>关键量化指标速查<button class="copy-btn" data-copy="' + regCopy(DB.hot.rates.map((r) => r.k + '：' + r.v).join('\n')) + '" style="margin-left:8px">📋 复制</button></h5>' + DB.hot.rates.map((r) =>
        '<div class="bar-row"><span class="b-lab" style="width:auto;flex:1;text-align:left;color:var(--tx2)">' + r.k + '</span><span class="b-val" style="text-align:right;color:var(--gold);font-weight:700">' + r.v + '</span></div>').join('') + '</div>';
      return '<div class="callout gold" style="margin-bottom:16px"><b>爆款总公式（2026-08）：</b>' + DB.hot.formula + '</div>' +
        rules + mjxHotPreCheck +
        '<div class="callout" style="margin-top:16px"><b>头部系列化规律（2026-09）：</b>' + DB.hot.series + '</div>' +
        '<div class="chart-box" style="margin:16px 0"><h5>🎬 结构沙盘 · 点击色块看任务</h5>' +
        '<div class="tool-filters" style="margin-bottom:8px"><span class="chip on" data-epmode="0">⏱ 单集98秒</span>' +
        (DB.hot.episodeMap.serial ? '<span class="chip" data-epmode="1">📺 ' + DB.hot.episodeMap.serial.label + '</span>' : '') + '</div>' +
        '<div class="ep-bar" id="epBar"></div>' +
        '<div class="ep-detail" id="epDetail"></div>' +
        '<p class="mini-note" id="epNote"></p></div>' +
        '<div class="callout" style="margin:16px 0"><b>封面公式（拆解100个爆款）：</b>' + DB.hot.coverFormula + '</div>' +
        '<div class="chart-box" style="margin-bottom:16px"><h5>✍️ 标题打分器（规则版 · 输入标题即时诊断）</h5>' +
        '<div class="ts-row"><input id="titleInput" placeholder="粘贴你的标题，如：战神赘婿被扫地出门，次日全军来迎" maxlength="40"><button class="btn pri" data-tscore style="flex-shrink:0">打分</button></div>' +
        (DB.hot.titleScorer.playbook ? '<div class="ts-chips" style="margin:10px 0 0">' + DB.hot.titleScorer.playbook.map((p) =>
          '<span class="tag" style="cursor:pointer" data-tpl="' + esc(p.ex) + '" title="' + esc(p.how) + '">📋 ' + p.n + '：' + esc(p.ex) + '</span>').join('') + '</div>' : '') +
        '<div id="titleResult"><p class="mini-note">六维规则打分：身份反差 / 悬念留白 / 情绪词 / 冲突动作 / 数字锚点 / 长度12-18字——命中越多分越高，满分100；点上方模板一键填入试打；打完分用下方AB测试流程定胜负。</p></div></div>' +
        '<div class="grid g2" style="margin-top:16px"><div class="chart-box"><h5>变现方式占比（2026-01，古东管家）</h5>' + donut([{ n: 'IAA 免费+广告', v: 71, c: '#8b5cf6' }, { n: 'IAP 单集付费', v: 26, c: '#22d3ee' }, { n: 'IAAP 混合', v: 3, c: '#f5b942' }]) + '</div>' + rates + '</div>' +
        '<div class="callout red"><b>一句总结：</b>爆款率0.18%的行业里，结构化方法（3秒钩子+黄金分割反转+结尾卡点）不是加分项，是入场券。</div>';
    },
```

说明：
- 与现行函数的差异仅 4 处：新增 `mjxHotGrpText`/`mjxHotAllText`（组/全量复制文本）、分组 chip 内嵌「📋」与行尾「复制全部心法」按钮、`rates` 的 h5 内「📋 复制」按钮、新增 `mjxHotPc`/`mjxHotPreCheck`（自检清单区，插在规则卡与系列化规律之间）。其余输出逐字符保持原样（含标题打分器、结构沙盘、环形图、「一句总结」）。
- 复制按钮走既有全局委托：`[data-copy]`（js/app.js:1958-1959）在 `.chip[data-hgi]`（js/app.js:2011-2012）**之前**处理并 `return`——chip 内嵌按钮点击只复制不触发筛选，点 chip 其余区域照常筛选，互不干扰。
- 新增 JS 标识符仅 `mjxHotGrpText`/`mjxHotAllText`/`mjxHotPc`/`mjxHotPreCheck`，均为函数内局部 const 且带 `mjxHot` 前缀；未新增任何 CSS 类（全部复用 `.copy-btn`/`.chip`/`.chart-box`/`.rule-card` 等现有类 + 内联样式），未触碰 `regCopy`/`doCopy` 等公共设施。

### 校验记录（本方案已实际执行）

- `node --check`（补丁合成后的 data.js 副本，位于系统临时目录）：语法通过；
- 合成补丁后加载 `DB` 断言 40 项全部 PASS：锚点 7 处唯一、rules 23→26 / rates 34→39 / preCheck 12 条、ruleGroups ids 正确、既有条目（rules[1]/[22]、rates[0] 口径、episodeMap.segs 6+5 段、total=98、既有键）全部原样、`hot()` 渲染出 9 个复制按钮且 7 个原有区块完整保留、新规则 24/25/26 分组归属正确。
- 校验脚本与合成副本均放在仓库外临时目录（`%TEMP%/mjx_hot_check/`），仓库内除本文件外零改动。

## 四、来源对照表

| 补丁条目 | 出处档案（research/） | 关键原文 |
|---|---|---|
| 规则24 全部数字 | 03-案例库.md · §更新 2026-10-01（v1.8） | "3人团队5天制作，上线29小时播放破2亿；春节档AI漫剧大盘播放量25.48亿次——极小团队+档期红利的组合样本，春节/国庆等档期值得专门备货" |
| 规则25 挂载门槛/CPS | 10-实战SOP深化.md · §五"起号与投流" | "小程序获取挂载能力+达人粉丝>1000、≥10条公开视频；机构入驻需成立满一年""CPS分销常见1000粉（含500有效粉）起【非官方口径】" |
| 规则25 新号3%/TOP100仅1部 | 10-实战SOP深化.md · §六 | "仅约3%新号能涨到1000粉""2025年抖音漫剧TOP100仅1部破10亿——矩阵是提高命中概率，不是每号必爆" |
| 规则26 组合拳四步 | 24-平台算法与流量池机制深拆.md · §5.2 | "复用爆量素材+裂变素材+新素材上新（上新量减少30%防原始素材衰退）；复制爆款计划微调标题/定向/出价；起量后阶梯式压价""通过冷启动后快速衰减说明承接质量不佳，需调整定向/出价/预算" |
| rates 评论率/综合互动率/3秒完播 | 10-实战SOP深化.md · §六数据基准表 | "评论率 0.5%及格/1%良好""综合互动率 5%/10%优秀""3秒完播率（投流素材）30-40%有起量潜力" |
| rates 矩阵差异化 | 10-实战SOP深化.md · §六 | "个人1人3-5号按题材分工，各号至少30%差异化，测出爆款号集中投流" |
| preCheck 第9条（字幕/双画幅/封面帧） | 02-开发流程与爆款方法论.md · §阶段8 | "字幕零错别字；双画幅+封面帧" |
| preCheck 其余11条 | 站内既有口径 | 规则02/03/04/05/07/08/15/19/23/25/26、episodeMap.note（98秒-2分钟）、封面公式、rates"AI标识最短持续时长"、标题打分器分级（js/app.js:1537：≥80爆款潜质/≥60及格） |
| 交互增强 | 站内既有基础设施 | regCopy/doCopy（js/app.js:46-64）、data-copy 委托（js/app.js:1958-1959） |

## 五、需人工核实

无。本轮新增条目的全部数字均能在上表所列 research 档案原文中逐字找到；两处沿用模块既有标注惯例的限定词——规则24「备货排播提前对齐预约蓄水」标【推断】（站内连载沙盘口径的引申，非档案原文）、规则25 CPS 门槛沿用档案原注【非官方口径】——均已随条目内嵌，不属无出处知识。

## 六、不做的事

1. **不动 `episodeMap`**（含 segs/serial/total）——`feat-storyboard.js` 按索引消费，分镜节奏题库按索引出题，动一根手指全站连锁；
2. **不修改任何既有条目的文字与数字口径**——23 条 rules、34 条 rates、titleScorer 词库、series/formula/coverFormula 全部原样；ruleGroups 仅追加 id；
3. **不加路由/命令面板/全局搜索/收藏钩子，不新建模块**——交互仅复用 `data-copy` 全局委托，在 `hot()` 函数体内部完成；
4. **不改 css/、index.html、sw.js**——零新增 CSS 类（若后续需要给自检清单做主题化样式，类名请用 `mjx-hot-` 前缀）；
5. **不收录存疑数字**——如"动态IP降82%""某平台支付转化率85%"等 research/24 已标【存疑】项不写入；完播率 15-20% 的另一拆解口径与站内 30% 及格线并存易混淆，也不录入；
6. **不重复搬运收益类数字**（万播5-10元、1.8亿播放结算18万等）——归「收益决策树」「变现运营」模块，本模块只在自检清单里引用既有 ROI 口径；
7. **封面公式不扩写**——已评估 research/15 的增量（稿定设计/AE 模板、1-2 Emoji 细节），价值密度低且 `coverFormula` 为既有字符串字段，本轮不为它新增平行键。
