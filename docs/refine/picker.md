# 细化方案：选型向导（picker）

> 目标文件：`js/feat-picker.js`（本方案全部代码改动仅落在这一个文件；除本文档外不改任何文件）
> 基线：feat-picker.js 以 `<script src="js/feat-picker.js?v=28">` 挂载（index.html:113），已被 sw.js 缓存列表收录（sw.js:5）。

## 一、现状盘点

**有什么（逐区清点，均实测自 js/feat-picker.js 全文）：**

| 数据区 | 规模 | 说明 |
|---|---|---|
| `QS`（feat-picker.js:48-93） | 6 题 / 20 选项（4+4+3+3+3+3） | 用途场景/月预算/产能节奏/出海/协作/画质，每选项带 `w`（主力分）与 `v`（跑量分） |
| `MODELS` + `MODEL_ORDER`（:26-36） | 8 款候选 | 逐条绑定 `DB.videoCompare` 下标与「工具库」`data-hl` 高亮键 |
| `LEAN` / `V_PRI`（:38-44） | 8 / 8 | 链路标签、跑量并列优先序 |
| `CANVAS_TIERS`（:96-100） | 3 档 | 绑定 `DB.canvas.select` 与 `deepGuides` |
| 结果区（:279-322） | 4 张卡 + 次选条 | 主力模型/跑量方案/画布/配音剪辑（3 行）+ 一键复制清单（12 行） |
| 其他 | — | 步进条、倾向提示、localStorage「manju_picker_v1」续答、`#/picker` 直开深链兜底、search 3 条、注入 CSS 25 条规则 |

**缺什么（最薄的三处 + 一处知识断层）：**
1. **推完即止**：结果页给出组合后没有任何「第一步怎么走」——用户拿到推荐到真正开产之间是断的；而研究档案里恰恰沉淀了大量即刻可用的开工要领（样片模式、试镜用 Flash、免费积分排期等）。
2. **计分黑盒**：6 题加权计分是模块卖点，但用户只看到「与主力总分差 N 分」一句，8 款模型的得分构成完全不可见，「次选」缺乏支撑。
3. **作答无解读**：20 个选项在结果页只回显成 chip，答了「出海为主」意味着什么（YouTube 新政、TikTok 入驻门槛）一个字没有——研究档案里有现成的高价值答案。
4. **④配音剪辑区最薄**：只有 3 行工具+价格+1 个音效链接，零使用要领；而「AI 配音情感不足」是全行业第一痛点（46.7% 用户不满，research/02-开发流程与爆款方法论.md 阶段7），恰是该区最该补的内容。

**风格说明（与任务提示的差异，以实际代码为准）**：任务模板提示「沿用反引号模板字符串风格」，但本模块数据区与渲染全部使用**单引号字符串拼接**（feat-picker.js:27-100 全区如此），反引号风格属 js/data.js。本方案新增代码一律沿用模块自身的单引号风格，不引入第二风格。

## 二、变更清单（逐条，含出处）

| # | 变更 | 落点 | 出处 |
|---|---|---|---|
| 1 | 新增常量 `mjxPickerPlaybook`：8 款主力模型各配「第一步 + 避坑」 | 插入 `CANVAS_TIERS` 之后 | research/21 §四/§一/§三/§2.1/§2.2；research/04 §三/§六/§更新v1.1；research/05 §四/§五；js/data.js tools 各条 tip/price/con |
| 2 | 新增常量 `mjxPickerQTips`：20 条「作答解读」（键=`题id:选项k`，覆盖全部 20 个选项） | 同上 | research/05 §一/§更新v1.2/§四；research/19 §典型镜头清单；research/21 §四/§2.1/§2.2；research/04 §更新v1.1/§更新v1.2/§八/§更新v2.0/§九；research/13 §四/§五/更新§一/更新§五；research/02 阶段3/阶段6/爆款方法论表；research/23 §三/§4.3/§5.1；research/14 §二/§三；research/10 §四；js/data.js videoCompareNote/canvas.tips/tools 鬼手剪辑 tip |
| 3 | 新增常量 `mjxPickerAudioTips`：8 条配音/剪辑/口型工具使用要领（键=`DB.tools.n`） | 同上 | research/10 §三/§四；research/19 §口型评测；research/21 §2.1；research/14 §一；research/04 §更新v1.2；js/data.js tools 即梦对口型/Hedra/MiniMax/Hedra tip、tools Runway price |
| 4 | `zoneMain`：主力卡新增「第一步这么走 / 避坑提醒」两个列表项（读 `mjxPickerPlaybook`） | 整函数替换 | 数据同 #1 |
| 5 | `zoneAudio`：3 行工具下方新增所选工具的使用要领列表 + 音效库要领注脚（读 `mjxPickerAudioTips`） | 整函数替换 | 数据同 #3 |
| 6 | 新增 `mjxPickerScoreHtml`：结果页计分明细 `<details>`（8 款模型主分/跑量分排序条形图，标注主力/跑量/备胎）——组内排序类小增强，纯渲染层、原生 `<details>` 无新增事件 | 插入 `viewResult` 之前 | 无新数据（复用模块内 `score()` 既有口径） |
| 7 | 新增 `mjxPickerTipsHtml` + `viewResult` 整函数替换：推荐卡内挂计分明细，结果页新增「作答解读」卡片 | 整函数替换 | 数据同 #2 |
| 8 | `copyText`：复制清单的主力模型下新增「第一步」一行 | 整函数替换 | 数据同 #1 |
| 9 | `injectStyle`：新增 15 条 `.mjx-picker-*` 规则并扩展移动端 media query | 整函数替换 | 纯样式，颜色/圆角/阴影全部取自 style.css 既有变量（--panel2/--line/--line2/--r-s/--grad/--tx 系，已实测存在：css/style.css:6-15） |

