# 细化方案：收益决策树

> 模块 id：`decision`（DB 键 `earnpath`，导航 id `earnpath`）｜ 数据区：`js/data.js:1794-2015`（注释锚点 `/* ================= 收益决策树与对照表 ================= */`）｜ 渲染函数：`js/app.js:735-771`（视图）+ `js/app.js:1193-1276`（决策树交互）
> 本方案为补丁文档，未对 js/、css/、index.html、sw.js、research/ 做任何改动。数据口径截至站内 2026-10-03（`DB.meta.updated`），引用 research/ 档案检索日期 2026-10-02。

---

## 一、现状盘点

### 1.1 现有什么（实测条目数）

用 `node -e "const DB=require('./js/data.js'); ..."` 实测（本次运行，输出原文）：

```
meta.updated = 2026-10-03
note chars: 149
bench.anchors: 4 | cols: 4 | rows: 3 (cells: 4,4,4)
tree.questions: 6 (opts: 2,2,2,2,2,2)
tree.results: 7 prep,script,light,solo,soloGamble,team,teamGamble
   prep why:2 data:3 steps:3
   script why:2 data:3 steps:3
   light why:2 data:3 steps:3
   solo why:2 data:3 steps:3
   soloGamble why:2 data:3 steps:3
   team why:2 data:3 steps:3
   teamGamble why:2 data:3 steps:3
calcBridge.points: 3
pitfalls: 8
caseMap: 5
```

即：1 段定位说明 + 对照表（4 基准锚 × 3 档投入 × 4 路径 = 12 格）+ 6 问决策树（12 选项 → 7 条结果路径，每条 why 2 / data 3 / steps 3 / pitfall 1）+ 三本账桥接 3 条 + 避坑 8 条 + 案例对照 5 部。交互侧：视图渲染 `app.js:735-771`；决策树交互（`epNext` 分支路由 + `dtStart/dtPick/dtBack/dtRestart`）`app.js:1193-1276`；事件委托 `app.js:2029-2033`；懒渲染 `app.js:245`；全局搜索索引 `app.js:1799-1803`（自动覆盖 bench.rows / tree.results / questions / pitfalls / caseMap，新增条目免登记可被搜到）。

### 1.2 缺什么、哪里最薄（按影响排序）

1. **"分账是彩票"只有结论、没有赔率结构**：模块反复告诉用户"万播 5-10 元、爆款率<0.1%、当彩票不作主食"，但从未解释单价由什么决定（免费分成=有效时长×单价×类型系数×版权系数；红果广告收入≈有效播放×eCPM×填充率-渠道成本）、有效播放的 30 秒门槛、热力值 7 日均改版；也没有"往哪个平台下注"的横向速查（快手个人零成本+大赛分成 95%、火龙 240%、B站/优酷窗口期）。这些在 research/24§2.6、research/17§二 与「变现运营」平台政策行里都有，但决策模块没有收口——模块内唯一的平台信息只有 soloGamble 结果里一句"快手零成本入驻"。
2. **文字版决策树 6 路径 vs 交互树 7 结果，"代运营"整条缺失**：research/23§三路径 5（代运营：国内挂牌 100-300 元/单起、海外 retainer $1500-8000/月、门槛=账号成绩背书）没有落进任何结果路径；交互树也没有"账号成绩"问项（`epNext` 无此分支），有起号能力的用户会被引导进 solo 却看不到这条溢价线。
3. **结果卡数据锚点固定 3 条，缺决策增量与校准**：solo 缺"价格下探趋势"（定制报价 1万-1.5万→1000-1500 元/分钟，36氪转引）；soloGamble 缺实结标尺（1.8 亿播放结算约 18 万、2500 万约 3.3 万，research/22§二）与"矩阵堆量被制度性关闭"（红果 2.0 取消规模系数）；script 的保底数字没写适用范围限定词（8-27 新政仅限"AI 剧对话型剧本"，research/24§〇修正1）——有误导风险；team 缺承制门槛线（热力值>4000 万或单月分账>10 万）。
4. **避坑清单 8 条缺两类新坑**：新形态分成误读（红果"平行世界"UGC 续写截至 2026-10-02 无任何分成细则）；产能-收益剪刀差（前 8 个月 43 万部、超 90% AI 制作 vs 单集算力成本涨 5 倍/万播收益跌 9 成）。
5. **交互面：全模块零可复制文本**：对照表与决策树结果卡都不能一键复制——全站 `codebox + copy-btn` 惯例（接单实操 `app.js:793-796` 等）本模块没用上；用户对完表想存档只能手抄。

### 1.3 盘点结论

