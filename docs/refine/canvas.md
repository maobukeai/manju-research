# 细化方案：无限画布与首尾帧挑战

> 模块 id：`canvas` · 数据区 `js/data.js:637-704`（canvas 对象）与 `js/data.js:707-838`（frameBank 题库） · 渲染函数 `js/app.js:532-557`
> 本方案只允许改动两处现实文件：`js/data.js`（canvas 数据区 + frameBank 题库增量）与 `js/app.js`（canvas() 渲染函数整函数替换）。其余一律只读。
> 补丁代码合计 112 行（数据增量 21 + 39 行、渲染函数 52 行），远低于 350 行上限。
> 全部补丁代码已通过自验：与 `js/data.js` 副本逐锚点合并后 `node --check` 语法通过；43 项结构/渲染断言全部 PASS（锚点唯一性、字段结构一致性、每题恰 1 个正确项、运镜分组映射、渲染 HTML 小节与计数、速查小节位于挑战之后、替换后 app.js 语法）。自验在临时目录完成，仓库内除本方案文档外零改动。

---

## 一、现状盘点

**数据区构成**（`js/data.js:638-704` 的 `canvas` 对象共 9 个键 + `js/data.js:707-838` 的 `frameBank` 数组）：

| 键 | 形态 | 条目数 | 内容 |
|---|---|---|---|
| `value` | `{ico,t,d}` 数组 | 4 | 无限画布四大核心价值（分镜连绘/角色一致性/场景延展/多格故事版） |
| `tools` | `{n,cap,fit,note}` 数组 | 9 | 画布工具对比表（即梦/剪映Hub/可灵/Krea/星流/CapCut/novelvids/tldraw/知漫剧） |
| `jimengOps` | 模板字符串 | 1 | 即梦智能画布操作路径（参考程度55/轮廓边缘/CFG 12-20） |
| `opsAlt` | `{n,path,key}` 数组 | 2 | 剪映Hub / 可灵灵动画布等效操作对照 |
| `deepGuides` | `{n,lvl,d}` 数组 | 6 | 六款画布手把手实操要点 |
| `select` | `{w,pick,why}` 数组 | 3 | 新手/进阶/工作室三档选型 |
| `steps` | `{t,d}` 数组 | 7 | 七步实操工作流（锚点→连绘→导出） |
| `tips` | 字符串数组 | 10 | 进阶技巧（双参考/六环链路/资产化/3D白模预演等） |
| `multiChar` | `{t,d}` 数组 | 7 | 多角色一致性专节（源自 research/19） |
| `frameBank` | `{id,a,move,opts[4]{t,ok,why}}` 数组 | 10 | 首尾帧转场题库（f1-f10，每轮随机抽 8 题） |

**模块外引用点**（全部无需改动，自动跟随增量或构成冻结约束）：

- 自动跟随：导航 `js/app.js:104`；模块简介 `js/app.js:127`；仪表盘统计文案 `js/app.js:443`（读 `DB.canvas.tools.length`）；全局搜索/收藏索引 `js/app.js:1795,1814,1815`（读 frameBank / tips / tools，forEach 追加安全）；挑战小标题题数 `js/app.js:550`（读 `DB.frameBank.length`，自动从"10题"变"13题"）。
- **冻结约束（本方案因此不碰这些键）**：`deepGuides`/`select` 被「视频模型选型向导」按**下标**绑定（`js/feat-picker.js:95-99`，`sel:0/1/2` 与 `guides:[0]/[1,2]/[3,5]`）——增删条目会整组错位；`frameBank` 的 f1-f6 被「分镜板」按 id 取题做预置链路（`js/feat-framesim.js:36-70`）——只许在队尾追加；`frameBank.length` 另驱动仪表盘关卡上限（`js/app.js:613,619` 与 `js/feat-studyhub.js:35`，均 `Math.min(8, length)`）——追加安全、删减危险。

**已有优势**：画布工具对比与三档选型完整；七步实操与多角色专节有据可查；首尾帧"判题"环节（四选一+判定理由）设计成熟，且 `why` 文案本身就是"视觉DNA/帧差定义运动/2-5秒"三原则的题面化。

**薄点（按严重度排序）**：

