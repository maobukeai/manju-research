# 细化方案：接单实操包

> 模块 id：`orders` ｜ 数据区：`js/data.js:2017-2271`（区注释锚点 `/* ================= 接单/商单实操包 ================= */`，`orders: {` 起于 2023 行）｜ 渲染函数：`js/app.js:773-854`（`orders()`）
> 本方案只允许改动两处现实文件：`js/data.js`（orders 数据区增量 + 新增 1 键）与 `js/app.js`（orders() 渲染函数整函数替换）。其余 js/、css/、index.html、sw.js、research/ 一律只读，未做任何改动。
> 补丁代码合计 **121 行**（数据增量 34 行 = 3+4+2+22+3，渲染函数 87 行），低于 350 行上限。
> 自验已通过：①锚点唯一性 6/6；②合并后 `node --check` 数据层与渲染层均语法通过；③结构断言 40+ 条全 PASS（既有键/条目数/数字口径未动、新条目字段结构与同区完全一致）；④`orders()` 整函数替换逐行差异核对：恰为计划内"2 行 h4 改写 + 5 行新增"；⑤渲染冒烟：以桩环境实跑替换后的 `orders()`，输出 HTML 含全部新小节/按钮/动态计数、无 `undefined`/`NaN`。自验在系统临时目录完成，仓库内除本方案文档外零改动。

---

## 一、现状盘点

**数据区构成**（`js/data.js:2023-2271` 的 `orders` 对象，共 9 个既有键）：

| 键 | 形态 | 条目数 | 行号 | 内容 |
|---|---|---|---|---|
| `note` | 模板字符串 | 1 | 2024 | 模块定位："会做片子之后，怎么收到第一笔钱" |
| `channels` | `{cats[5], items[12], extra}` | 12 渠道 | 2028-2045 | 垂直平台 7 + 流量平台 2 + 私域威客 2 + 海外 1；fee 空缺时渲染器标注"以平台结算页为准" |
| `pricing` | `{tiers[6], factors[4], notes[5], quoteTpl}` | 6+4+5 | 2048-2101 | 三市场分层六档、报价四因子、注记、28 行报价单模板（`{{token}}` 由计算器代入） |
| `scripts` | `{t,d,txt}[4]` | 4 | 2104-2109 | 报价/拒白嫖/催尾款/拒私下转账话术 |
| `folio` | `{rules[4], samples[3], proof[4]}` | 11 | 2112-2131 | 三部样片选题+数据证据 |
| `delivery` | `{g, items[]}` ×6 组 | 11 项 | 2135-2159 | 分辨率/时长/字幕/音轨/AI标识合规/交付包 |
| `contract` | `{flow[5], clauses[6], tpl}` | 11 | 2162-2223 | 收款五步、六条款、43 行合同模板 |
| `scams` | `{t,sign,how,src}[6]` | 6 | 2227-2234 | 六类骗术 |
| `plan` | `{note, phases[4], checklist[4组14项]}` | 19 | 2237-2270 | 14 天行动计划+进度自查（`manju_od_progress_v1` 本地存储） |

合计约 84 个数据条目 + 3 段可复制长文本（报价单/合同模板/确认单前只有前两者）。骨架完整（渠道→报价→作品集→交付→合同→防骗→14 天），工具密度已是全站最高之一。

**渲染层**（全部无需新建）：`orders()` 主渲染 `app.js:773-854`；`renderOdChannels`（1283-1296，渠道筛选，渠道计数 mini-note 读 `items.length` 自动更新）；`odQuoteCompute`（1297-1335，报价计算器+模板代入）；`refreshOdProgress`（1336-1354，14 天进度）；事件接线 `app.js:1998-2005` 与 input 委托 2065；全局搜索索引 `app.js:1804-1812` 对 channels/tiers/factors/samples/delivery/clauses/scams/plan 逐条 forEach——**数组追加即自动进索引，零改动**。

**缺什么、哪里最薄**（按伤害排序，均为对照 research/ 档案后的实缺口）：

