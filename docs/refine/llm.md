# 细化方案：大模型应用

> 模块 id：`llm` · 数据区 `js/data.js:840-1050` · 渲染函数 `js/app.js:559-578`
> 本方案只允许改动两处现实文件：`js/data.js`（llm 数据区增量）与 `js/app.js`（llm() 渲染函数整函数替换）。其余一律只读。
> 补丁代码合计约 80 行（数据增量实测 +40 行、渲染函数实测 38 行），远低于 350 行上限。

---

## 一、现状盘点

**数据区构成**（`js/data.js:841-1050`，共 11 个键）：

| 键 | 形态 | 条目数 | 内容 |
|---|---|---|---|
| `mapping` | `{s,t,n}` 数组 | 8 | 各环节用途映射（网文改编→反向拆解） |
| `models` | `{n,f,c,p}` 数组 | 7 | 模型选型表（Claude/GLM-5 等 7 款） |
| `pick` | 字符串数组 | 3 | 选型结论（2026-06 评测共识口径） |
| `jsonExample` | 模板字符串 | 1 | 分镜表 JSON 输出格式 |
| `promptTemplate` | 模板字符串 | 1 | 生成分镜的完整 Prompt 模板 |
| `fullEpisodeNote` / `fullEpisode` | 字符串 | 2 | 10 镜 92 秒完整一集示例+解读 |
| `automation` | `{t,tag,d}` 数组 | 6 | 自动化流水线路线（Coze/豆包即梦/novelvids/Claude Code/改编专用/团队版） |
| `automationPick` | 字符串 | 1 | 流水线选型口诀 |
| `serialMemory` | 模板字符串 | 1 | 连载化跨集记忆管理 JSON |
| `compatNote` | 字符串 | 1 | 与「爆款心法→分镜板工作台」双向兼容说明 |

**模块外引用点**（全部无需改动，自动跟随数据增量）：导航 `js/app.js:105`、副标题 `js/app.js:128`、仪表盘统计文案 `js/app.js:443`（读 `DB.llm.automation.length`）、全局搜索索引 `js/app.js:1816`（读全部 `automation` 条目）。

**已有优势**：正向链路模板全（4 个可复制大模板、JSON Schema 成熟）、与分镜板工作台双向兼容说明完整、automation 前期路线（Coze/豆包/novelvids/Claude Code）扎实。

**薄点（按严重度排序）**：

1. **只教"怎么生成"，不教"生成完会撞什么红线"**。research 里已有现成且经过核验的负向事实——红果 AI 剧本保底新政（S+ 保底 1 万、整体降幅约 75%）、平台同质化检测+开头查重、剧本过稿率 7.5%、抖音 AI 仿真人剧 ≥70 集/约 7 万字剧本量门槛——本模块一条都没进站。LLM 量产剧本的经济账是使用者最先踩的坑。
2. **automation 6 条全是"正向生产"路线，缺 2026-09/10 增量**：平台托管一键成片（巨日禄/字节三件套）、剪映生态后期自动化（小映 Agent + jianying-editor-skill）、Dify+ComfyUI 编排层与一致性节点参数。其中 Dify+ComfyUI 与端到端趋势警示来自**本模块专属档案 `research/07` 的 v1.2 更新节**，该节只有 VLM 闭环一半进了站（mapping 第 8 条），另一半（IPAdapter FaceID 参数、Seedance 2.0 冲击自建工作流的警示）漏收。
3. **"反向拆解"只有方法没有模板**：mapping 第 8 条讲了抽帧→VLM→JSON 的路径，但正向链路有 4 个可复制模板，反向链路一个都没有——闭环只建了一半。
4. **mapping 缺两个 LLM 可直接执行的环节**：钩子设计（五类钩子占比可直接写进提示词）与分镜自检（连续性规则返工），`research/12` §二/§四有现成可验证内容。
5. **交互为零**：整页无筛选、无整组复制；models 与 automation 的价值在对比，但读者无法一键把对比结果带走。

---

