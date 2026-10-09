/* 列出 js/data.js 的分区与顶层键（含行号/类型/是否含代码），输出 JSON。 */
import fs from 'node:fs';
import { parseDB } from './lib-dbparse.mjs';

const src = fs.readFileSync('js/data.js', 'utf8');
const { banners, keys } = parseDB(src);
console.log(JSON.stringify({ banners, keys: keys.map(({ text, ...rest }) => ({ ...rest, textLen: text.length })) }, null, 2));