骨架（对照表 × 决策树 × 三本账桥接 × 避坑 × 案例）与"预期管理工具而非暴富案例墙"的定位是对的，**不推倒、不加问项、不动分支路由**（`epNext` 一行不改，避免交互回归）。本方案沿三个薄点做增量：① 新键 `odds` 收口"分账赔率结构 × 平台政策差"；② 给 5 条结果路径追加 7 行数据锚点、补齐路径 5（代运营）与保底适用范围校准；③ 避坑补 2 条新坑；④ 渲染函数内部两处小增强（③ 号新区块 + 对照表/行动卡一键复制，全部走既有 `[data-copy]` 委托，零新增全局代码、零新增 CSS）。合计新增数据 16 条 + 2 个模块内工具函数 + 2 个渲染函数体替换，补丁完整代码合计约 110 行（在 350 行预算内）。

---

## 二、变更清单（逐条，含出处）

| # | 位置 | 增量 | 出处 |
|---|---|---|---|
| 1 | `earnpath` 新键 `odds`（7 条 {k,v,src}） | 分账赔率结构×平台政策差：单价公式链 / 有效播放 30 秒门槛 / 热力值 7 日均+承制门槛 4000 万 / 快手 8 亿分账+分成 95% / 火龙 240%+腾讯 85% / B站孵化+优酷窗口期 / 双端"内容资产 vs 时长资产"决策含义 | research/24-平台算法与流量池机制深拆.md §2.6；research/17-最新动态扫描2026-09-18至10-02.md §2.1-§2.5；平台政策全口径站内已有（「变现运营」data.js:1180-1187），本键只做决策蒸馏+互链 |
| 2 | `tree.results.script.data` 追加 1 条 | 保底适用范围：08-27 新政仅限"AI剧对话型剧本"（含番茄IP改编与原创），现行规则以平台后台为准 | research/24 §〇修正1；research/08 §2（data.js:1180 已录同一限定词） |
| 3 | `tree.results.light.data` 追加 1 条 | IP 资产二次变现新形态（Storeel"剧→角色聊天机器人"【经验推断】）+"平行世界"暂无分成细则勿误读 | research/25-互动叙事新形态与两周动态合并扫描.md §1.3、§1.1 |
| 4 | `tree.results.solo.data` 追加 2 条 | ①代运营溢价线（国内 100-300 元/单起、海外 retainer $1500-8000/月——补齐文字版路径5）；②价格下探趋势（定制报价 1万-1.5万→1000-1500 元/分钟、精品压至 600-800 元/分钟→早单早接、长约锁价） | research/23-收益预期对照与接单商单实操.md §三路径5、§二；research/17 §2.1（经济观察网） |
| 5 | `tree.results.soloGamble.data` 追加 2 条 | ①实结标尺（红果后台两例：1.8 亿播放≈18 万元≈10 元/万播、2500 万≈3.3 万元≈13.2 元/万播）；②矩阵堆量已死（红果 2.0 取消系列剧规模系数→彩票仓只押单部质量） | research/22-最新动态扫描第三轮2026-10上旬.md §二（塔猴后台案例；1.8 亿例另见 research/20 §②投中网 10-1 多源转述）；research/17 §2.1 / research/25 §2.2 |
| 6 | `tree.results.team.data` 追加 1 条 | 承制门槛线：热力值>4000 万或单月分账>10 万是部分平台承制合作门槛之一 | research/24 §2.6；research/23 §三路径3 |
| 7 | `pitfalls` 追加 2 条（第 9、10 坑） | ①新形态分成误读（平行世界结算空白，拉新功能≠分成机会）；②产能-收益剪刀差（43 万部/90% AI 制作 vs 算力涨 5 倍、收益跌 9 成→先算"单位播放收益×合规成本"） | research/25 §1.1（结算空白为事实、激励路线为【经验推断】）；research/17 §〇（国新办 43 万部经SCMP转引）/ §五合订元结论（亿欧）；research/24 §3.4（证券时报） |
| 8 | `app.js` 新增 2 个模块内工具函数 | `mjxDecisionMatrixText(E)`（对照表导出纯文本）、`mjxDecisionResultText(id)`（结果卡导出"行动卡"纯文本）——插在 `function dtStartCard()` 之前，仅被本模块消费 | 交互惯例：`regCopy`/`data-copy` 委托（app.js:46-47、1958-1959），同款用法见接单实操 app.js:793-796 |
| 9 | `app.js` `earnpath()` 视图函数整体替换（735-771） | ① 新增"③ 分账赔率与平台速查"区块渲染 `E.odds`（复用 anchors 同款 bar-row）；② ①区"使用规则"下加"⧉ 复制对照表"按钮；③ 区块序号顺延为 ①-⑥ | 交互增强均在模块渲染函数内部；无新增 CSS 类、无新增全局标识符 |
| 10 | `app.js` `dtResultCard(id)` 函数整体替换（1238-1258） | 结果卡按钮行加"⧉ 复制我的行动卡"（走既有 `data-copy` 委托）；其余渲染一字未动 | 同 #8 |

不改动任何既有条目的文字与数字口径；数据侧只做数组末尾追加与新增键 `odds`，渲染侧只换两个函数体 + 插入两个工具函数。

---

## 三、落点与代码

