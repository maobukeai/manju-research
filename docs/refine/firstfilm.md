# 细化方案：第一部成片

> 模块 id：`firstfilm` ｜ 数据区：`js/data.js` `firstfilm:` 键（行 1442-1629，注释锚点 `/* ================= 「第一部成片」7天闭环 ================= */`）｜ 渲染函数：`js/app.js:640-705`
> 本方案为补丁文档，未对 js/、css/、index.html、sw.js、research/ 做任何改动。数据口径截至站内 2026-10-03，引用 research/ 档案检索日期 2026-10-02。

---

## 一、现状盘点

### 1.1 现有什么（实测条目数）

用 `node -e "const DB=require('./js/data.js'); ..."` 实测（本次运行，输出原文）：

```
truth: 4
cost.notes: 3 defaults keys: 5
days: 7 steps: 35 tools: 25 pits: 24
  D1 steps5 tools3 pits3 / D2 steps5 tools4 pits3 / D3 steps5 tools3 pits4
  D4 steps5 tools4 pits3 / D5 steps5 tools4 pits4 / D6 steps5 tools4 pits4 / D7 steps5 tools3 pits3
income tiers: 3 paths: 3
checklist groups: 7 items: 21
```

即：页首诚实预期 4 条 + 成本速算（5 参数×3 注）+ D1-D7 七天闭环（35 步骤 / 25 工具跳转 / 24 坑）+ 收入衔接（3 分层×3 路径+行情）+ 7 天自查 21 项。交互侧：成本速算实时联动（`app.js:2062-2065` 输入委托→`ffCostCompute()` `app.js:1370`）、7 天进度本机存储（`FF_KEY` `app.js:1369`，`app.js:2034-2036` 点击委托）、学习仪表盘读同一进度源（`app.js:618`）、全局搜索已索引 days 与 income（`app.js:1797-1798`）。

### 1.2 缺什么、哪里最薄（按影响排序）

1. **全模块没有一条"可直接复制的文本"**：D3-D7 反复要求"七段式提示词""首尾帧技巧""音频标签"，但页内只给指令不给模板串，用户必须跳去「提示词库」「大模型应用」翻找再手工拼装。全站其他模块（运镜宝典 `app.js:510`、大模型应用 `app.js:566-570`、接单实操 `app.js:793-796`）均有 `codebox + copy-btn` 惯例，本模块是唯一的例外。
2. **参考图挂载的"怎么挂"没写**：D3 只说"挂角色参考"，缺 `@图片N` 锚定语法与即梦"角色ID"用法（research/10 §一已深拆，未进站）。
3. **D6 声音侧只有工具指向、没有文本级模板**：ElevenLabs v3 音频标签、MiniMax 拟声标记是"把情绪写进文本"的关键（research/10 §三），页内一字未提。
4. **D7 缺机制层内容**：只有完播率/点赞率指标，缺"双端机制差异、红果≥30 秒有效播放、掉池信号自查、封面标题党红线"（research/24 §2.4-3.3 已深拆）。
5. **D4/D5 缺高频失败模式的对策**：情绪词笼统（research/05 v1.2 微表情分层）、首尾帧跨度太远导致废片、可灵 Flash 档限制、第三方渠道低价风险（research/21 §二/§三）。
6. **交互薄**：D1-D7 长文一屏到底无阶段分组；checklist 21 项全为结果性自查，与新增步骤缺对应。

### 1.3 盘点结论

骨架（7 天闭环 + 双承诺 + 成本速算 + 自查）是全站最完整的实操模块，**不推倒、不加天**；本方案沿 D3-D7 的"缺文本、缺机制、缺防崩"三处最薄点做增量：约 16 条数据增量 + 1 个新键 `templates`（6 组贴身模板）+ 渲染函数内两处小增强（三阶段分组小标题、模板区一键复制）。

---

## 二、变更清单（逐条，含出处）