1. **模块名叫"首尾帧挑战"，却没有"怎么喂首尾帧"的实操层**。research/05 §四的六条实操——视觉DNA清单、2-5秒+出入点精确落帧、帧间提示词只补三件事、帧差=运动类型对照、Match Cut 衔接三选一+约束词、分段一致性校准——一条都没进数据区，只散落在各题 `why` 里；research/04 §三"首尾帧最稳三家"、research/21 §三可灵4.0 关键帧规格（≤10 关键帧 / Flash 无关键帧）等工具侧口径同样缺位。用户做完题，仍不知道下一步该把两帧喂给谁、提示词写什么。
2. **资产管理只有 tips 里一句"资产化"**。research/18 §A3 的 CHAR 资产库目录、版本管理四原则、参考图版本化、三视图成功率胜负手、前置建库3-5天全部未收录——而"一致性从抽卡概率战转向资产工程战"正是 2026 年的行业主线（research/19 §B4）。
3. **题库仅 10 题、每轮抽 8 题**（单题单轮被抽中概率 80%），重复率高；research/05 §二明确列出且漫剧高频的**急推变焦、希区柯克变焦、俯仰（上摇）**三种运镜无题覆盖。
4. **入手项目选择标准未收录**：research/06 §一"从≥2场景≥3角色的项目入手，参考图是最有效锚点"对新手是第一步，站内无处可看。

---

## 二、变更清单（逐条，含出处）

### C1 · `js/data.js` canvas 对象内新增键 `tailTips`（9 条，首尾帧生视频实操）

| # | 条目 | 出处（站内研究档案） |
|---|---|---|
| 1 | 两帧共享"视觉DNA"清单 | research/05-运镜与提示词.md §四.1 ＋ research/10-实战SOP深化.md §一（"两帧关联性不要太远…是废片主因"） |
| 2 | 2-5秒＋出入点铁律 | research/05-运镜与提示词.md §四.2 |
| 3 | 帧间提示词只补三件事 | research/05-运镜与提示词.md §四.3 ＋ §五（可灵"双重指挥"/smooth motion） |
| 4 | 帧差＝运动类型对照 | research/05-运镜与提示词.md §四.4 |
| 5 | Match Cut 衔接三选一 | research/05-运镜与提示词.md §四.6 |
| 6 | 首尾帧最稳三家 | research/04-AI工具矩阵.md §三 ＋ research/05-运镜与提示词.md §五/§四.5 |
| 7 | 关键帧进阶（可灵4.0） | research/21-可灵4.0正式版实测与视频模型价格核验.md §三（10关键帧/≤8000 tokens/Flash阉割清单；"Flash试镜"句沿用该档案自标的【经验推断】） |
| 8 | 尾帧链的互补解：续写串联 | research/04-AI工具矩阵.md §三 v2.0（官方"多次续拍最长2分钟"）＋ v1.8（逐段微调/动作钩子） |
| 9 | 分段校准与兜底 | research/05-运镜与提示词.md §四.5 ＋ research/06-无限画布.md §四.5（FFmpeg，与既有 steps 第七步同源，仅作交叉引用） |

### C2 · `js/data.js` canvas 对象内新增键 `assetOps`（6 条，画布资产工程化）

| # | 条目 | 出处（站内研究档案） |
|---|---|---|
| 1 | 入门项目怎么选（≥2场景≥3角色） | research/06-无限画布.md §一.3 |
| 2 | 前置建库 3-5 天 | research/18-工作室协作资产管理与多语种出海发行.md §A3.3（腾讯云 2026 精品连载工作流） |
| 3 | CHAR 资产库目录（直接可抄） | research/18-工作室协作资产管理与多语种出海发行.md §A3.1（知乎 CHAR 资产库 2026-01-10，目录结构与双索引为原文转述） |
| 4 | 版本管理四原则 | research/18-工作室协作资产管理与多语种出海发行.md §A3.2（CinemagiQ《Managing AI Assets at Scale》） |
| 5 | 参考图本身也要版本化 | research/18-工作室协作资产管理与多语种出海发行.md §A3.2（同文"两条关键扩展"） |
| 6 | 三视图成功率胜负手 | research/18-工作室协作资产管理与多语种出海发行.md §A3.1（正向词模板与"紧身衣"负面词为原文） |

### C3 · `js/data.js` frameBank 队尾追加 f11-f13（3 题）

| # | 题目（运镜） | 出处 |
|---|---|---|
| f11 | 急推变焦（瞳孔地震/反转） | 运镜定义与用法：research/05-运镜与提示词.md §二；判定框架（视觉DNA/帧差/2-5秒）：§四 |
| f12 | 希区柯克变焦（背叛/身世揭开） | 运镜定义与用法：research/05-运镜与提示词.md §二；判定框架：§四 |
| f13 | 俯仰（上摇）（霸总/反派登场） | 运镜定义与用法：research/05-运镜与提示词.md §二；判定框架：§四 |

> 说明：题面场景与选项文本为按 f1-f10 既有范式构造的**教学示例**（f1-f10 本身即原创教学题、无外部出处），非事实断言；其中的运镜定义、判定原则均有上表出处。追加在队尾，f1-f6（feat-framesim 按 id 取题）与既有"随机8题"逻辑均不受影响，题库 10→13 后单题单轮被抽中概率由 80% 降至约 61.5%。