1. **渠道区停在 2026-09-09 的"7 垂直平台+5 补充"**：9 月下旬已落地的两类 Q4 新机会——快手星芒×可灵创投 2.0（research/17§2.2）、腾讯火龙漫剧挑战赛（research/08§v2.7·6）——档案已录、模块未收。对一个回答"去哪接单"的页，最新机会缺位最伤。
2. **报价"下探"证据链滞后 + 只有乙方视角**：注记停在 36氪 1000-1500 元/分钟与央视 -90%；research/17§2.1 经济观察网"精品短剧压至 600-800 元/分钟"（9-28）、research/20§③ 投中网"精品 800-1500 元/分钟"未收。更要紧的是全部注记都是"我收多少"视角，research/22§二"平台按 20 万-50 万包干、承制净利仅 5%-8%"的甲方包干视角完全缺位——只回答"收多少"，没回答"接了整季包干还剩多少"。
3. **商单形态少一类**：单集品牌植入 1000-2000 元/集（research/18§A5.2），在更剧集的存量产能变现路径未提及。
4. **话术全是"防守型"**：4 段话术覆盖拒白嫖/催尾款/拒转账，缺"开工前"两步——brief 澄清与加急定价，恰是报价四因子里最容易被口头带过、纠纷最高发的两处（research/23§4.2）。
5. **合同缺乙方自保条款**：现有 6 条款里甲方"已读不回"（验收拖延）与"素材/授权迟迟不到位"（交期卡死在甲方侧）两类高频纠纷无对应条款。
6. **工具链缺"开工工具"**：有谈价工具（报价单）与签约工具（合同），缺开工前的 brief 书面化确认单——brief 不清就开工是无限改稿与尾款纠纷的共同起点。
7. **交互缺"整组复制"**：交付标准 11 项与话术 6 段只能逐条复制，交付前自查、发客户确认都要手工拼。

## 二、变更清单（逐条，含出处）

| # | 变更 | 落点 | 内容 | 出处 |
|---|---|---|---|---|
| 1 | 渠道 +2 | `orders.channels.items` 追加（闲鱼条之前，保持 flow 分组相邻） | ①快手星芒×可灵AI漫剧创投（保底 2 万现金起/三合作模式/结算兑现 1300 万）；②腾讯火龙漫剧挑战赛（三赛道/100 万奖金+商单推荐，存疑项随条内联标注） | research/17§2.2、research/08§v2.7·6、research/20§2.3 |
| 2 | 报价注记 +3 | `orders.pricing.notes` 尾部追加 | ①承制下探至 600-800 元/分钟+投中网 800-1500 对照成本线；②承制包干 20-50 万、净利仅 5%-8% 的"净利视角"；③单集植入 1000-2000 元/集形态 | research/17§2.1、research/20§③、research/22§二（+research/08§四承制ToB 同口径）、research/18§A5.2 |
| 3 | 话术 +2 | `orders.scripts` 尾部追加 | 需求澄清话术（四因子逐项对表）、加急报价话术（加急上浮写进单价） | authored 工具文本；策略依据 research/23§4.2（四因子、加急另议） |
| 4 | 合同条款 +2 | `orders.contract.clauses` 尾部追加 | 验收沉默期（____日未反馈视为验收通过）、甲方配合与工期顺延 | authored 模板条款；依据 research/23§4.3 标准收款流程与纠纷类型 |
| 5 | 新增键 `orders.briefTpl` | `orders` 根对象（scripts 之后、§3 之前） | 接单需求确认单模板（五段式：规格/交付范围/交付标准/商务/双方确认），规格口径逐项对齐 §4 交付标准清单既有口径 | authored 工具文本；策略依据 research/23§4.2；规格引用站内 delivery 既有口径，不另立数字 |
| 6 | 渲染函数整函数替换 | `js/app.js:773-854` `orders()` | ①新增"接单需求确认单"小节（渲染 briefTpl+复制按钮）；②"复制全部话术"整组复制按钮；③"复制为自查清单"整组复制按钮；④话术计数"4段"改动态 `O.scripts.length`；其余 78 行逐字保留 | 站内既有机制：全局 `[data-copy]` 委托（app.js:1958-1959）+ `regCopy`（app.js:46-47），零新事件、零新 CSS |

不做的事（节选，全表见 §六）：不动 `quoteTpl`/`contract.tpl` 文本、不动六档 tiers 与全部既有数字口径、不动渲染辅助函数与事件接线/存储键、不改字段结构（新条目字段与同区现有条目完全一致）。

## 三、落点与代码

### 改动 1 · `js/data.js`：`channels.items` 内、快手磁力引擎条之后插入两条新渠道

**锚点**：`data.js:2039` 的 `{ n: \`快手磁力引擎\`…` 条目行之后、`data.js:2040` 的 `{ n: \`闲鱼 / 猪八戒 / 一品威客\`…` 条目行之前。插在闲鱼之前使两条 flow 类新渠道与巨量星图/快手磁力引擎相邻，默认"全部"视图保持分组聚拢。以下 3 行整体插入：

