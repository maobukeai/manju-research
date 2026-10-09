# 细化方案：题材风向库（id：topics）

> 生成日期 2026-10-07。事实源头为 research/ 目录 26 篇档案；代码现状以本次实际读取的 js/data.js（1696-1719 行 genres 数据区）、js/app.js（986-998 行 renderGenres 及 1958-1959、1996-1997 行全局委托）、css/style.css（228-233、243-246、662-667 行相关样式）工作区版本为准。本方案为增量补丁：不改任何现有条目的字段与数字口径，不新建模块，不触碰公共设施。

## 一、现状盘点

**数据区**（`js/data.js:1696-1719`）：`DB.genres = { cats, items }`，**18 条**，字段结构统一为 `{ c, n, heat, bench, risk, note }`，heat 为 1-5 整数。分类分布：男频 5 条（data.js:1700-1704）、女频 3 条（1705-1707）、出海 2 条（1708-1709）、2026新风向 8 条（1710-1717）。

**渲染层**（`js/app.js`）：模板 `RENDERERS.genres`（app.js:609）= 分类 chips 容器 + `.grid.g3` 卡片容器；`renderGenres()`（app.js:986-998）按 `genreCat` 过滤渲染卡片（热度条复用全局 `heatBar`，app.js:21-25）；分类点击走全局委托 `[data-gdcat]`（app.js:1996-1997）。全站消费点已核实：导航计数 `DB.genres.items.length+'题材'`（app.js:107，新增条目自动更新）、全局搜索索引 `bench+note+risk`（app.js:1791，新增条目自动入库）、SECTION_SUB 副标题（app.js:130）、学习路径 D1 静态引用"18个题材"（data.js:1468，见第五节）。

**缺什么、哪里最薄**：
1. **女频/出海条目最薄**（3 条/2 条）——research/18 §B3 分市场卡片里现成的日本"千金大小姐"线、拉美 telenovela 线（含门槛与付费数据）完全没进库；女频缺"大女主搞钱"这条已验证内容线；
2. **2026-09/10 最新验证的题材结构空白**——10-1 榜单快照里的萌娃治愈、古风大女主断舍离、银发/年代/方言蓝海（research/25:116-122）、反套路神话（research/03:36）均未覆盖；
3. **红线案例只在条目里顺带一提**——《高考落榜》破亿下架（research/19:246）、《菩提临世》27 天归零（research/25:70）两个最贵的教训没有沉淀为立项动作，模块没有"预检"能力；
4. **档期与互动影游两个维度缺失**——春节档红利（research/03:37）、互动影游化（research/25:32-42）无条目；
5. **交互零工具性**——只有分类筛选，18+ 条卡片无法按热度排序、无法整组带走，与"立项前对表"的定位不匹配。

## 二、变更清单（逐条，含出处）

| # | 变更 | 内容 | 出处 |
|---|---|---|---|
| 1 | items 追加 9 条（下标 18-26，共 27 条） | 男频+1：反套路神话/仙界打工人；女频+2：大女主搞钱/清醒断舍离、萌娃治愈/亲情喜剧；出海+2：日本·千金逆袭线、拉美·telenovela 线；新风向+4：年代/银发/方言新蓝海、互动影游化、少儿/亲子动画、档期作战 | research/03:8、36、37；research/01:87、88、94；research/25:32、36、41、42、70、80、116-122；research/18:204、218、219、226；research/19:246、279、43-44；research/16:133（逐条对照见第四节） |
| 2 | genres 新增 `checks` 键（5 条立项预检清单） | 红线预检 / 授权链优先 / 选本三件事 / 对标在册 / 三本账——渲染为卡片网格顶部通栏 | research/19:246；research/25:70；research/16:31-34、87；research/03:8；research/02:13-14；research/19:186；research/01:71（爆款率两口径与站内 data.js:1221-1222 既有口径一致） |
| 3 | renderGenres 小增强：热度排序 + 条数统计 + 一键复制本组 | 排序 chips（默认序/热度↓）、`共 N 条` 小标、`复制本组(N)` 按钮——复制走全局 `[data-copy]` 委托（app.js:1958-1959）+ `regCopy`（app.js:46-47），排序事件直接挂在本模块自有节点上（`data-mjxtopics-sort`），**不改全局点击委托任何一行**；新增模块级状态 `mjxTopicsSort`（前缀合规） | 交互增强，无外部事实 |
| 4 | CSS 追加 `mjx-topics-*` 4 个类 | 预检通栏卡 / 工具条 / 排序 chip 缩小 / 复制按钮右对齐——全部复用现有 CSS 变量（--line/--r-s/--panel2/--tx2/--tx3，style.css:6-15）与现有 .chip/.copy-btn 基类 | 交互增强，无外部事实 |