| # | 位置 | 增量 | 出处 |
|---|---|---|---|
| 1 | `truth` 追加第 5 条 | 双端机制差异（抖音"内容资产" vs 红果"时长资产"）与 ≥30 秒有效播放口径 | research/24-平台算法与流量池机制深拆.md §2.4-2.6 |
| 2 | `cost.notes` 追加第 4 条 | 可灵整体均价 0.43 元/秒→50 秒约 21.5 元/集；宣传价默认乘 2-3 倍重抽系数 | research/21-可灵4.0正式版实测与视频模型价格核验.md §2.2、§七 |
| 3 | D1 `steps` 追加 | 拉片表逐镜拆解法（镜号/景别/运镜/机位/时长/情绪点/钩子/台词） | research/12-剧本创作与网文改编实操.md §四 |
| 4 | D2 `steps` 追加 | 反转三大模式 + 开场 15 秒三要素 | research/12 §二、§三 |
| 5 | D3 `steps` 追加 | `@图片N` 多图参考锚定 + 即梦"角色ID" | research/10-实战SOP深化.md §一 |
| 6 | D4 `steps` 追加 2 条 | 情绪词降级为微动作（四层结构）；镜头连续性三查（拆镜/景别错开） | research/05-运镜与提示词.md 更新v1.2；research/12 §四 |
| 7 | D5 `pits` 追加 3 条 | 首尾帧跨度勿远（废片主因）；可灵 4.0 Flash 阉割档限制；第三方渠道低价风险与样片模式替代 | research/10 §一 / research/05 §四；research/21 §三、§五；research/21 §二、§四 |
| 8 | D6 `steps` 追加 2 条 | ElevenLabs v3 行内音频标签 + MiniMax 拟声；混生成素材统一超分+补帧 | research/10 §三；research/14-声音设计与后期提质.md §二 |
| 9 | D6 `tools` 追加 | ElevenLabs SFX（月 50 次免费+视频转音效，工具库已有该条目、跳转有效） | research/14 §一；js/data.js:326 |
| 10 | D7 `steps` 追加 1 条 | 双端发布动作分开做（抖音 SEO+收藏钩子 / 红果前 30 秒留存） | research/24 §2.4-2.6 |
| 11 | D7 `pits` 追加 2 条 | 掉池信号与自查路径；封面标题党入红线（2026-07-13 更新版） | research/24 §3.2；§3.3 |
| 12 | 新键 `templates`（6 组） | 抽卡前缀骨架 / 首尾帧骨架+衔接 / 负面提示词 / 对口型台词 / 音频标签速查 / 标题五问+钩子词库 | research/10 §一；research/05 §四、§七、更新v1.2；research/19-数字人口型表演与美术风格进阶.md A6；research/10 §三；research/15-封面设计与标题实战.md §二、§三 |
| 13 | `checklist` 4 组各追加 1 项 | 拉片自查 / 开场三要素 / 微动作自查 / SEO 自查（均追加在数组末尾，`gi-ii` 本机进度索引不位移） | 同 #3/#4/#6/#10 |
| 14 | `app.js` firstfilm() 渲染函数整体替换 | ① D1-D7 前插入三个阶段分组小标题（复用 `.callout`）；② 新增"贴身模板"区：逐组复制 + 一键复制全部（走全局 `[data-copy]` 委托 `app.js:1958-1959`，零新增全局代码） | 交互惯例见 app.js:566-570、793-796 同款 `regCopy`+`codebox` |

不改动任何既有条目的文字与数字口径；只做数组末尾追加与新增键。

---

## 三、落点与代码

> 所有锚点已逐条验证唯一性（`node -e` 对 `js/data.js`、`js/app.js` 全文 split 计数，输出均为 `1 ×`，见文末"校验记录"）。以下每处先给锚点原文，再给替换后的完整代码，可直接整段粘贴。

### 改动 1｜js/data.js · truth 追加第 5 条

锚点（js/data.js:1447-1448，唯一）：

```js
    `合规是入场券：AI标识显式+隐式双标识、《微短剧发展管理办法》2026-09-01施行、未备案不得上线——细则见D6与「变现运营」合规红线`,
  ],
```

替换为：

```js
    `合规是入场券：AI标识显式+隐式双标识、《微短剧发展管理办法》2026-09-01施行、未备案不得上线——细则见D6与「变现运营」合规红线`,
    `双端机制不同，优化动作也要分开：抖音奖励"内容资产"（搜索流量是长效资产、发布后7天内不删），红果奖励"时长资产"（点击率×播放时长×完播率；单集观看≥30秒才计1次有效播放·经验值口径）——D2写结构、D7发片时按平台定制`,
  ],
```

### 改动 2｜js/data.js · cost.notes 追加第 4 条

锚点（js/data.js:1454-1455，唯一）：

```js
      `这只是生成成本：不含配音（剪映TTS免费起步）、人力与投流——完整三本账（人力/工期/回本播放量）用「互动计算器」`,
    ],
```

替换为：

```js
      `这只是生成成本：不含配音（剪映TTS免费起步）、人力与投流——完整三本账（人力/工期/回本播放量）用「互动计算器」`,
      `可灵整体均价口径约0.43元/秒（腾讯新闻2026-04-25实测折算）→50秒约21.5元/集；"每秒几毛钱"的宣传价默认乘2-3倍重抽系数——两家头部模型均无权威废片率公开数据`,
    ],
```

### 改动 3｜js/data.js · D1 steps 追加第 6 步

锚点（js/data.js:1465-1466，唯一）：

```js
        `红线预检：避开软色情/暴力血腥/宗教等特殊题材（《菩提临世》8亿播放上线27天双平台下架）与纯赘婿红海；对照"画风×题材匹配"条目锁画风——战神/赘婿→2D条漫、玄幻/西游→3D国漫、甜宠/乙游→韩漫风`,
      ],
```

替换为：

```js
        `红线预检：避开软色情/暴力血腥/宗教等特殊题材（《菩提临世》8亿播放上线27天双平台下架）与纯赘婿红海；对照"画风×题材匹配"条目锁画风——战神/赘婿→2D条漫、玄幻/西游→3D国漫、甜宠/乙游→韩漫风`,
        `对标拆解升一级：用"拉片表"逐镜拆（镜号/景别/运镜/机位/时长/情绪点/钩子/台词）——听花岛按秒拆解法，不是"看片"是"拆片"；Agent工作流可把数小时拉片压到10分钟`,
      ],
```

### 改动 4｜js/data.js · D2 steps 追加第 6 步

锚点（js/data.js:1485-1486，唯一）：

```js
        `给2-3个角色各写40字小传（身份/性格/标志外形）——D3做设定直接用`,
      ],
```

替换为：

