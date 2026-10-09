# 细化方案：总览仪表盘（id：overview）

> 生成日期 2026-10-07。事实源头为 research/ 目录 26 篇档案；代码现状以本次实际读取的 js/data.js、js/app.js 工作区版本为准。本方案为增量补丁：不改任何现有条目的字段与数字口径，不新建模块，不触碰公共设施。

## 一、现状盘点

**数据区**（`js/data.js`）：
- `DB.quickStats`（data.js:16-30）：**13 条**，字段 `{ n, l, s }`。覆盖市场规模/观看人群/上新量/爆款率/出海IAP/算力成本/万播收益/用户重合/海外月活/红果月活日活/可灵营收。
- `DB.industryNotes`（data.js:32-37）：**4 条**，字段 `{ ico, t, d, tag }`（tag 取 h/c/g/空，渲染层 app.js:439 映射为 ⚠警示/→机会/→增长）。覆盖产能洗牌、IP改编、工具Agent化、出海。

**渲染层**（`js/app.js`）：`RENDERERS.dashboard`（app.js:437-471）= hero + 最新研究条 + 13 张数字卡单列混排 + 4 张关键词卡 + 6 张模块导航卡 + 1 条红色警示 callout。入区时数字滚动动画由全局 `runCounters`（app.js:232、391-393）驱动，reveal 入场动画覆盖 `.stat-card`（app.js:347-356）。`quickStats/industryNotes` 全站仅此一处消费（已 grep 确认，app.js:463-465）。

**缺什么、哪里最薄**：
1. **数字墙无分组无口径提示**——市场/产能/收益/出海 13 个数字混排，只有小字可辨来源，无法"成组带走"引用；
2. **全站最重要的预期管理结论缺席**——research/23 开篇即说"所有'我这种背景能赚多少'的回答都挂在这三组数上"（90% 公司不赚钱 / 70%+ 底层创作者月收益几百元 / 大部分项目不回本），但该档案"网站对应模块"未列总览，结论没有回流到首页数字墙；
3. **缺机制与合规锚点**——红果"单集≥30秒才计 1 次分账播放"这种直接影响收益核算法（research/24:88）、《微短剧发展管理办法》9-1 施行与 6.8 万部下架等硬执行事实（research/22:47-54）都没有进总览；
4. **关键词只有 4 条**——2026-09/10 两大变化（合规硬执行期、互动叙事新形态）未覆盖；
5. **模块导航只露出 6 个内容型模块**——学习路径/第一部成片/制作清单/收益决策树/接单实操包等"行动型"模块零露出；
6. **数据零复制能力**——想引用任何一条数字只能手抄。

## 二、变更清单（逐条，含出处）

| # | 变更 | 内容 | 出处 |
|---|---|---|---|
| 1 | quickStats 追加 7 条（下标 13-19） | 超1000亿产值 / 75.4% AI含量 / 90%+公司不赚钱 / 70%+底层收益 / ≈100万播放回本线 / ≥30秒有效播放 / 超2000万火龙分账 | research/01:19、25；research/23:9、11、12；research/24:88；research/17:65（逐条对照见第四节） |
| 2 | industryNotes 追加 4 条（共 8 条） | 🛡️合规硬执行期(h) / 📉收益规则收紧(h) / 🎮互动叙事第二战场(c) / 🎭先AI验证再真人翻拍(c) | research/17:9、11、44、47、49；research/22:12、47、48、52、54；research/25:23-26、41、65、68、73 |
| 3 | 数字墙分组 + 组内筛选 + 一键复制 | 13+7=20 条按「市场与需求 / 产能与爆款率 / 收益与成本 / 平台与出海」分 4 组，组标题+条数小标，顶部筛选 chips（全部/单组），每组与整墙各有"复制"按钮（走全局 `data-copy` 委托 app.js:1958），组尾加口径提示 mini-note | 交互增强，无外部事实 |
| 4 | 模块导航补第二行「上手与变现 · 行动入口」 | 露出 learning/firstfilm/checklist/earnpath/orders/cases 六卡；modDesc 局部对象补 firstfilm/earnpath/orders 三条描述（文案改写自各模块 SECTION_SUB，app.js:132-135，无新事实） | 站内既有描述改写 |
| 5 | 复制文本含口径 | 复制导出格式「n —— l（s）」，头部带 `DB.meta.updated`，引用时口径随行 | 对 industryNotes[0] "引用前必须统一口径"要求的落实 |