## 二、变更清单（逐条，含出处）

共 **12 条新增数据条目 + 1 个新模板键 + 1 处渲染函数替换**。所有新增条目字段结构与同区现有条目完全一致；既有条目与既有数字口径**零改动**。

| # | 落点 | 类型 | 内容摘要 | 出处 |
|---|---|---|---|---|
| 1 | `mapping` +1 | 新增条目 | 钩子与反转设计：四类钩子占比+反转三模式+开场 15 秒三要素 | research/12 §二、§三 |
| 2 | `mapping` +1 | 新增条目 | 分镜自检：连续性规则（两事件拆镜/相邻镜号避同景别/道具光线一致） | research/12 §四 |
| 3 | `pick` +1 | 新增条目 | 成本侧红利：厦门思明区大模型 API 投入 30% 补助（年度上限 300 万）+ 全国七城扶持 | research/17 §四「地方扶持」 |
| 4 | `pitfalls` 新键 | 新增键（6 条字符串） | 红线与避坑：保底新政 / 同质化检测与过稿率 / 剧本体量门槛 / 过载镜头 / 笼统情绪词与首帧决定论 / 多角色同框口型崩 | research/08 更新 v2.7 §2、§1；research/12 §六；research/18 §2.1；research/12 §四；research/19 §A2.1、§A3.2；research/19 §A1.1 |
| 5 | `vlmPrompt` 新键 | 新增模板 | VLM 爆款反向拆解提示词（五要素+情绪节拍+单步动作链+只输出 JSON） | research/07 更新 v1.2「VLM实操闭环」；research/05「动作拆步法则」；模板体例豁免见 §五 |
| 6 | `automation` +1 | 新增条目 | 平台托管一键成片路线（巨日禄 2500 字→90 分镜、字节三件套 10 万字一键成片） | research/04 更新 v1.1「流水线/平台」 |
| 7 | `automation` +1 | 新增条目 | 剪映生态后期路线（小映 Agent+能力边界警告；jianying-editor-skill+四条硬约束） | research/23 §5.2；research/04 更新 v1.2「剪映小映Agent」 |
| 8 | `automation` +1 | 新增条目 | Dify+ComfyUI 编排路线（IPAdapter FaceID 权重 0.6-0.8、端到端趋势警示） | research/07 更新 v1.2「ComfyUI一致性节点参数」 |
| 9 | `app.js llm()` | 渲染增强 | 新增「红线与避坑」红框区、`vlmPrompt` 第 5 个模板代码块、模型速查表一键复制、自动化路线归并 3 粗组筛选（chips）+ 一键复制全部路线；模板区标题随 `vlmPrompt` 动态化 | 交互仅用现有 `.chip/.copy-btn/regCopy` 设施 + 本模块内联助手 `mjxLlmRouteFilter`（内联 onclick 为全站首例，取舍见改动5说明） |

---

## 三、落点与代码

### 改动 1：`js/data.js` — mapping 追加 2 条（锚点：`js/data.js:851-852`）

定位：`mapping` 数组收尾的 `  ],`（其后紧跟 `  models: [`，该组合全文唯一）。将：

```
  ],
  models: [
```

替换为：

```
    { s: `钩子与反转设计`, t: `按钩子类型占比+反转三模式，生成本集开头方案与反转点位`, n: `占比参考：情绪钩30-40%/悬念钩20-30%/危机钩10-20%/信息钩10-20%（GitHub short-drama skill统计口径）；反转三模式=身份/利益/关系；开场15秒三要素=身份错位+利益威胁+视觉冲击` },
    { s: `分镜自检`, t: `把生成的分镜JSON喂回LLM按连续性规则返工`, n: `一个镜头塞两个以上事件就要拆镜；相邻镜号避免相同景别；道具方位/光线色调前后一致（CSDN镜头连续性规则）` },
  ],
  models: [
```

### 改动 2：`js/data.js` — pick 追加 1 条 + 新增 `pitfalls` 键（锚点：`js/data.js:864-866`）