> 锚点已逐条验证唯一性：`grep -c` 实测 `现实收益`、`出海参照`、`用法：在「互动计算器」填制作参数`、`^  pitfalls: \[`、`earnpath() {`、`function dtResultCard` 在目标文件中各命中 1 次；`预期校准`/`收入分层`/`反面教材`/`合规三门票` 短词多义，改用整行（含完整反引号文本）做锚点，实测均唯一。js/app.js 全文件仅 1 个 IIFE（`app.js:2226` `})();`），`regCopy`/`esc`/`views`/`dt*` 同闭包，工具函数提升（hoisting）对 `earnpath()`（app.js:735，早于定义处）可见。所有锚点行号为撰写时实测（js/data.js 2463 行、js/app.js 2226 行版本）。

### 改动 1｜js/data.js · 新键 `odds`（插在 `calcBridge` 与 `pitfalls` 之间）

锚点（js/data.js:1995-1998，唯一）：

```
      `用法：在「互动计算器」填制作参数（集数/镜头/抽卡可用率/人力）与收益档位（尾部5/中位15/头部30元）→ 即时得出全片成本与回本播放量`,
    ],
  },
  pitfalls: [
```

替换为：

```js
      `用法：在「互动计算器」填制作参数（集数/镜头/抽卡可用率/人力）与收益档位（尾部5/中位15/头部30元）→ 即时得出全片成本与回本播放量`,
    ],
  },
  odds: [
    { k: `单价从哪来`, v: `免费分成=当月新增有效时长×时长单价×剧集类型系数×版权系数；红果广告收入≈有效播放×eCPM×填充率-渠道成本——算法优化的是"单位时长广告收益"，万播单价不是常数、随时可被下调`, src: `流媒体网2026-07/潮新闻2025（research/24§2.6）；类型系数下调史见「变现运营」画风系数口径` },
    { k: `有效播放门槛`, v: `红果单集观看≥30秒才计1次分账播放、第29秒跳出不计；有效播放认定收紧（需观看30%-50%时长才计入）——前30秒留存直接决定分账基数，"播放量"不等于"分账播放量"`, src: `CSDN行业拆解2025-2026经验值口径（research/24§2.6）；认定收紧见「变现运营」抖音/红果政策行` },
    { k: `热力值短周期化`, v: `由14天累计播放热度改7日均且取消上限——利好前期爆发强的剧、长尾剧单月冲榜难度上升；热力值>4000万或单月分账>10万是承制合作门槛之一`, src: `腾讯新闻转引官方公告2025-2026（research/24§2.6）` },
    { k: `快手 · 个人友好`, v: `2026-02新政个人/小工作室零成本入驻；全年8亿分账+2亿孵化现金+10亿级流量；AI短剧创作大赛爆款作者分成95%（真人短剧仅50-70%）；创投2.0单项目保底2万现金+40万灵感值起`, src: `research/17§2.2（剧短线2026-09-21核验）；政策全口径见「变现运营」快手行` },
    { k: `腾讯/火龙 · 高分成`, v: `火龙独家纯分成系数最高上浮240%、AI仿真人与3D精品剧单分钟保底最高1万元；腾讯视频端S+/S级独家85%、稀缺精品单部最高奖励100万——两者均为机构对公入驻、个人进不去`, src: `剧短线2026-09-28/research/17§2.4；全口径见「变现运营」腾讯行` },
    { k: `B站/优酷 · 窗口期`, v: `B站觉醒漫剧计划2.0：上传PV或1-3集正片签约孵化、创作费用覆盖制作成本+千万级流量扶持、updream+可灵AI制作最高100万算力积分；优酷2026-10-01至2027-03-31按热力值区间分账、每家合作方最高10万元——窗口期政策别当长期现金流做预算`, src: `流媒体网综合2026-09-30（research/17§2.3/§2.5）；见「变现运营」B站/优酷行` },
    { k: `双端决策含义`, v: `抖音奖励"内容资产"（搜索+长效推荐，2026权重向收藏/复访倾斜）、红果奖励"时长资产"（有效时长×eCPM）——同一部剧双端优化动作应当不同：抖音端重标题SEO与收藏钩子、红果端重前30秒留存与单集密度`, src: `research/24§2.6差异小结；机制条目见「爆款心法」` },
  ],
  pitfalls: [
```

### 改动 2｜js/data.js · `tree.results.script.data` 追加第 4 条

锚点（js/data.js:1884-1885，唯一）：

```
          { t: `现实收益`, v: `底层70%+月收益0-几百元是常态；学生进阶散单1000-3000元/月——先按散单定价，编剧线当彩票` },
        ],
```

替换为：

```js
          { t: `现实收益`, v: `底层70%+月收益0-几百元是常态；学生进阶散单1000-3000元/月——先按散单定价，编剧线当彩票` },
          { t: `保底适用范围`, v: `08-27保底新政仅限"AI剧对话型剧本"（含番茄IP改编与原创）——投递前先在创作者后台核对剧本类型是否在范围内；现行规则以平台后台为准（research/24§〇修正1；research/08已录）` },
        ],
```