不改动：`QS` 全部题目/选项/权重、`MODELS`/`CANVAS_TIERS`/`LEAN`/`V_PRI`、`score()`/`computeResult()`、存储键、深链兜底、search 文案（cnt「6问」保持）、事件委托。所有新增 JS 标识符以 `mjxPicker` 前缀、CSS 类以 `mjx-picker-` 前缀（已 grep 确认全站无占用）。

## 三、落点与代码

以下 6 处改动均在 `js/feat-picker.js`。代码块均为完整可粘贴最终形态，无省略。

### 改动 1：插入增补数据区（三常量）

- **锚点**：单行注释 `  /* ---------- 小工具 ---------- */`（当前 102 行）。该行保留，在其**之前**插入以下整块：

```js
  /* ---------- 增补数据区（细化补丁）：三条新常量，风格与既有常量一致（单引号字符串） ----------
     mjxPickerPlaybook：k 对齐 MODELS.k —— 主力模型的「第一步」与「避坑」；
     mjxPickerQTips：键 = 题id:选项k —— 每个作答的落地解读（结果页「作答解读」区，覆盖全部20个选项）；
     mjxPickerAudioTips：键 = DB.tools 的 n —— 配音/剪辑/口型工具的使用要领。
     逐条出处见 docs/refine/picker.md §四来源对照表；本区块不改动任何既有常量。 */
  var mjxPickerPlaybook = {
    jm: { first: '先用免费积分跑通「分镜图直出带配音」的单镜闭环；开网页版样片模式：480P草稿抽2次+升清1080P，15秒实测比直抽省约38%', pit: '积分政策频繁收紧（2026年9月每日免费积分66-100→30、高阶功能剥离免费池），抽卡前先看当日积分页再排产，别按上月额度做排期' },
    kl4: { first: '试镜用4.0 Flash验证运镜节奏（720P/3-20秒、实测6灵感值/秒），成片再上关键帧（≤10张）+全能参考（≤15项：图≤10、视频≤5且合计≤30秒）', pit: '正式版截至2026-10-02未全量、计费未公布，4K 10-bit HDR官方仍标「即将上线」——别把4K写进对客户的排期承诺' },
    kl3: { first: '把每日66灵感值当排期表用：720P生成约6灵感值/秒，50秒一集约300灵感值；对口型约1灵感值/秒，是主力通道里最便宜的口型档', pit: '单段仅5-10秒，长叙事靠尾帧链/续拍串联（官方续拍上限2分钟）；「串联不漂移」尚无权威压测数据，关键段落逐段校验再拼接' },
    vidu: { first: '整段16秒声画同出：「镜头一…镜头二…」的分镜写法可直接用；参考生视频挂1-7张锚定角色一致性', pit: '避免大幅度拉镜（易失真），运动幅度用「轻微/明显/剧烈」分级词；按量计费——先小批量试出单价再定产能' },
    hailuo: { first: '武打/情绪动作镜头批量跑用Fast版（成本-50%）；H3开源版2K直出15秒音画，本地部署零API成本', pit: '单段6-10秒偏短；官方Video Agent年费过万引争议——订阅前先按自己的单集时长算清账' },
    veo: { first: '先用Flow每天50免费积分测试英文台词与画质口碑，再决定订阅；8秒单段靠延长功能拼长段落', pit: '国内使用与支付有门槛（海外网络/支付方式）；API $0.05-0.6/秒按秒计费——英文向内容再上量，别拿来跑国内分账素材' },
    runway: { first: '把它当「救火队」：已有素材换风格/删加物体/换机位一句话搞定；2026-09起可在PR/AE时间线里直接调用', pit: '纯提示词控镜（无面板、无负向提示词栏），约束要正着写、静止必须写motionless；Gen-4.5计费约12 credits/秒，整段修复前先算积分' },
    wan: { first: '本地部署跑通社区ComfyUI工作流后，把跑量镜头交给它、关键镜头留给闭源旗舰——「开源跑量+闭源关键镜头」混合降本', pit: '需要中高端显卡；公测API按分辨率分档计费（480P约0.3/720P约0.6/1080P约1.2元/秒），算成本前先定分辨率档' },
  };
  var mjxPickerQTips = {
    'scene:story': '台词戏按五段式走：双人交代→A说话特写→B反应特写→物体空镜→双人收尾；一个片段只让一人开口，过肩/反应/空镜掩护其余口型',
    'scene:action': '动作戏铁律：运镜动词必带方向+速度、一镜最多1-2种运镜；「两人扭打」拆成「他挥拳→她侧身闪过→拳头砸碎花瓶」的单步动作链',
    'scene:volume': '跑量参照系：巨日禄2500字剧本自动拆约90个分镜、单人单日批量10集；但平台分账爆款率AI漫剧不足0.1%（2026H1）——爆款播放≠爆款收入',
    'scene:mix': '混合做的分工：叙事段落交给主力模型立住剧感，大场面/跑量镜头降档给第二模型控成本——「主力+跑量」双模型编排正是本向导的推荐结构',
    'budget:free': '免费三件套把每日额度当排期用：即梦每日免费积分（2026年9月已缩至30）+可灵66灵感值/天+Veo Flow每天50积分；开源Wan扛底仓',
    'budget:light': '轻预算甜蜜点：海螺约¥10/月起+可灵黄金¥66/月（常5折）——低价订阅+每日免费额度混搭，别一上来就买旗舰会员',
    'budget:mid': '这一档买的是「单镜上限」：即梦开样片模式（480P草稿→升清1080P，实测省约38%）；带货实测提醒：宣传价默认按重抽2-3倍预留',
    'budget:high': '工作室级走API走量：可灵3.0 Turbo API 720P约0.8积分/秒；第三方「0.2元/秒级」甩卖渠道存在服务与账号风险，接商单前慎用',
    'pace:slow': '慢更也按重抽2-3倍预留预算（带货实测提醒）；单镜可反复抽到满意，但分段首尾帧记得统一做一致性校准，拼起来才是片',
    'pace:weekly': '周更2-3集靠固定产线：相邻镜头尾帧=下镜首帧（尾帧链）；可灵续拍串联逐段微调提示词防漂移',
    'pace:daily': '日更是流水线不是肝：巨日禄单人单日10集；剪映「小映」AI粗剪（6分钟口播人工32分钟vs AI 10分钟）+人工只做卡点精修',
    'sea:no': '先对齐平台节奏再谈模型：红果单集压98秒-2分钟一个情绪闭环、2分钟完播权重38%——分镜密度照此倒推',
    'sea:yes': '出海跑量模式已死：2026-07-16起YouTube对模板化批量AI内容执行频道级取消获利；原创角色IP+一致性人设才能变现；TikTok Drama Center个人无法直接入驻，需挂靠机构',
    'sea:both': '双线要分主次：主链路国产控成本；出海译制「配音质量是第一死穴——预算向配音质量倾斜而非条数」，负评三大项：不像人/不像角色/不像本地人',
    'team:solo': '单人拼最短链路：豆包出脚本→即梦Seedance执行→剪映成片是官方工作流沉淀的新手默认链路，工具越少越快跑通闭环',
    'team:duo': '2-3人按「写本/出图出片/剪辑」分工即可并行流水线——站内口径3人日更10集；动手前先定分镜表11字段（镜头号/景别/时长/运镜等）',
    'team:studio': '工作室核心是「资产与分镜解耦」：角色/场景/道具放独立资产库跨镜头调用；一致性六环链路缺一环整季必崩',
    'qual:ok': '达标就发≠糊弄：先7天跑通第一条成片闭环再升级画质；剪映「AI画质增强」基础功能免费，零成本提质',
    'qual:hd': '精品感三件套：大幅运动与封面级镜头上旗舰+混生成素材统一超分补帧（Topaz或剪映AI画质增强）+源头控制色温（主力镜头同一模型）',
    'qual:client': '商单交付三底线：报价单写明修改轮次上限、先收30%-50%定金、初稿打水印确认后收尾款再交源文件；成片按-14 LUFS交付',
  };
  var mjxPickerAudioTips = {
    'MiniMax Speech': 'HD版给主角、turbo给群配；情绪转折用省略号分句，常规段1.1-1.2倍速、情感独白0.9-1.0；内联(laughs)(sighs)拟声直接写进文本',
    'ElevenLabs': '[whispers][sad]行内标签可堆叠，拼写错误会被念出来；重音=全大写；单次合成保持250字符以上更稳；不支持SSML（停顿用[pause]）',
    '即梦对口型': '民间两步法更省积分：先生成视频再拿去对口型；唱歌是口型照妖镜——先短句实测再上量',
    '可灵对口型': '约1灵感值/秒是对口型口径（生成口径720P约6灵感值/秒，别混算）；群像戏用「多角色指定发言」明确谁在说话',
    'Hedra': '540p出样片、定稿再升720p省积分；一年内已改价两次，投产前复核当日价格',
    '剪映专业版': '社区日更打法：AI分镜视频全部丢给小映拼接→自动BGM/字幕/转场→人工只做卡点精修；字幕竖屏一行≤8-10字符',
    'Premiere / DaVinci': '调色重点不是「调」而是「统一」：多模型混生成的色温差异，源头控制（主力镜头同一模型）+统一LUT收口',
    '剪映音效库': '每个打斗/反转/爽点动作都要有音效重音——「音效是爽感的一半」；热门音效易撞车，关键重音换AI生成专属变体',
  };
```