定位：`pick` 数组第 3 条（全文唯一）。将：

```
    `只在两件事上值得付费：JSON结构化流水线（Claude）与超长上下文（Kimi/Claude）`,
  ],
```

替换为：

```
    `只在两件事上值得付费：JSON结构化流水线（Claude）与超长上下文（Kimi/Claude）`,
    `成本侧红利：厦门思明区2026-09-07新政对合规大模型API投入（算力租赁/词元/接口订阅）按30%补助、单家企业年度上限300万元；备案新规后全国已有七个城市推出AI漫剧扶持政策——API开销先查本地政策再下单`,
  ],
  pitfalls: [
    `保底缩水：红果AI剧本保底新政（2026-08-25通知、08-27生效）——S+级保底1万元、S级5000元，A+级与A级取消保底只走纯分账，整体降幅约75%，仅限AI对话型剧本（含番茄IP改编与原创）。用LLM量产剧本前先按现行口径算收入账，旧保底传闻不作数`,
    `同质化检测：AI剧本质量自检=平台同质化检测+开头查重；2026年3-4月审核趋严后，漫剧一次过审率约60%→30%、红果剧本过稿率跌至7.5%（2026年中口径）——开头查重打在LLM最常套模板的黄金3秒上，量产前先自检`,
    `剧本体量门槛：抖音对AI仿真人剧要求≥70集、约7万字剧本——分集前先让LLM估算总字数并规划连载节奏，超长上下文模型（Kimi/Claude）在整本投喂时才真正用得上`,
    `过载镜头：单镜头=单个运镜+单个表演动作，禁止"旋转+大笑+发丝飘动+变焦"式叠加提示词；拆镜与景别规则见上映射表「分镜自检」行`,
    `笼统情绪词：让LLM把"伤心、紧张"改写成生理级微描述（手指收紧/眼角下垂/喉结滚动）；一个镜头只安排一次情绪转折；首帧若是中性脸，视频阶段救不回来——先重写静态表情再生成`,
    `多角色同框口型崩：一个片段只让一个人开口——分别生成"A说话特写"与"B反应镜头"；每个场景提示重述角色外观+明确站位（"米娜站左侧、莉子站右侧"），末尾加禁改条款（"请勿更改她的面部、穿搭、发型、年龄或风格"）`,
  ],
```

### 改动 3：`js/data.js` — automation 追加 3 条（锚点：`js/data.js:1013-1014`）

定位：`automation` 数组收尾的 `  ],`（其后紧跟 `  automationPick:`，该组合全文唯一）。将：

```
  ],
  automationPick: `选型口诀：Coze快速搭建、Dify私有化+RAG深度定制、n8n跨服务调度（如自动抓小说更新→触发流水线→推送剪辑队列）。`,
```

替换为：

```
    { t: `平台托管一键成片路线`, tag: `托管量产`, d: `巨日禄AI工业级流水线：2500字剧本自动拆约90个分镜，单人单日批量做10集竖屏短剧；字节漫剧创作工具（内测）支持10万字剧本一键成片，与即梦（创意生产间）、小云雀（ScriptBird剧本模型）构成工业化三件套。适合把重心放在剧本与审美的单人/小团队。` },
    { t: `剪映生态后期路线`, tag: `后期自动化`, d: `轻量路：小映Agent（2026-09-20发布，移动端）一句话生成视频初稿并自动配乐/调色/字幕/竖横多版式，官方口径6分钟口播粗剪AI约10分钟vs人工32分钟，社区打法=AI生成分镜视频→小映拼接→自动BGM/字幕/转场→人工卡点精修；⚠小映是移动端轻量助手、不是漫剧生产工具，漫剧主链路仍是剪映Hub（PC画布）+即梦/小云雀。技术路：jianying-editor-skill v1.5（GitHub luoluoluo22/jianying-editor-skill）装入Claude Code/Cursor用自然语言驱动剪映专业版——素材导入/特效搜索/TTS配音/字幕对齐/BGM推荐/无头批量导出1080P-4K等11项能力，底层pyJianYingDraft读写草稿、最终渲染仍由剪映原生完成；硬约束：仅支持剪映专业版≤5.9（6.0+弹窗破坏自动化）、macOS无自动导出、导出时不可操作键鼠、仅大陆版桌面端。` },
    { t: `Dify+ComfyUI 编排路线`, tag: `专业团队主流`, d: `编排层Dify（智能编排/RAG）+ComfyUI（生成节点）是专业团队主流组合；一致性用IPAdapter FaceID锁脸：2-4张五官清晰、无遮挡的正脸/侧脸参考图，权重0.6-0.8，固定随机种子，角色LoRA叠加做极致一致性（需中高端显卡）。趋势警示：Seedance 2.0类端到端方案开始冲击自建ComfyUI工作流的团队——自建管线价值在可控与低成本，端到端价值在上限与速度。` },
  ],
  automationPick: `选型口诀：Coze快速搭建、Dify私有化+RAG深度定制、n8n跨服务调度（如自动抓小说更新→触发流水线→推送剪辑队列）。`,
```

