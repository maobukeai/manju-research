/* 顶层键扫描器：字符级扫描 const DB = {...}，跳过字符串/模板字面量/插值/注释，
   返回每个一级键的精确位置信息，供合并脚本做文本级替换。 */

export function parseDB(src) {
  const decl = /(?:const|let|var)\s+DB\s*=\s*\{/.exec(src);
  if (!decl) throw new Error('未找到 const DB = { 声明');

  // 行号辅助
  const lineStarts = [0];
  for (let k = 0; k < src.length; k++) if (src.charCodeAt(k) === 10) lineStarts.push(k + 1);
  const lineAt = (idx) => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1; }
    return lo + 1;
  };

  // 分区横幅（整行注释 /* ===== 名字 ===== */）
  const banners = [];
  {
    const lines = src.split('\n');
    let acc = 0;
    for (const ln of lines) {
      const bm = /^\/\*\s*(.*?)\s*\*\/\s*$/.exec(ln);
      if (bm) {
        const name = bm[1].replace(/[=\s]+/g, ' ').trim();
        if (name) banners.push({ line: lineAt(acc), name });
      }
      acc += ln.length + 1;
    }
  }

  const frames = [{ type: 'code', brace: 1, bracket: 0, interp: false }]; // DB 对象内部
  const keys = [];
  let pending = null;          // { name, nameIndex, colonIndex, indent, nameLine, awaitColon, valueStartSeen, kind }
  let prevSig = '{';           // 上一个有效字符（用于判定键位置）
  let lastSigIdx = -1;         // 最后一个有效字符位置
  let i = dbOpen + 1;
  let done = false;

  const atKeyPos = () =>
    frames.length === 1 && frames[0].type === 'code' && frames[0].brace === 1 && frames[0].bracket === 0;

  while (i < src.length && !done) {
    const c = src[i];
    const f = frames[frames.length - 1];

    if (f.type === 'linecomment') {
      if (c === '\n') frames.pop();
      i++; continue;
    }
    if (f.type === 'blockcomment') {
      if (c === '*' && src[i + 1] === '/') { frames.pop(); i += 2; continue; }
      i++; continue;
    }
    if (f.type === 'squote' || f.type === 'dquote') {
      const q = f.type === 'squote' ? "'" : '"';
      if (c === '\\') { i += 2; continue; }
      if (c === q) { frames.pop(); lastSigIdx = i; prevSig = q; }
      i++; continue;
    }
    if (f.type === 'template') {
      if (c === '\\') { i += 2; continue; }
      if (c === '`') { frames.pop(); lastSigIdx = i; prevSig = '`'; i++; continue; }
      if (c === '$' && src[i + 1] === '{') { frames.push({ type: 'code', brace: 0, bracket: 0, interp: true }); i += 2; continue; }
      i++; continue;
    }

    // code 帧
    if (c === '/' && src[i + 1] === '/') { frames.push({ type: 'linecomment' }); i += 2; continue; }
    if (c === '/' && src[i + 1] === '*') { frames.push({ type: 'blockcomment' }); i += 2; continue; }
    if (c === "'") { frames.push({ type: 'squote' }); i++; continue; }
    if (c === '"') { frames.push({ type: 'dquote' }); i++; continue; }
    if (c === '`') { frames.push({ type: 'template' }); i++; continue; }

    if (c === '{') {
      if (atKeyPos() && pending && pending.valueStartSeen && !pending.valueStart) { /* 不会发生：valueStart 已在首个有效字符记录 */ }
      if (atKeyPos() && pending && !pending.valueStartSeen) {
        pending.valueStart = i; pending.valueStartSeen = true; pending.kind = 'object';
      }
      f.brace++;
      lastSigIdx = i; prevSig = '{'; i++; continue;
    }
    if (c === '}') {
      if (f.interp && f.brace === 0) { frames.pop(); i++; continue; } // 模板插值结束
      f.brace--;
      if (frames.length === 1 && f.brace === 0) { done = true; break; } // DB 结束
      if (frames.length === 1 && pending && pending.valueStartSeen && f.brace === 1 && f.bracket === 0) {
        completeKey(i);
      }
      lastSigIdx = i; prevSig = '}'; i++; continue;
    }
    if (c === '[') {
      if (atKeyPos() && pending && !pending.valueStartSeen) {
        pending.valueStart = i; pending.valueStartSeen = true; pending.kind = 'array';
      }
      f.bracket++;
      lastSigIdx = i; prevSig = '['; i++; continue;
    }
    if (c === ']') {
      f.bracket--;
      if (frames.length === 1 && pending && pending.valueStartSeen && f.brace === 1 && f.bracket === 0) {
        completeKey(i);
      }
      lastSigIdx = i; prevSig = ']'; i++; continue;
    }
    if (c === ',') {
      if (frames.length === 1 && pending && pending.valueStartSeen && pending.kind === 'scalar') {
        completeKey(lastSigIdx);
      }
      prevSig = ','; i++; continue;
    }

    if (/\s/.test(c)) { i++; continue; }

    // 标识符：可能是键名
    if (/[A-Za-z_$]/.test(c) && atKeyPos() && (prevSig === '{' || prevSig === ',')) {
      let j = i;
      while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const word = src.slice(i, j);
      // 向前看冒号
      let k = j;
      while (k < src.length && /\s/.test(src[k])) k++;
      const line = lineAt(i);
      const indent = (() => { const ls = lineStarts[line - 1]; let n = 0; while (src[ls + n] === ' ' || src[ls + n] === '\t') n++; return n; })();
      if (src[k] === ':') {
        pending = { name: word, nameIndex: i, colonIndex: k, indent, nameLine: line, awaitColon: false, valueStartSeen: false, kind: 'scalar', valueStart: -1 };
        prevSig = ':'; i = k + 1; continue;
      }
      // 不是键（异常情况），按普通标识符处理
      lastSigIdx = j - 1; prevSig = src[j - 1]; i = j; continue;
    }

    // 普通有效字符（数字、true/false 等）
    if (pending && !pending.valueStartSeen && atKeyPos()) {
      pending.valueStart = i; pending.valueStartSeen = true; pending.kind = 'scalar';
    }
    lastSigIdx = i; prevSig = c; i++; continue;
  }

  function completeKey(endIdx) {
    const text = src.slice(pending.valueStart, endIdx + 1);
    const raw = src.slice(pending.valueStart, endIdx + 1);
    keys.push({
      name: pending.name,
      nameIndex: pending.nameIndex,
      colonIndex: pending.colonIndex,
      valueStart: pending.valueStart,
      valueEnd: endIdx,
      indent: pending.indent,
      nameLine: pending.nameLine,
      endLine: lineAt(endIdx),
      kind: pending.kind,
      hasCode: /\bfunction\b|=>/.test(raw),
      text,
    });
    pending = null;
    prevSig = ',';
  }

  if (!done) throw new Error('扫描未正常收敛：DB 对象未闭合');
  keys.sort((a, b) => a.nameIndex - b.nameIndex);

  // 每个键所属分区
  for (const key of keys) {
    let sec = '(未分区)';
    for (const b of banners) if (b.line < key.nameLine) sec = b.name;
    key.section = sec;
  }
  return { banners, keys, dbEnd: i };
}