```js
        `给2-3个角色各写40字小传（身份/性格/标志外形）——D3做设定直接用`,
        `反转写不出来先贴模式：反转三大模式=身份反转/利益反转/关系反转，对号入座再填细节；开场15秒三要素自查——身份错位+利益威胁+视觉冲击，缺哪个补哪个`,
      ],
```

### 改动 5｜js/data.js · D3 steps 追加第 6 步

锚点（js/data.js:1506-1507，唯一）：

```js
        `首镜定风格：先出第一张分镜图定下画风与光调，后续所有分镜复述该图风格并挂同一角色参考`,
      ],
```

替换为：

```js
        `首镜定风格：先出第一张分镜图定下画风与光调，后续所有分镜复述该图风格并挂同一角色参考`,
        `多图参考注明用途：写"男人@图片1 下班后疲惫地走在走廊"（@图片N锚定每张参考图的职责）；即梦"角色ID"首传定妆图提取五官结构后自动套用，可调脸部/主体参考强度`,
      ],
```

### 改动 6｜js/data.js · D4 steps 追加第 6-7 步

锚点（js/data.js:1527-1528，唯一）：

```js
        `对照「爆款心法」98秒六段沙盘复查节奏：黄金钩子1-2镜/递进铺垫10-14镜/黄金反转3-5镜（含0.5秒特写）/卡点留钩3-5镜`,
      ],
```

替换为：

```js
        `对照「爆款心法」98秒六段沙盘复查节奏：黄金钩子1-2镜/递进铺垫10-14镜/黄金反转3-5镜（含0.5秒特写）/卡点留钩3-5镜`,
        `情绪词降级为微动作：用"眉头缓缓蹙起/指节泛白/喉结滚动/鼻翼翕动"替代"愤怒/悲伤"——四层结构：面部微表情→眼神方向→肢体语言→语气节奏`,
        `镜头连续性自查：道具方位与光线色调前后一致；一个镜头塞两个以上事件就要拆镜；相邻镜号避免相同景别`,
      ],
```

### 改动 7｜js/data.js · D5 pits 追加 3 条

锚点（js/data.js:1561-1562，唯一）：

```js
        `双重指挥（面板+提示词反向运镜）必崩——运镜只留一层控制`,
      ] },
```

替换为：

```js
        `双重指挥（面板+提示词反向运镜）必崩——运镜只留一层控制`,
        `首尾帧两帧关联性不要太远：构图/位置/景别跨度小，帧差越小中间运动越干净——差距过大模型会"发明"中间内容，运镜不完整是废片主因`,
        `可灵4.0 Flash是阉割档：3-20秒/仅720P/仅首帧图生视频/无关键帧与全能参考（fal.ai规格页9-30）——试镜定运镜节奏可以（"试镜用4.0 Flash"口径），出正式镜头用即梦Seedance或等全量后上关键帧`,
        `第三方渠道低价（0.23-0.3元/秒）系Agent贴钱甩卖，存在服务与账号风险——第一部片量小，用官方免费积分+即梦样片模式（480P草稿→升清1080P，升清成本约直出的1/8）更稳`,
      ] },
```

### 改动 8｜js/data.js · D6 steps 追加第 6-7 步

锚点（js/data.js:1570-1571，唯一）：

```js
        `合规双件套：发布时勾选"本视频含有AI生成内容"+画面显著位置AI标识持续≥2秒（只写简介无效）；显式+隐式（元数据）双标识是2025-09-01施行《人工智能生成合成内容标识办法》的要求`,
      ],
```

替换为：

```js
        `合规双件套：发布时勾选"本视频含有AI生成内容"+画面显著位置AI标识持续≥2秒（只写简介无效）；显式+隐式（元数据）双标识是2025-09-01施行《人工智能生成合成内容标识办法》的要求`,
        `配音稿直接写情绪：ElevenLabs v3行内方括号标签[whispers][sad][pause]可堆叠、重音=全大写、每行开头先写情绪标签——拼写必须正确，坏标签会被念出来；MiniMax侧直接写(laughs)(sighs)拟声（速查见下方"贴身模板"）`,
        `多模型混生成的素材画质/帧率不齐——统一超分+补帧再进时间线：剪映「AI画质增强」免费零成本，进阶Topaz Video AI（出海前批量提质，海外观众对画质更敏感）`,
      ],
```

### 改动 9｜js/data.js · D6 tools 追加 1 行

锚点（js/data.js:1576-1577，唯一）：

```js
        { n: `剪映音效库`, go: `#/tools?hl=剪映音效库`, use: `免费海量音效+AI音效匹配` },
      ],
```

替换为：

```js
        { n: `剪映音效库`, go: `#/tools?hl=剪映音效库`, use: `免费海量音效+AI音效匹配` },
        { n: `ElevenLabs SFX`, go: `#/tools?hl=ElevenLabs SFX`, use: `每月50次免费；"视频转音效"上传分镜视频自动逐镜配SFX——音效批量神器` },
      ],
```

### 改动 10｜js/data.js · D7 steps 追加第 6 步

锚点（js/data.js:1592-1593，唯一）：

```js
        `定迭代清单：下一集改什么（钩子/节奏/运镜）；连发20+集拿到真实数据后，再谈投流加码（投流ROI及格线1.15-1.2）`,
      ],