### 改动 4：`js/data.js` — 新增 `vlmPrompt` 模板键（锚点：`js/data.js:1048-1049`）

定位：`serialMemory` 模板字符串收尾的 `}\`,`（其后紧跟 `  compatNote:`，该组合全文唯一）。将：

```
}`,
  compatNote: `本模块JSON与「爆款心法 → 分镜板工作台」双向兼容。
```

替换为：

```
}`,
  vlmPrompt: `# 角色
你是短视频分镜解析器。我会按时间顺序给你一段爆款竖屏视频的逐帧截图（FFmpeg按1-2帧/秒抽取），请把它逆向拆解为结构化分镜JSON，用于学习其镜头套路。

# 任务
1. 按"景别+运镜+主体+动作+风格"五要素描述每帧所属镜头；
2. 合并连续相似帧为一个镜头，标注起止时间与估算时长；
3. 给每个镜头标注情绪节拍（钩子/铺垫/反转/卡点/空镜）；
4. 只输出JSON，不要输出JSON以外的任何文字。

# 输出JSON Schema
{
  "video": "爆款标题或编号",
  "fps": 2,
  "shots": [{
    "shot_id": "S01",
    "time_range": "0.0-3.0s",
    "shot_size": "特写|近景|中景|远景",
    "camera_move": "推|拉|摇|跟|固定",
    "subject": "主体与站位描述",
    "action": "单步动作链（一步一动作）",
    "style": "画风+光影+色调",
    "beat": "钩子|铺垫|反转|卡点|空镜",
    "learn": "可复用的套路点一句话"
  }]
}`,
  compatNote: `本模块JSON与「爆款心法 → 分镜板工作台」双向兼容。
```

（`compatNote` 一行是超长单行，此处只展示其行首作定位，粘贴时保持该行原样不动。）

### 改动 5：`js/app.js` — `llm()` 渲染函数整函数替换（锚点：`js/app.js:559-578`）

定位：RENDERERS 对象内从 `    llm() {` 到其后第一个 `    },`（即 `js/app.js:559-578`，紧邻 `    hot() {` 之前），整段替换为：