### 改动 2：`zoneMain` 整函数替换

- **锚点**：`function zoneMain(R) {` 起至其闭合 `}` 止的整个函数（当前 279-289 行）。
- **替换为**：

```js
  function zoneMain(R) {
    var M = R.main.m, vc = R.main.vc;
    var mjxPb = mjxPickerPlaybook[M.k];
    var lis = ['场景匹配「' + esc(vc.scene) + '」'];
    if (M.motto) lis.push('选型口诀（引自「工具库」对比表）：' + esc(M.motto));
    lis.push('能力亮点：' + esc(trim(vc.adv, 76)));
    if (mjxPb) {
      lis.push('<b>第一步这么走：</b>' + esc(mjxPb.first));
      lis.push('<b>避坑提醒：</b>' + esc(mjxPb.pit));
    }
    return '<div class="card pk-zone"><div class="pk-zone-head"><span class="tag c">① 主力视频模型</span><div class="pk-price">💰 ' + esc(vc.price) + '</div></div>' +
      '<b class="pk-zone-t">' + esc(vc.m) + '</b>' +
      '<ul class="pk-why">' + lis.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      (R.warn ? '<div class="callout red pk-warn"><b>预算提示：</b>' + esc(R.warn) + '</div>' : '') +
      '<div class="pk-links"><button class="btn ghost pk-go" data-go="' + hlLink(M.hl) + '">→ 工具库「' + esc(M.hl) + '」' + esc(M.hlNote) + '</button></div></div>';
  }
```