```

替换为：

```js
        `定迭代清单：下一集改什么（钩子/节奏/运镜）；连发20+集拿到真实数据后，再谈投流加码（投流ROI及格线1.15-1.2）`,
        `双端发布动作分开做：抖音端重标题SEO与收藏钩子（剧名+题材词+人设词进标题/话题，字幕可被OCR识别——搜索是长效资产）；红果端重前30秒留存与单集密度（单集观看≥30秒才计1次有效播放·经验值口径）`,
      ],
```

### 改动 11｜js/data.js · D7 pits 追加 2 条

锚点（js/data.js:1603-1604，唯一）：

```js
        `第一部片就烧钱投流——先有20+集真实数据再算ROI；2026 AI剧流量成本同比涨超100%（证券时报）`,
      ] },
```

替换为：

```js
        `第一部片就烧钱投流——先有20+集真实数据再算ROI；2026 AI剧流量成本同比涨超100%（证券时报）`,
        `掉池自检：播放骤降至几百/仅自己可见/发布提示"不适宜公开"——去创作者服务中心"账号状态检测"查违规记录；昵称/签名/头像/背景图留联系方式是常见自雷点`,
        `封面标题党入红线：抖音《动画微短剧（漫剧）内容创作建议》2026-07-13更新版把"封面与实际片名不一致"列入红线——封面大字别夸大到货不对板`,
      ] },