现有 18 条条目的文案、数字、【推断】标注全部原样保留；cats 分类结构不动。

## 三、落点与代码

### 3.1 js/data.js · genres.items 末尾追加 9 条

**锚点**：`画风×题材匹配` 条目行（data.js:1717）之后、items 数组闭合 `],`（data.js:1718）之前插入以下 9 行（4 空格缩进，字段结构与现有条目完全一致 `{ c, n, heat, bench, risk, note }`，反引号模板字符串风格）：

```js
    { c: `male`, n: `反套路神话/仙界打工人`, heat: 4, bench: `《斩仙台下，我震惊了诸神！》全网播放总量破10亿——2025年唯一播放量超10亿的漫剧`, risk: `神话壳贴近宗教/封建迷信红线：《高考落榜，忽悠同学上冥牌大学》破亿后因涉封建迷信全网下架，《菩提临世》8亿播放上线27天双平台下架`, note: `反套路=把"仙界打工人"等现代情绪装进神话壳+高密度反转——情绪钩当代化是它与传统神话题材的分界线` },
    { c: `female`, n: `大女主搞钱/清醒断舍离`, heat: 4, bench: `《二嫁有喜》6951万热度（2026-10-01红果总榜第5，古风大女主"清醒断舍离"路线，塔猴快照口径）`, risk: `女频审美门槛高；"无CP纯爽点"是差异化新方向而非保险箱——平台已抵制无脑霸总人设`, note: `女频蓝海的落地写法：搞钱/事业线替代恋爱脑主线；DataEye：近半年热播5603部漫剧中女性向仅占11.98%——供给缺口最大的内容赛道` },
    { c: `female`, n: `萌娃治愈/亲情喜剧`, heat: 4, bench: `《绿意萌熹：蛙系萌娃闹翻忧郁老爸》7370万（10-1总榜第2）+第二季6365万（第12）一、二季同榜；《乐乐来啦》两季同榜（6029万/5732万）`, risk: `萌娃形象AI一致性难（易崩脸）——与"萌宝助攻"条目同坑`, note: `"萌娃×治愈抑郁霸总"是2026-10快照里最亮眼的新IP复合写法——与出海IAP向的"萌宝助攻"分工：本条主吃国内免费大盘流量` },
    { c: `overseas`, n: `日本·千金逆袭线`, heat: 3, bench: `2024年日本短剧应用收入4500万美元+、单集解锁约0.5美元小额付费为主`, risk: `本土化最深：日语配音语感门槛+对中式霸总接受度有限，本土实拍改编常见——译制换皮难过关`, note: `"千金大小姐"逆袭剧在日本热卖、主力25-45岁女性——单用户价值高的第二梯队市场（语种排位第4【经验推断】：英语→西语→葡语→日语→印尼/泰/阿）` },
    { c: `overseas`, n: `拉美·telenovela线`, heat: 3, bench: `西语/葡语内容需求两年增约25%；巴西月活2400万+、墨西哥约2000万`, risk: `巴西门槛最高：葡语母语配音+telenovela审美改造+2026起儿童内容须法院授权；墨西哥西语要求较低`, note: `文化底盘=豪门冲突/契约婚姻/复仇，巴西本土题材有足球名利场、贫民窟复仇——低ARPU高量市场：西语先试拿量、巴西精品化收割；印尼（本地语言字幕硬性准入）与中东（宗教禁忌）只作矩阵补流量` },
    { c: `trend`, n: `年代/银发/方言新蓝海`, heat: 3, bench: `《夕阳红顶流，大爷大妈助我乐坛封神》6371万（10-1总榜第11）、《东北话事人》6296万（第14，方言题材首次高热度）；AI短剧榜年代/乡村/种田类占7席`, risk: `证据多来自10-1榜单快照（塔猴聚合源、统计口径不明【存疑】）；方言台词口型工具链薄弱——主流平台方言原生支持不足，常需普通话生成再换音轨或反应镜头规避【推断】`, note: `男频玄幻修真占AI漫剧榜TOP20九席之外的错位竞争——银发主角/年代乡村种田/方言权力斗争是10-1快照里最集中的新蓝海` },
    { c: `trend`, n: `互动影游化`, heat: 3, bench: `《盛世天下》（橙光IP改编·真人FMV互动影游）9月下旬全系列破600万套、系列收入约1.5亿元；DataEye：2026国内互动影游市场18-20亿元`, risk: `约90%互动影游亏损；触碰政治/军事/司法等特殊题材"每一个支线都按一类管理"（剧短端解读，单源【存疑】）——分支多=平台审核压力显著上升`, note: `橙光式分支玩法在Steam/买量渠道复活而非竖屏内嵌；工具对垒=剪映ICG Studio（Agent对话生支线）vs 腾讯造化工坊（六步标准化、上线不足两月近60款）；竖屏侧入口=红果"平行世界"续写+火龙互动专区` },
    { c: `trend`, n: `少儿/亲子动画`, heat: 3, bench: `《归途七侠》——国内首部AI儿童侠义动画，2026-09-23登陆红果/抖音/腾讯/优酷/芒果TV五平台`, risk: `少儿内容审核标准更严（未成年人保护红线）；出海巴西2026起儿童内容须法院授权`, note: `AI动画开始进入传统少儿赛道——审核标准更严但竞争更小（多平台2026-09已接纳首部此类内容）` },
    { c: `trend`, n: `档期作战`, heat: 3, bench: `《气运三角洲》（灵漫快创）3人团队5天制作、上线29小时播放破2亿（2026春节档）；春节档AI漫剧大盘播放量25.48亿次`, risk: `档期挤兑：中秋档16部短剧挤档期；备片节奏算错=错过窗口——《万妖图录传》第十三季曾因"篇幅变长+BGM问题"延期`, note: `极小团队+档期红利的组合样本已被验证——春节/国庆等档期值得专门备货` },
```