```js
      /* 细化轮2026-10-07增量：Q4新机会渠道两条（创投/挑战赛），数值口径取自 research/17§2.2 与 research/08§v2.7·6，存疑项随条标注 */
      { n: `快手星芒 × 可灵AI漫剧创投`, c: `flow`, bar: `按创投规则提交项目提案（联合出品/剧本合作/联合运营三种模式，以星芒后台为准）`, feat: `全年8亿元分账+2亿元精品孵化现金+10亿级专属流量；创投2.0单项目保底2万元现金+40万灵感值，最高50万现金、1000万灵感值、1亿流量；行业判断：补贴托得起产能、托不起每家工作室的盈亏平衡`, fee: `创投保底2万元现金起（创投2.0口径）；结算兑现：7月账单十家机构共获1300万元（剧短线2026-09-21原文核验）`, src: `research/17§2.2（流媒体网综合2026-09-30）/「变现运营」快手条` },
      { n: `腾讯火龙漫剧挑战赛（9-29启动）`, c: `flow`, bar: `三大赛道：工具（社区指绑定腾讯系创作工具【存疑】）/IP（开放央视老版四大名著）/故事（纪念长征胜利90周年）；持续12周、6次创周激励`, feat: `总奖金100万元现金+650万积分（流媒体网口径，海报未写明分配方式）；配套流量扶持/商单推荐/IP合作/独家签约——对新手是"比赛背书+商单推荐"的进场券`, fee: `奖金制（非抽成分账）；活动以海报发布、官方细则文档未见面世，产品名以官方页为准【存疑】`, src: `research/08§v2.7·6（腾讯新闻"短剧研究僧"/流媒体网2026-09-29原文直读）、research/20§2.3` },
```

插入后渠道 12→14；渠道筛选 chips（cats 未动）、渠道计数 mini-note（app.js:1288 读 `items.length`）、全局搜索索引（app.js:1804 forEach）全部自动跟随。

### 改动 2 · `js/data.js`：`pricing.notes` 数组末条之后追加三条注记

**锚点**：`data.js:2070` 的注记末条（含"先干活后收钱的单，等于免费给对方做风控"，该片段全文件唯一）之后、`data.js:2071` 的 `],`（notes 数组收口）之前。以下 4 行整体插入：

```js
      /* 细化轮2026-10-07增量：报价下探补最新口径 + 承制端"净利"视角 + 植入形态（research/17/20/22/18） */
      `承制报价下探到成本线贴脸：经济观察网2026-09-28——AI漫剧承制价格自4月起一路下跌，精品短剧压至600-800元/分钟（research/17§2.1）；投中网口径精品AI短剧800-1500元/分钟、单部约10万元（research/20§③，投中网转述口径）——对照AI中档成本线800-1200元/分钟，"中档价"正在被报价击穿：报价前先确认甲方预算对应哪一档，别按旧行情锚定`,
      `承制包干是薄利生意：平台按20万-50万元包下制作费、承制公司净利仅5%-8%（《短剧苦红果久矣》腾讯新闻/36氪2026-09-24，research/22§二；「变现运营」承制ToB条"一部20-50万、最高100万+"同口径）——接整季包干单按净利而不是流水算收入，垫资与返工最先吃掉这5%-8%`,
      `在更剧集还有第三种商单形态：单集品牌植入1000-2000元/集、几十集总植入仅数万元、远低于真人短剧（知乎·60亿播放团队复盘2026，research/18§A5.2）——前提是先有在更的剧：新手第一单别指望它，连载跑起来后把它当存量产能的增量变现`,
```

注记渲染进报价计算器下方 mini-note（`P.notes.join('<br>')`，app.js:792），追加即生效，不改任何既有注记。

### 改动 3 · `js/data.js`：`scripts` 数组末条之后追加两段话术，并在 `],` 收口后新增 `briefTpl` 键

**锚点**：`data.js:2108` 的 `{ t: \`收款方式话术 · 拒绝私下转账\`…` 条目行（全文件唯一）之后。分两步：

**3a** 在该条目行之后、`data.js:2109` 的 `],`（scripts 收口）之前，插入以下 2 行：

```js
    { t: `需求澄清话术 · 先对表再报价`, d: `brief不清就开工，是无限改稿与尾款纠纷的共同起点——报价四因子（时长/难度/周期/轮次）逐项问清再报价（research/23§4.2）；配套工具见上方"接单需求确认单"`, txt: `收到～为了准确报价，先跟您对几个关键项：①成片时长与集数；②题材与画风参考（有对标样片最好）；③是否含脚本/配音/字幕全包；④修改轮次与期望交付时间；⑤预算区间。您逐项确认后，我按对应档位出正式报价单，双方按单执行。` },
    { t: `加急报价话术 · 加急另议写进单价`, d: `交付周期是报价四因子之一，加急不加价等于用自己的返工率补贴甲方；口头"尽快"是纠纷源头（research/23§4.2）`, txt: `常规交付周期为定金到账后____个工作日。如需加急到____个工作日，按总价上浮____%（用于插单优先排期），修改轮次与交付标准不变——加急压缩的是周期，不是流程与验收标准。` },
```

**3b** 在 `data.js:2109` 的 `],`（scripts 收口）之后、`data.js:2111` 的 `/* ---- §3 作品集怎么搭 ---- */` 之前，插入以下 21 行（新键 `briefTpl`，orders 根对象增量，2 空格缩进与同区 `channels:`/`pricing:` 等键一致；落地时在 `],` 与注释行之间保留 1 个空行，共占 22 行——与同区各 § 注释前的空行风格一致）：