### C4 · `js/app.js` canvas() 渲染函数整函数替换（52 行）

- 新增三个小节渲染：`🎬 首尾帧生视频实操`（置于「进阶技巧」之后，单条复制＋整组一键复制）、`🗂️ 画布资产工程化`、`📚 首尾帧题库速查`（置于挑战**之后**防剧透，按运镜类别静态分组，13 题各显示首帧/正确尾帧/判定理由）；
- 原有十个小节（价值卡/工具对比/即梦路径/等效对照/六款实操/七步工作流/进阶技巧/多角色专节/挑战/怎么选）逐字保留，消费的数据键一个不变；
- 复制能力复用全局 `data-copy` 委托（`js/app.js:1958-1959`）与 `regCopy`（`js/app.js:46-47`），**不新增任何事件分支**；不新增 CSS 类（css/ 只读），全部用行内 style＋既有类；
- `tailTips`/`assetOps` 读取处带 `|| []` 兜底：即使只应用渲染改动、未应用数据改动，页面也不报错。

---

## 三、落点与代码

### 改动 1 · `js/data.js`：`canvas` 对象内、`tips` 数组收口之后插入

**锚点**：`data.js:694` 的 `  ],`（`tips` 数组收口，上一行 693 为含"3D白模预演"的 tip）与 `data.js:695` 的 `  multiChar: [` 之间。以下 21 行整体插入：

```js
  /* 首尾帧生视频实操（喂帧/帧间提示词/工具规格 · 2026-10-07 增补，逐条出处见 docs/refine/canvas.md §四） */
  tailTips: [
    { t: `两帧共享"视觉DNA"清单`, d: `同宽高比、相近曝光、相似构图与色调、主体一致——帧差越小，中间运动越干净；差距过大模型会"发明"中间内容（融帧鬼影的根源）。两帧关联性不要太远：构图/位置/景别跨度小才稳，跨度太大导致运镜不完整是废片主因。` },
    { t: `2-5秒 + 出入点铁律`, d: `单段首尾帧片段控制在2-5秒；剪辑时让出入点精确落在上传的两帧上——即成片从首帧画面开始、在尾帧画面收束，不越界也不浪费。` },
    { t: `帧间提示词只补三件事`, d: `节奏（slow/rapid）+ 氛围 + 两帧之间的行为。两帧图已经定义了"从哪到哪"，提示词再复述画面内容只会跟帧差打架；可灵用首尾帧时切忌运镜面板与提示词双重指挥，加 smooth motion 稳住。` },
    { t: `帧差＝运动类型对照`, d: `位置差→位移；表情差→情绪；景别差→推拉；构图差→转场。想要推镜，就让尾帧＝首帧的放大构图——本页「首尾帧转场挑战」每一题都在考这条。` },
    { t: `Match Cut 衔接三选一`, d: `取A镜最后帧作B镜首帧，一句话写明衔接类型（morph / match cut / whip pan 三选一），加约束词 no extra elements, camera locked——约束词含义即"不加戏、锁机位"，防止模型在接缝处自由发挥。` },
    { t: `首尾帧最稳三家`, d: `可灵、Vidu Q2 Turbo、即梦。即梦"图生视频+首尾帧"最强、中文复合运镜词响应好；不涉及一镜到底时只放首帧或尾帧即可，无需凑齐两帧。` },
    { t: `关键帧进阶（可灵4.0）`, d: `4.0正式版支持最多10张关键帧输入做精准叙事控制、提示词≤8000 tokens；Flash 先行版仅首帧图生视频、无关键帧/全能参考——用Flash试镜验证运镜与节奏，正式版再上关键帧出成片【经验推断，由规格差异反推】。` },
    { t: `尾帧链的互补解：续写串联`, d: `可灵单次生成可通过续写串联成长叙事（官方口径多次续拍最长2分钟），角色外观与场景风格基本不漂移；实操要点：逐段微调提示词、每段结尾留动作钩子接下段。` },
    { t: `分段校准与兜底`, d: `所有分段的首尾帧先统一导入图像工具做一致性校准，再进视频模型；供应商不返回尾帧时，用FFmpeg从成片片尾提取作下一镜首帧（与上方第七步口径一致）。` },
  ],
  /* 画布资产工程化（入手项目/建库/目录与版本 · 2026-10-07 增补，逐条出处见 docs/refine/canvas.md §四） */
  assetOps: [
    { t: `入门项目怎么选`, d: `从≥2场景、≥3角色的项目入手——参考图是最有效的一致性锚点。` },
    { t: `前置建库 3-5 天`, d: `精品连载开工前先建库：SD本地部署训练角色LoRA（30-50张图覆盖不同角度/表情/光照，可保持100集一致）+ MJ批量生成场景母版图锁定风格 + 即梦图生图建道具素材库。` },
    { t: `CHAR 资产库目录（直接可抄）`, d: `CHAR/CHAR001_苏晚/ 下分 refs/（权威参考图·三视图）、v1/ v2/（历次生成版本，永不覆盖）、approved.jsonl（已批准版本登记）；角色卡以"标签+关键词"双索引维护。` },
    { t: `版本管理四原则`, d: `①一个资产一个身份：角色/场景/道具各一个实体，所有重生成都是它的新版本；②廉价非破坏性迭代：十次变体全保留，命名"Hero, version 7"而不是 hero_final_v3_NEW(2).png；③唯一的当前版本：任何时刻只有一版标记"已批准"，分镜/生视频/剪辑只读该版本；④回滚是一等操作：版本9跑偏，回滚到版本6再分支，不从零重做。` },
    { t: `参考图本身也要版本化`, d: `角色权威参考表更新后，下游镜头要标注"基于哪个参考版本生成"；参考、备注、决策等上下文直接挂在镜头节点上——让每个镜头知道自己用了哪个角色/场景/风格版本。` },
    { t: `三视图成功率胜负手`, d: `正向词统一模板："同一角色，白色背景，全身照，全身无遮挡，动漫风格，3D渲染，皮克斯风格，全身，倾斜45度，二头身"；两项胜负手：补齐全身照三视图差集 + 负面词必加"紧身衣"。` },
  ],
```