### 改动 3：`zoneAudio` 整函数替换

- **锚点**：`function zoneAudio(R) {` 起至其闭合 `}` 止的整个函数（当前 317-322 行）。
- **替换为**：

```js
  function zoneAudio(R) {
    var mjxTips = [R.audio.tool, R.edit.tool, R.lips.tool].map(function (n) {
      return mjxPickerAudioTips[n] ? '<li><b>' + esc(n) + ' ·</b> ' + esc(mjxPickerAudioTips[n]) + '</li>' : '';
    }).join('');
    return '<div class="card pk-zone"><div class="pk-zone-head"><span class="tag h">④ 配音剪辑</span><div class="pk-price">价格档见各行</div></div>' +
      '<b class="pk-zone-t">声音与成片的最后两公里</b>' +
      '<div class="pk-rows">' + pkRow('配音', R.audio) + pkRow('剪辑', R.edit) + pkRow('口型', R.lips) + '</div>' +
      (mjxTips ? '<ul class="mjx-picker-tips">' + mjxTips + '</ul>' : '') +
      '<div class="pk-links"><button class="btn ghost pk-go" data-go="' + hlLink('剪映音效库') + '">→ 音效：剪映音效库（免费）</button></div>' +
      (mjxPickerAudioTips['剪映音效库'] ? '<div class="mjx-picker-anote">💡 ' + esc(mjxPickerAudioTips['剪映音效库']) + '</div>' : '') +
      '</div>';
  }
```

### 改动 4：新增两个渲染辅助函数 + `viewResult` 整函数替换

- **锚点**：`function viewResult() {` 起至其闭合 `}` 止的整个函数（当前 323-348 行）。
- **替换为**（两个新辅助函数 + 新版 `viewResult`）：