### 改动 3｜js/data.js · `tree.results.light.data` 追加第 4 条

锚点（js/data.js:1903-1904，唯一）：

```
          { t: `预期校准`, v: `底层70%+创作者月收益0-几百元（知乎2026-08-24【原文未复核】）——先用散单验证交付能力，别辞职别囤课` },
        ],
```

替换为：

```js
          { t: `预期校准`, v: `底层70%+创作者月收益0-几百元（知乎2026-08-24【原文未复核】）——先用散单验证交付能力，别辞职别囤课` },
          { t: `IP资产二次变现新形态`, v: `"剧→角色聊天机器人"（Storeel模式）是已验证的IP角色资产二次变现路径（research/25§1.3【经验推断】）——角色/场景资产除了挂模板店，还可以往陪伴型互动内容走；红果"平行世界"UGC续写暂无分成细则，别把平台拉新功能当分成机会（research/25§1.1）` },
        ],
```

### 改动 4｜js/data.js · `tree.results.solo.data` 追加第 4、5 条

锚点（js/data.js:1922-1923，唯一）：

```
          { t: `收入分层`, v: `中层约20%月营收数千-2万——注意是营收不是利润，先扣算力与人力再算账` },
        ],
```

替换为：

```js
          { t: `收入分层`, v: `中层约20%月营收数千-2万——注意是营收不是利润，先扣算力与人力再算账` },
          { t: `代运营溢价线`, v: `有账号成绩背书者可叠加代运营：国内挂牌100-300元/单起（猪八戒2026检索口径）、海外月费retainer $1500-8000/月（Playcut 2026）——这是决策树文字版的路径5，交互树未单设问项：有起号成功案例就把它加进你的商单组合（research/23§三）` },
          { t: `价格下探趋势`, v: `定制报价从早期1万-1.5万/分钟跌至1000-1500元/分钟（36氪转引2026）、精品短剧压至600-800元/分钟（经济观察网）——报价逐年下探：早单早接、长约锁价，别按去年的行情锚定今年的报价（research/23§二/17§2.1）` },
        ],
```

### 改动 5｜js/data.js · `tree.results.soloGamble.data` 追加第 4、5 条

锚点（js/data.js:1941-1942，唯一）：

```
          { t: `出海参照`, v: `2026H1海外微短剧IAP约12.7亿美元（+13%）——见「变现运营」出海板块；AI漫剧单条效率仅真人剧1/16（YouTube 2026H1审计）` },
        ],
```

替换为：

```js
          { t: `出海参照`, v: `2026H1海外微短剧IAP约12.7亿美元（+13%）——见「变现运营」出海板块；AI漫剧单条效率仅真人剧1/16（YouTube 2026H1审计）` },
          { t: `实结标尺`, v: `红果后台实结两例（2026年5-6月）：1.8亿播放结算约18万元（≈10元/万播）、2500万播放结算约3.3万元（≈13.2元/万播）——用实结单价×预期播放、再扣投流占比，才算得出"到手预期"而非"流水幻觉"（research/22§二，塔猴后台案例；1.8亿例另见投中网10-1，research/20§②多源转述）` },
          { t: `矩阵堆量已死`, v: `红果"优质AI剧生产活动2.0"（2026-10生效）取消系列剧规模系数、只按单部真实热度计发——"多号/多季堆数量拿扶持"被制度性关闭，彩票仓只押单部质量不押数量（research/17§2.1/25§2.2）` },
        ],
```

### 改动 6｜js/data.js · `tree.results.team.data` 追加第 4 条

锚点（js/data.js:1960-1961，唯一）：

```
          { t: `反面教材`, v: `"半年做垮一家AI影视公司"：门槛低+同质化+产能过剩（四味毒叔2026-09-09）——承制也不是躺赚` },
        ],
```

替换为：

```js
          { t: `反面教材`, v: `"半年做垮一家AI影视公司"：门槛低+同质化+产能过剩（四味毒叔2026-09-09）——承制也不是躺赚` },
          { t: `承制门槛线`, v: `热力值>4000万或单月分账>10万是部分平台承制合作门槛之一（research/24§2.6）——接承制单前先核对自家账号历史数据够不够格；不够就先用商单样片与案例攒资格（research/23§三路径3）` },
        ],
```

### 改动 7｜js/data.js · `pitfalls` 追加第 9、10 条

锚点（js/data.js:2006-2007，唯一）：

```
    { t: `合规三门票`, d: `备案+授权+AI标识缺一即遭下架停更；《菩提临世》热度8923万、全网约8亿播放，上线约27天因题材红线双平台下架——收益预期先过合规关。`, src: `见「变现运营」合规红线与「案例拆解」风险案例` },
  ],
```

替换为：