现有 13+4 条目、hero、最新研究条、警示 callout（含"0.18%"口径）全部原样保留。

## 三、落点与代码

### 3.1 js/data.js · quickStats 末尾追加 7 条

**锚点**：`{ n: \`8.5亿元\`…` 行（data.js:29）之后、该数组闭合 `],`（data.js:30）之前插入以下 7 行（保持 2 空格缩进，字段结构与现有条目一致 `{ n, l, s }`）：

```js
  { n: `超1000亿`, l: `2025微短剧+漫剧总产值`, s: `DataEye 2026-01 · 其中动画微短剧189.8亿（口径互斥详见下方行业关键词①）` },
  { n: `75.4%`, l: `抖音新剧AI含量(2026-08)`, s: `当月上线74,313部新剧 · 界面新闻` },
  { n: `90%+`, l: `不赚钱的AI短剧公司占比`, s: `澎湃新闻(转每日经济新闻2026-08-17)/钛媒体/CBNData同题结论 · 网传"投中网"出处未检索到原文，落档以此三家为准` },
  { n: `70%+`, l: `底层创作者月收益仅0-几百元`, s: `收益三分层：约20%月营收数千-2万(营收非利润)、<10%月营收2万+ · 分层出处原文未复核，与DataEye"90%月入<5000元、30%亏损"量级相容` },
  { n: `≈100万播放`, l: `三五千元成本剧的回本线`, s: `按万播5元测算；平均播放仅几十万-两三百万，大部分项目不回本 · 澎湃测算` },
  { n: `≥30秒`, l: `红果单集计1次分账播放的门槛`, s: `第29秒跳出不计，直接决定分账基数 · 行业拆解经验口径(非官方)` },
  { n: `超2000万`, l: `火龙漫剧单部最高分账(头部参照)`, s: `该剧制作成本约40万、投入产出比近50倍 · 腾讯视频2026-06发布会口径` },
```

### 3.2 js/data.js · industryNotes 末尾追加 4 条

**锚点**：`{ ico: \`🌏\`…tag: \`g\` },` 行（data.js:36）之后、该数组闭合 `],`（data.js:37）之前插入以下 4 行（字段结构一致 `{ ico, t, d, tag }`；标题条数 `行业${DB.industryNotes.length}个关键词` 会自动变为 8）：

```js
  { ico: `🛡️`, t: `合规进入硬执行期`, d: `《微短剧发展管理办法》（总局令第16号）2026-09-01施行：AI微短剧每集明显位置加提示标识（第34条）、片头标注剧名与许可证/备案编号（第27条）；罚则=警告/通报批评+十万元以下罚款（第46条），全文无当事人申诉条款。"凡播必审"管理提示9-4出台；总局今年以来下架违规微短剧6.8万部、处置账号1200+个，红果8月拦截下架8689部违规AI剧。备案三档：投资≥80万总局备案+发行证 / 30-80万省审 / <30万平台自审，未备案不得上线。`, tag: `h` },
  { ico: `📉`, t: `收益规则全面收紧`, d: `红果AI剧本保底S+级5万→1万（8-27生效，仅限AI对话型剧本）；"优质AI剧生产活动2.0"取消系列剧规模系数——多季铺量拿扶持被制度关闭，转向奖励单部真实热度；承制公司净利仅5%-8%；红果「平行世界」UGC续写截至10-02无任何分成规则，勿把平台拉新功能误读为变现机会。`, tag: `h` },
  { ico: `🎮`, t: `互动叙事成第二战场`, d: `DataEye：2026国内互动影游市场18-20亿元；《盛世天下》全系列销量破600万套、收入约1.5亿元；红果「平行世界」开放UGC续写（最多选3位角色/每人每日3次/约10秒成片，须官方审核进公共合集）；字节剪映ICG Studio与腾讯造化工坊等两个月4款产品对垒——"看剧→续写→陪伴"是IP角色资产二次变现方向。`, tag: `c` },
  { ico: `🎭`, t: `先AI验证、再真人翻拍`, d: `"反向开发"打法被行业命名：约10万元/部、数周出几十集的AI漫剧先验证IP流量，跑通后真人版精准承接——《剑宗团宠小师妹》原作累计播放34亿、真人版9-26开机80集；《万妖图录传》系列播放超60亿、真人版9-20开机。反面教训：《菩提临世》8亿播放因题材红线27天下架。真人短剧与AI漫剧亏损率均80-90%，这是IP孵化的风险对冲。`, tag: `c` },
```