```js
  /* ---------- 增补视图：计分明细 / 作答解读（结果页渲染函数内部增强，不涉公共设施） ---------- */
  function mjxPickerScoreHtml(R) {
    var mjxSc = score(pkState.ans);
    var mjxRows = MODEL_ORDER.map(function (k) { return { k: k, t: mjxSc.tot[k], v: mjxSc.vol[k] }; });
    mjxRows.sort(function (a, b) { return b.t - a.t; });
    var mjxMax = Math.max(1, mjxRows[0].t);
    var mjxTrs = mjxRows.map(function (r) {
      var mjxMark = r.k === R.main.m.k ? ' <span class="tag c">主力</span>'
        : (r.k === R.vol.m.k ? ' <span class="tag g">跑量</span>'
          : (r.k === R.second.m.k ? ' <span class="tag">备胎</span>' : ''));
      return '<div class="mjx-picker-srow"><span class="mjx-picker-sname">' + esc(vcOf(modelOf(r.k)).m) + mjxMark + '</span>' +
        '<span class="mjx-picker-sbar"><i style="width:' + Math.round(r.t / mjxMax * 100) + '%"></i></span>' +
        '<span class="mjx-picker-sval">主 ' + r.t + ' · 跑 ' + r.v + '</span></div>';
    }).join('');
    return '<details class="mjx-picker-score"><summary>📊 为什么是它？展开看 8 款模型计分明细</summary>' +
      '<div class="mjx-picker-stable">' + mjxTrs + '</div>' +
      '<p class="mini-note">「主」=主力模型加权总分（出海 / 场景 / 预算权重最高）；「跑」=跑量方案独立计分（与主力互补、免费/低成本优先）。回退改答后明细即时刷新。</p></details>';
  }
  function mjxPickerTipsHtml() {
    var mjxLis = QS.map(function (q) {
      var mjxTip = mjxPickerQTips[q.id + ':' + pkState.ans[q.id]];
      return mjxTip ? '<li><b>' + esc(q.short) + ' ·</b> ' + esc(mjxTip) + '</li>' : '';
    }).join('');
    if (!mjxLis) return '';
    return '<div class="card" style="margin-top:14px"><b style="display:block;font-size:15px;margin:2px 0 8px">▚ 作答解读：你的每个选择意味着什么</b>' +
      '<ul class="mjx-picker-tips">' + mjxLis + '</ul>' +
      '<p class="mini-note">解读口径引自 research/ 研究档案与「工具库」条目；涉及价格与政策时效的表述以对应档案标注的检索时点为准。</p></div>';
  }
  function viewResult() {
    var R = computeResult(pkState.ans);
    var recap = QS.map(function (q) {
      var o = optOf(q, pkState.ans[q.id]);
      return '<span class="chip on" style="cursor:default">' + q.short + '：' + esc(o ? o.n : '—') + '</span>';
    }).join('');
    var copyId = ctx.regCopy(copyText(R));
    return stepsHtml(QS.length) +
      '<div class="card" style="padding:16px 18px;margin-bottom:14px"><span class="tag g">组合推荐已生成</span>' +
      '<b style="display:block;font-size:17px;margin:8px 0 2px">▸ 你的推荐工具链</b>' +
      '<div class="tool-filters" style="margin-top:8px">' + recap + '</div>' +
      mjxPickerScoreHtml(R) +
      '<p class="mini-note">点任意已完成步骤可回退改答（其后作答将作废重答）。</p></div>' +
      '<div class="grid g2">' + zoneMain(R) + zoneVol(R) + zoneCanvas(R) + zoneAudio(R) + '</div>' +
      mjxPickerTipsHtml() +
      '<div class="card" style="margin-top:14px;display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px">' +
      '<span class="tag">次选备胎</span><b>' + esc(R.second.vc.m) + '</b>' +
      '<span style="font-size:12.5px;color:var(--tx2)">与主力总分差 ' + R.second.gap + ' 分——题材切换或某档涨价时的第一替换。</span>' +
      '<button class="btn ghost pk-go" data-go="' + hlLink(R.second.m.hl) + '">→ 工具库「' + esc(R.second.m.hl) + '」' + esc(R.second.m.hlNote) + '</button></div>' +
      '<div class="card" style="margin-top:14px">' +
      '<div class="pk-foot">' +
      '<button class="btn pri" data-copy="' + copyId + '">📋 一键复制推荐清单</button>' +
      '<button class="btn ghost" data-pk-back>← 回上一题改答</button>' +
      '<button class="btn ghost" data-pk-reset>↻ 重答</button>' +
      '<button class="btn ghost" data-go="tools">浏览「工具库」全量库 →</button>' +
      '<button class="btn ghost" data-go="earnpath">去「收益决策树」选变现路径 →</button></div>' +
      '<p class="mini-note">计分口径：推荐池仅为 DB.videoCompare 8 款视频模型与画布三档选型，权重为本模块内置常量（出海 / 场景 / 预算权重最高，节奏 / 画质次之，协作最低）；价格档引用「工具库」对比表当日数据。本模块不新增研究口径。</p></div>';
  }
```

### 改动 5：`copyText` 整函数替换

- **锚点**：`function copyText(R) {` 起至其闭合 `}` 止的整个函数（当前 349-368 行）。
- **替换为**：

```js
  function copyText(R) {
    var L = [];
    var mjxPb = mjxPickerPlaybook[R.main.m.k];
    L.push('【漫剧研究 · 选型向导】我的推荐工具链');
    L.push('1. 主力视频模型：' + R.main.vc.m);
    L.push('   价格档：' + R.main.vc.price);
    L.push('   理由：场景匹配「' + R.main.vc.scene + '」' + (R.main.m.motto ? '；选型口诀：' + R.main.m.motto : ''));
    if (mjxPb) L.push('   第一步：' + mjxPb.first);
    L.push('2. 跑量方案：' + R.vol.vc.m + '（' + (R.vol.famSame ? '与主力同生态换档' : '开源跑量+闭源关键镜头的混合编排') + '）');
    L.push('   价格档：' + R.vol.vc.price);
    L.push('3. 画布工具：' + R.canvas.pick + '（' + R.canvas.tierName + '档；' + R.canvas.why + '）');
    L.push('4. 配音：' + R.audio.tool + '（价格档：' + R.audio.price + '）');
    L.push('   剪辑：' + R.edit.tool + '（价格档：' + R.edit.price + '）');
    L.push('   口型：' + R.lips.tool + '（价格档：' + R.lips.price + '）');
    L.push('5. 次选备胎：' + R.second.vc.m + '（与主力分差 ' + R.second.gap + ' 分）');
    L.push('— 依据作答：' + QS.map(function (q) {
      var o = optOf(q, pkState.ans[q.id]);
      return q.short + '=' + (o ? o.n : '—');
    }).join('；'));
    L.push('— 生成于「漫剧研究学习平台 · 选型向导」，权重为模块内置口径，价格档以工具库当日数据为准');
    return L.join('\n');
  }
```

### 改动 6：`injectStyle` 整函数替换（追加 15 条 `.mjx-picker-*` 规则 + 扩展移动端）