### 改动 2 · `js/data.js`：`frameBank` 队尾追加 f11-f13

**锚点**：f10 末选项（`data.js:836`，含"推窗主角→驿使"的 why 行）之后的 `    ] },`（`data.js:837`，f10 对象收口）之后、frameBank 收口 `],`（`data.js:838`）之前。注意是插到 **f10 对象的 `    ] },` 之后**，不要插进 f10 的 `opts` 数组里。以下 39 行整体插入：

```js
  { id: `f11`,
    a: `复古书房深夜：主角坐在书桌前拆开一封旧信，中景构图，台灯暖黄光只照亮他与桌面，房间四周沉在阴影里`,
    move: `急推变焦：镜头瞬间急速推近，猛地撞向主角读信时的双眼`,
    opts: [
      { t: `同一书房同一台灯光线：主角眼部大特写充满画面，瞳孔震颤、眼眶泛红，背景书架已虚化成暖黄色块`, ok: true,
        why: `共享DNA（同主体/同场景/同光线），帧差=中景到眼部大特写的骤然放大——帧差恰好定义"急推变焦"的爆发感，2-5秒内一镜完成"看到真相"的瞳孔地震。` },
      { t: `推近后画面变成信纸上的字迹特写，主角完全出画`, ok: false,
        why: `换了主体：急推变焦的落点是首帧主体的眼睛，落点换成信纸等于中途换掉叙事焦点——"谁在读信"的情绪冲击被偷换成道具特写。` },
      { t: `主角仍坐在书桌前拆信，构图几乎没变，只是信封又展开了一点`, ok: false,
        why: `帧差过小（无变化）：急推了2-5秒构图却没有骤然放大，观众感知不到爆发力，"急推变焦"沦为静图拖时长，反转冲击力全部落空，还容易被平台判低质。` },
      { t: `撞向双眼时已是白天办公室，脸上是冷白日光灯`, ok: false,
        why: `帧差过大：光线（深夜台灯暖黄→白天冷白）与场景（书房→办公室）全变，两帧不共享视觉DNA——模型强行急推会产出扭曲闪烁的融帧鬼影。` },
    ] },
  { id: `f12`,
    a: `会议室白日：反派高管立于长桌尽头训话，仰视构图只拍到他的下巴与挺括的西装下摆，头顶日光灯冷白`,
    move: `希区柯克变焦：镜头推近主角同时背景拉远扭曲，压迫感陡增`,
    opts: [
      { t: `同一会议室同一冷白光：主角面部占比明显放大、嘴角挂着讥讽，背景长桌与窗外天际线被拉长变形、透视失真加剧`, ok: true,
        why: `共享DNA（同主体/同场景/同光线），帧差是"主体放大+背景反向拉远扭曲"同时发生——这正是希区柯克变焦（dolly zoom）独有的帧差组合，2-5秒内把背叛揭穿的眩晕感砸在观众脸上。` },
      { t: `只推近主角面部，背景长桌保持正常透视不变`, ok: false,
        why: `帧差类型错配：只有主体放大、背景不反向畸变，那是普通"推"的帧差——希区柯克变焦必须两股帧差同时反向发生，缺一股就退化为普通推镜，压迫感无从谈起。` },
      { t: `背景拉长扭曲了，但主角还是画面里原来那么大，姿势也没变`, ok: false,
        why: `帧差过小（主体无变化）：dolly zoom 的张力来自"主体放大与背景畸变同时挤压"，主体不动只剩背景变形，观众只会觉得画面坏了而不是局势反转了。` },
      { t: `镜头推到一半场景已切成夜晚停车场，画面里换成另一个人`, ok: false,
        why: `帧差过大：光线（日光灯冷白→夜晚）、场景（会议室→停车场）、主体（反派高管→另一个人）全变——两帧不共享视觉DNA，模型只能硬切或变形糊接。` },
    ] },
  { id: `f13`,
    a: `豪宅大门清晨：大门缓缓打开，画面下缘只有一双锃亮的黑色皮鞋踏入，逆光把门槛镀成金色，画面上部大量留白`,
    move: `俯仰（上摇）：机位原地不动，镜头从皮鞋缓慢上摇到主角的脸`,
    opts: [
      { t: `同一大门同一逆光：构图沿垂直方向连续上移，皮鞋与西装下摆移出画面下缘，主角下巴、嘴角与居高临下的眼神依次入画`, ok: true,
        why: `共享DNA（同主体/同场景/同光线），帧差=取景方向的垂直角度位移，恰好定义"俯仰"——2-5秒内完成从"是谁来了"到"原来是他"的登场仪式感，摇镜的落点就是叙事落点。` },
      { t: `摇到一半大门已换成雨夜街头，皮鞋变成雨中的运动鞋`, ok: false,
        why: `换了场景：俯仰的帧差只能来自同一机位的垂直转动，中途换空间锚点等于转动链条断裂——"上摇"变成两个镜头的硬拼，登场仪式感被打断。` },
      { t: `仍是皮鞋特写构图，只是皮鞋面的反光更亮了一些`, ok: false,
        why: `帧差过小（无运镜）：摇了2-5秒取景方向却没有垂直位移，只有道具反光小变化，观众感知不到"上摇"的运动，静图拖时长还容易被平台判低质。` },
      { t: `摇到脸时已是正午，逆光变成顶光，脸上换了另一名角色`, ok: false,
        why: `帧差过大：光线（清晨逆光→正午顶光）与主体（换成别人）全变，两帧不共享视觉DNA——模型强行过渡会产出扭曲闪烁的融帧鬼影，登场戏直接穿帮。` },
    ] },
```

