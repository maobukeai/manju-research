# 细化方案：学习路径（learning）

> 涉及文件：`js/data.js`（learning 数据区 4 处增量插入）+ `js/app.js`（learning() 渲染函数整体替换）。
> 本轮补丁本身只写本文档；上述两个 js 文件当前一律只读，代码块为待应用补丁。基线：`js/data.js:1375-1436`（learning 数据区）、`js/app.js:612-638`（渲染函数）。

## 一、现状盘点

**有什么（逐卡清点，实测自 js/data.js:1376-1436）：**

| 卡片（DB.learning 下标） | 条目数 | 附加 |
|---|---|---|
| [0] 第1-7天 · 零基础跑通第一条片 | 6 条 | 完成判定关卡①指向「第一部成片」7天自查 |
| [1] 第8-30天 · 形成可复用生产线 | 5 条 | 关卡②产线三练习均值 |
| [2] 第31-90天 · 商业化与规模化 | 6 条 + 3 跳转 | 关卡③接单14天行动计划 |
| [3] 第8-30天配套 · 产线量化自检 | 4 条（四条硬线） | — |
| [4] 分岔A · 分账向 / [5] 分岔B · 商单向 / [6] 分岔C · 出海向 | 各 3 条，各 1 跳转 | — |

合计 7 卡 / 30 条目 / 6 个跳转链接。条目结构统一为 `{ d, d2 }`（backtick 模板字符串）。渲染层：`app.js:612-638` grid g3 输出，前三卡挂 `LN_GATES` 完成判定（读 `manju_ff_progress_v1`/`manju_quiz_best`/`manju_rt_best`/`manju_ft_best`/`manju_od_progress_v1` 五个本机进度键）；全局搜索自动收录（`app.js:1796` 遍历 `tr.items`，新增条目免登记）；导航 cnt 静态文案「90天」（`app.js:108`）。第1-7天卡与「第一部成片」模块（data.js:1442）是有意分工：路径卡给编排与判定，firstfilm 给 D1-D7 执行深化——非冗余。

**缺什么 / 哪里最薄（三处知识断层 + 一处交互缺口，均经 grep 验证）：**

1. **没有「第0步」**：路径直接从 Day1 开始，投入档位（每天几小时/每月多少钱/免费档够不够）在起点无承接——research/23§二 的三档投入假设只落在「收益决策树」（data.js:1806 一行），学习路径入口没有对表动作。
2. **第8-30天缺两块**：① 角色LoRA训练在「制作清单」卡4有完整速查（data.js:224-228），但路径上没有"何时做、为哪条硬线做"的编排；② 周4数据复盘只讲平台数据，缺"对标拉片"方法论——听花岛按秒拆解、拉片表字段、AI自动拉片（research/12§四）全站未入任何模块数据（grep `视频转分镜|自动拉片|按秒拆解` 仅命中研究日志 data.js:2379）。
3. **第31-90天缺起号前置步**：矩阵分发条目直接列平台，但抖音挂载门槛（1000粉+10条公开视频）与"仅约3%新号能涨到1000粉"（research/10§五、§六）未进任何模块数据（grep `挂载` 仅命中无关条目与研究日志 data.js:2418）——资格要倒排30天准备，这是路径级信息，专项模块里反而看不到。
4. **不可导出**：30 条路径条目无法一键带走对照执行；站内已有通用复制设施（`regCopy`/`data-copy` 委托，app.js:46-64、1958-1959）可零成本复用。

## 二、变更清单（逐条，含出处）

| # | 变更 | 落点 | 出处 |
|---|---|---|---|
| 1 | 第1-7天卡 items 顶部插入 `Day0 开始前 · 投入档位对表` | js/data.js:1379 前 | research/23 §二（投入档位假设）；§5.2【推断】（免费链路覆盖第1-7天，站内「收益决策树」data.js:1865 同口径已录）；§4.3（2690元课，科技日报2026-03-17，data.js:2003 同口径） |
| 2 | 第8-30天卡插入 `周3-4 角色LoRA资产`（运镜专项之后） | js/data.js:1390 后 | research/10 §二（数据集30-100张/60+较稳、触发词、LiblibAI约10-50元/次含打标30分钟-1小时）；续集省30-40% 为站内既有口径（data.js:1411、「制作清单」卡4 data.js:224-228 同源） |
| 3 | 第8-30天卡插入 `周4起 · 对标拉片与数据复盘双轮`（数据复盘之后收尾） | js/data.js:1392 后 | research/12 §四（听花岛按秒拆解法、拉片表字段、Agent拉片数小时→10分钟、火山引擎"视频转分镜"3-5分钟拆解记录）；镜头连续性两规则为「制作清单」分镜表模板既有口径（data.js:221） |
| 4 | 第31-90天卡插入 `月2 起号与挂载资格倒排`（合规动作之后、矩阵分发之前） | js/data.js:1402 后 | research/10 §五（抖音挂载门槛=粉丝>1000+≥10条公开视频、机构成立满一年、CPS 1000粉含500有效粉【非官方口径】）、§六（仅约3%新号到1000粉）；起号三板斧为「爆款心法」起号条既有口径（data.js:1065） |
| 5 | learning() 整函数替换：页首新增「复制整条90天路径」、每卡头部新增「⧉ 复制」（Markdown 清单导出） | js/app.js:612-638 | 无新数据——复用既有 `regCopy`/`data-copy` 通用复制设施（app.js:46-64、1958-1959，与运镜宝典/大模型应用页同一模式），不触碰事件委托本体 |