- **锚点**：`function injectStyle() {` 起至其闭合 `}` 止的整个函数（当前 390-426 行）。
- **替换为**：

```js
  function injectStyle() {
    if (document.getElementById('mj-picker-style')) return;
    var st = document.createElement('style');
    st.id = 'mj-picker-style';
    st.textContent =
      '#sec-picker .pk-steps{display:flex;gap:7px;margin:2px 0 14px}' +
      '#sec-picker .pk-step{flex:1;min-width:0;display:flex;align-items:center;gap:7px;padding:9px 10px;border-radius:var(--r-s);border:1px solid var(--line);background:var(--panel2);color:var(--tx3);font-size:12px;cursor:default;font-family:inherit;transition:.2s var(--ease-out);overflow:hidden}' +
      '#sec-picker .pk-step i{font-style:normal;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--line2);color:var(--tx2);font-size:11px;font-weight:700;flex-shrink:0;transition:.2s}' +
      '#sec-picker .pk-step span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#sec-picker .pk-step.done{cursor:pointer;color:var(--tx2);border-color:var(--line2)}' +
      '#sec-picker .pk-step.done i{background:var(--grad);color:#fff}' +
      '#sec-picker .pk-step.done:hover{border-color:var(--p1);transform:translateY(-1px)}' +
      '#sec-picker .pk-step.cur{color:var(--tx);border-color:var(--p1);box-shadow:var(--shadow-sm)}' +
      '#sec-picker .pk-step.cur i{background:var(--p1);color:#fff}' +
      '#sec-picker .pk-lean{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--tx2);background:var(--panel2);border:1px dashed var(--line2);border-radius:var(--r-s);padding:8px 12px;margin:0 0 14px}' +
      '#sec-picker .pk-lean b{color:var(--gold)}' +
      '#sec-picker .pk-opt{text-align:left}' +
      '#sec-picker .pk-opt b{display:block;font-size:14px}' +
      '#sec-picker .pk-opt span{display:block;font-size:12px;color:var(--tx3);margin-top:3px;font-weight:400;line-height:1.6}' +
      '#sec-picker .pk-opt.on{border-color:var(--p1);background:rgba(139,92,246,.14);box-shadow:0 0 0 1px var(--p1) inset}' +
      '#sec-picker .pk-zone{display:flex;flex-direction:column}' +
      '#sec-picker .pk-zone-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:8px}' +
      '#sec-picker .pk-price{font-size:11.5px;color:var(--gold);text-align:right;line-height:1.5;max-width:58%}' +
      '#sec-picker .pk-zone-t{font-size:16.5px;line-height:1.5}' +
      '#sec-picker .pk-why{margin:8px 0 10px;padding:0;list-style:none}' +
      '#sec-picker .pk-why li{position:relative;padding:3px 0 3px 15px;font-size:12.8px;color:var(--tx2);line-height:1.65}' +
      '#sec-picker .pk-why li::before{content:"";position:absolute;left:2px;top:12px;width:5px;height:5px;border-radius:50%;background:var(--p2)}' +
      '#sec-picker .pk-rows{margin:2px 0 8px}' +
      '#sec-picker .pk-row{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px dashed var(--line)}' +
      '#sec-picker .pk-rows .pk-row:first-child{border-top:none}' +
      '#sec-picker .pk-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:auto;padding-top:8px}' +
      '#sec-picker .pk-go{padding:7px 14px;font-size:12.5px;border-radius:var(--r-s)}' +
      '#sec-picker .pk-warn{margin-top:2px;margin-bottom:10px;font-size:12.5px}' +
      '#sec-picker .pk-foot{display:flex;flex-wrap:wrap;gap:10px}' +
      '#sec-picker .mjx-picker-score{border:1px dashed var(--line2);border-radius:var(--r-s);padding:10px 14px;margin-top:12px;background:var(--panel2)}' +
      '#sec-picker .mjx-picker-score summary{cursor:pointer;font-size:13px;color:var(--tx2);user-select:none}' +
      '#sec-picker .mjx-picker-score summary:hover{color:var(--tx)}' +
      '#sec-picker .mjx-picker-stable{margin-top:10px;display:flex;flex-direction:column;gap:6px}' +
      '#sec-picker .mjx-picker-srow{display:flex;align-items:center;gap:10px;font-size:12px}' +
      '#sec-picker .mjx-picker-sname{width:170px;flex-shrink:0;color:var(--tx2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
      '#sec-picker .mjx-picker-sname .tag{margin-left:4px}' +
      '#sec-picker .mjx-picker-sbar{flex:1;min-width:0;height:8px;border-radius:4px;background:var(--line);overflow:hidden}' +
      '#sec-picker .mjx-picker-sbar i{display:block;height:100%;border-radius:4px;background:var(--grad)}' +
      '#sec-picker .mjx-picker-sval{flex-shrink:0;color:var(--tx3);font-variant-numeric:tabular-nums}' +
      '#sec-picker .mjx-picker-tips{margin:8px 0 2px;padding:0;list-style:none}' +
      '#sec-picker .mjx-picker-tips li{padding:5px 0;font-size:12.3px;color:var(--tx2);line-height:1.65;border-top:1px dashed var(--line)}' +
      '#sec-picker .mjx-picker-tips li:first-child{border-top:none}' +
      '#sec-picker .mjx-picker-tips b{color:var(--tx)}' +
      '#sec-picker .mjx-picker-anote{font-size:11.5px;color:var(--tx3);line-height:1.6;margin-top:6px;padding-top:6px;border-top:1px dashed var(--line)}' +
      '@media(max-width:960px){#sec-picker .pk-step span{display:none}#sec-picker .pk-step{padding:8px;justify-content:center}#sec-picker .pk-price{max-width:100%}#sec-picker .mjx-picker-sname{width:118px}}';
    document.head.appendChild(st);
  }
```