```

### 改动 12｜js/data.js · 新增 `templates` 键（6 组贴身模板）

锚点（js/data.js:1605-1606，`  income: {` 全文唯一）：

```js
  ],
  income: {
```

替换为（新键位于 `DB.firstfilm` 命名空间内，与同区 `truth/days/income/checklist` 同级同风格，不进入全局作用域）：

```js
  ],
  /* 贴身模板（v3.1新增）：D3-D7 各环节复制即用的骨架/负面词/标签速查；
     结构对齐「接单实操」scripts 的 { t, txt } 惯例并加 use 字段标注使用日 */
  templates: [
    { t: `抽卡提示词 · 固定前缀骨架`, use: `D3-D5每张图都带：前缀+风格词锁定画风，只改镜头与动作段`, txt: `【固定前缀】（每张图一字不改）2D条漫风格 + 商业短剧质感 + 高清细节
【风格词】（D3定稿的画风尾缀，一字不改带进每一镜）
【主体】（角色描述卡40-80字：发型+发色+瞳色+服装+标志特征）
【镜头语言】（焦段+景别+角度：24mm环境 / 35mm叙事 / 85mm特写）
【光影氛围】（用光比/光源方向等数据词，不用"柔和""高级"等主观词）
【画质后缀】（高清细节、线条锐利、无文字水印）
口诀：每集/每角色固定同一段前缀+风格词，只改镜头与动作段` },
    { t: `首尾帧提示词骨架`, use: `D5图生视频：帧差定义运动，提示词只补三件事`, txt: `首帧：（描述图A：主体/场景/光线）
尾帧：（描述图B：与A同主体同场景同光线——位置差→位移；表情差→情绪；景别差→推拉；构图差→转场）
提示词只补三件事：节奏（slow/rapid）+ 氛围 + 两帧之间的行为
相邻镜头衔接：取A最后帧作B首帧，一句话写衔接类型
morph / match cut / whip pan 三选一，加约束词 no extra elements, camera locked` },
    { t: `负面提示词 · 图像视频通用`, use: `D3/D5每次生成挂上：手部/面部/闪烁/融化的通用防线`, txt: `blurry, low quality, deformed face, bad hands, extra fingers, fused fingers, bad anatomy, extra limbs, watermark, text, flickering, morphing, warping, duplicated character` },
    { t: `对口型台词模板`, use: `D6关键特写：先TTS定稿台词，再逐句驱动画面`, txt: `@图片中的{角色} 说：{台词}，口型与音频同步
（情绪标注词放台词前，如：[悲伤] 你从来都没信过我……）
配套铁律：先配音定稿→按单句剪音频→逐句驱动；长句拆2-3段、接缝补1-2帧
一镜一人开口；口型只用在关键特写，其余台词用反应/过肩/空镜掩护` },
    { t: `音频标签速查 · ElevenLabs v3 / MiniMax`, use: `D6配音稿：把情绪写进文本，不靠模型猜`, txt: `【ElevenLabs v3】行内方括号：[whispers] 我不该告诉你…… [laughs]
情绪类：[sad][angry][happily][excited][worried][upset][tired][surprised]
节奏类：[whispers][shouts][softly][rushed][slowly][pause][booming]
生理反应类：[laughs][sighs][clears throat][chuckles][gasps]
可堆叠[excited][laughs]；重音=全大写或[shouts]；多说话人每行开头先写情绪标签
注意：拼写必须正确（坏标签会被念出来）；不支持SSML（<break>→[pause]）；单次合成保持250字符以上更稳
【MiniMax Speech 2.6】直接写拟声 (laughs)、(sighs)；emotion枚举 happy/sad/angry/fearful/disgusted/surprised/neutral` },
    { t: `标题自检五问 + 反转钩子词库`, use: `D7发布前最后一道关：配合「爆款心法」标题打分器`, txt: `标题自检五问：有身份反差吗？有悬念留白吗？有数字锚点吗？有情绪词吗？超18字了吗？
反转钩子词库：竟 / 居然 / 却 / 谁知 / 没想到 / 结果 / 背后 / 真相 / 凭什么
套路示例：身份反差="战神赘婿被扫地出门，次日全军来迎"；数字锚定="月薪3千却承包了整个公司"
反套路警示：摔辞职信/被退婚/打脸反派已过度使用——反套路真实感开头更易出圈` },
  ],
  income: {
```

### 改动 13｜js/data.js · checklist 4 组各追加 1 项（均追加在数组末尾，`gi-ii` 进度索引不位移）

锚点（js/data.js:1621，唯一）：

```js
    { d: `D1`, t: `定题材与对标`, items: [`题材+对标爆款已定（题材风向库对表）`, `红线预检通过（避开已治理题材）`, `画风已锁定（画风×题材匹配）`] },
```

替换为：

```js
    { d: `D1`, t: `定题材与对标`, items: [`题材+对标爆款已定（题材风向库对表）`, `红线预检通过（避开已治理题材）`, `画风已锁定（画风×题材匹配）`, `对标已按拉片表逐镜拆（镜号/景别/运镜/时长/情绪点）`] },
```

锚点（js/data.js:1622，唯一）：

```js
    { d: `D2`, t: `一集剧本`, items: [`98秒剧本完成（Prompt模板+人工改钩子/反转/台词）`, `钩子-反转-卡点三处已标注`, `台词单句≤15字口语化`] },
```

替换为：

```js
    { d: `D2`, t: `一集剧本`, items: [`98秒剧本完成（Prompt模板+人工改钩子/反转/台词）`, `钩子-反转-卡点三处已标注`, `台词单句≤15字口语化`, `开场三要素齐：身份错位+利益威胁+视觉冲击`] },
```

锚点（js/data.js:1624，唯一）：

```js
    { d: `D4`, t: `分镜与提示词`, items: [`分镜表10-15镜（含时长/景别/运镜）`, `每镜image_prompt七段式可直接粘贴`, `每镜运镜≤2种且带方向+速度+目的`] },
```

替换为：

```js
    { d: `D4`, t: `分镜与提示词`, items: [`分镜表10-15镜（含时长/景别/运镜）`, `每镜image_prompt七段式可直接粘贴`, `每镜运镜≤2种且带方向+速度+目的`, `情绪词已换成具体微动作（无笼统"愤怒/悲伤"式描写）`] },
```

锚点（js/data.js:1627，唯一）：

```js
    { d: `D7`, t: `发布与数据复盘`, items: [`封面标题按公式做好并AB`, `已发布（7天内不删）`, `72小时数据复盘+迭代清单`] },
```

替换为：

```js
    { d: `D7`, t: `发布与数据复盘`, items: [`封面标题按公式做好并AB`, `已发布（7天内不删）`, `72小时数据复盘+迭代清单`, `标题含题材长尾词、剧名可被站内搜索（SEO自查）`] },
```

### 改动 14｜js/app.js · `firstfilm()` 渲染函数整体替换

锚点：js/app.js:640 `    firstfilm() {` 起，至 js/app.js:705 `    },`（其后一行是 `    monetize() {`）止，整函数替换为下述完整函数体（函数名与依赖不变；新增局部标识符均带 `mjxFirstfilm` 前缀；复制走全局 `[data-copy]` 委托 `app.js:1958-1959` 与既有 `regCopy/doCopy`，不改任何公共设施；未新增 CSS 类，全部复用 `callout/codebox/cb-bar/copy-btn/pd-box/chart-box/tag`）：

```js
    firstfilm() {
      const F = DB.firstfilm;
      /* 页首：诚实预期 */
      const truth = F.truth.map((t) => '<li style="margin:4px 0 4px 18px;padding:2px 0;color:var(--tx2);font-size:13px">' + t + '</li>').join('');
      /* 成本速算 */
      const d = F.cost.defaults;
      const num = (k, step, suffix, label) => '<label class="calc-num"><span>' + label + '</span><span class="cn-in"><input type="number" id="ff-' + k + '" value="' + d[k] + '" step="' + step + '" min="0">' + (suffix ? '<i>' + suffix + '</i>' : '') + '</span></label>';
      const costBox = '<div class="chart-box"><h5>⚡ 第一部片成本速算 <span class="sub">单集生成成本 · 与「互动计算器」同口径</span></h5>' +
        '<div class="calc-grid">' +
        num('shots', 1, '镜', '单集镜头数（第一部片建议10-15镜）') +
        num('imgUnit', 0.1, '元/张', '单张成品图成本') +
        num('rate', 5, '%', '抽卡可用率（图像健康线≥30%）') +
        num('vidUnit', 0.5, '元/条', '单条视频成本') +
        num('retries', 0.5, '倍', '视频重抽系数（常态2起）') +
        '</div><div class="calc-out" id="ffCostOut"></div>' +
        '<p class="mini-note">' + F.cost.notes.join('<br>') + '</p>' +
        '<div style="margin-top:10px"><button class="btn pri" data-go="calc">用「互动计算器」算全片三本账与回本播放量 →</button></div></div>';
      /* 7天进度自查清单 */
      const groups = F.checklist.map((g, gi) => {
        const items = g.items.map((it, ii) =>
          '<div class="ff-ck" data-ffck="' + gi + '-' + ii + '"><span class="box"></span><span>' + it + '</span></div>').join('');
        return '<div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px"><b style="font-size:13px">' + g.d + ' ' + g.t + '</b><span class="tag" id="ffg-' + gi + '">0/' + g.items.length + '</span></div>' + items + '</div>';
      }).join('');
      const total = F.checklist.reduce((a, g) => a + g.items.length, 0);
      const ckBox = '<div class="chart-box"><h5>✅ 7天进度自查 <span class="sub">勾选自动保存在本机浏览器</span></h5>' +
        '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap"><b style="font-size:15px" id="ffPct">0%</b><span class="mini-note" style="margin:0" id="ffNum"></span>' +
        '<button class="copy-btn" id="ffReset" style="margin-left:auto">↻ 重置进度</button></div>' +
        '<div class="ff-bar"><div class="ff-fill" id="ffFill"></div></div>' +
        '<div class="grid g2" style="margin-top:12px;gap:10px 18px">' + groups + '</div>' +
        '<p class="mini-note" style="margin-top:8px">共' + total + '项 · 与「制作清单」的37项完整版独立保存——第一条片跑通后，正式项目请用完整版。</p></div>';
      /* D1-D7 每日章节（增强：三阶段分组小标题，复用 .callout） */
      const mjxFirstfilmPhases = {
        D1: '阶段一 · 纸上作业（D1-D2）：想清楚再动手——这里的错要到D5才付得起学费',
        D3: '阶段二 · 资产与生成（D3-D5）：一致性是生死线——卡住就回锚点图，别硬抽',
        D6: '阶段三 · 成片与发布（D6-D7）：合规是入场券——漏AI标识是最常踩的限流主因',
      };
      const dayHtml = F.days.map((dy) => {
        const steps = dy.steps.map((s) => '<li>' + s + '</li>').join('');
        const tools = dy.tools.map((t) =>
          '<div class="bar-row" style="padding:5px 0"><span style="flex:0 0 150px;text-align:left"><button class="btn ghost" data-go="' + t.go + '" style="padding:4px 12px;font-size:12.5px">' + esc(t.n) + ' →</button></span><span style="flex:1;font-size:12.6px;color:var(--tx2)">' + t.use + '</span></div>').join('');
        const mjxFirstfilmPh = mjxFirstfilmPhases[dy.d] ? '<div class="callout" style="margin:16px 0 10px"><b>' + mjxFirstfilmPhases[dy.d] + '</b></div>' : '';
        return mjxFirstfilmPh +
          '<h4 class="block-t">' + dy.ico + ' ' + dy.d + ' · ' + dy.t + ' <span class="sub">⏱ ' + dy.time + '</span></h4>' +
          '<div class="card" style="padding:16px 18px">' +
          '<p style="font-size:13.2px;color:var(--tx);margin:0 0 12px"><b>今天的目标：</b>' + dy.goal + '</p>' +
          '<div class="grid g2" style="gap:12px;align-items:start">' +
          '<div class="pd-box"><h5>今天做什么（' + dy.steps.length + '步）</h5><ul>' + steps + '</ul></div>' +
          '<div><div class="pd-box" style="margin-bottom:12px"><h5>用什么工具（点击直达）</h5>' + tools + '</div>' +
          '<div class="pd-box"><h5>产出物</h5><ul><li>' + dy.output + '</li></ul></div></div>' +
          '</div>' +
          '<div class="pd-box warn" style="margin-top:12px"><h5>常见坑</h5><ul>' + dy.pits.map((p) => '<li>' + p + '</li>').join('') + '</ul></div>' +
          '</div>';
      }).join('');
      /* 贴身模板（增强：逐组复制 + 一键复制整组，走全局 data-copy 委托与 regCopy 惯例） */
      const mjxFirstfilmTplRows = (F.templates || []).map((tp) =>
        '<div class="codebox" style="margin-top:10px"><div class="cb-bar"><span>' + tp.t + ' · ' + tp.use + '</span>' +
        '<button class="copy-btn" data-copy="' + regCopy(tp.txt) + '">复制</button></div><pre>' + esc(tp.txt) + '</pre></div>').join('');
      const mjxFirstfilmTplAll = regCopy((F.templates || []).map((tp) => '【' + tp.t + '】（' + tp.use + '）\n' + tp.txt).join('\n\n────────\n\n'));
      const mjxFirstfilmTplBox = '<h4 class="block-t">📎 贴身模板 <span class="sub">骨架/负面词/首尾帧/音频标签/标题五问 · 按日取用：D3-D4骨架与负面词 → D5首尾帧 → D6音频标签 → D7标题五问</span></h4>' +
        '<div class="card" style="padding:16px 18px">' +
        '<div style="display:flex;align-items:center;gap:10px;margin:0 0 2px"><b style="font-size:13px">六组模板对应 D3-D7 各环节，改{占位符}即用</b>' +
        '<button class="copy-btn" data-copy="' + mjxFirstfilmTplAll + '" style="margin-left:auto">📋 一键复制全部模板</button></div>' +
        mjxFirstfilmTplRows + '</div>';
      /* 收入衔接 */
      const inc = F.income;
      const tierRows = inc.tiers.map((t) =>
        '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 110px;text-align:left">' + t.n + '</span><span style="flex:0 0 120px;color:var(--gold);font-weight:700;font-size:12.8px">' + t.v + '</span><span style="flex:1;font-size:12.4px;color:var(--tx2)">' + t.d + '</span></div>').join('');
      const pathRows = inc.paths.map((p) =>
        '<div class="bar-row"><span class="b-lab" style="width:auto;flex:0 0 96px;text-align:left;color:var(--gold);font-weight:700">' + p.n + '</span><span style="flex:1;font-size:12.6px;color:var(--tx2)">' + p.d + '</span></div>').join('');
      const incomeBox = '<h4 class="block-t">💰 出片之后：第一笔收入怎么衔接 <span class="sub">90天见钱的诚实路径</span></h4>' +
        '<div class="card" style="padding:16px 18px">' +
        '<p style="font-size:13px;color:var(--tx2);margin:0 0 10px">' + inc.note + '</p>' +
        '<div class="chart-box"><h5>收益三分层（引用「变现运营」收益对照矩阵）</h5>' + tierRows + '</div>' +
        '<div class="chart-box" style="margin-top:10px"><h5>按你的背景选路径</h5>' + pathRows + '</div>' +
        '<div class="callout" style="margin-top:12px"><b>行情参考：</b>' + inc.market + '</div></div>';
      return '<div class="callout gold" style="margin-bottom:16px"><b>本页双承诺：7天出片 + 90天见钱。</b>' +
        '7天跑通"创意→可发布成片"全链路（外部回测支持：CSDN七步教程/B站24集保姆级教程，2026-09检索）；首笔收入现实预期在第60-90天（知乎·天狐 2026-08-24口径，与「学习路径」第31-90天商业化一致）。' +
        '<ul style="margin:8px 0 0;list-style:disc">' + truth + '</ul></div>' +
        '<div class="grid g2" style="align-items:start">' + costBox + ckBox + '</div>' +
        '<h4 class="block-t" style="margin-top:8px">7天每日实操 <span class="sub">每节固定结构：今天做什么 / 用什么工具 / 产出物 / 常见坑</span></h4>' +
        dayHtml + mjxFirstfilmTplBox + incomeBox +
        '<div class="callout blue"><b>跑通之后去哪：</b>第二部片起别再从零开始——把本页D3-D5沉淀的描述卡/锚点图/提示词模板搬进「无限画布」工作流，按「学习路径」第8-30天模板化+资产化，爆款率0.16%的行业里，复用资产才是把偶然变必然的方法。</div>';
    },
```

### 兼容性说明（渲染层依赖核对）

- `refreshFfProgress()`（app.js:1387-1405）按 `DB.firstfilm.checklist` 动态计数，checklist 21→25 项自动适配；新增项追加在数组末尾，`localStorage` 中 `gi-ii` 键不位移，已勾进度不丢失。
- 学习仪表盘关卡（app.js:618 `gateCount('manju_ff_progress_v1', ...)`）与全局搜索（app.js:1797-1798）均为动态遍历，无需改动。
- 新键 `templates` 不被任何现有消费方读取（`grep firstfilm` 全站核对过），由改动 14 的新渲染代码消费；`(F.templates || [])` 兜底保证数据键未应用时页面仍可渲染。
- D6 新工具跳转 `#/tools?hl=ElevenLabs SFX` 的目标条目已存在（js/data.js:326 `{ n: \`ElevenLabs SFX\`, ... }`），跳转有效。

---

## 四、来源对照表

| 新增内容 | research/ 出处（档案内小节） | 档案自身标注 |
|---|---|---|
| 双端机制差异、红果≥30秒有效播放 | 24-平台算法与流量池机制深拆.md §2.4-2.6（差异小结"可落地"） | ≥30秒为 CSDN 行业拆解"经验值口径"，已随文标注 |
| 搜索是长效资产、SEO 布局 | 同上 §2.4、§六.3 | 40%+ 占比系【存疑】聚合源，**未采用具体百分比**，只采用方向判断 |
| 可灵均价 0.43 元/秒、宣传价乘 2-3 倍、无权威废片率 | 21-可灵4.0正式版实测与视频模型价格核验.md §2.2、§七（核验员轮逐句坐实） | 腾讯新闻 2026-04-25 实测折算口径 |
| Flash 阉割档限制 | 同上 §三（fal.ai 9-30 规格页）、§五（"试镜用4.0 Flash"口诀【推断】） | 实操含义由规格差异反推，已按"试镜/成片"分开表述 |
| 第三方渠道 0.23-0.3 元/秒甩卖与风险；样片模式省 38%、升清约 1/8 | 同上 §二、§四 | 36氪 2026-08-31 原文核验 |
| 拉片表字段、听花岛按秒拆解、Agent 拉片 10 分钟、拆镜与景别错开 | 12-剧本创作与网文改编实操.md §四 | — |
| 反转三大模式、开场 15 秒三要素 | 同上 §二、§三 | — |
| @图片N 锚定、即梦"角色ID"、参考强度 | 10-实战SOP深化.md §一"参考图挂载" | — |
| 微表情四层结构、微动作词库 | 05-运镜与提示词.md 更新 2026-10-01（v1.2） | — |
| 首尾帧帧差勿远、补三件事、Match Cut 约束词 | 同上 §四（1/3/4/6 条） | — |
| 负面提示词 EN 全表 | 同上 §七（逐字引用） | — |
| 对口型模板"先配音定稿→按单句剪音频→长句拆2-3段接缝补1-2帧" | 19-数字人口型表演与美术风格进阶.md A6.1；"一镜一人开口"另见站内术语表（js/data.js:1673） | — |
| 音画同步模板"@图片中的{角色} 说：{台词}" | 05-运镜与提示词.md 更新 v1.2"音画同步模板"（Seedance 2.0 漫剧手册） | — |
| ElevenLabs v3 标签四类清单/可堆叠/坏标签被念出/≥250字符/不支持SSML；MiniMax (laughs)(sighs) 与 emotion 枚举 | 10-实战SOP深化.md §三（官方 Audio Tags 101 / API 文档口径） | — |
| 超分+补帧统一画质、Topaz/剪映 AI 画质增强 | 14-声音设计与后期提质.md §二 | — |
| ElevenLabs SFX 月 50 次免费、视频转音效 | 同上 §一；站内工具库 js/data.js:326 | — |
| 标题五问、反转钩子词库、套路示例、反套路警示 | 15-封面设计与标题实战.md §二、§三 | — |
| 抽卡提示词六段结构公式、焦段量化（24/35/85mm）、光比数据词 | 10-实战SOP深化.md §一"提示词模板化" | — |

---

## 五、需人工核实

无。所有新增条目均可在 research/ 档案中找到原文出处（见第四节对照表）；两处档案自身标注为"经验值口径/【推断】"的内容（红果 ≥30 秒有效播放、"试镜用4.0 Flash"口诀）已按档案原样在正文内联标注，未以确定事实口吻陈述；research/24 中标【存疑】的数字（收藏率权重 40%+、动态 IP 降 82% 风险、支付转化率 85% 等）一律未采用。模板骨架中的槽位说明文字均为档案公式的复述，唯一示例值"2D条漫风格"取自站内既有口径（题材风向库"画风×题材匹配"条目）。

---

## 六、不做的事

1. 不改 `index.html`、`sw.js`、公共 JS 设施——不动路由/命令面板/全局搜索/收藏系统/`refreshFfProgress`/`ffCostCompute` 等任何函数；改动 14 仅替换模块自己的渲染函数体。
2. 不重命名/删除任何现有 DB 键与字段（`truth/cost/days/income/checklist` 及其子字段全部原样），只做数组末尾追加与新增键 `templates`。
3. 不改既有条目的任何数字口径（即梦积分时间线、80-100 元/集参考带、完播率及格线、万播 5-30 元等全部保持原样）。
4. 不新增模块、不新增 CSS 文件/类（复用现有 `.callout/.codebox/.cb-bar/.copy-btn/.pd-box/.chart-box`），渲染函数内新增局部变量均带 `mjxFirstfilm` 前缀。
5. 不给 D1-D7 加"按天筛选/折叠"与页内跳转锚点——站内路由基于 `location.hash`（app.js:2040），页内 `#` 锚点会与 `#/` 哈希路由冲突，风险大于收益；阶段分组小标题以零风险方式解决长文导航问题。
6. 不采用 research/24 中标注【存疑】的具体数字，不引入 research/ 档案之外的新知识。
7. 不动 7 天天数结构与"双承诺"叙事；checklist 不做按天筛选（进度组件与学习仪表盘共享存储口径，保持最小改动）。

---

## 附：校验记录（本次实际执行）

1. 条目数盘点：`node -e "const DB=require('./js/data.js'); ..."` → 输出 truth:4 / days:7(steps35/tools25/pits24) / income 3+3 / checklist 7×21（见第一节原文）。
2. 锚点唯一性：对上列全部锚点字符串在 `js/data.js`、`js/app.js` 全文 split 计数，输出均为 `1 ×`（含 `  income: {`、`    firstfilm() {`、checklist 四整行、各日末条 step/pit/tool）。
3. 跳转有效性：`grep -n "ElevenLabs SFX" js/data.js` → js/data.js:326 工具条目存在，`#/tools?hl=ElevenLabs SFX` 可达。
4. 补丁代码量：文档内全部 ```js 代码块合计 187 行（含每处改动为"整段粘贴替换"所需的锚点引用行）；纯新增代码约 143 行（改动 14 函数体 83 行、templates 块 34 行、改动 1-11 净增 16 行、checklist 4 行改写），低于 350 行上限。
5. 模拟应用测试（本次实际执行，脚本与产物均在系统临时目录，未触碰项目文件）：从本方案中**按原文提取**改动 1-13 的全部 16 组「锚点→替换为」代码块，逐条应用到 `js/data.js` 临时副本 → 锚点全部唯一命中 → `require` 加载成功，实测计数 truth 5 / cost.notes 4 / days 步骤 35→43、工具 25→26、坑 24→29（逐日 D1:6/3/3 · D2:6/4/3 · D3:6/3/4 · D4:7/4/3 · D5:5/4/7 · D6:7/5/4 · D7:6/3/5）/ templates 6 组（{t,use,txt} 字段齐）/ checklist 21→25 项 / income 与 truth 首条原样未动；改动 14 的完整函数体（从本方案提取）`node --check` 语法通过，关键依赖探针（ffCostOut/ffReset/incomeBox/跑通之后去哪/data-ffck）全部保留。
6. 未执行项：浏览器端冒烟验证（按任务约束未实际修改 js/，无法在真实页面点按）。应用后建议自查：①打开 `#/firstfilm` 页面三处阶段分组小标题与"贴身模板"区正常渲染、模板复制按钮有 ✓ 提示；②7 天进度勾选/重置正常且旧进度不丢；③控制台无 `templates` 相关报错（有 `(F.templates || [])` 兜底）。