```js
  /* ---- 接单需求确认单（细化轮2026-10-07新增键 briefTpl；authored 工具文本——规格项对齐 §4 交付标准清单口径，策略依据 research/23§4.2 四因子） ---- */
  briefTpl: `【接单需求确认单】
（开工前发甲方书面确认，对方回复"确认"留痕即生效；确认后再出正式报价单与合同）

项目名称：________________
一、内容规格
  · 题材/画风：____________（对标参考：____________）
  · 时长与集数：共____集 × 每集约____分钟（单集按98秒-2分钟情绪闭环）
  · 画幅：9:16竖屏为主；16:9横屏备用（是/否）
二、交付范围（含项打√、不含项划掉——四因子逐项过，防"以为只做生成、验收要全片"）
  · 脚本/分镜：□含 □不含      · 配音：□含 □不含
  · 字幕：□含 □不含            · BGM/音效：□含 □不含
  · 修改轮次：____轮（超出按每轮总价____%另计，书面确认后实施）
三、交付标准
  · 按「接单/商单实操包」交付标准清单执行：1080P / 字幕逐句校对 / 对白音效BGM三轨分离 / AI标识合规
  · 交付日：定金到账后____个工作日；加急按总价上浮____%
四、商务口径
  · 预算区间：____________（对照「报价方法论」六档位对表）
  · 付款：定金30%-50%（____________元）签约当日支付，尾款于源文件发出前结清，走平台担保交易
五、双方确认
  甲方：____________  日期：________    乙方：____________  日期：________`,
```

话术 4→6 段；新键 `briefTpl` 由改动 5 的渲染函数消费，在此之前插入不产生任何副作用（无人读取即静默存在，与 quoteTpl 落库方式一致）。

### 改动 4 · `js/data.js`：`contract.clauses` 数组末条（合规分工）之后追加两条乙方自保条款

**锚点**：`data.js:2177` 的 `{ t: \`合规分工\`…src: \`「变现运营」compliance三门票条\` },` 条目行（"compliance三门票条"全文件唯一）之后、`data.js:2178` 的 `],`（clauses 收口）之前。以下 3 行整体插入：

```js
      /* 细化轮2026-10-07增量：乙方自保条款两条（authored 模板条款，依据 research/23§4.3 收款流程与纠纷类型；签约前咨询专业意见） */
      { t: `验收沉默期`, d: `甲方收到验收版后____日内未书面反馈视为验收通过、自动进入尾款环节——没有这条，"已读不回"会无限拖住收款节点；确认方式沿用标准收款流程第三步的书面留痕，与修改轮次上限配套使用`, src: `authored模板条款（依据research/23§4.3收款流程）` },
      { t: `甲方配合与工期顺延`, d: `甲方提供的IP授权/素材/参考反馈逾期，交付周期相应顺延且不视为乙方违约——素材授权链卡在甲方侧是交期纠纷的常见源头；顺延天数以书面记录为准`, src: `authored模板条款（依据research/23§4.3素材授权与纠纷类型）` },
```

条款 6→8 条，自动进条款表与全局搜索索引（app.js:1809 forEach）。**不动 `contract.tpl` 模板文本**——新条款以条款表行形式增量，避免与用户已复制存档的旧模板产生版本混淆；是否回写模板留给后续迭代决策。

### 改动 5 · `js/app.js`：`orders()` 渲染函数整体替换（app.js:773-854）

**锚点**：`app.js:773` 的 `    orders() {` 起至 `app.js:854` 的 `    },` 止（下一方法为 `calc() {`，app.js:856）。用以下 **87 行完整函数体**整体替换——与原函数逐行差异恰为：新增 1 行注释 + 3 个常量（briefCode/allScriptsTxt/deliveryTxt）+ 1 个"接单需求确认单"小节 h4，改写 2 行 h4（话术计数动态化 + 两处整组复制按钮）；其余 78 行逐字未动。零新事件、零新 CSS：三个复制控件全部走全局 `[data-copy]` 委托（app.js:1958-1959）与 `regCopy`（app.js:46-47），按钮置于 `h4.block-t`（flex 布局，`margin-left:auto` 推右，与 `.pb-cat .copy-btn` 既有用法同款）：