不改动：全部既有条目（字段 `{d,d2}`、数字口径、文案一字不动）、LN_GATES 三关卡及其进度键、跳转链接、两个 callout、导航 cnt、搜索索引（新增条目经 data.js 结构自动被 app.js:1796 收录）。

## 三、落点与代码

### 改动 1：js/data.js — 第1-7天卡插入 Day0 条目

- **锚点**：js/data.js:1378-1379（`items: [` 开行 + Day1-2 行）。Day0 行插在 Day1-2 行**之前**，改动后这两处为：

```js
    items: [
      { d: `Day0 开始前 · 投入档位对表`, d2: `先按背景定档位再开工：上班族副业=每天2-3小时、月工具投入300-2000元（research/23§二档位假设，同「收益决策树」口径）；学生=预算<500元/月走纯免费档；全职3人组见「变现运营」收益对照矩阵——免费链路（即梦免费档+剪映基础版）可覆盖第1-7天全部动作，AI Ultra 1499元/年是进阶付费点而非入门门槛；预算优先级【经验】：模型会员>素材>课程，学习期主要风险是培训费而非工具费——"零基础包接单月入过万"的2690元课已被官媒点名（科技日报2026-03-17）` },
      { d: `Day1-2 看懂行业`, d2: `通读本平台「总览」「爆款心法」，搞懂三本账（单条成本/抽卡可用率/万播单价）与爆款率意味着什么（双口径并列：2025全年漫剧0.16% / 2026H1 AI漫剧不足0.1%）` },
```

### 改动 2：js/data.js — 第8-30天卡插入角色LoRA条目

- **锚点**：js/data.js:1390（周3 运镜专项训练行，整行保留），其后**新增一行**：

```js
      { d: `周3 运镜专项训练`, d2: `逐个测试「运镜宝典」16种运镜在你主力模型上的响应，建立自己的"运镜-模型"适配表` },
      { d: `周3-4 角色LoRA资产`, d2: `给出场最多的1-2个主力角色练LoRA——「资产复用率」硬线的直接抓手（固定成本复用可让续集省30-40%）：数据集30-100张（60+较稳，多角度/多光照/多表情/多景别）、固定触发词（如myrole）召唤；LiblibAI在线训练约10-50元/次（含打标30分钟-1小时）；参数基线与训练监控口径直接抄「制作清单」卡4「角色描述卡+LoRA训练速查」` },
```

### 改动 3：js/data.js — 第8-30天卡插入对标拉片条目

- **锚点**：js/data.js:1392-1393（周4 数据复盘行 + `    ]},` 收行，整行保留），两行之间**新增一行**：

```js
      { d: `周4 数据复盘`, d2: `连续发布20+集，统计完播率/流失点，反推钩子与卡点节奏；对照「爆款心法」量化指标` },
      { d: `周4起 · 对标拉片与数据复盘双轮`, d2: `数据复盘告诉你哪一集掉人，拉片告诉你为什么：对标爆款按秒逐帧拆——听花岛方法论"不是看片，是拆片"；拉片表字段=镜号/景别/运镜/机位/时长/情绪点/钩子/台词；AI提速：Agent工作流把数小时拉片压到约10分钟，火山引擎"视频转分镜"可自动生成3-5分钟拆解记录——镜头连续性两规则（一镜塞两个以上事件就拆镜/相邻镜号避免相同景别）见「制作清单」分镜表模板` },
    ]},
```

### 改动 4：js/data.js — 第31-90天卡插入起号条目

- **锚点**：js/data.js:1402（月2 完成合规动作行，整行保留），其后**新增一行**：

```js
      { d: `月2 完成合规动作`, d2: `按投资额完成备案分层，AI标识显式+隐式双落地（见「变现运营」合规红线）` },
      { d: `月2 起号与挂载资格倒排`, d2: `矩阵分发前先倒排30天把账号资格做出来：抖音挂载能力=达人粉丝>1000+≥10条公开视频（机构入驻需成立满一年；CPS分销常见1000粉、含500有效粉起【非官方口径】）；仅约3%新号能涨到1000粉——挂载门槛就是第一道筛选；起号三板斧（前10条内容垂直题材统一/一机一号一卡/起号期强钩子养号）见「爆款心法」起号条` },
```

