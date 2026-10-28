// ライト／ダークの切り替え。選んだモードは localStorage に保存し、
// 未選択なら端末の設定（prefers-color-scheme）に従う。
// 画面が一瞬ちがう色で出ないよう、head で同期的に読み込む。
(() => {
  const KEY = "theme";
  const root = document.documentElement;
  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };
  const saved = read();
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;

  const current = () => root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  const syncMeta = () => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = current() === "dark" ? "#0b1020" : "#2563eb";
  };

  document.addEventListener("DOMContentLoaded", () => {
    syncMeta();
    for (const button of document.querySelectorAll(".theme-toggle")) {
      button.addEventListener("click", () => {
        const next = current() === "dark" ? "light" : "dark";
        root.dataset.theme = next;
        try {
          localStorage.setItem(KEY, next);
        } catch {
          // 保存できない環境でも、このページの間は切り替わる
        }
        syncMeta();
      });
    }
  });
})();