```js
    orders() {
      const O = DB.orders, P = O.pricing;
      /* §2 报价：三市场分层表 + 四因子 + 计算器 + 报价单模板 */
      const tierChips = P.tiers.map((t, i) => '<span class="chip' + (i === odTier ? ' on' : '') + '" data-odtier="' + i + '" title="' + esc(t.src) + '">' + t.n + '</span>').join('');
      const tierRows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:130px">市场档位</th><th style="min-width:130px">报价口径</th><th>说明与口径来源</th><th style="min-width:200px">使用提示</th></tr></thead><tbody>' +
        P.tiers.map((t) => {
          const u = (t.cur === '$' ? '美元/' : '元/') + t.unit;
          const rng = t.lo === t.hi ? t.lo + u + '起' : t.lo + '-' + t.hi + ' ' + u;
          return '<tr><td><b>' + t.n + '</b></td><td style="color:var(--gold);font-weight:700;white-space:nowrap">' + rng + '</td>' +
            '<td style="color:var(--tx2)">' + t.d + '<br><span style="font-size:11px;color:var(--tx3)">' + t.src + '</span></td>' +
            '<td style="color:var(--tx2);font-size:11.5px">' + t.verd + '</td></tr>';
        }).join('') + '</tbody></table></div>';
      const factorCards = P.factors.map((f) => '<div class="card"><span class="tag c">' + f.t + '</span><p style="font-size:12.6px;color:var(--tx2);margin:8px 0 0">' + f.d + '</p></div>').join('');
      const quoteBox = '<div class="chart-box"><h5>💰 报价参考计算器 <span class="sub">市场档位 × 时长 · 定金即算 · 纯本地计算</span></h5>' +
        '<div class="tool-filters" style="margin-bottom:10px">' + tierChips + '</div>' +
        '<div class="calc-grid">' +
        '<label class="calc-num"><span>时长</span><span class="cn-in"><input type="number" id="od-mins" value="2" step="0.5" min="0"><i>分钟</i></span></label>' +
        '<label class="calc-num"><span>系列单资产复用折扣</span><span class="cn-in"><input type="number" id="od-reuse" value="0" step="5" min="0" max="40"><i>%</i></span></label>' +
        '</div><div class="calc-out" id="odQuoteOut"></div>' +
        '<p class="mini-note">' + P.notes.join('<br>') + '</p>' +
        '<div class="codebox" style="margin-top:10px"><div class="cb-bar"><span>报价单模板（计算结果自动带入 · 复制后填空即用）</span><button class="copy-btn" id="odQuoteCopy">复制</button></div><pre id="odQuotePre"></pre></div></div>';
      const scriptCards = O.scripts.map((s) => '<div class="card pf-card"><div class="pf-t">' + s.t + '</div>' +
        '<p style="font-size:12.4px;color:var(--tx2);margin:6px 0 8px">' + s.d + '</p>' +
        '<div class="codebox"><div class="cb-bar"><span>话术 · 复制后填空即用</span><button class="copy-btn" data-copy="' + regCopy(s.txt) + '">复制</button></div><pre>' + esc(s.txt) + '</pre></div></div>').join('');
      /* 细化轮增量（2026-10-07）：需求确认单渲染 + 两组"一键复制整组"——零新事件/零新CSS，复用全局 [data-copy] 委托（app.js:1958）与 regCopy 登记 */
      const briefCode = O.briefTpl ? '<div class="codebox" style="margin-top:12px"><div class="cb-bar"><span>接单需求确认单（开工前发甲方书面确认 · 回复"确认"留痕 · 复制后填空即用）</span><button class="copy-btn" data-copy="' + regCopy(O.briefTpl) + '">复制</button></div><pre>' + esc(O.briefTpl) + '</pre></div>' : '';
      const allScriptsTxt = '【AI漫剧接单话术合集】\n\n' + O.scripts.map((s) => '◆ ' + s.t + '\n' + s.txt).join('\n\n────\n\n');
      const deliveryTxt = '【交付标准自查清单】\n' + O.delivery.map((g) => '▍' + g.g + '\n' + g.items.map((it) => '  · ' + it.t + '：' + it.d).join('\n')).join('\n');
      /* §3 作品集 */
      const folioRules = '<div class="callout"><ul style="margin:0;list-style:disc">' + O.folio.rules.map((r) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + r + '</li>').join('') + '</ul></div>';
      const sampleCards = O.folio.samples.map((s) => '<div class="card" data-hl="' + esc(s.n) + '"><b>' + s.n + '</b>' +
        '<div class="gd-bench" style="margin:6px 0 4px">🎯 对标：' + s.ref + '</div>' +
        '<p style="font-size:12.6px;color:var(--tx2);margin:0 0 8px">' + s.d + '</p>' +
        '<span class="tag c">为什么是它：' + s.why + '</span></div>').join('');
      const proofList = '<div class="chart-box" style="margin-top:12px"><h5>数据与产能证据（甲方看什么）</h5><ul style="margin:0;list-style:disc">' +
        O.folio.proof.map((p) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + p + '</li>').join('') + '</ul></div>';
      /* §4 交付标准 */
      const deliveryTbl = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:130px">分组</th><th style="min-width:110px">标准项</th><th>要求</th><th style="min-width:190px">口径出处</th></tr></thead><tbody>' +
        O.delivery.map((g) => g.items.map((it, ii) =>
          '<tr><td>' + (ii === 0 ? '<b>' + g.g + '</b>' : '') + '</td><td><b>' + it.t + '</b></td>' +
          '<td style="color:var(--tx2)">' + it.d + '</td><td style="color:var(--tx3);font-size:11.5px">' + it.src + '</td></tr>').join('')).join('') +
        '</tbody></table></div>';
      /* §5 合同与定金 */
      const flowHtml = '<div class="step-flow">' + O.contract.flow.map((f) => '<div class="step-item"><b>' + f.t + '</b><p>' + f.d + '</p></div>').join('') + '</div>';
      const clauseRows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:110px">关键条款</th><th>要点</th><th style="min-width:200px">依据</th></tr></thead><tbody>' +
        O.contract.clauses.map((c) => '<tr><td><b>' + c.t + '</b></td><td style="color:var(--tx2)">' + c.d + '</td><td style="color:var(--tx3);font-size:11.5px">' + c.src + '</td></tr>').join('') +
        '</tbody></table></div>';
      const tplCode = '<div class="codebox"><div class="cb-bar"><span>合同核心条款模板（可复制后按项目调整 · 签约前咨询专业意见）</span><button class="copy-btn" data-copy="' + regCopy(O.contract.tpl) + '">复制</button></div><pre>' + esc(O.contract.tpl) + '</pre></div>';
      /* §6 防骗 */
      const scamCards = O.scams.map((s) => '<div class="card" data-hl="' + esc(s.t) + '"><span class="tag h">骗术 · ' + s.t + '</span>' +
        '<p style="font-size:12.6px;margin:8px 0 4px"><b>识别信号：</b>' + s.sign + '</p>' +
        '<p style="font-size:12.6px;color:var(--tx2);margin:0 0 6px"><b style="color:var(--ok)">应对：</b>' + s.how + '</p>' +
        '<p style="font-size:11px;color:var(--tx3);margin:0">' + s.src + '</p></div>').join('');
      /* §7 14天计划（进度自查复用 ff-ck 样式族，独立存储键） */
      const ckGroups = O.plan.checklist.map((g, gi) => {
        const items = g.items.map((it, ii) => '<div class="ff-ck od-ck" data-odck="' + gi + '-' + ii + '"><span class="box"></span><span>' + it + '</span></div>').join('');
        return '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><b style="font-size:13px">' + g.d + ' · ' + g.t + '</b><span class="tag" id="odg-' + gi + '">0/' + g.items.length + '</span></div>' + items + '</div>';
      }).join('');
      const ckTotal = O.plan.checklist.reduce((a, g) => a + g.items.length, 0);
      const planBox = '<div class="chart-box"><h5>✅ 14天进度自查 <span class="sub">勾选自动保存在本机浏览器</span></h5>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:15px" id="odPct">0%</b><span class="mini-note" style="margin:0" id="odNum"></span>' +
        '<button class="copy-btn" id="odReset" style="margin-left:auto">↻ 重置进度</button></div>' +
        '<div class="ff-bar"><div class="ff-fill" id="odFill"></div></div>' +
        '<div class="grid g2" style="margin-top:12px;gap:10px 18px">' + ckGroups + '</div>' +
        '<p class="mini-note" style="margin-top:8px">共' + ckTotal + '项 · 与「制作清单」「第一部成片」7天清单相互独立保存。</p></div>';
      const phaseCards = O.plan.phases.map((p) => '<div class="card"><span class="tag c">' + p.d + '</span>' +
        '<b style="display:block;margin:6px 0 4px">' + p.t + '</b>' +
        '<p style="font-size:12.6px;color:var(--tx2);margin:0">' + p.d2 + '</p></div>').join('');
      return '<div class="callout gold" style="margin-bottom:16px"><b>从"会做片子"到"能收钱"。</b>' + O.note + '</div>' +
        '<h4 class="block-t" style="margin-top:0">① 接单渠道盘点 <span class="sub">垂直平台7个口径：网易·数艺社2026-09-09（research/23§4.1 原文核验）</span></h4>' +
        '<div class="tool-filters" id="odChips"></div><div class="grid g2" id="odGrid"></div>' +
        '<div class="callout" style="margin-top:12px"><b>渠道总原则：</b>' + O.channels.extra + '</div>' +
        '<h4 class="block-t">② 报价方法论 <span class="sub">三市场分层 + 四因子 + 计算器（参照「变现运营」成本阶梯800-1200元/分钟）</span></h4>' + tierRows +
        '<div class="grid g4" style="margin-top:12px">' + factorCards + '</div>' + quoteBox +
        '<h4 class="block-t">接单需求确认单 <span class="sub">brief不清就开工，是无限改稿与尾款纠纷的共同起点——先书面钉死口径再报价</span></h4>' + briefCode +
        '<h4 class="block-t">接单话术 <span class="sub">' + O.scripts.length + '段可复制 · 填空即用</span><button class="copy-btn" style="margin-left:auto" data-copy="' + regCopy(allScriptsTxt) + '">📋 复制全部话术</button></h4><div class="grid g2">' + scriptCards + '</div>' +
        '<h4 class="block-t">③ 作品集怎么搭 <span class="sub">3部不同题材样片 + 数据截图（用「案例拆解」案例库的对标思路）</span></h4>' + folioRules +
        '<div class="grid g3" style="margin-top:12px">' + sampleCards + '</div>' + proofList +
        '<h4 class="block-t">④ 交付标准清单 <span class="sub">分辨率/时长/字幕/音轨/AI标识合规——AI标识整段引用「变现运营」compliance</span><button class="copy-btn" style="margin-left:auto" data-copy="' + regCopy(deliveryTxt) + '">📋 复制为自查清单</button></h4>' + deliveryTbl +
        '<h4 class="block-t">⑤ 合同与定金 <span class="sub">标准收款流程：research/23§4.3 · 定金30-50%</span></h4>' + flowHtml + clauseRows + tplCode +
        '<h4 class="block-t">⑥ 防骗指南 <span class="sub">六类骗术 × 识别信号 × 应对（research/23§4.3）</span></h4><div class="grid g2">' + scamCards + '</div>' +
        '<h4 class="block-t">⑦ 从0到第一单的14天行动计划 <span class="sub">诚实预期：14天=接单准备，不是14天赚到钱（首笔收入第60-90天）</span></h4>' +
        '<div class="callout" style="margin-bottom:12px">' + O.plan.note + '</div>' +
        '<div class="grid g4" style="margin-bottom:12px">' + phaseCards + '</div>' + planBox +
        '<div style="margin-top:12px"><button class="btn pri" data-go="earnpath">用「收益决策树」对表收入预期 →</button> ' +
        '<button class="btn ghost" data-go="calc">用「互动计算器」算自己的单分钟成本 →</button></div>';
    },
```