```js
    { t: `合规三门票`, d: `备案+授权+AI标识缺一即遭下架停更；《菩提临世》热度8923万、全网约8亿播放，上线约27天因题材红线双平台下架——收益预期先过合规关。`, src: `见「变现运营」合规红线与「案例拆解」风险案例` },
    { t: `新形态分成误读`, d: `红果"平行世界"UGC续写（选角色+情绪标签生成10秒续作）截至2026-10-02无任何创作者分成/结算细则——平台拉新功能≠分成机会，短期大概率走流量激励路线；看到"续写也能赚钱"的说法先查官方细则再动心。`, src: `钛媒体2026-07-17深读（research/25§1.1；结算空白为事实、"流量激励路线"为【经验推断】）；「变现运营」红果行同步标注` },
    { t: `产能-收益剪刀差`, d: `前8个月约43万部上线、超90%为AI制作（国新办2026-09-20），同期"单集算力成本涨5倍、万播收益跌9成"（亿欧2026-09-29）、AI短剧流量成本同比涨超100%（证券时报）——辞职、加杠杆、扩产前先算"单位播放收益×合规成本"，不以产量为第一约束。`, src: `research/17§〇/§五合订元结论；证券时报（research/24§3.4）` },
  ],
```

### 改动 8｜js/app.js · 新增 2 个模块内工具函数（插在 `function dtStartCard()` 之前）

锚点（js/app.js:1215，唯一）：

```
  function dtStartCard() {
```

替换为：

```js
  /* 模块内纯文本导出工具（mjxDecision 前缀）：供 data-copy 复制按钮消费，走全局复制委托（app.js:1958-1959），零新增全局代码 */
  function mjxDecisionMatrixText(E) {
    const L = ['【收益预期对照表 · 收益决策树】（口径截至 ' + DB.meta.updated + '）'];
    E.bench.anchors.forEach((a) => L.push('· ' + a.k + '：' + a.v));
    E.bench.rows.forEach((r) => {
      L.push('◆ ' + r.bg + '（' + r.assume + '）');
      E.bench.cols.forEach((c, i) => L.push('  - ' + c + '：' + r.cells[i].v));
    });
    L.push('使用规则：' + E.bench.rule);
    L.push('—— 来自「漫剧研究学习平台」#/earnpath');
    return L.join('\n');
  }
  function mjxDecisionResultText(id) {
    const T = DB.earnpath.tree, R = T.results[id] || T.results.solo;
    const a = (dtState && dtState.answers) || {};
    const L = ['【我的变现路径行动卡】'];
    T.questions.forEach((q) => { const o = q.opts.find((x) => x.k === a[q.id]); if (o) L.push('· ' + q.s + '：' + o.n); });
    L.push('▸ 推荐路径：' + R.title + '（' + R.tag + '）');
    L.push('适合谁：' + R.fit);
    R.why.forEach((w) => L.push('· 为什么：' + w));
    R.data.forEach((d) => L.push('· ' + d.t + '：' + d.v));
    R.steps.forEach((s, i) => L.push('第' + (i + 1) + '步：' + s));
    L.push('最大坑：' + R.pitfall);
    L.push('下一步：打开「互动计算器」验证三本账与回本播放量；口径详见「变现运营」「案例拆解」与 research/23。');
    return L.join('\n');
  }
  function dtStartCard() {
```

### 改动 9｜js/app.js · `earnpath()` 视图函数整体替换（js/app.js:735-771）

锚点：`js/app.js:735-771`，自 `    earnpath() {` 起、至其闭合 `    },` 止的整个函数体（原文见仓库，此处不整段重复）。替换为：