### 3.3 js/app.js · RENDERERS.dashboard 整函数替换

**锚点**：`RENDERERS` 对象内 `dashboard() {`（app.js:437）至对应 `},`（app.js:471），整函数替换为下文。说明：
- 分组筛选用模块内 `setTimeout(0)` 绑定——`route()` 在渲染函数返回后才写 `sec.innerHTML`（app.js:210-218），且各模块每次加载只渲染一次（`sec.dataset.rendered` 守卫），绑定一次即全程有效；
- `data-mjx-overview-*` 为本模块私有属性，已核对全局事件委托（app.js:1943-2058）无同名分支，零冲突；复制按钮复用全局 `data-copy` 委托（app.js:1958）；
- **零新增 CSS**：全部复用 `.tool-filters/.chip/.copy-btn/.mini-note/.block-t/.stat-grid/.module-grid`（style.css:243、250、247、307、318、362），css/style.css 无需改动；
- 新增 JS 标识符均带 `mjxOverview` 前缀；分组按下标划定，未列入下标的末尾新增条目自动并入末组，未来追加数据不会丢。

```js
    dashboard() {
      const stat = (s) => '<div class="stat-card"><div class="s-num">' + s.n + '</div><div class="s-lab">' + s.l + '</div><div class="s-sub">' + s.s + '</div></div>';
      const note = (x) => '<div class="card"><div style="font-size:24px">' + x.ico + '</div><b style="display:block;margin:6px 0 4px">' + x.t + '</b><p style="font-size:12.8px;color:var(--tx2)">' + x.d + '</p><div style="margin-top:8px">' + (x.tag ? '<span class="tag ' + x.tag + '">' + { h: '⚠ 警示', c: '→ 机会', g: '→ 增长' }[x.tag] + '</span>' : '') + '</div></div>';
      const mod = (x, d) => '<div class="card mod-card" data-go="' + x.id + '"><span class="m-go">→</span><div class="m-ico">' + ICONS[x.ico] + '</div><b>' + x.n + '</b><p>' + d + '</p>' + (x.cnt ? '<span class="mod-badge">' + x.cnt + '</span>' : '') + '</div>';
      const modDesc = {
        pipeline: '九阶段全流程拆解，每阶段含工具/产出/避坑', tools: '视频模型对比表+' + DB.tools.length + '款工具的定位/价格/实战技巧', cameras: DB.cameras.length + '种运镜动画演示+可复制提示词',
        prompts: '2个万能公式+' + DB.promptBank.reduce((a, c) => a + c.items.length, 0) + '条模板+负面词对照表', canvas: '即梦/剪映Hub/可灵灵动画布等' + DB.canvas.tools.length + '款画布工具+七步实操', llm: '分镜JSON模板+完整一集示例+' + DB.llm.automation.length + '条自动化流水线路线',
        hot: '黄金3秒/反转/卡点/投流的量化标准', learning: '7天入门→30天产线→90天商业化的完整路径', monetize: DB.monetize.platforms.length + '大平台分账政策与出海打法',
        calc: '制作成本计算器+收益模拟器，一键算出回本播放量', cases: DB.cases.length + '个现象级案例的可复制经验',
        genres: '男频/女频/出海题材热度与对标，含2026新风向', rhythm: '98秒单集结构拍点判断，8题随机5题，练"拍点放第几秒"的结构感',
        checklist: DB.checklist.reduce((a, g) => a + g.items.length, 0) + '项自查清单，本地保存进度', glossary: DB.glossary.length + '条行业黑话分类速查', log: '每周自动研究更新记录',
        docs: RESEARCH_DOCS.length + '篇完整研究档案站内阅读，支持章节切换与全文检索',
        firstfilm: '7天出片闭环：D1-D7每天做什么/用什么工具/产出什么，含成本速算与进度自查', earnpath: '"我这种背景能赚多少"——对照表+决策树先立预期，再用计算器验证', orders: '接单渠道/报价单/合同模板/防骗清单，话术全部可复制',
      };
      /* mjxOverview 增强：数字墙按主题分组（下标划组，未列入下标的末尾新增条目自动并入末组） */
      const mjxOverviewGroups = [
        { id: 'market', t: '市场与需求', ids: [0, 1, 8, 13] },
        { id: 'supply', t: '产能与爆款率', ids: [2, 3, 4, 14] },
        { id: 'money', t: '收益与成本 · 先算三本账', ids: [6, 7, 15, 16, 17, 18] },
        { id: 'platform', t: '平台与出海', ids: [5, 9, 10, 11, 12, 19] },
      ];
      const mjxOverviewListed = {};
      mjxOverviewGroups.forEach((g) => g.ids.forEach((i) => { mjxOverviewListed[i] = 1; }));
      DB.quickStats.forEach((_, i) => { if (!mjxOverviewListed[i]) mjxOverviewGroups[mjxOverviewGroups.length - 1].ids.push(i); });
      const mjxOverviewStatTxt = (t, list) => '【' + t + '】漫剧行业数据口径 · 截至' + DB.meta.updated + '\n' + list.map((s) => '· ' + s.n + ' —— ' + s.l + '（' + s.s + '）').join('\n');
      const mjxOverviewAllTxt = mjxOverviewGroups.map((g) => mjxOverviewStatTxt(g.t, g.ids.map((i) => DB.quickStats[i]).filter(Boolean))).join('\n\n');
      const mjxOverviewStatHtml = '<div class="tool-filters"><span class="chip on" data-mjx-overview-filter="all">全部 ' + DB.quickStats.length + ' 条</span>' +
        mjxOverviewGroups.map((g) => '<span class="chip" data-mjx-overview-filter="' + g.id + '">' + g.t + '</span>').join('') +
        '<button class="copy-btn" data-copy="' + regCopy(mjxOverviewAllTxt) + '" style="margin-left:auto">⧉ 复制全部数据口径</button></div>' +
        mjxOverviewGroups.map((g) => {
          const list = g.ids.map((i) => DB.quickStats[i]).filter(Boolean);
          if (!list.length) return '';
          return '<div data-mjx-overview-group="' + g.id + '"><h4 class="block-t">' + g.t + ' <span class="sub">' + list.length + ' 条</span>' +
            '<button class="copy-btn" data-copy="' + regCopy(mjxOverviewStatTxt(g.t, list)) + '" style="margin-left:auto">复制本组</button></h4>' +
            '<div class="stat-grid">' + list.map(stat).join('') + '</div></div>';
        }).join('') +
        '<p class="mini-note">※ 各数字为不同机构/时点口径（DataEye/界面新闻/国新办/快手财报等），引用时请连同小字口径一并带走；"复制"按钮导出的文本已含口径。</p>';
      const mjxOverviewNotesTxt = DB.industryNotes.map((x) => '【' + x.t + '】' + x.d).join('\n\n');
      /* mjxOverview 增强：分组筛选——模块自有小交互，route() 写入 innerHTML 后下一帧绑定，不触碰全局事件设施 */
      setTimeout(() => {
        const sec = document.getElementById('sec-dashboard');
        if (!sec) return;
        sec.querySelectorAll('[data-mjx-overview-filter]').forEach((chip) => {
          chip.addEventListener('click', () => {
            const v = chip.getAttribute('data-mjx-overview-filter');
            sec.querySelectorAll('[data-mjx-overview-filter]').forEach((c) => c.classList.toggle('on', c === chip));
            sec.querySelectorAll('[data-mjx-overview-group]').forEach((g) => { g.style.display = (v === 'all' || g.getAttribute('data-mjx-overview-group') === v) ? '' : 'none'; });
          });
        });
      }, 0);
      return `
      <div class="hero">
        <span class="orb o1"></span><span class="orb o2"></span><span class="orb o3"></span>
        <div class="h-kicker">MANJU RESEARCH LAB · AI ANIME SHORT DRAMA</div>
        <h1>把 <em>AI漫剧</em> 做成一门<br>可复制的工业化手艺</h1>
        <p>本平台持续研究漫剧（AI动态漫画短剧）的最新开发流程、工具栈、运镜语言、无限画布工作流、大模型玩法与变现政策——研究成果全部结构化收录在此，由自动研究管线每周更新。</p>
        <div class="h-btns">
          <button class="btn pri" data-go="pipeline">从九阶段流程开始 →</button>
          <button class="btn ghost" data-go="tools">浏览工具库</button>
          <button class="btn ghost" data-go="cameras">看运镜演示</button>
        </div>
      </div>
      ${DB.log[0] ? '<button class="latest-strip" data-go="log"><span class="ls-badge">最新研究</span><span class="ls-txt">' + DB.log[0].date + ' · ' + DB.log[0].t + '</span><span class="ls-go">查看 →</span></button>' : ''}
      ${mjxOverviewStatHtml}
      <h4 class="block-t">2026年10月 · 行业${DB.industryNotes.length}个关键词<button class="copy-btn" data-copy="${regCopy(mjxOverviewNotesTxt)}" style="margin-left:auto">复制全部</button></h4>
      <div class="grid g4">${DB.industryNotes.map(note).join('')}</div>
      <h4 class="block-t">平台模块导航 <span class="sub">全部 ${NAV.length - 1} 个模块见左侧导航</span></h4>
      <div class="module-grid">
        ${['pipeline', 'tools', 'prompts', 'cameras', 'calc', 'docs'].map((id) => NAV.find((x) => x.id === id)).filter(Boolean).map((x) => mod(x, modDesc[x.id] || '')).join('')}
      </div>
      <h4 class="block-t">上手与变现 · 行动入口 <span class="sub">从这里开始动手</span></h4>
      <div class="module-grid">
        ${['learning', 'firstfilm', 'checklist', 'earnpath', 'orders', 'cases'].map((id) => NAV.find((x) => x.id === id)).filter(Boolean).map((x) => mod(x, modDesc[x.id] || '')).join('')}
      </div>
      <div class="callout red"><b>入局必读：</b>行业报价半年跌幅超90%、在播爆款率仅0.18%、红果已砍保底——先用「制作清单」里的"三本账"算清成本，再决定投入。可行路径：官方授权IP改编 + Agent流水线压成本 + 多平台矩阵分发 + 出海IAP溢价。</div>`;
    },
```