```js
    llm() {
      const L = DB.llm;
      /* mjxLlm：本模块内联交互（路线粗组筛选），只作用于本模块渲染出的DOM，不触碰全局委托 */
      window.mjxLlmRouteFilter = (el, key) => {
        el.parentElement.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c === el));
        document.querySelectorAll('#mjxLlmRoutes .route-card').forEach((c) => { c.style.display = (key === 'all' || c.dataset.mjxGrp === key) ? '' : 'none'; });
      };
      const map = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>环节</th><th>LLM任务</th><th>要点</th></tr></thead><tbody>' +
        L.mapping.map((m) => '<tr><td><b>' + m.s + '</b></td><td>' + m.t + '</td><td style="color:var(--tx2)">' + m.n + '</td></tr>').join('') + '</tbody></table></div>';
      const models = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>模型</th><th>漫剧任务适配</th><th>长文本</th><th>价格</th></tr></thead><tbody>' +
        L.models.map((m) => '<tr><td><b>' + m.n + '</b></td><td>' + m.f + '</td><td>' + m.c + '</td><td style="color:var(--tx2)">' + m.p + '</td></tr>').join('') + '</tbody></table></div>';
      const modelCopy = '<button class="copy-btn" style="margin-left:auto" data-copy="' + regCopy(L.models.map((m) => m.n + '｜适配：' + m.f + '｜长文本：' + m.c + '｜价格：' + m.p).join('\n')) + '">复制速查表</button>';
      const pick = L.pick.map((p) => '<li style="margin-left:18px;padding:2px 0;color:var(--tx2);font-size:13px">' + p + '</li>').join('');
      const pitfall = (L.pitfalls || []).length ? '<div class="callout red" style="margin-top:14px"><b>红线与避坑 · 立项/签单前先过一遍：</b><ul style="margin:8px 0 0">' +
        L.pitfalls.map((p) => '<li style="margin-left:18px;padding:3px 0;font-size:13px">' + p + '</li>').join('') + '</ul></div>' : '';
      const code1 = '<div class="codebox"><div class="cb-bar"><span>分镜表 JSON 输出格式（novelvids / Claude Code 流水线实践）</span><button class="copy-btn" data-copy="' + regCopy(L.jsonExample) + '">复制</button></div><pre>' + esc(L.jsonExample) + '</pre></div>';
      const code2 = '<div class="codebox"><div class="cb-bar"><span>LLM 生成分镜脚本 · 完整Prompt模板（可复制）</span><button class="copy-btn" data-copy="' + regCopy(L.promptTemplate) + '">复制</button></div><pre>' + esc(L.promptTemplate) + '</pre></div>';
      const code3 = '<div class="codebox"><div class="cb-bar"><span>完整一集分镜JSON示例（10镜 · 92秒 · 战神归来题材 · 可直接复制）</span><button class="copy-btn" data-copy="' + regCopy(L.fullEpisode) + '">复制</button></div><pre>' + esc(L.fullEpisode) + '</pre></div>' +
        '<div class="callout"><b>示例结构解读：</b>' + L.fullEpisodeNote + '</div>';
      const code4 = L.serialMemory ? '<div class="codebox"><div class="cb-bar"><span>连载化 · 跨集设定与记忆管理JSON（每集开工先喂LLM：前情提要+伏笔对账，再生成分镜）</span><button class="copy-btn" data-copy="' + regCopy(L.serialMemory) + '">复制</button></div><pre>' + esc(L.serialMemory) + '</pre></div>' +
        '<div class="callout blue"><b>与分镜板工作台双向兼容：</b>' + L.compatNote + '</div>' : '';
      const code5 = L.vlmPrompt ? '<div class="codebox"><div class="cb-bar"><span>VLM爆款反向拆解 · 逐帧喂 Gemini/GLM-4.6V 等多模态模型（可复制）</span><button class="copy-btn" data-copy="' + regCopy(L.vlmPrompt) + '">复制</button></div><pre>' + esc(L.vlmPrompt) + '</pre></div>' : '';
      /* mjxLlm：9条路线 tag 过细（实测9/9唯一，单chip只滤出1卡），归并3粗组再上筛选；卡片仍展示原tag */
      const grpOf = (t) => ({ '上手最快': '快速上手', '零门槛': '快速上手', '托管量产': '平台托管', '后期自动化': '平台托管',
        '最完整': '自建产线', '降本95%': '自建产线', '改编专用': '自建产线', '团队版': '自建产线', '专业团队主流': '自建产线' }[t] || '其他');
      const grps = ['all'].concat(L.automation.map((r) => grpOf(r.tag)).filter((g, i, a) => a.indexOf(g) === i));
      const cnt = (g) => g === 'all' ? L.automation.length : L.automation.filter((r) => grpOf(r.tag) === g).length;
      const routeChips = '<div class="tool-filters" style="margin-bottom:10px">' +
        grps.map((g, i) => '<span class="chip' + (i === 0 ? ' on' : '') + '" onclick="mjxLlmRouteFilter(this,\'' + g + '\')">' + (g === 'all' ? '全部' + L.automation.length + '条' : g + ' · ' + cnt(g)) + '</span>').join('') +
        '<button class="copy-btn" style="margin-left:auto" data-copy="' + regCopy(L.automation.map((r) => '【' + r.tag + '】' + r.t + '\n' + r.d).join('\n\n')) + '">复制全部路线</button></div>';
      const routes = '<div class="grid g2" id="mjxLlmRoutes">' + L.automation.map((r) => '<div class="card route-card" data-mjx-grp="' + grpOf(r.tag) + '"><span class="tag c">' + r.tag + '</span><br><b style="display:block;margin-top:6px">' + r.t + '</b><p>' + r.d + '</p></div>').join('') + '</div>';
      return '<h4 class="block-t" style="margin-top:0">各环节用途映射</h4>' + map +
        '<h4 class="block-t">模型选型' + modelCopy + '</h4>' + models + '<ul style="margin-top:8px">' + pick + '</ul>' +
        pitfall +
        '<h4 class="block-t">' + (L.vlmPrompt ? '五' : '四') + '个可直接复制的模板</h4>' + code1 + code2 + code3 + code4 + code5 +
        '<h4 class="block-t">自动化流水线 · ' + L.automation.length + '条路线</h4>' + routeChips + routes +
        '<div class="callout blue"><b>选型口诀：</b>' + L.automationPick + '</div>';
    },
```

