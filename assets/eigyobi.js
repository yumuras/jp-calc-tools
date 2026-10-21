// 営業日の計算。土日・祝日（と、選んだ場合は年末年始）を休みとする。

import { holidayName } from "./holidays.js";

/**
 * 休みならその理由（"土曜日"・祝日名・"年末年始"）、営業日なら null。
 * options.yearEnd: 12/29〜1/3 を休みにするか
 */
export function closedReason(date, options = {}) {
  const dow = date.getDay();
  if (dow === 0) return "日曜日";
  if (dow === 6) return "土曜日";
  const name = holidayName(date);
  if (name) return name;
  if (options.yearEnd) {
    const m = date.getMonth() + 1;
    const d = date.getDate();
    if ((m === 12 && d >= 29) || (m === 1 && d <= 3)) return "年末年始";
  }
  return null;
}

export function isBusinessDay(date, options = {}) {
  return closedReason(date, options) === null;
}

/**
 * 基準日から n 営業日後（n が負なら前）の日付。基準日そのものは数えない。
 * 例: 金曜の1営業日後は（祝日でなければ）翌週月曜
 * skipped には、途中で飛ばした平日の休み（祝日・年末年始）を入れて返す
 */
export function addBusinessDays(start, n, options = {}) {
  const step = n >= 0 ? 1 : -1;
  const d = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const skipped = [];
  let remaining = Math.abs(n);
  while (remaining > 0) {
    d.setDate(d.getDate() + step);
    const reason = closedReason(d, options);
    if (reason === null) {
      remaining--;
    } else if (reason !== "土曜日" && reason !== "日曜日") {
      skipped.push({ date: new Date(d), reason });
    }
  }
  return { date: d, skipped };
}

/**
 * start〜end（両端を含む）の営業日数。options.excludeStart で開始日を数えない。
 * 日付が逆順でも、早いほうから数える
 */
export function countBusinessDays(start, end, options = {}) {
  let [from, to] = start <= end ? [start, end] : [end, start];
  from = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  if (options.excludeStart) from.setDate(from.getDate() + 1);
  let businessDays = 0;
  let calendarDays = 0;
  const holidays = [];
  for (const d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    calendarDays++;
    const reason = closedReason(d, options);
    if (reason === null) {
      businessDays++;
    } else if (reason !== "土曜日" && reason !== "日曜日") {
      holidays.push({ date: new Date(d), reason });
    }
  }
  return { businessDays, calendarDays, holidays };
}