补丁代码合计约 90 行（data.js 11 行 + app.js 函数约 79 行），低于 350 行上限。

## 四、来源对照表

| 新增条目/事实 | 站内出处 | 原文关键句 |
|---|---|---|
| 2025微短剧+漫剧总产值超1000亿元（DataEye 2026-01） | research/01-行业全景与政策.md:19（§二市场数据表） | "2025微短剧+漫剧总产值 超1000亿元 DataEye 2026-01" |
| 2026-08抖音新剧AI占比75.4%、月上线74,313部（界面新闻） | research/01:25 | 表行原文直录 |
| "90%以上公司不赚钱"（澎湃2026-08-17转每日经济新闻/钛媒体/CBNData；投中网出处未命中已注） | research/23:9、112 | "落档以澎湃/钛媒体/CBNData口径为准" |
| 收益三分层：底层70%+月收益0-几百元 / 约20%月营收数千-2万 / <10%月营收2万+（分层出处原文未复核，与DataEye 2025口径量级相容） | research/23:11、112 | "底层70%+创作者月收益0-几百元……【原文未复核】，但与同题公开口径量级相容" |
| 三五千元成本剧按万播5元需约100万播放回本、平均播放几十万-两三百万、大部分不回本（澎湃测算） | research/23:12 | "AI漫剧最低成本三五千元，按万播5元需约100万播放才回本" |
| 红果单集观看≥30秒计1次分账播放、第29秒跳出不计（行业拆解经验口径） | research/24:88 | "比'播放量'严格得多，直接决定分账基数" |
| 火龙单部最高分账超2000万元、成本约40万、投入产出比近50倍（腾讯2026-06发布会口径） | research/17:65 | "（腾讯视频6月年度发布会披露）" |
| 《微短剧发展管理办法》9-1施行、AI标识第34条、编号第27条、罚则十万元以下第46条、无申诉条款 | research/22:52、54、136；research/17:11 | "总局官网《微短剧发展管理办法》全文在……第34/27/36条以原直读为准" |
| "凡播必审"管理提示9-4 | research/22:48 | "广电总局网络视听司发布管理提示" |
| 总局下架违规微短剧6.8万部、处置账号1200多个（9-17国新办口径） | research/22:47、136 | "⑨新浪2026-09-17逐字（下架6.8万部、处置账号1200多个）" |
| 红果8月拦截下架8689部违规AI剧 | research/17:11、49；research/22:89 | 同数互证 |
| S+保底5万→1万、8-27生效、仅限AI对话型剧本 | research/17:47；research/24:12 | "8-25红果通知、8-27生效……仅限AI剧对话型剧本" |
| "优质AI剧2.0"取消系列剧规模系数、奖励单部真实热度 | research/17:9、44 | "'多季铺量'路线在政策层面终结" |
| 承制净利5%-8%（平台包干20-50万/部） | research/22 §二"承制利润薄如纸"（腾讯新闻/36氪2026-09-24） | "制作公司仅赚5%-8%承制利润" |
| 互动影游市场18-20亿元、《盛世天下》600万套/约1.5亿元 | research/25:41 | "DataEye：2026国内互动影游市场18-20亿元" |
| 平行世界机制（3位角色/每日3次/约10秒/官方审核）与"无分成规则，勿误读为变现机会" | research/25:25、26 | "避免把平台拉新功能误读为分成机会" |
| 剪映ICG Studio / 腾讯造化工坊等两个月4款 | research/25 §1.2 | "腾讯系：两个月4款产品" |
| 剑宗原作34亿播放、真人版9-26开机80集；万妖60亿+真人版9-20开机 | research/25:68、§1.4 | "本条增量为'原作34亿播放、单日热度破亿'" |
| 《菩提临世》8亿播放27天下架 | research/25:73 | "8亿播放归零）的合规反面案例" |
| 亏损率均80-90%（36氪2026）、"反向开发"命名 | research/25:65 | "真人短剧与AI漫剧亏损率均高达80-90%" |