补丁合计：6 个代码块实测 **211 行**（已通过 `node --check` 语法校验），在 ~350 行预算内。

## 四、来源对照表

> research/*.md 为全站事实源头；js/data.js 为站内既有口径（本模块本身已绑定引用，引用行号为当前工作区实测）。

### mjxPickerPlaybook（8 条）

| 键 | 字段 | 出处 |
|---|---|---|
| jm.first | 样片模式省约38%（480P草稿抽2次22元+升清77元≈99元 vs 直抽156元） | research/21 §四「即梦降本新增项」；§2.2 |
| jm.pit | 免费积分66-100→30（9月14-26）、9-20高阶功能剥离免费池 | research/21 §四「即梦C端积分政策」；research/04 §更新v2.0 |
| kl4.first | Flash试镜（720P/3-20秒/6灵感值/秒、无关键帧/全能参考）；关键帧≤10、全能参考≤15项（图≤10+视频≤5合计≤30秒） | research/21 §三（官方规格补全+Flash阉割清单） |
| kl4.pit | 截至10-02未全量、正式版计费未公布、4K 10-bit HDR「即将上线」未落地 | research/21 §一/§五 |
| kl3.first | 每日66灵感值；720P生成约6灵感值/秒（50秒≈300灵感值，按单价折算）；对口型约1灵感值/秒 | research/21 §2.1（价格表）+§2.2（50秒×6=300灵感值折算口径） |
| kl3.pit | 单段5-10秒；续拍官方上限2分钟；漂移压测无权威数据、关键段落逐段校验 | research/21 §三「漂移问题如实报告」；js/data.js:266（dur 字段） |
| vidu.first | 16秒声画同出；「镜头一…镜头二…」写法可用；参考生视频1-7张 | js/data.js:304（tools Vidu pro/tip）；research/04 §三表格 |
| vidu.pit | 避免大幅拉镜；运动幅度分级词「轻微/明显/剧烈」 | research/05 §五「各家运镜控制差异」Vidu 行 |
| hailuo.first | Fast版成本-50%；H3开源2K直出15秒音画 | research/04 §三表格+§更新v1.1 |
| hailuo.pit | 单段6-10秒；Video Agent年费过万引争议 | research/04 §更新v1.1；js/data.js:305（con） |
| veo.first | Flow每天50免费积分；8秒可延长 | research/04 §九成本速查（Veo 3.1 免费50积分/天）；js/data.js:269（dur「8秒（可延长）」） |
| veo.pit | 国内使用与支付有门槛；API $0.05-0.6/秒 | js/data.js:306（tools Veo con/price）；research/04 §三表格 |
| runway.first | 换风格/删加物体/换机位一句话；2026-09 PR/AE插件 | research/04 §三+§六；js/data.js:330 |
| runway.pit | 纯提示词无面板无负向栏、静止写motionless；约12 credits/秒 | research/05 §五 Runway 行；js/data.js:307（price 字段） |
| wan.first | 开源跑量+闭源关键镜头混合降本；ComfyUI社区工作流 | js/data.js:273（videoCompareNote）；js/data.js:311（tools Wan tip） |
| wan.pit | 需中高端显卡；公测API分档价 480P 0.3 / 720P 0.6 / 1080P 1.2元/秒 | js/data.js:311（con）；research/21 §2.2「核验注」（新浪财经8-7公测稿） |

### mjxPickerQTips（20 条）

| 键 | 出处 |
|---|---|
| scene:story | research/19 §典型镜头清单（五段式）；js/data.js:441-450 camTalkRules「一个片段只让一个人开口」 |
| scene:action | research/05 §一「运镜铁律」1/2 条；§更新v1.2「动作拆步法则」 |
| scene:volume | research/04 §更新v1.1「巨日禄AI」；research/23 §三路径1（AI漫剧爆款率<0.1%，DataEye 2026H1）；research/02「收益警示」（爆款播放≠爆款收入） |
| scene:mix | js/data.js:273 videoCompareNote（混合编排口诀）；本模块 zoneVol famSame 既有文案同口径 |
| budget:free | research/21 §四（即梦9月免费积分→30）；research/04 §九（可灵66灵感值/天、Veo 50积分/天）；js/data.js:271（Wan 开源免费） |
| budget:light | research/04 §三表格（海螺约¥10/月起、可灵黄金¥66常5折） |
| budget:mid | research/21 §四样片模式省38%；§2.2 废片系数（带货实测提醒默认乘2-3倍） |
| budget:high | research/21 §2.1（可灵3.0 Turbo API 720P 0.8积分/秒）；§2.2（第三方渠道0.23-0.3元/秒存在服务与账号风险） |
| pace:slow | research/21 §2.2 废片系数；§四（分段首尾帧统一一致性校准同 research/05 §四第5条） |
| pace:weekly | research/05 §四「首尾帧技巧」（尾帧链）；research/21 §三（续拍逐段微调防漂移，同 js/data.js:303 可灵 tip） |
| pace:daily | research/04 §更新v1.1（巨日禄单人单日10集）；§更新v1.2（小映：6分钟口播人工32分钟 vs AI 10分钟） |
| sea:no | research/02「爆款方法论」表（红果98秒-2分钟、2分钟完播权重38%） |
| sea:yes | research/13 更新§五（2026-07-16新政三分类、频道级执法、「模板化才是死罪」）；更新§一（Drama Center 机构通道仅企业主体、个人挂靠） |
| sea:both | js/data.js:337（tools 鬼手剪辑 tip：配音第一死穴+负评三大项） |
| team:solo | js/data.js:293（tools 豆包 tip：豆包出脚本→即梦执行→剪映成片）；research/04 §八「新手档」 |
| team:duo | research/02 阶段6（流水线并行3人日更10集）；阶段3（分镜表11字段） |
| team:studio | research/04 §更新v2.0「资产与分镜解耦」（CSDN）；js/data.js:687（canvas.tips 一致性六环链路） |
| qual:ok | research/23 §5.1（7天出片可行）；research/14 §二（剪映「AI画质增强」基础功能免费） |
| qual:hd | js/data.js:303（可灵 tip：大幅运动与4K封面级镜头上4.0）；research/14 §二（Topaz统一超分补帧）；research/10 §四（色温统一：主力镜头同一模型） |
| qual:client | research/23 §4.2（修改轮次写进报价单）、§4.3（30%-50%定金→初稿打水印→确认→尾款→源文件）；research/14 §三（-14 LUFS 交付） |

### mjxPickerAudioTips（8 条）

| 键 | 出处 |
|---|---|
| MiniMax Speech | research/10 §三（省略号分句、1.1-1.2/0.9-1.0倍速、(laughs)(sighs) 内联拟声）；js/data.js:321（HD主角/turbo群配） |
| ElevenLabs | research/10 §三（标签拼写错误会被念出来、重音=全大写、250字符以上、不支持SSML） |
| 即梦对口型 | js/data.js:313（民间两步法、约8积分/秒）；research/19 §口型评测（唱歌是口型照妖镜、先短句实测） |
| 可灵对口型 | research/21 §2.1（对口型口径澄清：网页端约1灵感值/秒 ≠ 生成720P约6灵感值/秒）；js/data.js:314（多角色指定发言） |
| Hedra | js/data.js:315（540p样片/720p定稿；一年内改价两次） |
| 剪映专业版 | research/04 §更新v1.2（小映拼接打法）；research/10 §四（字幕一行≤8-10字符） |
| Premiere / DaVinci | research/10 §四（色温统一五步质检）；js/data.js:331（调色重点统一色温差异） |
| 剪映音效库 | research/14 §一（音效爽感法则）；js/data.js:325（热门音效易撞车） |

## 五、需人工核实

无。所有新增数据均溯源至 research/*.md 或 js/data.js 既有条目（含源档案自身标注的【存疑】【推断】项，本方案一律未采用——如火山引擎 MCN 年度资源包【存疑·促销口径】、4.0「排队拥堵」待观察项、凌晨1-2点发布「经验之谈」均已回避）。其中三处数字在源档案内为转引口径，沿用时已按档案原样表述：样片模式省38%（冷逸实测经smzdm转引，research/21 §四）、可灵3.0网页端720P约6灵感值/秒（research/21 §十注明未独立复核、维持原核验出处）、废片系数2-3倍（源档案标【推断】，本方案表述为「带货实测提醒」，与 §2.2 原文一致）。

## 六、不做的事

1. **不加第 7 题**：加题会让已存 6 答的老用户回来时被强制多答一题，且「6问」口径（cnt/sub/search/开场白）全部要动——收益不抵破坏。
2. **不改任何既有数字口径**：QS 权重、V_PRI、CANVAS_TIERS、warn 触发条件一概不动；既有条目字段零增删。
3. **不动 `computeResult`/`score`/存储/深链兜底/事件委托**：计分明细只读 `score()` 结果，不反向改计分。
4. **不动公共设施**：路由、命令面板、全局搜索、收藏系统、data-go/data-copy 委托（app.js）均不触碰；不新建模块、不改 index.html/sw.js/css。
5. **不把「需人工核实」以外的补充知识写进代码**：如 AI 生视频每秒成本横评、各平台流量池百分比等未入选内容，留在研究档案里。
6. **不在结果页罗列完整价目表**：价格时效风险高（即梦积分三连收紧、可灵4.0计费未公布），一律深链「工具库」卡片看当日口径，向导只给档位与要领。