```js
    earnpath() {
      const E = DB.earnpath, B = E.bench, T = E.tree;
      /* §1 基准锚点 */
      const anchors = '<div class="chart-box" style="margin-bottom:16px"><h5>先立基准：四组数锚定所有收益预期 <span class="sub">口径截至 ' + DB.meta.updated + '</span></h5>' +
        B.anchors.map((a) => '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 132px;text-align:left;color:var(--gold);font-weight:700">' + a.k + '</span>' +
          '<span style="flex:1;font-size:12.8px"><b>' + a.v + '</b><br><span style="color:var(--tx3);font-size:11.5px">' + a.src + '</span></span></div>').join('') + '</div>';
      /* §1 收益预期对照表（投入程度 × 路径） */
      const matrix = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="min-width:96px">投入程度</th>' +
        B.cols.map((c) => '<th style="min-width:200px">' + c + '</th>').join('') + '</tr></thead><tbody>' +
        B.rows.map((r) => '<tr><td><b>' + r.bg + '</b><br><span style="font-size:11px;color:var(--tx3)">' + r.assume + '</span></td>' +
          r.cells.map((c) => '<td><b style="color:var(--gold);font-size:12.8px">' + c.v + '</b>' +
            '<p style="font-size:12.2px;color:var(--tx);margin:4px 0 3px">' + c.d + '</p>' +
            '<p style="font-size:11px;color:var(--tx3);margin:0">' + c.src + '</p></td>').join('') + '</tr>').join('') +
        '</tbody></table></div>';
      /* §3 分账赔率与平台速查（机制蒸馏自 research/24§2.6 与 research/17§二；政策全口径见「变现运营」平台政策行） */
      const odds = '<div class="chart-box" style="margin-bottom:16px"><h5>分账下注前先懂：赔率结构 × 平台政策差 <span class="sub">机制口径 research/24§2.6 · 政策全量见「变现运营」</span></h5>' +
        E.odds.map((o) => '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 132px;text-align:left;color:var(--gold);font-weight:700">' + o.k + '</span>' +
          '<span style="flex:1;font-size:12.8px"><b>' + o.v + '</b><br><span style="color:var(--tx3);font-size:11.5px">' + o.src + '</span></span></div>').join('') + '</div>';
      /* §4 三本账计算器入口 */
      const calcCard = '<div class="card" style="padding:16px 18px"><ul style="margin:0;list-style:disc">' +
        E.calcBridge.points.map((p) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + p + '</li>').join('') +
        '</ul><div style="margin-top:12px"><button class="btn pri" data-go="calc">打开「互动计算器」算三本账与回本播放量 →</button></div></div>';
      /* §5 避坑清单 */
      const pits = E.pitfalls.map((p, i) => '<div class="card"><span class="tag h">坑 ' + String(i + 1).padStart(2, '0') + '</span>' +
        '<b style="display:block;margin-top:6px">' + p.t + '</b><p style="font-size:12.6px;color:var(--tx2);margin-top:5px">' + p.d + '</p>' +
        '<p style="font-size:11px;color:var(--tx3);margin:4px 0 0">' + p.src + '</p></div>').join('');
      /* §6 真实案例对照 */
      const caseRows = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>案例（见「案例拆解」）</th><th>路径标签</th><th>发生了什么</th><th>对你的决策启示</th></tr></thead><tbody>' +
        E.caseMap.map((c) => '<tr><td><b>' + c.n + '</b></td><td><span class="tag ' + (c.tag.indexOf('反面') === 0 ? 'h' : 'c') + '">' + c.tag + '</span></td>' +
          '<td style="color:var(--tx2)">' + c.d + '</td><td>' + c.lesson + '</td></tr>').join('') + '</tbody></table></div>';
      return '<div class="callout gold" style="margin-bottom:16px"><b>这页回答一个问题：我这种背景能赚多少、该走哪条变现路。</b>' + E.note + '</div>' +
        '<h4 class="block-t" style="margin-top:0">① 收益预期对照表 <span class="sub">投入程度 × 变现路径 · 全部数字引用站内已有口径</span></h4>' + anchors + matrix +
        '<div class="callout" style="margin-top:12px"><b>使用规则：</b>' + B.rule + '</div>' +
        '<div style="margin:10px 0 0"><button class="btn ghost" data-copy="' + regCopy(mjxDecisionMatrixText(E)) + '">⧉ 复制对照表（纯文本 · 含基准锚与三档投入对照）</button></div>' +
        '<h4 class="block-t">② 变现路径决策树 <span class="sub">' + T.questions.length + '问 · 选项驱动结论 · 纯本地计算不上传</span></h4>' +
        '<div id="dtBox"></div>' +
        '<div class="callout" style="margin-top:12px"><b>通用规则：</b>' + T.rule + '</div>' +
        '<h4 class="block-t">③ 分账赔率与平台速查 <span class="sub">"彩票仓"下注前的机制与政策差 · 蒸馏自 research/24§2.6、research/17§二</span></h4>' + odds +
        '<h4 class="block-t">④ 三本账计算器入口 <span class="sub">与「互动计算器」联动</span></h4>' + calcCard +
        '<h4 class="block-t">⑤ 避坑清单 <span class="sub">引用「变现运营」收益警示与 research/23 防骗清单</span></h4><div class="grid g2">' + pits + '</div>' +
        '<h4 class="block-t">⑥ 真实案例对照 <span class="sub">四条路径各有一个可对表的样本</span></h4>' + caseRows +
        '<div style="margin-top:12px"><button class="btn ghost" data-go="cases">去「案例拆解」看全部' + DB.cases.length + '个案例 →</button></div>';
    },
```

### 改动 10｜js/app.js · `dtResultCard(id)` 函数整体替换（js/app.js:1238-1258）

锚点：`js/app.js:1238-1258`，自 `  function dtResultCard(id) {` 起、至其闭合 `  }` 止的整个函数体。替换为（仅在按钮行插入复制按钮，其余渲染与原文逐字一致）：