### 改动 3 · `js/app.js`：整函数替换 canvas()

**锚点**：`app.js:532` 的 `    canvas() {` 至 `app.js:557` 的收口 `    },`（下一个函数 `llm()` 位于 559 行，不动）。用以下 52 行整体替换：

```js
    canvas() {
      const C = DB.canvas;
      const ftBest = store.get(FT_KEY, 0);
      const val = C.value.map((v) => '<div class="card"><div style="font-size:22px">' + v.ico + '</div><b style="display:block;margin:5px 0 3px">' + v.t + '</b><p style="font-size:12.6px;color:var(--tx2)">' + v.d + '</p></div>').join('');
      const tbl = '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>工具</th><th>画布核心能力</th><th>适配</th><th>备注</th></tr></thead><tbody>' +
        C.tools.map((t) => '<tr><td><b>' + t.n + '</b></td><td>' + t.cap + '</td><td>' + stars(t.fit) + '</td><td style="color:var(--tx2)">' + t.note + '</td></tr>').join('') + '</tbody></table></div>';
      const steps = '<div class="step-flow">' + C.steps.map((s) => '<div class="step-item"><b>' + s.t + '</b><p>' + s.d + '</p></div>').join('') + '</div>';
      const tips = C.tips.map((t) => '<div class="card" style="padding:12px 15px;font-size:13px;color:var(--tx2)"><b style="color:var(--gold)">⚡ </b>' + t + '</div>').join('');
      const guides = C.deepGuides.map((g) => '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><b>' + g.n + '</b><span class="tag c">' + g.lvl + '</span></div><p style="font-size:12.7px;color:var(--tx2);margin-top:7px">' + g.d + '</p></div>').join('');
      const selRows = C.select.map((s) => '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 64px;text-align:left;color:var(--gold);font-weight:700">' + s.w + '</span><span style="flex:1;font-size:13px"><b>' + s.pick + '</b></span><span style="flex:1.6;font-size:12px;color:var(--tx3)">' + s.why + '</span></div>').join('');
      /* mjxCanvas 增补①：首尾帧生视频实操卡片（单条可复制） */
      const mjxCanvasTailList = C.tailTips || [];
      const mjxCanvasTailCards = '<div class="grid g2">' + mjxCanvasTailList.map((x) => '<div class="card" style="padding:13px 15px"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><b style="font-size:13.5px">' + x.t + '</b><button class="copy-btn" data-copy="' + regCopy(x.t + '：' + x.d) + '" style="flex-shrink:0">复制</button></div><p style="font-size:12.7px;color:var(--tx2);margin:7px 0 0;line-height:1.75">' + x.d + '</p></div>').join('') + '</div>';
      /* mjxCanvas 增补②：画布资产工程化卡片 */
      const mjxCanvasAssetCards = '<div class="grid g2">' + (C.assetOps || []).map((x) => '<div class="card" style="padding:13px 15px"><b style="display:block;margin-bottom:6px">' + x.t + '</b><p style="font-size:12.7px;color:var(--tx2);margin:0;line-height:1.75">' + x.d + '</p></div>').join('') + '</div>';
      /* mjxCanvas 增补③：题库速查——按运镜类别静态分组，复用全局 esc()，不新增事件分支 */
      const mjxCanvasFtCats = [['急推变焦', '急推变焦'], ['希区柯克', '希区柯克变焦'], ['固定', '固定机位'], ['环绕', '环绕'], ['移焦', '移焦'], ['俯仰', '俯仰'], ['横移', '横移'], ['降', '降镜'], ['推', '推镜'], ['拉', '拉镜'], ['摇', '摇镜'], ['甩', '甩镜'], ['升', '升镜']];
      const mjxCanvasFtCatOf = (m) => (mjxCanvasFtCats.find((c) => m.indexOf(c[0]) >= 0) || ['', '其他'])[1];
      const mjxCanvasFtGroups = [];
      DB.frameBank.forEach((q) => {
        const g = mjxCanvasFtCatOf(q.move);
        let grp = mjxCanvasFtGroups.find((x) => x.g === g);
        if (!grp) { grp = { g, qs: [] }; mjxCanvasFtGroups.push(grp); }
        grp.qs.push(q);
      });
      const mjxCanvasFtRef = mjxCanvasFtGroups.map((grp) => '<div style="font-size:13.5px;font-weight:800;color:var(--gold);margin:16px 0 8px">▸ ' + esc(grp.g) + ' · ' + grp.qs.length + '题</div>' +
        '<div class="grid g2">' + grp.qs.map((q) => {
          const good = q.opts.find((o) => o.ok);
          return '<div class="card" style="padding:12px 14px"><b style="font-size:13px;color:var(--p2)">🎯 ' + esc(q.move.split('：')[0]) + '</b>' +
            '<p style="font-size:12.3px;color:var(--tx2);margin:6px 0 0;line-height:1.7"><b style="color:var(--tx3)">首帧：</b>' + esc(q.a) + '</p>' +
            '<p style="font-size:12.3px;color:var(--tx2);margin:5px 0 0;line-height:1.7"><b style="color:var(--tx3)">✔ 正确尾帧：</b>' + esc(good ? good.t : '') + '</p>' +
            '<p style="font-size:12.3px;color:var(--tx3);margin:5px 0 0;line-height:1.7">' + esc(good ? good.why : '') + '</p></div>';
        }).join('') + '</div>').join('');
      return '<div class="grid g4">' + val + '</div>' +
        '<h4 class="block-t">工具对比</h4>' + tbl +
        '<div class="callout"><b>即梦智能画布操作路径：</b>' + C.jimengOps + '</div>' +
        '<h4 class="block-t">剪映Hub / 可灵灵动画布 · 等效操作对照 <span class="sub">与三档选型对应 · 2026-10 实测口径</span></h4>' + (C.opsAlt || []).map((o) => '<div class="callout blue"><b>' + o.n + '：</b>' + o.path + '<br><b style="color:var(--gold)">⚡ 关键差异：</b>' + o.key + '</div>').join('') +
        '<h4 class="block-t">六款画布手把手实操要点 <span class="sub">2026-10 深度实测口径</span></h4><div class="grid g3">' + guides + '</div>' +
        '<h4 class="block-t">七步实操工作流 <span class="sub">角色三视图锚定 → 分镜连绘 → 导出</span></h4>' + steps +
        '<h4 class="block-t">进阶技巧</h4><div class="grid g2">' + tips + '</div>' +
        '<h4 class="block-t">🎬 首尾帧生视频实操 <span class="sub">喂帧 / 帧间提示词 / 工具规格 · ' + mjxCanvasTailList.length + '条 · 技法源自 research/05·04·21·10</span><button class="copy-btn" data-copy="' + regCopy(mjxCanvasTailList.map((x) => x.t + '：' + x.d).join('\n')) + '" style="margin-left:auto;flex-shrink:0">一键复制整组</button></h4>' + mjxCanvasTailCards +
        '<h4 class="block-t">🗂️ 画布资产工程化 <span class="sub">入手项目 / 建库 / 目录与版本 · 技法源自 research/06·18</span></h4>' + mjxCanvasAssetCards +
        '<h4 class="block-t">👥 多角色一致性专节 <span class="sub">同框 / 对话 / 换装 · 技法源自 research/19</span></h4><div class="grid g2">' + (C.multiChar || []).map((m) => '<div class="card"><b style="display:block;margin-bottom:5px">' + m.t + '</b><p style="font-size:12.7px;color:var(--tx2);margin:0">' + m.d + '</p></div>').join('') + '</div>' +
        '<h4 class="block-t">🎞️ 首尾帧转场挑战 <span class="sub">题库' + DB.frameBank.length + '题 · 每轮随机8题 · 考察视觉DNA / 帧差定义运动 / 2-5秒原则</span></h4>' +
        '<div id="ftBox"><div class="card" style="text-align:center;padding:30px 20px">' +
        '<b style="font-size:16px;display:block;margin-bottom:6px">给首帧和运镜，选出正确的尾帧</b>' +
        '<p style="font-size:12.8px;color:var(--tx2);max-width:520px;margin:0 auto">尾帧链是无限画布连绘的核心（见上方第七步）：上一镜尾帧=下一镜首帧。规则口诀——两帧共享视觉DNA、帧差定义运动类型、单镜2-5秒。</p>' +
        (ftBest ? '<p class="mini-note" style="margin-top:10px">🏆 历史最佳：' + ftBest + '/8</p>' : '') +
        '<button class="btn pri" data-ft-start style="margin-top:14px">开始挑战 →</button></div></div>' +
        '<h4 class="block-t">📚 首尾帧题库速查 <span class="sub">挑战做完再来对答案 · ' + DB.frameBank.length + '题按运镜分组（含正确尾帧与判定理由）</span></h4>' + mjxCanvasFtRef +
        '<h4 class="block-t">怎么选 <span class="sub">按人群给出2026-10选型</span></h4><div class="chart-box">' + selRows + '</div>';
    },
```