### 3.2 js/data.js · genres 内新增 checks 键（items 数组闭合之后）

**锚点**：items 数组闭合 `],`（data.js:1718）之后、genres 对象闭合 `},`（data.js:1719）之前插入（2 空格缩进，与 cats/items 键平级；新键为纯增量，渲染层原逻辑不读取该键则零影响）：

```js
  checks: [
    `① 红线预检先行：软色情/暴力血腥/宗教/封建迷信/特殊题材（政治、军事、司法、公安等）任一命中即换题材——前科：《高考落榜，忽悠同学上冥牌大学》破亿后全网下架、《菩提临世》8亿播放上线27天双平台下架`,
    `② 授权链优先：番茄小说版权中台免费改编权 → 阅文/书旗官方授权库 → 原创自持；私改网文=侵权——《我在末世开超市》上线3天即被发《侵权风险告知函》，题材通用模板≠法律安全`,
    `③ 选本三件事（万妖制作方方法论）：人物能不能被记住、情节能不能往前走、想象中的画面能不能做出来——三条全过再写剧本`,
    `④ 对标在册：DataEye/红果热榜/WETRUE + 番茄/七猫热度榜找对标拆解，避开平台已治理题材与纯赘婿红海——先看结算规则再立项`,
    `⑤ 算完三本账再立项：单条综合成本、抽卡可用率、万播单价——爆款率仅0.16%（2025全年漫剧）/<0.1%（2026H1 AI漫剧），题材热度≠回本`,
  ],
```

