# iPAS AI 應用規劃師模擬考新版

這是一個可直接部署到 GitHub Pages 的純靜態網站，包含三個頁面：

- `index.html`：新版入口選單
- `exam.html`：正式考試版
- `review.html`：解答版 / 交卷後檢討頁

另外補了：

- `.nojekyll`：讓 GitHub Pages 更穩定地直接發布靜態檔案
- `NOTION_EMBED_GUIDE.md`：Notion 嵌入建議網址與配置方式

## 本機預覽

可用任何靜態伺服器預覽，例如：

```bash
cd "/Users/mac/Documents/New project/ipas-mock-exam"
python3 -m http.server 4173
```

然後打開 `http://localhost:4173`。

## GitHub Pages 發佈

1. 建立 GitHub repository。
2. 把這個專案放進 repo，或直接以 `ipas-mock-exam` 當 repo 內容。
3. 如果你使用目前工作區根目錄當 repo，已提供 GitHub Actions workflow：
   `.github/workflows/deploy-ipas-mock-exam.yml`
4. 推到 `main` 或 `master` 後會自動部署到 GitHub Pages。
5. 在 GitHub `Settings > Pages` 確認 Source 為 `GitHub Actions`。
6. 發佈成功後會拿到一個公開網址。

## Notion 嵌入

1. 先取得 GitHub Pages 網址。
2. 在 Notion 輸入 `/embed`。
3. 貼上首頁網址或解答版網址。

建議：

- 給學生使用時嵌入 `index.html` 或 `exam.html`
- 給老師講解時嵌入 `review.html?mode=answer-key`