```js
  function dtResultCard(id) {
    const T = DB.earnpath.tree, R = T.results[id] || T.results.solo;
    const recap = T.questions.filter((q) => dtState.answers[q.id]).map((q) => {
      const o = q.opts.find((x) => x.k === dtState.answers[q.id]);
      return '<span class="chip on" style="cursor:default">' + esc(q.s) + '：' + esc(o ? o.n : '—') + '</span>';
    }).join('');
    const why = R.why.map((w) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + w + '</li>').join('');
    const dataRows = R.data.map((d) => '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 104px;text-align:left;color:var(--gold);font-weight:700">' + d.t + '</span>' +
      '<span style="flex:1;font-size:12.6px;color:var(--tx2)">' + d.v + '</span></div>').join('');
    const steps = R.steps.map((s, i) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px"><b style="color:var(--tx)">第' + (i + 1) + '步：</b>' + s + '</li>').join('');
    return '<div class="card" style="padding:18px 20px"><span class="tag c">' + R.tag + '</span>' +
      '<b style="display:block;font-size:17px;margin:8px 0 4px">▸ 推荐路径：' + R.title + '</b>' +
      '<p class="mini-note" style="margin:0">适合谁：' + R.fit + '</p>' +
      (recap ? '<div class="tool-filters" style="margin:10px 0 0">' + recap + '</div>' : '') +
      '<div class="chart-box" style="margin-top:12px"><h5>为什么是这条路</h5><ul style="margin:0;list-style:disc">' + why + '</ul></div>' +
      '<div class="chart-box" style="margin-top:10px"><h5>数据锚点 <span class="sub">口径详见「变现运营」「案例拆解」与 research/23</span></h5>' + dataRows + '</div>' +
      '<div class="chart-box" style="margin-top:10px"><h5>接下来三步</h5><ul style="margin:0;list-style:disc">' + steps + '</ul></div>' +
      '<div class="callout red" style="margin-top:12px"><b>最大坑：</b>' + R.pitfall + '</div>' +
      '<div style="margin-top:14px"><button class="btn pri" data-go="calc">用「互动计算器」验证三本账 →</button> ' +
      '<button class="btn ghost" data-copy="' + regCopy(mjxDecisionResultText(id)) + '">⧉ 复制我的行动卡</button> ' +
      '<button class="btn ghost" data-dt-restart>↻ 重新测一次</button></div></div>';
  }
```

### 校验记录（本次实际执行）