### 改动 5：js/app.js — learning() 渲染函数整体替换

- **锚点**：js/app.js:612 `    learning() {` 起至 :638 `    },` 止，整函数替换为下块。既有逻辑（LN_GATES、关卡渲染、两个 callout）逐字节保留；新增标识符 `mjxLearningMd`/`mjxLearningAll`（mjxLearning 前缀），复制走既有 `data-copy` 委托，无新增事件、无新增 CSS 类：

```js
    learning() {
      const qzMax = Math.min(8, DB.quizBank.length), rtMax = Math.min(5, DB.rhythmBank.length), ftMax = Math.min(8, DB.frameBank.length);
      const gatePct = (a, b) => b > 0 ? Math.round(a / b * 100) : 0;
      const gateCount = (key, groups, pre) => { const st = store.get(key, {}) || {}; let done = 0, total = 0; (groups || []).forEach((g, gi) => (g.items || []).forEach((_, ii) => { total++; if (st[pre + gi + '-' + ii]) done++; })); return gatePct(done, total); };
      /* 完成判定关卡：与「学习仪表盘」读同一批本机进度源——阈值：7天自查≥80%（仪表盘「接近完成」线）、三练习≥75%（仪表盘及格线）、接单计划≥50%（经验线，档案无出处） */
      const LN_GATES = [
        { lab: '第一部成片 · 7天自查', cur: gateCount('manju_ff_progress_v1', DB.firstfilm.checklist, ''), need: 80, go: 'firstfilm', goLab: '去推进 →' },
        { lab: '产线三练习均值', cur: Math.round((gatePct(Math.min(store.get('manju_quiz_best', 0), qzMax), qzMax) + gatePct(Math.min(store.get('manju_rt_best', 0), rtMax), rtMax) + gatePct(Math.min(store.get('manju_ft_best', 0), ftMax), ftMax)) / 3), need: 75, go: 'studyhub', goLab: '去仪表盘 →' },
        { lab: '接单14天行动计划', cur: gateCount('manju_od_progress_v1', DB.orders.plan.checklist, ''), need: 50, go: 'orders', goLab: '去推进 →' },
      ];
      /* mjxLearning：路径卡导出 Markdown 清单——只读 DB.learning、不写进度，复制按钮走既有 data-copy 委托（app.js 事件委托 [data-copy] → doCopy） */
      const mjxLearningMd = (tr) => '# ' + tr.t + '\n目标：' + tr.goal + '\n' + (tr.items || []).map((it) => '- ' + it.d + '\n  ' + it.d2).join('\n');
      const track = (tr, i) => {
        const links = (tr.links || []).map((x) => '<button class="btn ghost" data-go="' + x.go + '" title="' + esc(x.use) + '" style="padding:4px 12px;font-size:12.5px">' + esc(x.n) + ' →</button>').join('');
        const linkRow = links ? '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;padding-top:10px;border-top:1px dashed var(--line)">' + links + '</div>' : '';
        const g = i < LN_GATES.length ? LN_GATES[i] : null;
        const ok = g && g.cur >= g.need;
        const gate = g ? '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:10px;padding:8px 12px;border:1px dashed var(--line);border-radius:var(--r-s);background:var(--panel2)">' +
          '<span class="tag' + (ok ? ' g' : ' c') + '">' + (ok ? '✓ 达成' : '完成判定') + '</span>' +
          '<span style="font-size:12.3px;color:var(--tx2)">' + g.lab + ' ' + g.cur + '%（判定线 ' + g.need + '%）</span>' +
          '<button class="btn ghost" data-go="' + g.go + '" style="margin-left:auto;padding:3px 10px;font-size:12px">' + g.goLab + '</button></div>' : '';
        return '<div class="card learn-card"><div class="ln-head"><span style="font-size:22px">' + tr.ico + '</span><div><b>' + tr.t + '</b><p class="ln-goal">' + tr.goal + '</p></div>' +
          '<button class="copy-btn" data-copy="' + regCopy(mjxLearningMd(tr)) + '" title="复制本卡为Markdown清单" style="margin-left:auto;flex-shrink:0">⧉ 复制</button></div>' +
          tr.items.map((it) => '<div class="ln-item"><b>' + it.d + '</b><p>' + it.d2 + '</p></div>').join('') +
          linkRow + gate + '</div>';
      };
      const mjxLearningAll = DB.learning.map(mjxLearningMd).join('\n\n');
      return '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
        '<button class="copy-btn" data-copy="' + regCopy(mjxLearningAll) + '">⧉ 复制整条90天路径（Markdown清单）</button>' +
        '<span class="mini-note" style="margin:0">只复制清单文字，不含本机进度。</span></div>' +
        '<div class="grid g3">' + DB.learning.map(track).join('') + '</div>' +
        '<div class="callout"><b>路径逻辑：</b>第一周用「开发流程」9阶段跑通闭环（完成＞完美）；第一个月把偶然的成功变成模板与资产（提示词库/无限画布/运镜适配表）；第三个月才算经济账——备案合规、矩阵分发、投流ROI、出海溢价，最后用系列化沉淀长期价值。</div>' +
        '<div class="callout blue" style="margin-top:12px"><b>关卡与分岔：</b>每阶段卡底部的「完成判定」与「学习仪表盘」读同一批本机进度源，达标即亮绿灯——先解锁再进下一阶段；第31-90天按分账/商单/出海三条分岔小步并行试点，用真实数据决定主攻方向，口径详见「收益决策树」。</div>';
    },
```