### 3.3 js/app.js · renderGenres 整函数替换（含紧邻状态行）

**锚点**：app.js:986-998（`/* ---------- 题材风向库过滤 ---------- */` 注释行起、`}` 函数闭合止）整块替换为以下完整代码（分类 chips 的 `data-gdcat` 属性与委托协议原样保留；`data-copy` 复用全局委托 app.js:1958-1959；排序事件挂在本模块自有节点，不动全局委托；`heatBar/regCopy/$` 均为同闭包既有工具）：

```js
  /* ---------- 题材风向库过滤（细化：预检通栏+热度排序+一键复制本组；排序事件挂本模块自有节点，不走全局委托） ---------- */
  let genreCat = 'all';
  let mjxTopicsSort = 'default';
  function renderGenres() {
    const chips = $('#gdChips'), grid = $('#gdGrid');
    if (!grid) return;
    if (chips) chips.innerHTML = DB.genres.cats.map((c) =>
      '<span class="chip' + (c.id === genreCat ? ' on' : '') + '" data-gdcat="' + c.id + '">' + c.n + '</span>').join('');
    let items = DB.genres.items.filter((g) => genreCat === 'all' || g.c === genreCat);
    if (mjxTopicsSort === 'heat') items = [...items].sort((a, b) => b.heat - a.heat);
    const catName = (DB.genres.cats.find((c) => c.id === genreCat) || {}).n || '';
    const copyTxt = '【题材风向库' + (genreCat !== 'all' ? ' · ' + catName : '') + '（' + items.length + '条 · 热度为平台题材盘相对评级）】\n' + items.map((g, i) =>
      (i + 1) + '. ' + g.n + '｜热度' + g.heat + '/5\n　对标：' + g.bench + '\n　要点：' + g.note + '\n　风险：' + g.risk).join('\n');
    const checks = DB.genres.checks || [];
    grid.innerHTML =
      (checks.length ? '<div class="mjx-topics-checks" style="grid-column:1/-1"><b>🚦 立项预检 · 定题材前先过五关</b><ol>' + checks.map((x) => '<li>' + x + '</li>').join('') + '</ol></div>' : '') +
      '<div class="mjx-topics-bar" style="grid-column:1/-1"><span class="mjx-topics-cnt">共 ' + items.length + ' 条' + (genreCat !== 'all' ? ' · ' + catName : '') + '</span>' +
      '<span class="mjx-topics-sort"><span class="chip' + (mjxTopicsSort === 'default' ? ' on' : '') + '" data-mjxtopics-sort="default">默认序</span>' +
      '<span class="chip' + (mjxTopicsSort === 'heat' ? ' on' : '') + '" data-mjxtopics-sort="heat">热度↓</span></span>' +
      '<button class="copy-btn mjx-topics-copy" data-copy="' + regCopy(copyTxt) + '">📋 复制本组(' + items.length + ')</button></div>' +
      items.map((g) => '<div class="card genre-card"><div class="gd-top"><b>' + g.n + '</b><span class="gd-heat"><i>热度</i>' + heatBar(g.heat) + '</span></div>' +
        '<div class="gd-bench">🏆 对标：' + g.bench + '</div>' +
        '<p class="gd-note">' + g.note + '</p>' +
        '<div class="gd-risk">⚠ ' + g.risk + '</div></div>').join('');
    grid.querySelectorAll('[data-mjxtopics-sort]').forEach((el) => el.addEventListener('click', () => {
      mjxTopicsSort = el.dataset.mjxtopicsSort; renderGenres();
    }));
  }
```

### 3.4 css/style.css · 末尾追加工具条样式

**锚点**：style.css 文件末尾（1002 行之后）追加（全部 `mjx-topics-` 前缀；复用 6-15 行的 CSS 变量与 228-233 行 .chip、243-246 行 .copy-btn 基类）：

