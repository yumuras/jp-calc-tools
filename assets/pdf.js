// PDFの結合・ページの抜き出し・1ページずつの分割。処理はすべてブラウザ（端末）の中で行う。
import { PDFDocument } from "./vendor/pdf-lib.esm.min.js";

/** 全角の数字・記号を半角にそろえる。 */
function normalize(text) {
  return String(text)
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[、，,]/g, ",")
    .replace(/[－ー―‐−〜~]/g, "-")
    .replace(/\s+/g, "");
}

/**
 * 「1-3, 5, 8-」のようなページ指定を、0始まりのページ番号の配列にする。
 * 「8-」は8ページ目から最後まで。書いた順に並べ、重複はそのまま残す。
 * 指定が読めない・範囲外なら Error（メッセージは画面にそのまま出せる文）。
 */
export function parsePageRanges(text, pageCount) {
  const src = normalize(text);
  if (src === "") throw new Error("ページを指定してください（例：1-3, 5）。");
  const pages = [];
  for (const part of src.split(",")) {
    if (part === "") continue;
    const m = part.match(/^(\d+)(?:-(\d*))?$/);
    if (!m) throw new Error(`「${part}」は読み取れません。「1-3, 5」のように指定してください。`);
    const start = Number(m[1]);
    const end = m[2] === undefined ? start : m[2] === "" ? pageCount : Number(m[2]);
    if (start < 1 || end > pageCount || start > end) {
      throw new Error(`「${part}」はページの範囲外です（このPDFは${pageCount}ページです）。`);
    }
    for (let p = start; p <= end; p++) pages.push(p - 1);
  }
  if (pages.length === 0) throw new Error("ページを指定してください（例：1-3, 5）。");
  return pages;
}

/** PDFを読み込む。パスワード付き・壊れたファイルは分かりやすいエラーにする。 */
export async function loadPdf(bytes, name = "ファイル") {
  try {
    return await PDFDocument.load(bytes);
  } catch (e) {
    if (/encrypt/i.test(String(e && e.message))) {
      throw new Error(`「${name}」はパスワードで保護されているため扱えません。`);
    }
    throw new Error(`「${name}」はPDFとして読み込めませんでした。`);
  }
}

/** ページ数。 */
export async function pageCountOf(bytes, name) {
  return (await loadPdf(bytes, name)).getPageCount();
}

/** 複数のPDFを、渡した順に1つにまとめる。files は { name, bytes } の配列。 */
export async function mergePdfs(files) {
  const out = await PDFDocument.create();
  for (const { name, bytes } of files) {
    const src = await loadPdf(bytes, name);
    const pages = await out.copyPages(src, src.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  return out.save();
}

/** 指定したページ（0始まり）だけを、その順で新しいPDFにする。 */
export async function extractPages(bytes, indices, name) {
  const src = await loadPdf(bytes, name);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, indices);
  pages.forEach((p) => out.addPage(p));
  return out.save();
}

/** 1ページずつのPDFに分ける。 */
export async function splitEachPage(bytes, name) {
  const src = await loadPdf(bytes, name);
  const result = [];
  for (const i of src.getPageIndices()) {
    const out = await PDFDocument.create();
    const [page] = await out.copyPages(src, [i]);
    out.addPage(page);
    result.push(await out.save());
  }
  return result;
}