## 五、需人工核实

无。所有写入代码的新增条目均有上表所列站内出处；其中两条源档案自带的低置信标注（三分层"原文未复核"、≥30秒"经验口径非官方"）已原样保留在条目 `s` 小字中，未洗白为硬事实。另注：modDesc 新增的 firstfilm/earnpath/orders 三条为站内既有模块描述（app.js:132-135）的改写，无新事实。

## 六、不做的事

1. **不改任何现有条目**：13 条 quickStats、4 条 industryNotes 的字段与数字口径一字不动（含底部 callout 的"0.18%"），仅数组末尾追加；
2. **不新增 CSS**：全部复用现有类，css/style.css、index.html、sw.js 零改动；
3. **不碰公共设施**：路由（app.js:197-249）、全局事件委托（app.js:1943-2058）、命令面板、全局搜索、收藏系统均不动；分组筛选是模块内 `setTimeout(0)` 自绑定，`data-mjx-overview-*` 私有属性不与任何全局分支撞名；
4. **不做数字墙排序**：各数字机构/时点口径不同，排序会制造"可横向比较"的错觉且打散既有顺序——用分组替代；
5. **不收录存疑数字**：刻意避开——"300万播放仅收益500元"（research/22 判为存疑·原出处不明）、"10月在投超4000部"（系2025年10月口径，research/22 本轮最重要的口径修正）、"AI仿真人剧占比38%"（与既有 quickStats"38% 付费用户重合率"数字撞车易误读）、各"月入过万"个例（research/23 明确要求不做暴富案例墙）；
6. **不新建模块**、不改模块 id/导航结构/SECTION_SUB，不加路由项。