**渲染增强说明**：

- 既有 5 个区块（映射表/选型表/pick/模板/流水线卡片/口诀）的 HTML 结构与文案**逐字保留**，只做增量；
- 新增 1 个红框区（`pitfalls`，`data.js` 无此键或为空数组时自动不渲染，向后兼容）、1 个第 5 模板代码块（`vlmPrompt` 同理）、2 个一键复制按钮（模型速查表 / 全部路线，走现有 `regCopy`+`data-copy` 全局复制设施）；模板区标题改为 `(L.vlmPrompt ? '五' : '四') + '个'` 动态拼接——`vlmPrompt` 撤出时标题自动回退为「四个」，不再硬编码（回应复核意见6）；
- 路线筛选改为**粗组制**：9 条路线的原 tag 实测 9/9 唯一、每个非 all chip 只能滤出 1 张卡、实用价值低（回应复核意见4），故在渲染函数内以 `grpOf` 映射表把 9 个 tag 归并为 3 个粗组——快速上手（上手最快/零门槛）· 2 条、平台托管（托管量产/后期自动化）· 2 条、自建产线（最完整/降本95%/改编专用/团队版/专业团队主流）· 5 条，chips 显示「组名 · 条数」；卡片仍逐字展示原 tag，`复制全部路线` 仍按原 tag 输出，`data.js` 既有条目的 tag 值零改动；
- 筛选逻辑为模块私有内联助手 `window.mjxLlmRouteFilter`（新标识符，`mjxLlm` 前缀），在渲染函数体内定义、只操作本模块渲染出的 `#mjxLlmRoutes .route-card`，`style.display` 隐藏机制与 `hot()` 的 data-hgi 分支（处理逻辑在 `js/app.js:2011-2012`）同构。**须明示：内联 onclick 为全站首例**（修订前 `grep -c "onclick=" js/app.js` 实测 = 0，全站交互一律走 `js/app.js:1943` 全局委托）——取舍理由：本方案任务约束为「交互增强只允许在该模块自己的渲染函数内部」，不得向全局委托器追加分支，故选内联 onclick（已核验 `index.html` 无 CSP meta、内联处理器随 innerHTML 注入可正常绑定、chips 样式走 `.tool-filters` 的 flex-wrap 不破移动端）；若后续全站统一交互范式，可按复核意见3a 在 `js/app.js:1943` 委托器加 2-3 行 data-hgi 镜像分支、chips 回退为 data-* 属性（需先放宽「只许改 llm() 函数体」的任务自限）；
- 未新增任何 CSS 类（全部复用现有类+内联样式），故本次无 `mjx-llm-` 前缀 CSS；
- automation 增至 9 条后，仪表盘统计（`js/app.js:443`）与全局搜索索引（`js/app.js:1816`）自动跟随，无需改动。

