# Invisible Workflow Agent — 規格計劃書 v1.1

## 1. 專案目標

打造 AI 驅動的無代碼工作流自動化平台，讓使用者能透過自然語言建立規則，自動串接多种工具（Gmail、Google Calendar、Slack、Notion、Trello、GitHub）。

## 2. 目標受眾

- 獨立開發者與小型團隊
- 需要自動化重複性任務的專業人士
- Product Owner 直接用自然語言管理功能需求

## 3. 核心功能

### 3.1 工具串接（OAuth）

支援以下工具的 OAuth 連接：
- **Gmail** — 讀取/發送郵件
- **Google Calendar** — 讀取/建立行事曆事件
- **Slack** — 發送訊息到頻道
- **Notion** — 讀取/更新頁面
- **Trello** — 建立/移動卡片
- **GitHub** — 建立 Issue、PR、評論

### 3.2 規則引擎

- 自然語言建立規則（Trigger → Condition → Action）
- Trigger 類型：Meeting ended、Email received、Scheduled (Cron)、GitHub PR、Notion updated、Trello card moved
- Action：發送郵件、發送 Slack 訊息、建立 Notion 頁面、建立 Trello 卡片、建立 GitHub Issue
- 規則啟用/停用切換
- 規則執行統計（成功/失敗）

### 3.3 工作流執行（Temporal）

- 使用 Temporal workflow engine 確保工作流可靠執行
- 支援延遲執行（Cron trigger）
- 執行日誌完整記錄

## 4. 技術架構

### 4.1 前端
- Next.js 16 + TailwindCSS + TypeScript
- 組件：Dashboard、ToolsPanel、RulesPanel、LogsPanel、AddRuleModal

### 4.2 後端 API（11 Endpoints）
| Method | Endpoint | 說明 |
|--------|----------|------|
| POST | `/api/auth/[...nextauth]` | NextAuth.js 認證 |
| GET | `/api/tools` | 取得工具列表與連接狀態 |
| GET | `/api/tools/[toolId]/status` | 檢查特定工具連接狀態 |
| POST | `/api/tools/[toolId]/connect` | 初始化 OAuth 流程 |
| GET | `/api/tools/[toolId]/callback` | OAuth callback |
| POST | `/api/tools/[toolId]/disconnect` | 中斷工具連接 |
| GET/POST | `/api/rules` | 取得/建立規則 |
| GET/PUT/DELETE | `/api/rules/[ruleId]` | 單一規則 CRUD |
| POST | `/api/rules/[ruleId]/toggle` | 啟用/停用規則 |
| GET | `/api/executions` | 取得執行日誌 |
| POST | `/api/executions/[executionId]/retry` | 重試失敗的執行 |
| GET | `/api/dashboard/stats` | 儀表板統計 |

### 4.3 資料庫（4 PostgreSQL Tables via Prisma）

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  toolConnections ToolConnection[]
  rules         Rule[]
  executions    Execution[]
}

model ToolConnection {
  id           String   @id @default(cuid())
  userId       String
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  toolId       String   // 'gmail' | 'google-calendar' | 'slack' | 'notion' | 'trello' | 'github'
  accessToken  String?
  refreshToken String?
  expiresAt    DateTime?
  accountId    String?
  accountName  String?
  connected    Boolean  @default(false)
  connectedAt  DateTime?
  lastSyncAt   DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  @@unique([userId, toolId])
}

model Rule {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String
  trigger     String   // 'meeting_ended' | 'email_received' | 'scheduled' | 'github_pr' | 'notion_updated' | 'trello_card_moved'
  condition   String   // JSON condition
  action      String   // JSON action
  schedule    String?  // cron expression
  enabled     Boolean  @default(true)
  lastRunAt   DateTime?
  runCount    Int      @default(0)
  successCount Int     @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  executions  Execution[]
}

model Execution {
  id          String   @id @default(cuid())
  ruleId      String
  rule        Rule     @relation(fields: [ruleId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status      String   // 'success' | 'failed' | 'running'
  details     String?
  startedAt   DateTime @default(now())
  completedAt DateTime?
  workflowId  String?  // Temporal workflow ID
  @@index([ruleId])
  @@index([userId])
}
```

### 4.4 Temporal Workflows

**Workflow: `automation-workflow`**
- 接收 ruleId 和 trigger event
- 執行 condition 檢查
- 執行 action（呼叫對應 tool API）
- 記錄 execution 結果

**Workflow: `scheduled-workflow`**
- Cron 觸發
- 查詢所有符合條件的 rules
- 並行執行 automation-workflow

### 4.5 OAuth 配置

各工具 OAuth endpoint：
- Google（Gmail + Calendar）：`https://oauth.googleusercontent.com`
- Slack：`https://slack.com/oauth/v2`
- Notion：`https://api.notion.com`
- Trello：`https://trello.com`
- GitHub：`https://github.com/login/oauth`

## 5. 驗收清單

- [x] OAuth 工具連接流程完成
- [x] 規則 CRUD API 完整
- [x] 執行日誌 API 完整
- [x] 儀表板統計 API
- [x] Temporal workflow 定義
- [x] 前端與後端 API 整合
- [x] Vercel 部署成功