1. 条目数盘点：`node -e "const DB=require('./js/data.js'); ..."`（命令与输出原文见 §1.1）。
2. 锚点唯一性：`grep -c` 对上列锚点逐一实测（见 §三 开头说明），整行锚点命中数均为 1；js/app.js 全文件仅 1 个 IIFE，工具函数提升（hoisting）对 `earnpath()`（app.js:735，早于定义处）可见。
3. 补丁可粘贴性与语法：在系统临时目录（`%TEMP%\mjx-decision-check\`）将改动 1-10 按锚点整行替换/按行号（735-771、1238-1258）应用到 `js/data.js` 与 `js/app.js` 的临时副本（**仓库文件未动，仅改临时副本**），对两个副本执行 `node --check`，均通过。
4. 数据形状断言：加载打补丁的临时 data.js，53 项断言全 PASS——`E.odds` 7 条且每条恰为 `{k,v,src}`；script/light/solo/soloGamble/team 的 data 增至 4/4/5/5/4 条且每行恰为 `{t,v}`（字段结构未变）；`pitfalls` 10 条；抽查原条目（`solo.data[0]`、`pitfalls[0]`、`caseMap` 5 条、`bench.anchors` 4 条、`tree.questions` 6 条）确认既有数字口径未动。
5. 渲染冒烟：从打补丁的临时 app.js 提取两个工具函数与新 `earnpath()`/`dtResultCard` 函数体，用桩（stub `esc`/`regCopy`/`dtState`）实际执行——返回串含"③ 分账赔率与平台速查"与顺延后的 ①-⑥ 序号、odds 7 条、"坑 10"；对照表/行动卡两个复制按钮均正确注册 `regCopy`，两段纯文本导出内容抽查正确（行动卡含答题回顾、推荐路径、新增"代运营溢价线"行与三步行动）；并断言 `epNext` 分支路由逐字未改动。

---

## 四、来源对照表

| 新增内容 | 关键数字/事实 | research 出处 | 站内交叉引用 |
|---|---|---|---|
| odds·单价公式链 | 免费分成=当月新增有效时长×时长单价×剧集类型系数×版权系数（流媒体网 2026-07）；红果广告收入≈有效播放×eCPM×填充率-渠道成本（潮新闻 2025） | research/24 §2.6 | 「变现运营」画风系数口径（data.js:1180） |
| odds·有效播放门槛 | 红果单集观看≥30秒计1次分账播放、第29秒跳出不计（CSDN 经验值口径）；认定收紧30%-50% | research/24 §2.6 | 「变现运营」抖音/红果政策行；「爆款心法」（data.js:1072、1103） |
| odds·热力值短周期化 | 14天累计→7日均、取消上限；热力值>4000万或单月分账>10万为承制门槛之一 | research/24 §2.6 | 「变现运营」红果行（data.js:1180） |
| odds·快手 | 8亿分账+2亿孵化现金+10亿级流量；大赛爆款作者分成95%（真人50-70%）；创投2.0保底2万现金+40万灵感值起 | research/17 §2.2（剧短线 2026-09-21 核验） | 「变现运营」快手行（data.js:1181） |
| odds·腾讯/火龙 | 火龙独家纯分成最高上浮240%、AI仿真人与3D精品单分钟保底最高1万元；腾讯视频 S+/S 独家85%、稀缺精品最高奖100万；机构对公入驻 | research/17 §2.4 | 「变现运营」腾讯行（data.js:1182） |
| odds·B站/优酷 | B站觉醒漫剧计划2.0（费用覆盖成本+千万流量+最高100万算力积分）；优酷 2026-10-01~2027-03-31 热力值区间分账、每家最高10万元 | research/17 §2.3/§2.5（流媒体网 2026-09-30） | 「变现运营」B站/优酷行（data.js:1183/1187） |
| odds·双端含义 | 抖音奖励"内容资产"、红果奖励"时长资产"，双端优化动作不同 | research/24 §2.6 差异小结 | 「爆款心法」（data.js:1072） |
| script·保底适用范围 | 08-27 新政仅限"AI剧对话型剧本"（含番茄IP改编与原创） | research/24 §〇修正1；research/08 §2 | 「变现运营」红果行（data.js:1180） |
| light·IP资产二次变现 | Storeel"剧→角色聊天机器人"为已验证路径【经验推断】；平行世界结算细则空白 | research/25 §1.3、§1.1 | 「变现运营」红果行"平行世界"注记 |
| solo·代运营溢价线 | 国内挂牌100-300元/单起（猪八戒 2026）；海外 retainer $1500-8000/月（Playcut 2026） | research/23 §三路径5 | —（文字版路径5首次入库） |
| solo·价格下探趋势 | 定制报价 1万-1.5万→1000-1500元/分钟（36氪转引）；精品压至600-800元/分钟（经济观察网） | research/23 §二；research/17 §2.1 | — |
| soloGamble·实结标尺 | 1.8亿播放≈18万元（≈10元/万播）；2500万≈3.3万元（≈13.2元/万播） | research/22 §二（塔猴后台案例）；research/20 §②（投中网 10-1，多源转述） | — |
| soloGamble·矩阵堆量已死 | 红果2.0（2026-10生效）取消系列剧规模系数 | research/17 §2.1；research/25 §2.2 | 「变现运营」红果行"2.0"细则（data.js:1180） |
| team·承制门槛线 | 热力值>4000万或单月分账>10万 | research/24 §2.6 | 同 odds |
| pitfall·新形态分成误读 | 平行世界截至 2026-10-02 无分成细则（事实）；流量激励路线【经验推断】 | research/25 §1.1（钛媒体 2026-07-17） | 「变现运营」红果行 |
| pitfall·产能-收益剪刀差 | 前8个月43万部、超90% AI制作（国新办 2026-09-20 经SCMP转引）；算力涨5倍/收益跌9成（亿欧 2026-09-29）；流量成本涨超100%（证券时报） | research/17 §〇/§五；research/24 §3.4 | — |

---

## 五、需人工核实

无。本方案全部新增数字与事实均可在 research/17、20、22、23、24、25 档案原文中定位（见 §四），无站外凭记忆补充；其中两处弱口径已在条目内原样标注：①Storeel 模式为【经验推断】（research/25 §1.3 原标注）；②1.8 亿播放结算约 18 万例为投中网 10-1 多源转述（research/20 §2 注明"多源转述"，与塔猴后台案例互证）。

---

## 六、不做的事

1. **不动 `epNext` 分支路由与 6 问题干/选项**：不新增"账号成绩"问项——改路由属交互回归风险（7 条结果、3 条短路逻辑需全量回归），路径 5（代运营）以数据行方式补进 solo 结果即可达意。
2. **不加对照表第 5 列/第 4 行**："代运营"列与"头部参照"行（昆仑万维流水、创作者收入 1000 元-80 万）会加宽爆表并违背"不做暴富案例墙"的模块定位——头部数字已在 bench.anchors 分层框架里间接覆盖。
3. **不往 `caseMap` 加无名标尺案例**：表格首列承诺"案例（见「案例拆解」）"，实结标尺放 soloGamble.data 更贴合其"数据锚点"语义。
4. **不动全局搜索索引（app.js:1799-1803）**：新增的 `odds` 键不会被全局搜索收录（索引函数按既有键名遍历）；pitfalls/caseMap/rows/results 的新增条目会被自动收录。若后续要让 odds 可搜，应由全局设施轮次统一处理。
5. **不新增 CSS 类、不改 index.html/sw.js/路由/命令面板/收藏系统**：复制按钮走既有 `[data-copy]` 委托与 `copy-btn`/`btn ghost` 既有类，零新增样式。
6. **不改既有条目的任何数字与文字口径**：script 结果原有"平台编剧线"条目未补限定词，为不违反"既有数字口径不改"纪律，采取追加校准行（改动 2）而非改写原文。
