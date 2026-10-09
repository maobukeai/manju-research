/* ============================================================
   漫剧研究学习平台 · 外挂模块：选型向导（picker）
   —— 答题式工具链收敛器：6 步单选问答（用途场景 / 月预算 / 产能节奏 /
      是否出海 / 协作方式 / 画质要求），加权计分当场输出
      「主力视频模型 + 跑量方案 + 画布工具 + 配音剪辑」组合推荐，
      每项带推荐理由与价格档，data-go 深链「工具库」?hl= 高亮对应卡片。
   数据来源（不新增研究口径）：
   · 视频模型推荐池 = DB.videoCompare 8 款模型的 scene/price 口径 + DB.videoCompareNote 选型口诀
   · 画布三档 = DB.canvas.select / DB.canvas.deepGuides
   · 配音剪辑价格档与理由 = DB.tools 对应条目的 price/tag 字段
   · 题目与计分权重为本文件内常量；答案持久化 localStorage「manju_picker_v1」
   定位：与「收益决策树」（选变现路径）、「工具库」（可筛选全量库）互补不重复。
   ============================================================ */
(function () {
  'use strict';

  var PK_KEY = 'manju_picker_v1';
  var pkState = null; /* { v:1, ans:{qid:optKey}, hist:[qid...] } */
  var ctx = null;     /* window.MJ */
  /* data.js 以顶层 const 声明 DB（全局词法绑定，不在 window 上，MJ.DB 实为 undefined）；
     与 app.js 既有渲染器一致，直接引用裸标识符 DB（同步脚本序保证 data.js 先于本文件执行） */
  var DBX = (typeof DB !== 'undefined') ? DB : null;

  /* ---------- 候选池：k 为模块内键，vc 绑定 DB.videoCompare 下标，
     hl 为「工具库」卡片 data-hl 键（= DB.tools 的 n，深链高亮用） ---------- */
  var MODELS = [
    { k: 'jm',     vc: 0, fam: 'jm',     motto: '叙事段落用Seedance 2.5',           hl: '即梦 Seedance',  hlNote: '' },
    { k: 'kl4',    vc: 1, fam: 'kl',     motto: '大场面4K上可灵4.0',                hl: '可灵 Kling',     hlNote: '（4.0 档）' },
    { k: 'kl3',    vc: 2, fam: 'kl',     motto: '跑量用3.0 Omni或海螺Fast',         hl: '可灵 Kling',     hlNote: '（3.0 Omni 档）' },
    { k: 'vidu',   vc: 3, fam: 'vidu',   motto: '',                                 hl: 'Vidu',           hlNote: '' },
    { k: 'hailuo', vc: 4, fam: 'hailuo', motto: '跑量用3.0 Omni或海螺Fast',         hl: '海螺 Hailuo',    hlNote: '' },
    { k: 'veo',    vc: 5, fam: 'veo',    motto: '出海用Veo',                        hl: 'Veo 3.1',        hlNote: '' },
    { k: 'runway', vc: 6, fam: 'runway', motto: '修复改写用Runway Aleph',           hl: 'Runway',         hlNote: '' },
    { k: 'wan',    vc: 7, fam: 'wan',    motto: '私有化用Wan',                      hl: '通义万相 Wan',   hlNote: '' },
  ];
  var MODEL_ORDER = ['jm', 'kl4', 'kl3', 'vidu', 'hailuo', 'veo', 'runway', 'wan'];
  /* 跑量方案并列时的优先序：免费/低成本优先 */
  var V_PRI = ['kl3', 'hailuo', 'wan', 'jm', 'vidu', 'kl4', 'veo', 'runway'];
  /* 当前倾向轻提示：领先模型 → 链路标签 */
  var LEAN = {
    jm: '国产叙事主力链路', kl4: '旗舰大场面链路', kl3: '免费/性价比跑量链路',
    vidu: '整段声画直出链路', hailuo: '低成本动作跑量链路', veo: '出海国际链路',
    runway: '素材修复改写链路', wan: '私有化开源链路',
  };

  /* ---------- 题库与计分权重（模块内常量） ----------
     w = 主力模型计分增量；v = 跑量方案计分增量（单独排序，保证与主力互补） */
  var QS = [
    { id: 'scene', short: '用途', t: '你做漫剧，主力镜头是什么类型？',
      sub: '对应「工具库」视频模型对比表的「适用场景」列——这是主力模型的定档依据。',
      opts: [
        { k: 'story',  n: '剧情叙事',          d: '台词戏、多镜头叙事段落，剧情连贯优先', w: { jm: 3, vidu: 2, kl4: 1, kl3: 1 }, v: { kl3: 1, hailuo: 1 } },
        { k: 'action', n: '大场面 / 动作戏',   d: '打斗、爆炸、复杂运镜，单镜头震撼优先', w: { kl4: 3, hailuo: 2, jm: 1 }, v: { kl3: 1, hailuo: 2 } },
        { k: 'volume', n: '日更跑量短打',      d: '爽点节奏快、量大管饱，成本与产能优先于单镜上限', w: { kl3: 2, hailuo: 2, wan: 2, jm: 1 }, v: { kl3: 2, hailuo: 2, wan: 2, jm: 1 } },
        { k: 'mix',    n: '混合都做',          d: '叙事为主，穿插大场面和跑量素材', w: { jm: 2, kl4: 2, vidu: 1 }, v: { jm: 1, kl3: 1 } },
      ] },
    { id: 'budget', short: '预算', t: '每月愿意为生成工具花多少钱？',
      sub: '决定价格档——免费链路靠每日积分与开源模型硬扛，旗舰档买的是单镜上限。',
      opts: [
        { k: 'free',  n: '免费 / 极低（<¥50）',  d: '白嫖每日免费积分 + 开源模型，一分钱掰两半花', w: { wan: 3, kl3: 2, hailuo: 1, jm: 1 }, v: { wan: 3, kl3: 2 } },
        { k: 'light', n: '轻预算（¥50-300）',    d: '够一张低价档会员或按量小额充值', w: { hailuo: 3, kl3: 2, jm: 2, vidu: 1 }, v: { hailuo: 2, kl3: 1, wan: 1 } },
        { k: 'mid',   n: '认真投入（¥300-1000）', d: '主力会员拉满，配额不再是抽卡瓶颈', w: { jm: 3, kl4: 2, vidu: 2, kl3: 1 }, v: { jm: 2, kl3: 1 } },
        { k: 'high',  n: '工作室级（¥1000+）',   d: '多席位会员 + API 走量，追头部画质与产能', w: { kl4: 3, veo: 2, runway: 2, jm: 1 }, v: { kl3: 2, jm: 1 } },
      ] },
    { id: 'pace', short: '节奏', t: '更新节奏打算怎么排？',
      sub: '节奏决定抽卡次数：日更的每一次重 roll 都是钱，慢工细活可以慢慢磨关键镜头。',
      opts: [
        { k: 'slow',   n: '慢工细活（周更1集或更低）', d: '精品导向，单镜反复抽卡到满意为止', w: { kl4: 2, jm: 2, veo: 1, runway: 1 }, v: {} },
        { k: 'weekly', n: '稳定周更（2-3集）',         d: '产量质量平衡，要一条顺手的固定产线', w: { jm: 2, vidu: 1, kl3: 1, hailuo: 1 }, v: { kl3: 1, hailuo: 1, jm: 1 } },
        { k: 'daily',  n: '日更冲量（每天1集+）',      d: '工业化流水线，成本曲线压到最低', w: { kl3: 2, hailuo: 2, wan: 2, jm: 1 }, v: { kl3: 2, hailuo: 2, wan: 2, jm: 1 } },
      ] },
    { id: 'sea', short: '出海', t: '内容发国内还是海外？',
      sub: '出海英文向直接换生态：Veo 原生音频与画质口碑第一，配音口型也要换国际线。',
      opts: [
        { k: 'no',   n: '只做国内',     d: '红果/抖音/快手分发，国产模型生态最顺', w: { jm: 2, kl4: 1, kl3: 1, hailuo: 1 }, v: {} },
        { k: 'yes',  n: '出海为主',     d: '英文向 / TikTok / YouTube，英文台词与海外审美元素多', w: { veo: 4, runway: 2, vidu: 1 }, v: { veo: 1 } },
        { k: 'both', n: '国内海外双线', d: '一鱼两吃：主链路国产，关键出海镜头另开国际档', w: { jm: 1, veo: 2, vidu: 2, runway: 1 }, v: {} },
      ] },
    { id: 'team', short: '协作', t: '几个人干活？',
      sub: '协作方式主要决定画布工具档位与流程编排——单人拼链路最短，工作室拼统筹与私有化。',
      opts: [
        { k: 'solo',   n: '单人作战',                d: '一条龙全包，工具越少越好、链路越短越好', w: { kl3: 1, jm: 1 }, v: {} },
        { k: 'duo',    n: '2-3 人小队',              d: '有人写本有人出图出片，轻协作即可', w: { vidu: 1, kl4: 1, jm: 1 }, v: {} },
        { k: 'studio', n: '5 人以上 / 多人协作',     d: '需要画布多人实时协作、资产统一管理', w: { kl4: 1, runway: 1, wan: 1 }, v: { wan: 1 } },
      ] },
    { id: 'qual', short: '画质', t: '成片质量标准定在哪一档？',
      sub: '决定"达标就发"还是"关键镜头上旗舰"——跑量与精品的预算分配完全不同。',
      opts: [
        { k: 'ok',     n: '达标就行',               d: '能看、出片快，先跑通闭环再谈升级', w: { kl3: 2, hailuo: 2, wan: 1 }, v: { kl3: 1, hailuo: 1, wan: 1 } },
        { k: 'hd',     n: '精品感',                 d: '封面级关键镜头、4K 规格，观众一眼看出制作力', w: { kl4: 3, veo: 2, jm: 1 }, v: { jm: 1, kl3: 1 } },
        { k: 'client', n: '商单交付标准',           d: '客户审片，稳定性与可修改性优先', w: { veo: 2, runway: 2, kl4: 2, vidu: 1 }, v: {} },
      ] },
  ];

  /* ---------- 画布三档：sel 绑定 DB.canvas.select 下标，guides 绑定 DB.canvas.deepGuides 下标 ---------- */
  var CANVAS_TIERS = [
    { sel: 0, guides: [0],    go: 'canvas', goLabel: '→ 「无限画布」看实操与对比' },
    { sel: 1, guides: [1, 2], go: 'canvas', goLabel: '→ 「无限画布」看实操与对比' },
    { sel: 2, guides: [3, 5], go: 'tools?hl=' + encodeURIComponent('星流Agent / Lovart'), goLabel: '→ 工具库「星流Agent / Lovart」' },
  ];

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
  /* ---------- 小工具 ---------- */
  function esc(s) { return ctx.esc(s); }
  function eachKey(o, fn) { for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) fn(k, o[k]); }
  function trim(s, n) { s = String(s); return s.length > n ? s.slice(0, n) + '…' : s; }
  function modelOf(k) { for (var i = 0; i < MODELS.length; i++) if (MODELS[i].k === k) return MODELS[i]; return MODELS[0]; }
  function vcOf(m) { return DBX.videoCompare[m.vc]; }
  function optOf(q, k) { for (var i = 0; i < q.opts.length; i++) if (q.opts[i].k === k) return q.opts[i]; return null; }
  function argMax(tab, order) {
    var best = order[0];
    order.forEach(function (k) { if (tab[k] > tab[best]) best = k; });
    return best;
  }
  function toolInfo(name) {
    var list = (DBX && DBX.tools) || [];
    for (var i = 0; i < list.length; i++) if (list[i].n === name) return list[i];
    return null;
  }
  function hlLink(name) { return 'tools?hl=' + encodeURIComponent(name); }

  /* ---------- 计分 ---------- */
  function score(ans) {
    var tot = {}, vol = {};
    MODEL_ORDER.forEach(function (k) { tot[k] = 0; vol[k] = 0; });
    QS.forEach(function (q) {
      var o = optOf(q, ans[q.id]);
      if (!o) return;
      eachKey(o.w, function (mk, dv) { if (tot[mk] !== undefined) tot[mk] += dv; });
      eachKey(o.v, function (mk, dv) { if (vol[mk] !== undefined) vol[mk] += dv; });
    });
    return { tot: tot, vol: vol };
  }

  /* ---------- 结果推导 ---------- */
  function canvasTierIdx(ans) {
    if (ans.team === 'studio') return 2;
    if ((ans.budget === 'free' || ans.budget === 'light') && ans.team === 'solo') return 0;
    return 1;
  }
  function computeResult(ans) {
    var s = score(ans);
    var mainK = argMax(s.tot, MODEL_ORDER);
    var rest = MODEL_ORDER.filter(function (k) { return k !== mainK; });
    var secK = rest[0];
    rest.forEach(function (k) { if (s.tot[k] > s.tot[secK]) secK = k; });
    var volK = argMax(s.vol, V_PRI.filter(function (k) { return k !== mainK; }));

    var main = modelOf(mainK), vol = modelOf(volK), second = modelOf(secK);
    var mainVc = vcOf(main), volVc = vcOf(vol), secVc = vcOf(second);

    var warn = '';
    if (ans.budget === 'free' && (mainK === 'veo' || mainK === 'runway' || mainK === 'kl4')) {
      warn = '该模型为付费订阅档（' + mainVc.price + '），与「免费 / 极低」预算冲突——建议先用免费积分试产，或直接以次选「' + secVc.m + '」为主力。';
    }

    var famSame = main.fam === vol.fam;

    var tierIdx = canvasTierIdx(ans);
    var ct = CANVAS_TIERS[tierIdx];
    var sel = DBX.canvas.select[ct.sel];
    var guides = ct.guides.map(function (gi) { return DBX.canvas.deepGuides[gi]; });

    function toolPack(name) {
      var t = toolInfo(name);
      return { tool: name, price: t ? t.price : '—', why: t ? t.tag : '', hl: name };
    }
    var audioName = ans.sea === 'yes' ? 'ElevenLabs' : 'MiniMax Speech';
    var editName = (ans.team === 'studio' || ans.qual === 'client' || ans.sea === 'yes') ? 'Premiere / DaVinci' : '剪映专业版';
    var lipsName = ans.sea === 'yes' ? 'Hedra' : (ans.scene === 'story' ? '即梦对口型' : '可灵对口型');

    return {
      main: { m: main, vc: mainVc },
      vol: { m: vol, vc: volVc, famSame: famSame },
      second: { m: second, vc: secVc, gap: s.tot[mainK] - s.tot[secK] },
      warn: warn,
      canvas: { tierIdx: tierIdx, tierName: sel.w, pick: sel.pick, why: sel.why, guides: guides, go: ct.go, goLabel: ct.goLabel },
      audio: toolPack(audioName),
      edit: toolPack(editName),
      lips: toolPack(lipsName),
    };
  }

  /* ---------- 本地持久化 ---------- */
  function save() { ctx.store.set(PK_KEY, pkState); }
  function loadState() {
    var s = ctx.store.get(PK_KEY, null);
    if (!s || typeof s !== 'object' || s.v !== 1) return null;
    if (!s.ans || typeof s.ans !== 'object' || !Array.isArray(s.hist)) return null;
    if (s.hist.length > QS.length) return null;
    for (var i = 0; i < s.hist.length; i++) {
      if (s.hist[i] !== QS[i].id || !optOf(QS[i], s.ans[s.hist[i]])) return null;
    }
    return { v: 1, ans: s.ans, hist: s.hist };
  }
  function reset() {
    pkState = null;
    try { localStorage.removeItem(PK_KEY); } catch (e) { }
    ctx.toast('↻ 已重置，重新开始');
    draw();
  }

  /* ---------- 状态动作 ---------- */
  function start() { pkState = { v: 1, ans: {}, hist: [] }; save(); draw(); }
  function pick(key) {
    var qi = pkState.hist.length;
    if (qi >= QS.length) return;
    var q = QS[qi];
    var sep = key.indexOf(':');
    if (sep < 0 || key.slice(0, sep) !== q.id) return; /* 只接受当前题的作答 */
    var k = key.slice(sep + 1);
    if (!optOf(q, k)) return;
    pkState.ans[q.id] = k;
    if (pkState.hist[qi] !== q.id) pkState.hist.push(q.id);
    save();
    var done = pkState.hist.length >= QS.length;
    draw();
    if (done) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function back() {
    if (!pkState || !pkState.hist.length) return;
    var last = pkState.hist.pop();
    delete pkState.ans[last];
    save(); draw();
  }
  function jump(i) {
    if (!pkState || i >= pkState.hist.length) return;
    /* 第 i 段步进对应第 i 题（0 基）：保留前 i 个答案，从第 i 题起重答 */
    var drop = pkState.hist.splice(i);
    drop.forEach(function (qid) { delete pkState.ans[qid]; });
    save(); draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ---------- 视图：步进条 / 倾向提示 ---------- */
  function stepsHtml(cur) {
    return '<div class="pk-steps">' + QS.map(function (q, i) {
      var cls = i < cur ? 'done' : (i === cur ? 'cur' : '');
      var act = i < cur ? ' data-pk-step="' + i + '" title="回到第' + (i + 1) + '题改答（其后作答将作废）"' : ' disabled';
      return '<button class="pk-step ' + cls + '"' + act + '><i>' + (i + 1) + '</i><span>' + q.short + '</span></button>';
    }).join('') + '</div>';
  }
  function leanHtml() {
    if (!pkState || !pkState.hist.length) return '';
    var lead = modelOf(argMax(score(pkState.ans).tot, MODEL_ORDER));
    return '<div class="pk-lean">🧭 已偏向：<b>' + esc(LEAN[lead.k]) + '</b> · 当前候选「' + esc(vcOf(lead).m) + '」' +
      '<span style="margin-left:auto;color:var(--tx3);flex-shrink:0">随作答即时更新</span></div>';
  }

  /* ---------- 视图：开场 / 答题 / 结果 ---------- */
  function viewIntro() {
    var chips = QS.map(function (q) { return '<span class="chip on" style="cursor:default">' + q.short + '</span>'; }).join('');
    return '<div class="card" style="text-align:center;padding:38px 20px">' +
      '<div style="font-size:42px">🎯</div>' +
      '<b style="font-size:18px;display:block;margin:10px 0 6px">工具链选型向导</b>' +
      '<p style="font-size:13px;color:var(--tx2);max-width:600px;margin:0 auto">答 ' + QS.length + ' 个问题（用途场景 / 月预算 / 产能节奏 / 是否出海 / 协作方式 / 画质要求），当场加权计分，输出「主力视频模型 + 跑量方案 + 画布工具 + 配音剪辑」组合推荐——每项带推荐理由与价格档，可一键深链「工具库」高亮对应卡片。</p>' +
      '<div class="tool-filters" style="justify-content:center;margin-top:12px">' + chips + '</div>' +
      '<div class="callout blue" style="max-width:600px;margin:14px auto 0;text-align:left"><b>三件套分工：</b>「收益决策树」选的是变现路径，「工具库」是可筛选的全量库，本向导是答题式收敛器——先把组合定下来，再去全量库里挑替身。</div>' +
      '<button class="btn pri" data-pk-start style="margin-top:18px">开始作答 →</button>' +
      '<p class="mini-note">题目与权重为本模块内置口径；推荐池仅 DB.videoCompare 8 款视频模型 + 画布三档选型，不新增研究结论。作答进度自动保存在本机浏览器，中途离开回来可续答。</p></div>';
  }
  function viewQuestion() {
    var i = pkState.hist.length;
    var q = QS[i];
    var cur = pkState.ans[q.id];
    var opts = q.opts.map(function (o) {
      return '<button class="quiz-opt pk-opt' + (cur === o.k ? ' on' : '') + '" data-pk-opt="' + q.id + ':' + o.k + '">' +
        '<b>' + esc(o.n) + '</b><span>' + esc(o.d) + '</span></button>';
    }).join('');
    return stepsHtml(i) + leanHtml() +
      '<div class="card quiz-card">' +
      '<div class="quiz-head"><span class="tag">第 ' + (i + 1) + ' / ' + QS.length + ' 题 · ' + q.short + '</span><span class="tag c">单选 · 即时计分</span></div>' +
      '<div class="quiz-q">' + esc(q.t) + '</div>' +
      '<p class="mini-note" style="margin:0">' + esc(q.sub) + '</p>' +
      '<div class="quiz-opts">' + opts + '</div>' +
      '<div style="margin-top:14px">' +
      (i > 0 ? '<button class="btn ghost" data-pk-back>← 上一步</button> ' : '') +
      '<button class="btn ghost" data-pk-reset>↻ 重答</button></div></div>';
  }
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
  function zoneVol(R) {
    var v = R.vol, vc = v.vc;
    var lis = ['场景匹配「' + esc(vc.scene) + '」'];
    if (v.famSame) lis.push('与主力同生态换档：关键镜头留在主力档，跑量镜头降到本档控成本。');
    else lis.push('与主力互补："开源跑量 + 闭源关键镜头"的混合编排是工作室降本标配（引自选型口诀）。');
    return '<div class="card pk-zone"><div class="pk-zone-head"><span class="tag g">② 跑量方案</span><div class="pk-price">💰 ' + esc(vc.price) + '</div></div>' +
      '<b class="pk-zone-t">' + esc(vc.m) + '</b>' +
      '<ul class="pk-why">' + lis.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<div class="pk-links"><button class="btn ghost pk-go" data-go="' + hlLink(v.m.hl) + '">→ 工具库「' + esc(v.m.hl) + '」' + esc(v.m.hlNote) + '</button></div></div>';
  }
  function zoneCanvas(R) {
    var c = R.canvas;
    var lis = ['三档选型（引自「无限画布」）：' + esc(c.why)];
    c.guides.forEach(function (g) { lis.push(g.n + '：' + esc(trim(g.d, 84))); });
    lis.push('价格档：画布工具未收录价格口径，以「无限画布」对比表与各自生态会员为准。');
    return '<div class="card pk-zone"><div class="pk-zone-head"><span class="tag">③ 画布工具</span><div class="pk-price">档位 · ' + esc(c.tierName) + '</div></div>' +
      '<b class="pk-zone-t">' + esc(c.pick) + '</b>' +
      '<ul class="pk-why">' + lis.map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul>' +
      '<div class="pk-links"><button class="btn ghost pk-go" data-go="' + c.go + '">' + esc(c.goLabel) + '</button></div></div>';
  }
  function pkRow(label, t) {
    return '<div class="pk-row"><div style="min-width:0">' +
      '<b>' + label + ' · ' + esc(t.tool) + '</b>' +
      '<div style="font-size:12px;color:var(--tx2);margin-top:2px">' + esc(trim(t.why, 58)) + '</div>' +
      '<div style="font-size:11.5px;color:var(--gold);margin-top:2px">💰 ' + esc(t.price) + '</div></div>' +
      '<button class="btn ghost pk-go" data-go="' + hlLink(t.tool) + '" title="去工具库高亮「' + esc(t.tool) + '」">→</button></div>';
  }
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

  function draw() {
    var body = document.getElementById('pkBody');
    if (!body) return;
    if (!pkState) body.innerHTML = viewIntro();
    else if (pkState.hist.length >= QS.length) body.innerHTML = viewResult();
    else body.innerHTML = viewQuestion();
  }

  /* ---------- 事件委托（render 每页加载只执行一次，这里绑定一次） ---------- */
  function onElClick(e) {
    var b;
    if ((b = e.target.closest('[data-pk-opt]'))) { pick(b.dataset.pkOpt); return; }
    if ((b = e.target.closest('[data-pk-start]'))) { start(); return; }
    if ((b = e.target.closest('[data-pk-back]'))) { back(); return; }
    if ((b = e.target.closest('[data-pk-reset]'))) { reset(); return; }
    if ((b = e.target.closest('[data-pk-step]'))) { jump(+b.dataset.pkStep); return; }
    /* data-copy / data-go 交给 app.js 的 document 级委托处理（复制/深链高亮） */
  }

  /* ---------- 样式注入（唯一 id，颜色/圆角/阴影全部取自 style.css 变量） ---------- */
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

  /* ---------- 渲染入口（契约：写 el.innerHTML，返回值被忽略） ---------- */
  function render(sec, MJ) {
    ctx = MJ;
    injectStyle();
    sec.innerHTML = '<div id="pkBody"></div>';
    document.getElementById('pkBody').addEventListener('click', onElClick);
    pkState = loadState(); /* 中途离开回来续答 */
    draw();
  }

  /* ---------- 直开深链兜底 ----------
     app.js 的 route() 在 init() 内先于本文件执行：页面首开若带 '#/picker' 的 hash，
     会被当作未知路由重定向到最近访问/总览。注册成功后用导航起始 URL
     （PerformanceNavigationTiming.name，含原始 hash）识别直开意图并恢复路由；
     API 缺失或 hash 非本模块时静默跳过（行为退化为：点一次导航进入）。 */
  function rescueDeepLink() {
    try {
      var entries = (window.performance && typeof window.performance.getEntriesByType === 'function')
        ? window.performance.getEntriesByType('navigation') : [];
      var name = (entries && entries[0] && typeof entries[0].name === 'string') ? entries[0].name : '';
      var i = name.indexOf('#/');
      if (i < 0) return;
      var h = name.slice(i);
      if ((h === '#/picker' || h.indexOf('#/picker?') === 0) && location.hash !== h) {
        window.MJ.go('picker');
      }
    } catch (e) { /* 任何异常都忽略，不影响正常入口 */ }
  }

  /* ---------- 自注册 ---------- */
  var mod = {
    id: 'picker',
    icon: '🎯',
    name: '选型向导',
    cnt: '6问',
    sub: ['答题式工具链选型向导', '答6个问题（用途场景/月预算/产能节奏/是否出海/协作方式/画质要求），加权计分当场输出「主力视频模型+跑量方案+画布工具+配音剪辑」组合推荐，每项带理由与价格档，可深链「工具库」高亮对应卡片。与「收益决策树」（选变现路径）、「工具库」（可筛选全量库）互补：这里是答题式收敛器。'],
    after: 'tools',
    search: [
      { tit: '选型向导 · 答题式工具链收敛器', txt: '答6个问题（用途场景/月预算/产能节奏/是否出海/协作方式/画质要求），加权计分输出主力视频模型+跑量方案+画布工具+配音剪辑组合推荐，带理由与价格档，深链工具库高亮对应卡片，作答进度本地保存。' },
      { tit: '视频模型选型口诀（选型向导引用）', txt: '叙事段落用Seedance 2.5，大场面4K上可灵4.0，试镜用4.0 Flash，跑量用3.0 Omni或海螺Fast，出海用Veo，修复改写用Runway Aleph，私有化用Wan；开源跑量+闭源关键镜头的混合编排是工作室降本标配。' },
      { tit: '画布三档选型（选型向导引用）', txt: '新手选即梦智能画布：中文免费积分、参数直观、与即梦视频/剪映同生态；进阶选剪映Hub+可灵灵动画布：Hub成片最短链路、灵动画布一致性+102%、Agent智能分镜；工作室选星流Agent统筹+Toonflow/ComfyUI私有化：导演台式多人协作、开源可私有部署、自由接模型。' },
    ],
    render: render,
  };

  if (window.MJ && typeof window.MJ.addModule === 'function') {
    if (window.MJ.addModule(mod)) rescueDeepLink();
  } else {
    (window.__MJ_QUEUE = window.__MJ_QUEUE || []).push(mod); /* 兜底：app.js init 时统一排水 */
  }
})();