**自验记录**（本次会话实际执行）：将三个代码块按上述锚点合并进 `js/data.js` / `js/app.js` 的临时副本后——

- `node --check merged-data.js` → 通过；`node --check`（替换 canvas() 后的完整 app.js 副本）→ 通过；
- `node verify.mjs`（43 项断言）→ **43 pass / 0 fail**：锚点唯一性、既有 9 键条目数不变（value 4 / tools 9 / opsAlt 2 / deepGuides 6 / select 3 / steps 7 / tips 10 / multiChar 7）、tailTips 9 条与 assetOps 6 条均 `{t,d}` 非空、frameBank 10→13 且 f1-f10 未动、f11-f13 字段结构与既有题完全一致且每题恰 1 个正确项、13 题全部落入预期运镜分组（f10 含"推窗"不误判为推镜）、渲染 HTML 含三个新小节且挑战小标题自动变"题库13题"、复制按钮恰 10 个（9 单条＋1 整组）、速查小节位于挑战之后。渲染冒烟测试对 `store/esc/stars/regCopy` 使用了桩函数；未起浏览器，页面级视觉效果未人工目验。

---

## 四、来源对照表

| 补丁条目 | 站内出处 | 研究档案引用的原始来源 |
|---|---|---|
| tailTips 1 视觉DNA清单 | research/05 §四.1；research/10 §一 | research/05 §四"首尾帧技巧"（§一归属 Runway 官方指南 2025-2026）；research/10 抽卡可用率节（参考图挂载） |
| tailTips 2 2-5秒+出入点 | research/05 §四.2 | 同上 |
| tailTips 3 帧间提示词三件事 | research/05 §四.3＋§五 | research/05 §五"各家运镜控制差异"（可灵行） |
| tailTips 4 帧差=运动类型 | research/05 §四.4 | 同 §四 |
| tailTips 5 Match Cut 三选一 | research/05 §四.6 | 同 §四 |
| tailTips 6 首尾帧最稳三家 | research/04 §三；research/05 §五/§四.5 | research/04 工具矩阵正文结论"首尾帧最稳三家：可灵、Vidu Q2 Turbo、即梦" |
| tailTips 7 关键帧进阶（可灵4.0） | research/21 §三 | fal.ai 规格页 2026-09-30＋smzdm 定价拆解 2026-10-01＋德里克文首批实测（档案内已标【经验推断】句沿用） |
| tailTips 8 续写串联 | research/04 §三 v2.0/v1.8 | 可灵官方 release note"多次续拍最长2分钟"（fal 标注 coming soon）；社区实测逐段微调/动作钩子 |
| tailTips 9 分段校准与兜底 | research/05 §四.5；research/06 §四.5 | 即梦实测口径；FFmpeg 提尾帧（与站内 steps 第七步同源，仅交叉引用） |
| assetOps 1 入门项目怎么选 | research/06 §一.3 | research/06 无限画布专题正文（选型建议） |
| assetOps 2 前置建库 3-5 天 | research/18 §A3.3 | 腾讯云开发者社区《AI漫剧制作流程深度解析》2026（精品连载工作流；成本数字因档案内口径不一致【存疑】未收录） |
| assetOps 3 CHAR 资产库目录 | research/18 §A3.1 | 知乎《AI短剧角色永不崩的底层逻辑：CHAR资产库搭建与一致性管控》2026-01-10（全文已抓取） |
| assetOps 4 版本管理四原则 | research/18 §A3.2 | CinemagiQ《Managing AI Assets at Scale: Versioning, Characters & Continuity》2026（全文已抓取） |
| assetOps 5 参考图版本化 | research/18 §A3.2 | 同上（"两条关键扩展"段） |
| assetOps 6 三视图胜负手 | research/18 §A3.1 | 同 CHAR 资产库文（正向词模板与"紧身衣"负面词为原文） |
| frameBank f11 急推变焦 | research/05 §二（定义/用法）＋§四（判定框架） | research/05 §二运镜表："sudden crash zoom slamming into his eyes｜瞳孔地震/反转"；题面为教学示例 |
| frameBank f12 希区柯克变焦 | research/05 §二＋§四 | 同表："dolly zoom, background warps｜推近同时背景拉远扭曲｜背叛/身世揭开"；题面为教学示例 |
| frameBank f13 俯仰（上摇） | research/05 §二＋§四 | 同表："slow tilt up from leather shoes to face｜从皮鞋上摇到脸｜霸总/反派登场"；题面为教学示例 |