**兼容性核对**（均已断言）：全部既有 DOM id 保留（odQuoteCopy/odQuotePre/odChips/odGrid/od-mins/od-reuse/odQuoteOut/odPct/odNum/odReset/odFill/odg-N）；`data-odcat`/`data-odtier`/`.od-ck` 结构不变；事件接线（app.js:1998-2005、2065）、`renderOdChannels`/`odQuoteCompute`/`refreshOdProgress`/`toggleOdCk`/`resetOdProgress`、存储键 `manju_od_progress_v1`（app.js:1279）零改动——**14 天旧进度数据完全兼容**；`briefCode` 对 `O.briefTpl` 做了存在性守卫，即使数据层先于/后于渲染层单独上线也不报错。

## 四、来源对照表

| 新增内容 | 落点 | 出处 | 关键原文依据（research/ 档案内文字） |
|---|---|---|---|
| 快手星芒×可灵AI漫剧创投 | channels.items | research/17§2.2（53-55 行） | "8亿元分账+2亿元精品孵化现金+10亿级专属流量；创投2.0单项目保底2万元现金+40万灵感值，最高50万现金、1000万灵感值、1亿流量；三种合作模式（联合出品/剧本合作/联合运营）"；"7月账单显示十家机构共获1300万元（剧短线2026-09-21，原文核验）"；"补贴托得起产能、托不起每家工作室的盈亏平衡" |
| 腾讯火龙漫剧挑战赛 | channels.items | research/08§"更新·2026-10-02（v2.7）·6"（160 行）+ research/20§2.3 | "三大赛道——工具赛道…IP赛道（开放央视老版四大名著IP）…故事赛道…持续12周、6次创周激励、总奖金100万元…流媒体网口径总奖池650万积分+100万元现金，配套流量扶持/商单推荐/IP合作/独家签约"；"'WorkRally'等产品名以官方页为准【存疑】" |
| 注记①：承制下探 600-800 / 投中网 800-1500 | pricing.notes | research/17§2.1（49 行）+ research/20§③（76 行） | "AI漫剧承制价格自4月起一路下跌，精品短剧压至600-800元/分钟"（经济观察网 2026-09-28）；"另据投中网：AI短剧制作成本约为真人剧1/10、周期2–3周，精品AI短剧800–1500元/分钟、单部约10万元" |
| 注记②：承制包干净利 5%-8% | pricing.notes | research/22§二（40 行）+ research/08§四（37 行） | "承制利润薄如纸：《短剧苦红果久矣》（腾讯新闻/36氪 2026-09-24）：平台按20万-50万元包下制作费，制作公司仅赚5%-8%承制利润"；"承制ToB：一部20-50万、最高100万+；净利5%-8%" |
| 注记③：单集品牌植入 1000-2000 元/集 | pricing.notes | research/18§A5.2（121 行） | "商单植入：AI短剧单集植入成本1000-2000元，几十集总植入仅数万元，远低于真人短剧（知乎·60亿播放团队复盘 2026）" |
| 需求澄清话术 / 加急报价话术 | scripts | authored 工具文本；策略依据 research/23§4.2（63 行） | "报价四因子：时长×难度（是否含配音/剪辑/脚本）×交付周期×修改轮次…按视频时长/难度/周期分档报价并坚持预付款为社区共识" |
| 验收沉默期 / 甲方配合与工期顺延 | contract.clauses | authored 模板条款；依据 research/23§4.3（68 行） | 标准收款流程"交付初稿→客户确认→收尾款→再发源文件"与防骗五条纠纷类型（方案被白嫖、反复改稿、尾款拖欠） |
| 接单需求确认单（briefTpl） | orders.briefTpl | authored 工具文本；规格项逐条对齐站内 §4 交付标准清单既有口径（data.js:2135-2159），不另立数字 | — |
| 需求确认单小节 / 两处整组复制 / 动态计数 | app.js orders() | 站内既有机制 | 全局 `[data-copy]` 点击委托（app.js:1958-1959）、`regCopy` 长文本登记（app.js:46-47）、`h4.block-t` flex 头部与 `.copy-btn`（css/style.css:243-247） |