---

## 四、来源对照表

| 新增内容 | 站内出处 | 核心事实 |
|---|---|---|
| mapping·钩子与反转设计 | research/12-剧本创作与网文改编实操.md §二「钩子类型清单（含占比）」、§三「反转与节奏」 | 情绪钩30-40%/悬念钩20-30%/危机钩10-20%/信息钩10-20%（GitHub short-drama skill 统计口径）；开场15秒三要素=身份错位+利益威胁+视觉冲击；反转三大模式=身份/利益/关系 |
| mapping·分镜自检 | research/12 §四「拉片拆解方法论」 | CSDN 镜头连续性规则：一个镜头塞两个以上事件就要拆镜；相邻镜号避免相同景别；道具方位、光线色调要一致 |
| pick·成本侧红利 | research/17-最新动态扫描2026-09-18至10-02.md §四「备案与AI标识等合规新规」·「地方扶持」条 | 厦门思明区 2026-09-07 新政：合规大模型API投入（算力租赁/词元/接口订阅）按30%补助、单家企业年度上限300万元（流媒体网综合 2026-09-30）；36氪：全国已有七个城市推出AI漫剧扶持政策 |
| pitfalls·保底缩水 | research/08-变现运营.md 更新 v2.7 §2「剧本保底两口径定谳」 | 8-25 红果通知、08-27 生效：S+级保底1万元、S级5000元，A+级与A级取消保底只走纯分账，整体降幅约75%，仅限AI剧对话型剧本（含番茄IP改编与原创） |
| pitfalls·同质化检测 | research/12 §六「编剧生态与质量自检」；research/08 更新 v2.7 §1「过审率参照」 | 质量自检=平台同质化检测+开头查重；漫剧一次过审率约60%→30%、红果剧本过稿率跌至7.5%（Tech星球/流媒体网转引，2026年中口径） |
| pitfalls·剧本体量门槛 | research/18-工作室协作资产管理与多语种出海发行.md §2.1「行业通行的五段流水线」（节头 research/18:19；事实在 research/18:26 腾讯云五步表·剧本行） | 抖音对AI仿真人剧要求≥70集、约7万字剧本 |
| pitfalls·过载镜头 | research/19-数字人口型表演与美术风格进阶.md §A2.1「同一角色跨镜头形象稳定」防崩七步第3条；research/12 §四 | 单镜头=单个运镜+单个表演动作，不叠加"旋转+大笑+发丝飘动+变焦"式过载提示词 |
| pitfalls·笼统情绪词 | research/19 §A3.2「微表情与肢体语言」 | 生理级微描述替代笼统情绪词；一个镜头只安排一次情绪转折；首帧决定论（首帧中性脸救不回来） |
| pitfalls·多角色同框口型崩 | research/19 §A1.1「多角色对话的口型分配」 | 一个片段只让一个人开口；每场景提示重述角色外观+明确站位+末尾禁改条款 |
| vlmPrompt 模板（体例豁免，见§五） | 事实元素全有据：1-2帧/秒抽帧=research/07-大模型应用.md:71；"景别+运镜+主体+动作+风格"五要素JSON=research/07:72；"单步动作链（一步一动作）"=research/05-运镜与提示词.md:92；"只输出JSON"=同区既有 promptTemplate 同款体例（js/data.js:895「不要输出任何JSON以外的文字」）。模板组装沿用同区 promptTemplate/fullEpisode/serialMemory 三大站内组装先例 | 1-2帧/秒抽帧、按五要素输出结构化JSON、单步动作链、只输出JSON；情绪节拍词（钩子/反转/卡点）沿用 research/12 §二/§三 站内通用口径 |
| automation·平台托管一键成片 | research/04-AI工具矩阵.md 更新 v1.1「流水线/平台」 | 巨日禄AI：2500字剧本自动拆约90个分镜、单人单日批量10集；字节漫剧创作工具（内测）10万字剧本一键成片+工业化三件套 |
| automation·剪映生态后期路线（小映半） | research/04 更新 v1.2「剪映『小映』Agent」；research/23-收益预期对照与接单商单实操.md §5.2「剪映Hub · 小映 · Skill生态」 | 小映一句话生成初稿、自动配乐/调色/字幕；6分钟口播粗剪 AI 10分钟 vs 人工32分钟；社区打法四步；⚠"小映是移动端轻量助手，不是漫剧生产工具" |
| automation·剪映生态后期路线（skill半） | research/23 §5.2「开源自动化进阶」 | jianying-editor-skill v1.5：11项能力、pyJianYingDraft、渲染仍由剪映原生完成；四条硬约束（≤5.9/macOS无自动导出/导出时不可动键鼠/仅大陆版） |
| automation·Dify+ComfyUI 编排 | research/07 更新 v1.2「ComfyUI一致性节点参数（2026-09社区共识）」 | Dify+ComfyUI 专业团队主流组合；IPAdapter FaceID 2-4张参考、权重0.6-0.8、固定种子；角色LoRA需中高端显卡；Seedance 2.0类端到端冲击自建工作流 |