---

## 五、需人工核实

无。所有写进代码的陈述均能在 `research/*.md` 找到对应章节（见 §四）；唯一沿用的【经验推断】标注（tailTips 7"Flash试镜/正式版出成片"）为 research/21 档案内自行标注并随文保留；题库三道新题的题面场景属教学示例（与既有 f1-f10 同范式），非事实断言。

---

## 六、不做的事

1. **不动 `deepGuides` 与 `select`**：二者被选型向导按下标绑定（`js/feat-picker.js:95-99`），增删会错位；本方案对这两个键零改动。
2. **不动 f1-f10 及一切既有条目**：既有字段、数字口径（参考程度55、CFG 12-20、一致性+102%、5人协作上限等）一律不改，纯增量。
3. **不加"组内筛选 chips"交互**：现有模块级筛选（如 `data-hgi`）依赖 `js/app.js:1943` 起的全局点击委托里加分支，属公共设施，超出"只在该模块渲染函数内部增强"的边界——故题库速查采用**静态分组**，复制走既有全局 `data-copy` 通道（`js/app.js:1958-1959`）。
4. **新区块不接入全局搜索/收藏**：索引清单（`js/app.js:1795-1815`）属公共设施未动；tailTips/assetOps 暂不进全局搜索，如后续需要，在索引处各加一行 forEach 即可。
5. **不新增 CSS 类**：css/ 只读；所有新卡片/分组标题用既有类（card/grid g2/block-t/copy-btn/mini-note）＋行内 style，因此本方案没有产生任何需要 `mjx-canvas-` 前缀的类。新增 JS 标识符一律带 `mjxCanvas` 前缀（mjxCanvasTailList/mjxCanvasTailCards/mjxCanvasAssetCards/mjxCanvasFtCats/mjxCanvasFtCatOf/mjxCanvasFtGroups/mjxCanvasFtRef），且全部限定在 canvas() 函数体内部，不污染全局。
6. **不收录存疑数字**：research/18 §A3.3 的"单分钟成本1000-2500元"在档案内即标"同源两口径不一致【存疑】"，不写进数据；既有 tips 中 3D白模工具名（Kavilo/Nano Banana 2/GPT-6 等）的【存疑】标注维持原状不动。
7. **不新建模块、不动路由/命令面板/全局搜索/收藏系统**；不改 `index.html`、`sw.js`、`css/`、其余 `js/`（含 feat-* 外挂）与 `research/`。
8. **sw.js 无需处理**：其缓存策略为全部同源 GET 网络优先（`sw.js:2-5` 注释），data.js 更新即时可见，缓存版本号无需 bump。
