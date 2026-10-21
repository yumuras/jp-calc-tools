// 有給休暇の付与日数（労働基準法39条）。画面とテストの両方から使う。

// 継続勤務年数 0.5, 1.5, 2.5, 3.5, 4.5, 5.5, 6.5年以上 ごとの付与日数
export const GRANT_TABLE = {
  full: [10, 11, 12, 14, 16, 18, 20], // 週5日以上、または週30時間以上
  w4: [7, 8, 9, 10, 12, 13, 15],
  w3: [5, 6, 6, 8, 9, 10, 11],
  w2: [3, 4, 4, 5, 6, 6, 7],
  w1: [1, 2, 2, 2, 3, 3, 3],
};

export const WORK_TYPES = {
  full: "週5日以上、または週30時間以上",
  w4: "週4日（年169〜216日）",
  w3: "週3日（年121〜168日）",
  w2: "週2日（年73〜120日）",
  w1: "週1日（年48〜72日）",
};

function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * 入社日から n か月「経過した日」。応当日がない月（8/31 の6か月後など）は翌月1日。
 * 例: 4/1 → 10/1、8/31 → 3/1
 */
export function addMonthsElapsed(date, months) {
  const total = date.getMonth() + months;
  const year = date.getFullYear() + Math.floor(total / 12);
  const month = ((total % 12) + 12) % 12;
  if (date.getDate() > daysInMonth(year, month)) {
    return new Date(year, month + 1, 1);
  }
  return new Date(year, month, date.getDate());
}

/** 付与予定の一覧（入社6か月後から maxGrants 回分）。 */
export function grantSchedule(hireDate, workType, maxGrants = 10) {
  const table = GRANT_TABLE[workType];
  if (!table) throw new Error(`unknown work type: ${workType}`);
  const rows = [];
  for (let i = 0; i < maxGrants; i++) {
    rows.push({
      date: addMonthsElapsed(hireDate, 6 + 12 * i),
      yearsOfService: 0.5 + i,
      days: table[Math.min(i, table.length - 1)],
    });
  }
  return rows;
}

/**
 * 基準日時点の状況。
 * - lastGrant / nextGrant: 直近の付与と次回の付与
 * - maxBalance: 一度も使っていない場合の最大保有日数（時効2年なので直近2回分の合計）
 * - fiveDayDuty: 直近の付与が10日以上なら、付与日から1年以内に5日取得させる義務がある
 */
export function statusOn(hireDate, workType, asOf) {
  const schedule = grantSchedule(hireDate, workType, 60);
  const past = schedule.filter((r) => r.date <= asOf);
  const lastGrant = past.at(-1) ?? null;
  const prevGrant = past.at(-2) ?? null;
  const nextGrant = schedule.find((r) => r.date > asOf) ?? null;
  return {
    lastGrant,
    nextGrant,
    maxBalance: (lastGrant?.days ?? 0) + (prevGrant?.days ?? 0),
    fiveDayDuty: lastGrant !== null && lastGrant.days >= 10,
    fiveDayDeadline: lastGrant ? addMonthsElapsed(lastGrant.date, 12) : null,
  };
}

/** 'YYYY-MM-DD' をローカル日付に（タイムゾーンでずれないように自前で読む）。 */
export function parseDate(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
}

export function formatDate(d) {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}