```css
/* ================= 题材风向库 · 预检通栏与组内工具条（细化 mjx-topics 前缀） ================= */
.mjx-topics-checks{grid-column:1/-1;border:1px dashed var(--line);border-radius:var(--r-s);background:var(--panel2);padding:12px 16px;font-size:12.6px}
.mjx-topics-checks b{font-size:13px}
.mjx-topics-checks ol{margin:8px 0 0;padding-left:18px;display:grid;gap:5px;color:var(--tx2)}
.mjx-topics-bar{grid-column:1/-1;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:2px 0 4px}
.mjx-topics-cnt{font-size:12.5px;color:var(--tx3)}
.mjx-topics-sort{display:inline-flex;gap:6px}
.mjx-topics-sort .chip{padding:4px 12px;font-size:12px}
.mjx-topics-copy{margin-left:auto}
```

**补丁代码合计**：9+7+28+9 = 53 行（远低于 350 行上限），可审、可整段粘贴。

## 四、来源对照表

| 落点条目 | 声称事实 | 出处（research/ 档案:行） |
|---|---|---|
| 反套路神话 bench | 斩仙台下破10亿、2025唯一 | research/03:36 |
| 反套路神话 risk | 高考落榜破亿下架 | research/19:246 |
| 反套路神话 risk | 菩提临世8亿播放27天下架 | research/25:70 |
| 反套路神话 note | "仙界打工人"现代情绪装进神话壳+高密度反转 | research/03:36 |
| 大女主搞钱 bench | 二嫁有喜6951万总榜第5、清醒断舍离 | research/25:118（快照口径警示见 25:111-113） |
| 大女主搞钱 risk | 平台已抵制无脑霸总人设 | research/19:279 |
| 大女主搞钱 risk | "大女主无CP纯爽点"差异化方向 | research/01:94 |
| 大女主搞钱 note | 5603部中女性向仅11.98% | research/01:94 |
| 萌娃治愈 bench | 绿意萌熹7370万/6365万、乐乐来啦6029万/5732万 | research/25:117、121 |
| 萌娃治愈 note | "本期最亮眼新IP"判断 | research/25:117 |
| 萌娃治愈 risk | 萌娃形象AI一致性难（易崩脸） | 站内既有条目 data.js:1707（萌宝助攻同口径，非新增事实） |
| 日本·千金逆袭线 bench | 2024日本短剧App收入4500万美元+、单集约0.5美元 | research/18:219（雨果跨境/虎嗅转引口径） |
| 日本·千金逆袭线 risk/note | 千金大小姐热卖、25-45岁女性、中式霸总接受度有限 | research/18:219 |
| 日本·千金逆袭线 note | 语种排位第4【经验推断】 | research/18:226 |
| 拉美·telenovela线 bench | 西语/葡语需求两年+25%、巴西2400万+/墨西哥2000万月活 | research/18:218 |
| 拉美·telenovela线 risk | 巴西三重门槛（葡语配音/telenovela审美/2026儿童令）、墨西哥较低 | research/18:218、204 |
| 拉美·telenovela线 note | 豪门冲突/契约婚姻/复仇底盘、足球名利场/贫民窟复仇 | research/18:218 |
| 拉美·telenovela线 note | 印尼本地字幕硬性准入、中东宗教禁忌、矩阵补流量定位 | research/18:221、202-203、226 |
| 年代/银发/方言 bench | 夕阳红顶流6371万第11、东北话事人6296万第14、年代/乡村/种田7席 | research/25:120、119 |
| 年代/银发/方言 note | AI漫剧榜TOP20男频玄幻修真占9席 | research/25:122 |
| 年代/银发/方言 risk | 塔猴快照口径不明【存疑】；方言口型工具链薄弱【推断】 | research/25:111-113；research/19:43-44 |
| 互动影游化 bench | 盛世天下600万套/约1.5亿、互动影游市场18-20亿 | research/25:41 |
| 互动影游化 risk | 约90%互动影游亏损；特殊题材"每个支线按一类管理"【存疑】 | research/25:42、80 |
| 互动影游化 note | 橙光复活路径、ICG Studio vs 造化工坊（两月近60款）、平行世界/火龙互动专区 | research/25:42、32、36、38 |
| 少儿/亲子动画 bench | 归途七侠 2026-09-23 五平台首播 | research/01:88 |
| 少儿/亲子动画 risk/note | 审核更严但竞争更小；巴西2026儿童令 | research/08:94；research/18:204 |
| 档期作战 bench | 气运三角洲3人5天29小时破2亿、春节档25.48亿 | research/03:37 |
| 档期作战 risk | 中秋档16部挤档期；万妖十三季"篇幅+BGM"延期 | research/01:87；research/16:133 |
| checks① | 高考落榜/菩提临世前科 + 特殊题材范围 | research/19:246；research/25:70、80 |
| checks② | 番茄→阅文/书旗→原创自持授权链；我在末世开超市3天收函 | research/16:87；research/03:8 |
| checks③ | 选本三件事（制作方原话归纳） | research/16:31-34 |
| checks④ | DataEye/红果热榜/WETRUE+番茄/七猫、避开已治理题材、先看结算规则 | research/02:13-14 |
| checks⑤ | 爆款率0.16%（2025全年漫剧）/<0.1%（2026H1 AI漫剧）、三本账 | research/19:186；research/01:71（与站内 data.js:1221-1222 既有口径一致） |
| 交互增强 #3/#4 | 无外部事实 | 交互增强，复用 app.js:46-64（regCopy/doCopy）、app.js:1958-1959（data-copy 委托）、app.js:21-25（heatBar） |

