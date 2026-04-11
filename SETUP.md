# Invisible Workflow Agent — 後端設定指南

## 問題說明
「沒有寫後端」的原因：**Vercel 上缺少 `DATABASE_URL` 環境變數**，導致 Prisma 無法連接資料庫，所有 API  calls 都會失敗。

---

## Step 1：建立 PostgreSQL 資料庫（免費選項）

### 選項 A：Neon（推薦，免費額度最優）
1. 前往 https://neon.tech 免費註冊
2. 建立新 Project，選擇 PostgreSQL
3. 在 Dashboard 複製 Connection String，格式如：
   ```
   postgresql://user:password@ep-xxx-xxx-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. 複製該字串，作為下方 `DATABASE_URL` 的值

### 選項 B：Vercel Postgres
1. 在 Vercel Dashboard → 你的專案 → Storage → Create Postgres Database
2. 跟隨指示建立資料庫
3. 連線字串會自動作為 `DATABASE_URL` 可用

### 選項 C：Supabase（免費）
1. 前往 https://supabase.com 免費註冊
2. 建立新 Project
3. 在 Settings → Connection String 複製 PostgreSQL 連線字串

---

## Step 2：在 Vercel 設定環境變數

1. 前往 https://vercel.com/dashboard
2. 選擇 `invisible-workflow-agent-2` 專案
3. 點 Settings → Environment Variables
4. 新增以下變數：

| 變數名 | 值（範例） | 說明 |
|--------|-----------|------|
| `DATABASE_URL` | `postgresql://...`（上一步的字串） | **必要**，否則後端無法運作 |
| `NEXTAUTH_URL` | `https://invisible-workflow.vercel.app` | 生產環境網址 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` 產生 | Auth 加密用 |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxx` | Google OAuth |
| `GITHUB_CLIENT_ID` | `Iv1.xxx` | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | `xxx` | GitHub OAuth |
| `NOTION_CLIENT_ID` | `xxx` | Notion OAuth |
| `NOTION_CLIENT_SECRET` | `xxx` | Notion OAuth |
| `SLACK_CLIENT_ID` | `xxx` | Slack OAuth |
| `SLACK_CLIENT_SECRET` | `xxx` | Slack OAuth |
| `TRELLO_API_KEY` | `xxx` | Trello API |
| `NEXT_PUBLIC_APP_URL` | `https://invisible-workflow.vercel.app` | OAuth callback 用 |

---

## Step 3：設定 OAuth 應用程式

### Google OAuth
1. 前往 https://console.cloud.google.com
2. 建立新專案 → APIs & Services → OAuth consent screen
3. 設定Scopes：`gmail.readonly`, `gmail.send`, `calendar.readonly`, `calendar.events`
4. 建立 OAuth 2.0 Client ID，設定 Authorized redirect URI：
   ```
   https://invisible-workflow.vercel.app/api/auth/callback/google
   ```

### GitHub OAuth
1. 前往 https://github.com/settings/applications/new
2. 設定 Homepage URL：`https://invisible-workflow.vercel.app`
3. 設定 Authorization callback URL：
   ```
   https://invisible-workflow.vercel.app/api/auth/callback/github
   ```

---

## Step 4：執行資料庫遷移

在 Vercel 設定完 `DATABASE_URL` 並Redeploy 後，系統會自動：
1. 執行 `prisma generate`（建置時）
2. 執行 `prisma migrate deploy`（透過 vercel-build script）

---

## Step 5：Redeploy

1. 在 Vercel Dashboard → Deployments
2. 點擊最新 deployment 右側的 ⋮ 選單
3. 選擇 Redeploy（或 push 新 commit 觸發自動部署）

---

## 驗證後端是否正常

部署完成後，訪問：
```
https://invisible-workflow.vercel.app/api/dashboard/stats
```

正常情況應返回 JSON（需要先登入）：
```json
{
  "activeRules": 0,
  "connectedTools": 0,
  "totalTools": 6,
  "successRate": 100,
  ...
}
```

若返回 500 錯誤，檢查 Vercel 環境變數是否正確設定 `DATABASE_URL`。