渠道 cat 归属说明：两条新渠道归 `flow`（流量平台商单/分账）——创投/挑战赛均为平台出钱的供给端机会，与巨量星图/快手磁力引擎同组。

## 五、需人工核实

**无**——全部新增数字口径均可在 research/ 对应档案找到原文（见 §四），无"站内找不到出处的补充知识"写进代码。两点如实说明（均沿用站内既有【存疑】随条标注纪律，同区已有 OSChina【存疑·未复核】先例）：

1. 火龙挑战赛的"总奖金 100 万元+650 万积分"：档案本身注明"海报未写明分配方式、官方细则文档未见面世【存疑】"，已内联标注在该渠道条目的 bar/fee 字段。
2. 投中网"精品 AI 短剧 800-1500 元/分钟"：research/20 系转述口径（未直读原文），注记内已写明"投中网转述口径"。

authored 工具文本（两段话术、两条模板条款、确认单）沿用既有 quoteTpl/contract.tpl 的 authored 纪律：策略依据已在字段内标注，合同/条款类保留"签约前咨询专业意见"口径。

## 六、不做的事

- **不动任何既有 DB 键、字段、数组顺序与数字口径**：cats/tiers/factors/folio/delivery/flow/scams/plan 零改动（断言：tiers 仍 6 档且 dz 档 800-1200、scams 仍 6、delivery 仍 6 组 11 项、checklist 仍 4 组 14 项、quoteTpl/contract.tpl 文本逐字未动）；只做数组尾部/组内追加与新增 `briefTpl` 一个键。
- **不改字段结构**：新条目字段与同区现有条目完全一致（渠道 n/c/bar/feat/fee/src、话术 t/d/txt、条款 t/d/src）。
- **不动渲染辅助函数与事件层**：`renderOdChannels`/`odQuoteCompute`/`refreshOdProgress`/`toggleOdCk`/`resetOdProgress`、事件委托（1998-2005、2065）、存储键 `manju_od_progress_v1` 全部保持原样——14 天旧进度数据无损兼容。
- **不动公共设施**：路由、命令面板、全局搜索、收藏系统零改动；全局搜索索引（app.js:1804-1812）对数组 forEach 自动纳入新渠道/新条款，无需改索引代码。
- **不新增 CSS 类**：本次增强全部复用既有 chip/codebox/copy-btn/block-t/tag/callout 类，`mjx-gig-` 前缀未启用（保留给未来需要样式的增强）；未新建任何 JS 标识符，无需 `mjxGig` 前缀。
- **不新建模块**、不新增 localStorage 键、不改 index.html / sw.js / css/ / research/。
- **不收录 research/ 无口径的渠道**：沿用区头注释纪律（淘宝服务市场等仍不收录、不编造）。
- **不回写 contract.tpl/quoteTpl 模板文本**：新条款以条款表行+确认单形式增量，避免与用户已复制存档的旧模板版本混淆。
- **发布注意事项（超出本补丁范围，由实施轮按既有发布流程处理）**：`js/data.js` 与 `js/app.js` 变更上线时，需同步升级 index.html 的静态资源版本参数（`?v=28`→`?v=29`，index.html:106-108）与 sw.js 缓存名（`manju-v3.0`，sw.js:3，data.js/app.js 在 CORE 预缓存清单内）——本补丁不含这两个文件的改动。