---

## 五、需人工核实

无。原第 1 条（vlmPrompt 模板组装待人核、需复核后再入库）按复核意见撤销，改为**模板体例豁免**：模板的事实元素已全部有据（1-2帧/秒抽帧=research/07:71、"景别+运镜+主体+动作+风格"五要素=research/07:72、单步动作链=research/05:92、"只输出JSON"与同区既有 promptTemplate「不要输出任何JSON以外的文字」同款体例），组装体例与同区既有 promptTemplate/fullEpisode/serialMemory 三大站内组装先例完全一致——既有先例本就是站内组装且已入库，vlmPrompt 同规处理，不作为待人核内容，故不适用「人核内容不得入代码」约束（豁免依据见 §四对照表 vlmPrompt 行）。其余 12 条新增数据的数字与结论均可在 §四对照表所列 research 档案原文中逐字对应。

---

## 六、不做的事

1. **不改 `models` 表**：现有 7 款与 research/04 §一「剧本文案大模型」一一对应，无新的可验证候选条目（DeepSeek V4-Flash 为同款轻量变体、单独成行价值低），不注水。
2. **不动任何既有条目与五大既有模板**（`jsonExample`/`promptTemplate`/`fullEpisode`/`fullEpisodeNote`/`serialMemory`/`compatNote`/`automationPick`）：既有数字口径零改动；`fullEpisodeNote` 中的"98秒-2分钟情绪闭环"等口径维持原样。
3. **不动公共设施**：路由、命令面板、全局搜索、收藏系统、全局点击委托（`js/app.js:1943`）零改动；路线筛选不新增全局 `data-*` 分支，改用模块私有内联助手（内联 onclick 为全站首例，取舍与回退路径已在 §三改动5说明中明示）。
4. **不新建模块、不改 index.html/sw.js/css/**：本次未新增任何 CSS 类（无 `mjx-llm-` 前缀使用场景），样式全部复用 `.chip/.copy-btn/.callout.red/.route-card/.tool-filters`。
5. **不跨模块搬内容**：research/19 的口型/表演细则属「提示词库/工具库」范畴，本方案只取直接服务"LLM 提示词怎么写"的三条规则（防混淆写法/一次一个动作/微描述），其余不迁移；research/05「音画同步模板」同理不搬（属提示词库）。
6. **不写无出处的"建议"**：如托管平台的账号/分成条款风险、第三方渠道甩卖价风险等（research/04 v2.0 仅针对视频 API 渠道有据），站内无直接出处，一律不写进代码。