**代码量核对**：新增数据 4 行 + 函数替换约 45 行，合计约 50 行（远低于 350 行上限），全部为完整可粘贴形态、无省略号。

## 四、来源对照表

| 新增内容 | 研究档案出处 | 站内互证（既有口径，未改动） |
|---|---|---|
| Day0 · 投入档位对表：每天2-3小时/月工具300-2000元（档位假设）、学生<500元/月 | research/23-收益预期对照与接单商单实操.md §二 | data.js:1806「收益决策树」业余档、data.js:1242-1244 monetize.incomeMatrix |
| Day0 · 免费链路覆盖第1-7天、AI Ultra 1499元/年非入门门槛 | research/23 §5.2（研究侧标【推断】） | data.js:1865（earnpath 启动成本卡）、data.js:329（工具库剪映条目价格） |
| Day0 · 2690元培训课被点名、主要风险是培训费 | research/23 §4.3（科技日报2026-03-17） | data.js:2003（earnpath 避坑清单）、data.js:1243（学生档） |
| 周3-4 · LoRA数据集30-100张/60+较稳、触发词、LiblibAI约10-50元/次含打标30分钟-1小时 | research/10-实战SOP深化.md §二 | data.js:224-228（制作清单卡4同口径）、data.js:300（LiblibAI 工具条目） |
| 周3-4 · 续集省30-40%（资产复用价值） | research/18 §A5.2（外包承制档） | data.js:1411（产线量化自检·资产复用率条既有口径） |
| 周4起 · 听花岛按秒拆解法、拉片表字段、Agent拉片数小时→约10分钟、火山引擎"视频转分镜"3-5分钟拆解记录 | research/12-剧本创作与网文改编实操.md §四 | data.js:215-221（制作清单卡3分镜表模板，连续性两规则同源） |
| 月2 · 抖音挂载门槛（粉丝>1000+≥10条公开视频、机构成立满一年、CPS 1000粉含500有效粉【非官方口径】） | research/10 §五 | data.js:2418（研究日志一行提及，此前未入模块数据） |
| 月2 · 仅约3%新号能涨到1000粉 | research/10 §六 | 无（本补丁首次入库） |
| 月2 · 起号三板斧（前10条垂直/一机一号一卡/强钩子养号） | research/10 §五 | data.js:1065（爆款心法·起号打法条既有口径） |

## 五、需人工核实

无。四条新增条目的全部事实性内容均有 research/*.md 章节出处（见上表）；研究侧自身带保留标记的口径（【非官方口径】【推断】【经验】）已在条目内原样保留标记；程序性表述（"给出场最多的主力角色练LoRA""预算优先级"）为操作建议，已标【经验】或不涉及事实断言。

## 六、不做的事

1. **不改任何既有条目**：learning 区 7 卡 30 条的字段结构（`{d,d2}`）、数字口径、文案一字不动；不重命名/删除任何 DB 键；不新增字段、不新增 DB 顶层键。
2. **不重复建库**：拉片连续性规则、LoRA 速查、防骗五条、回本账、千川出价等已由「制作清单」「接单实操包」「收益决策树」「爆款心法」承接的内容，一律以交叉引用入条目，不再复制数字进 learning 区（避免双源漂移）。
3. **不新增 CSS 类**：css/ 目录只读，渲染增强全部复用既有 `copy-btn`/`mini-note` 类与内联样式（颜色/边框取站内 CSS 变量），故无 `mjx-learning-*` 类产出。
4. **不动公共设施**：路由、命令面板、全局搜索、收藏系统、事件委托本体零改动——复制按钮仅"使用"既有 `[data-copy]` 委托（app.js:1958），与其余模块同模式。
5. **不新建模块、不做大改版**：不拆分岔卡为独立模块，不加账号体系/证书徽章/签到打卡（research/16§一 已明确"不做"），不改导航 cnt 文案与 index.html/sw.js。
