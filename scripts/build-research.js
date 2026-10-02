/* ============================================================
   构建脚本：把 research/*.md 打包成 js/research-data.js
   用法：node scripts/build-research.js
   每次新增/修改研究档案后运行一次，网站「研究档案」模块即更新
   ============================================================ */
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'research');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md')).sort();

const docs = files.map((f) => {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8');
  const title = (raw.match(/^#\s+(.+)$/m) || [])[1] || f.replace(/\.md$/, '');
  return { file: f, title: title.trim(), content: raw };
});

const out = '/* 自动生成于 ' + new Date().toISOString().slice(0, 10) +
  ' · 源文件：research/*.md · 重建：node scripts/build-research.js */\n' +
  'const RESEARCH_DOCS = ' + JSON.stringify(docs) + ';\n' +
  'if (typeof module !== "undefined") module.exports = RESEARCH_DOCS;\n';

fs.writeFileSync(path.join(__dirname, '..', 'js', 'research-data.js'), out, 'utf8');
console.log('OK: ' + docs.length + ' docs -> js/research-data.js');