## 五、需人工核实（无则写「无」）

1. **data.js:1468 学习路径 D1 工具文案「18个题材」**——新增 9 条后该静态数字过期（实际 27 条）。按"现有条目既有数字口径一律不改"纪律未列入变更清单；建议后续把该文案改为动态 `DB.genres.items.length` 或人工同步为 27。
2. **10-1 榜单快照条目**（大女主搞钱/萌娃治愈/年代银发方言三条的 bench）——数据来自塔猴聚合源，榜单统计周期/口径不明（research/25:111 已标【存疑观察点】）。条目文案内已带"10-1快照/塔猴快照口径"字样；若官方周榜口径出台，建议复核数字。
3. **互动影游化条目中"每一个支线都按一类管理"**——依据剧短端 2026-09-16 解读，单源【存疑】（research/25:80、§〇7）；文案内已标【存疑】，总局分类分层标准原文核对通过后可去掉标记。
4. **日本市场"4500万美元/0.5美元"为转引口径**（research/18:219 标注雨果跨境/虎嗅转引）——引用时保留"转引"语境，不建议当作官方数据直引。

## 六、不做的事

- **不改现有 18 条条目的任何字段、文案与数字**（含条目内既有的【推断】/【存疑】标注与 bench 口径）；
- **不动 cats 分类结构**（不加新分类 id——分类 chips 与全局委托 `data-gdcat`（app.js:1996-1997）依赖现有 5 个 id）；
- **不动全局事件委托、路由、命令面板、全局搜索、收藏系统**——排序点击直接挂在本模块自有节点；`data-copy` 走既有全局委托协议；全局搜索（app.js:1791）与导航计数（app.js:107）对新增条目自动生效，无需改动；
- **不新建模块、不改 index.html / sw.js / 任何公共 CSS 设施**；
- **不重复入库**：《愤怒的吸血鬼》万圣节窗口（已在狼人/吸血鬼条目）、红果平行世界机制细节（已在互动续写条目与变现运营）、画风×题材匹配查表（已在 trend 条目）均不另立新条目；
- **不把无出处的补充知识写进代码**——本方案新增数据全部可溯源至第四节对照表；制作建议类表述仅复述档案内已标注的经验推断并保留标记。
