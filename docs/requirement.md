# GA4データ分析AIエージェント プロトタイプ要件定義書

> Claude Code向け実装仕様書 / 2026年4月版

---

## 0. プロトタイプの目的

寺本氏（ソリューションオーナー）自身のGA4アカウントを接続して**実際に分析を走らせられる状態**まで到達することがゴール。本番品質のマルチテナント対応・本格的なセキュリティ設計は次フェーズに譲り、**「GA4をつなぐ → 数分で自然言語で分析できる」**というコア体験を最短で実証する。

### 成功基準
- 寺本氏がブラウザで自身のGoogleアカウントでサインインし、GA4プロパティを選択し、5〜10分以内に分析画面に到達できる
- 自然言語で「先月のランディングページ別セッション数トップ10は？」と聞くと、正しいSQLが生成され、結果と簡潔な示唆が返ってくる
- BQ Export未設定の場合も、ガイドに従って設定完了まで進める（または即時にData APIフォールバック分析が使える）

### スコープ外（フェーズ2以降）
- マルチテナント・組織管理
- dbt-ga4モデリング層の自動デプロイ
- Cube.jsセマンティックレイヤー
- スライド自動生成
- Workload Identity Federation、VPC Service Controls
- 監査ログ基盤
- 改善提案・施策レコメンドの高度化
- Stripe課金・プラン管理

---

## 1. 技術スタック

| レイヤー | 採用技術 | 理由 |
|---------|---------|------|
| フロント | Next.js 14 (App Router) + TypeScript | 寺本氏の既存スタック（LAIV）と統一 |
| UI | Tailwind CSS + shadcn/ui | 高速な UI 構築、オンボーディングのステップUIに必要なコンポーネントが揃う |
| 認証 | NextAuth.js (Google Provider) | OAuth 2.0 をシンプルに扱える |
| 状態管理 | Zustand または React Context | 認証状態とオンボーディング進捗を保持 |
| GA4連携 | `googleapis` (Admin API v1) | GA4プロパティ一覧・BQリンク状態取得 |
| BQ連携 | `@google-cloud/bigquery` | OAuthトークンをそのまま渡してクエリ実行 |
| LLM | Anthropic SDK (Claude Sonnet 4.6) | Text-to-SQL と示唆生成 |
| 可視化 | Recharts | 数値・時系列のシンプルなグラフで十分 |
| デプロイ | Vercel | 寺本氏の既存環境 |
| データストア | Vercel KV (Redis) または Postgres (Supabase) | 最小限のセッション情報・スキーマキャッシュのみ |

### 認証方式の選択：**OAuth 2.0 を採用**

プロトタイプではサービスアカウント方式を使わず、**ユーザーのGoogleアカウントのOAuthトークンで直接BQとGA Admin APIを叩く**方式を採用する。

- メリット: 寺本氏が「サービスアカウントのメアドをコピペしてIAMに追加する」などの作業が不要。**サインイン一発でテスト可能**
- デメリット: Google OAuth consent screen が「未検証アプリ」警告を出す → テストモードで寺本氏のメールアドレスをテストユーザー登録すれば回避可能
- 本番ではサービスアカウント＋Workload Identity Federationに移行（フェーズ2）

**必要なOAuthスコープ:**
```
openid
email
profile
https://www.googleapis.com/auth/analytics.readonly        # GA Admin API
https://www.googleapis.com/auth/bigquery.readonly         # BQ クエリ実行
https://www.googleapis.com/auth/cloud-platform.read-only  # GCPプロジェクト一覧取得
```

---

## 2. ユーザーフロー全体像

```
[ランディング]
    ↓ 「Googleで始める」クリック
[Google OAuth 同意画面]
    ↓ スコープ承認
[オンボーディング: Step 1/5] GCPプロジェクト選択
    ↓
[オンボーディング: Step 2/5] GA4プロパティ選択
    ↓
[オンボーディング: Step 3/5] BQ Export 状態の自動診断
    ↓ 未連携なら Step 3a へ、連携済みなら Step 4 へ
[Step 3a] BQ Export 設定ガイド（分岐）
    ↓
[オンボーディング: Step 4/5] 接続テスト（実際にクエリを1本投げる）
    ↓
[オンボーディング: Step 5/5] スキーマ取得・ドメイン知識生成
    ↓
[分析画面（メインダッシュボード）]
```

---

## 3. オンボーディング詳細設計（最重要セクション）

オンボーディングの品質がサービスの初期体験を決めるため、以下を原則とする：

**設計原則**
1. **現在地を常に明示**: 上部にステップインジケーター（1/5 → 2/5 → ...）を常時表示
2. **できないことの理由を言語化**: 「BQリンクが見つかりません」ではなく「このGA4プロパティはBigQueryにまだ接続されていません。以下の3分で完了する手順で設定できます」
3. **確認ボタンで前進**: 各ステップに「検証」ボタンを置き、実際にAPIを叩いて確認する（ユーザーの自己申告を信じない）
4. **スキップ可能な場合は明示**: BQ未設定なら「Data API経由で暫定的に分析を始める（機能制限あり）」の選択肢を提示
5. **コピペUIを用意**: サービスアカウントメール、GCPプロジェクトIDなど、ユーザーがコピーする値には1クリックコピーボタン

### Step 1/5: GCPプロジェクト選択

**画面要素**
- タイトル: 「BigQueryクエリを実行するGCPプロジェクトを選択してください」
- サブテキスト: 「クエリ課金はこのプロジェクトに対して発生します。GA4のBigQuery Exportが格納されているプロジェクトと同じでも別でも構いません」
- プロジェクト選択ドロップダウン（Cloud Resource Manager APIで一覧取得）
- 「プロジェクトがない場合」→ GCP Consoleへの遷移リンク＋戻ってきたら再取得ボタン

**バックエンド処理**
```typescript
GET https://cloudresourcemanager.googleapis.com/v1/projects
Authorization: Bearer <access_token>
```

**バリデーション**
- 選択したプロジェクトでBigQuery APIが有効化されているか確認
- 無効な場合: 「このプロジェクトでBigQuery APIを有効にする必要があります」＋有効化ページへの直リンク

### Step 2/5: GA4プロパティ選択

**画面要素**
- タイトル: 「分析するGA4プロパティを選択してください」
- 寺本氏がアクセス権を持つGA4プロパティ一覧をカード形式で表示
- 各カードに: プロパティ名 / プロパティID / データストリーム数 / 作成日

**バックエンド処理**
```typescript
// Admin API v1beta
GET https://analyticsadmin.googleapis.com/v1beta/accountSummaries
```

**選択後**
- 選択したプロパティIDをセッションに保存
- Step 3に自動遷移

### Step 3/5: BigQuery Export 状態の自動診断

**画面要素**
- タイトル: 「BigQuery Exportの接続を確認しています」
- 診断中: プログレスインジケーター＋「プロパティ `<name>` のBQリンクを確認中...」
- 結果表示:

**分岐A: 連携済み（理想パス）**
```
✅ BigQuery Exportが有効です
    プロジェクト: <project_id>
    データセット: analytics_<property_id>
    最新データ: 2026-04-15（13時間前）
    エクスポート形式: 日次 + ストリーミング
    
    [次へ進む]
```

**分岐B: 連携未設定**
```
⚠️ このプロパティはBigQueryに接続されていません
    
    以下のいずれかを選択してください:
    
    [ 推奨 ] BigQuery Exportを設定する（3〜5分）
    → 高精度な分析、サンプリングなし、過去14ヶ月を超えるデータ保持
    
    [ 暫定 ] GA4 Data API経由で今すぐ始める
    → 即時利用可、ただしサンプリングと(other)行の制約あり
```

**バックエンド処理**
```typescript
// Admin API: BigQuery Links
GET https://analyticsadmin.googleapis.com/v1beta/properties/<property_id>/bigQueryLinks
```

戻り値が空配列なら未連携、1件以上あれば連携済み。連携済みの場合、さらに実際にそのBQデータセットへのクエリ権限があるか`bigquery.datasets.get`で確認する。

### Step 3a/5: BigQuery Export 設定ガイド（未連携時のみ）

**画面構成: 4つのサブステップに分解**

```
┌─ 3a.1 GCPプロジェクトの準備 ─────────────┐
│                                            │
│ ✓ プロジェクト [my-project] を確認済み     │
│ □ BigQuery APIを有効化する                │
│   [APIコンソールで有効化]  [有効化を確認]  │
│                                            │
└────────────────────────────────────────────┘

┌─ 3a.2 GA4でBigQueryリンクを作成 ──────────┐
│                                            │
│ 以下の手順をGA4管理画面で実行してください:  │
│                                            │
│ 1. [GA4管理画面を開く →] (直リンク)        │
│ 2. 「プロダクトリンク」→「BigQueryリンク」 │
│ 3. 「リンク」をクリック                    │
│ 4. プロジェクト [my-project] を選択        │
│ 5. データロケーション: 「Tokyo (asia-northeast1)」推奨 │
│ 6. 頻度: 「日次」+「ストリーミング」両方ON推奨 │
│                                            │
│ [完了したので確認する]                     │
│                                            │
└────────────────────────────────────────────┘

┌─ 3a.3 リンクの確認 ────────────────────────┐
│                                            │
│ ⏳ リンクを検証中...                       │
│ ✅ リンクが作成されました                  │
│                                            │
└────────────────────────────────────────────┘

┌─ 3a.4 データ到着待ち ──────────────────────┐
│                                            │
│ 初回エクスポートは通常24〜48時間かかります  │
│                                            │
│ [暫定的にData APIで分析を始める]           │
│ [データ到着を待つ（メール通知）]            │
│                                            │
└────────────────────────────────────────────┘
```

**注意**: このガイドは「画像/GIF付き」にするとさらに親切。プロトタイプでは文字ベースで可、Next Imageで静的画像を後追加できる構造にしておく。

### Step 4/5: 接続テスト

**画面要素**
- タイトル: 「接続をテストしています」
- 実行する3つのチェック（順に実行、リアルタイム表示）:
  1. ✅ BigQueryへの接続確認
  2. ✅ events_テーブルの存在確認
  3. ✅ サンプルクエリの実行（直近7日のevent_count）

**バックエンド処理**
```sql
-- テストクエリ
SELECT
  COUNT(*) AS event_count,
  MIN(event_date) AS oldest_date,
  MAX(event_date) AS latest_date
FROM `<project>.<dataset>.events_*`
WHERE _TABLE_SUFFIX BETWEEN
  FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
  AND FORMAT_DATE('%Y%m%d', CURRENT_DATE())
LIMIT 1
```

**表示結果**
```
✅ 接続成功
   過去7日間のイベント数: 1,234,567
   データ期間: 2026-04-09 〜 2026-04-15
   
   スキャンサイズ: 42.3 MB ($0.0003相当)
```

### Step 5/5: スキーマ取得・ドメイン知識生成

**画面要素**
- タイトル: 「プロパティの構造を学習しています」
- 進捗表示:
  - ✅ events_テーブルのスキーマを取得
  - ✅ カスタムディメンション・メトリクスを検出（Admin APIから）
  - ✅ event_paramsの実在キーを検出（サンプルクエリで）
  - ✅ user_propertiesの実在キーを検出
  - ✅ カスタムチャネルグルーピングを確認

**バックエンド処理**
```sql
-- event_paramsの実在キー検出（サンプリングでコスト抑制）
SELECT DISTINCT key
FROM `<project>.<dataset>.events_*`, UNNEST(event_params) AS p
WHERE _TABLE_SUFFIX = FORMAT_DATE('%Y%m%d', DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY))
```

**最後**
```
🎉 セットアップ完了！
   プロパティ: <property_name>
   検出したカスタムディメンション: 12個
   検出したイベントパラメータ: 87個
   
   [分析を始める →]
```

---

## 4. 分析エージェント機能（MVP）

### 4.1 UI構成

ChatGPT風のシンプルなチャットUI。左ペインに会話履歴、右メインにチャット領域。

**メッセージタイプ**
- ユーザー発言（テキスト）
- アシスタント応答（テキスト＋ツール実行結果の展開可能カード）
- ツール実行カード: `SQL生成` / `Dry Run` / `実行` / `グラフ生成` の各段階が折りたたまれている

### 4.2 エージェントのツール定義

Anthropic APIのTool Use機能で以下のツールを実装:

```typescript
tools = [
  {
    name: "generate_sql",
    description: "ユーザーの質問からBigQuery用のSQLを生成する。GA4のBQ Exportスキーマに準拠",
    input_schema: { question: "string", context: "string?" }
  },
  {
    name: "dry_run_sql",
    description: "SQLをDry Runして構文確認＋推定スキャンバイト数を取得。実行前に必ず呼ぶ",
    input_schema: { sql: "string" }
  },
  {
    name: "execute_sql",
    description: "SQLを実行。maximum_bytes_billedで上限制御。推定10GB超は事前承認が必要",
    input_schema: { sql: "string", max_bytes_billed: "number" }
  },
  {
    name: "visualize",
    description: "クエリ結果をチャート化。chart_type: 'bar' | 'line' | 'table' | 'number'",
    input_schema: { data: "object[]", chart_type: "string", x_field: "string?", y_field: "string?" }
  },
  {
    name: "generate_insight",
    description: "クエリ結果から簡潔な示唆を生成する（3〜5文）",
    input_schema: { question: "string", data: "object[]", context: "string?" }
  }
]
```

### 4.3 プロンプト設計（システムプロンプト）

```
あなたはGA4データ分析の専門家エージェントです。ユーザーの自然言語の質問を
BigQueryのSQLに変換し、実行し、結果を解釈して示唆を返します。

【接続情報】
- プロジェクト: {project_id}
- データセット: {dataset_id}
- プロパティ名: {property_name}
- 利用可能な日付範囲: {min_date} 〜 {max_date}

【重要なGA4 BigQuery Exportスキーマ知識】
1. テーブルは events_YYYYMMDD 形式の日別シャード。
   ワイルドカード + _TABLE_SUFFIX で複数日クエリする。必ずWHERE句で日付範囲を絞ること。
   
2. event_params は REPEATED RECORD。
   UNNEST(event_params) で展開し、keyでフィルタ、value.string_value / int_value / 
   float_value / double_value で取得。
   
3. 主要メトリクス定義:
   - セッション数: COUNT(DISTINCT CONCAT(user_pseudo_id, CAST((SELECT value.int_value 
     FROM UNNEST(event_params) WHERE key = 'ga_session_id') AS STRING)))
   - アクティブユーザー数: COUNT(DISTINCT user_pseudo_id) WHERE is_active_user = TRUE
     ※ is_active_userが無い場合、user_engagementイベント発火ユーザー
   - エンゲージメントセッション: session_engaged = '1'（注: 文字列型）
   - コンバージョン: event_name IN (<設定済みコンバージョンイベント>)

4. トラフィックソースは3種類あるので要注意:
   - traffic_source.*: ユーザー初回獲得時のみ（以後不変）
   - collected_traffic_source.*: イベントごとの生データ
   - session_traffic_source_last_click.*: セッション単位のラストクリック（GA4 UIに最も近い）
   → 「流入元」を聞かれたら session_traffic_source_last_click を使う

5. ページURLは event_params の 'page_location' キー。
   パスだけなら 'page_path' キー、または REGEXP_EXTRACT で抽出。

【スキャンコスト管理】
- execute_sql の前に必ず dry_run_sql を実行
- 推定10GB超の場合は、ユーザーに確認する
- SELECT * は絶対に使わない
- WHERE _TABLE_SUFFIX での日付絞り込みを必須とする

【カスタム定義】
{custom_dimensions_and_metrics_json}

【イベントパラメータ実在キー】
{detected_event_param_keys_json}

【応答スタイル】
- 簡潔に。示唆は3〜5文。
- 数値は必ず表・グラフで可視化する。
- SQLは折りたたみで表示（ユーザーが確認できるが、主役ではない）。
```

### 4.4 サンプル分析シナリオ（プロトタイプの動作確認用）

寺本氏が試してほしい質問例をダッシュボードのサジェストとして表示:

1. 「先月のランディングページ別セッション数トップ10を見せて」
2. 「直近30日のデイリーアクティブユーザー数の推移は？」
3. 「モバイルとデスクトップで直帰率はどう違う？」
4. 「流入元チャネル別のコンバージョン率を比較して」
5. 「先週と今週で最もアクセスが増えたページは？」

---

## 5. システムアーキテクチャ（プロトタイプ版）

```
┌─────────────────────────────────────────────┐
│         ブラウザ (Next.js クライアント)      │
└─────────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────────┐
│  Next.js API Routes (Vercel Serverless)     │
│                                              │
│  /api/auth/*          → NextAuth.js          │
│  /api/ga/properties   → GA Admin API         │
│  /api/ga/bq-link      → BQリンク診断         │
│  /api/bq/test         → 接続テスト           │
│  /api/bq/schema       → スキーマ取得         │
│  /api/chat            → Claude API + ツール  │
│  /api/bq/query        → BQクエリ実行         │
└─────────────────────────────────────────────┘
       ↓                   ↓                ↓
┌─────────────┐    ┌──────────────┐   ┌────────────┐
│  Google     │    │  BigQuery    │   │ Anthropic  │
│  Admin API  │    │  (クライアント)│   │  Claude    │
└─────────────┘    └──────────────┘   └────────────┘
                          ↑
                   ┌─────────────┐
                   │  Vercel KV  │
                   │ (スキーマ    │
                   │  キャッシュ) │
                   └─────────────┘
```

### データフロー（チャット1往復）
1. ブラウザ → `/api/chat` へユーザー発言を送信
2. サーバーは会話履歴 + システムプロンプト + ツール定義をClaudeに送信
3. ClaudeがTool Useでツールを要求 → サーバー側で実行:
   - `dry_run_sql` → BQ Dry Run（課金なし）
   - `execute_sql` → BQ実行
4. ツール結果をClaudeに返す → 示唆生成 → クライアントへストリーミング応答
5. クライアントはツールの実行ログを折りたたみカードで表示

---

## 6. 安全制御・コスト管理

### BQクエリの保護
```typescript
const options = {
  query: sql,
  maximumBytesBilled: '10737418240',  // 10 GB のハード上限
  dryRun: false,
  useQueryCache: true,
};
```

### Dry Run 必須化
- LLMが`execute_sql`を呼ぶ前に、必ず`dry_run_sql`を呼ぶようプロンプトで縛る
- Dry Run結果で`totalBytesProcessed > 10GB`なら、ユーザーに確認を求める応答を生成

### LLMコスト
- Prompt Cachingを有効化（システムプロンプトのドメイン知識部分をキャッシュ）
- Claude Sonnet 4.6を主に使用、単純確認系はHaiku 4.5にルーティング（任意）

### スキーマキャッシュ
- `event_params`のDISTINCTキー検出は1プロパティあたり1日1回まで（Vercel KVにTTL24hで保存）
- カスタムディメンションはGA4管理画面での変更時のみ再取得（「再スキャン」ボタンで手動発火）

---

## 7. データモデル（最小限）

Vercel KV または Supabase Postgres。プロトタイプでは KV で十分。

```typescript
// キー: user:{email}
type UserSession = {
  email: string;
  selected_project_id: string;
  selected_property_id: string;
  selected_dataset: string;  // analytics_XXXXXX
  bq_link_status: 'linked' | 'not_linked' | 'fallback_api';
  onboarding_completed: boolean;
};

// キー: schema:{property_id}
type PropertySchema = {
  property_id: string;
  custom_dimensions: Array<{ name: string; scope: string; parameter_name: string }>;
  custom_metrics: Array<{ name: string; measurement_unit: string }>;
  detected_event_params: string[];  // UNNEST検出済み実在キー
  detected_user_properties: string[];
  last_scanned_at: string;
};

// キー: chat:{user_id}:{chat_id}
type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  tool_calls?: Array<{ name: string; input: object; output: object }>;
  created_at: string;
};
```

---

## 8. フェーズ分け実装計画

### フェーズ1-A: 基盤（1〜2日）
- Next.jsプロジェクト初期化
- NextAuth.js + Google Provider 設定
- Google Cloud Console でOAuth Client IDを作成（寺本氏が実施）
- テストユーザーに寺本氏のメールアドレスを登録

### フェーズ1-B: オンボーディング（2〜3日）
- Step 1〜5 の画面実装
- GA Admin API / Cloud Resource Manager API / BQ APIの呼び出し実装
- BQ Export未設定時の設定ガイドUI（文字ベース）

### フェーズ1-C: 分析エンジン（2〜3日）
- Claude API Tool Use 統合
- システムプロンプト構築（スキーマ自動注入）
- SQLジェネレーター → Dry Run → 実行 → 可視化の一気通貫
- 5つのサンプル質問で動作確認

### フェーズ1-D: 磨き込み（1〜2日）
- エラーハンドリング
- ローディング状態
- 寺本氏の実データでのテスト＆調整

**合計: 7〜10営業日でMVP完成**

---

## 9. テスト手順（寺本氏のGAアカウント接続時）

1. **事前準備（寺本氏）**
   - GCPプロジェクトでBigQuery APIが有効化されていることを確認
   - 分析対象のGA4プロパティでBigQuery Exportが有効化されていることを確認（未設定なら設定）
   - 初回エクスポートから24時間以上経過していることを確認

2. **OAuth設定（実装者）**
   - GCP Console → APIs & Services → OAuth consent screen
   - User Type: External / Publishing status: Testing
   - Test users に寺本氏のGoogleアカウントを追加
   - Scopes に上述の5つを追加

3. **接続テスト**
   - プロトタイプのURLにアクセス
   - 「Googleで始める」でサインイン
   - Step 1〜5を順に進める
   - 各ステップで想定通り動作するか確認

4. **分析テスト**
   - サンプル質問5つを順に実行
   - SQL生成の精度、実行の成功率、示唆の妥当性を評価
   - エッジケース: カスタムディメンションを使った質問、複雑なファネル分析など

5. **フィードバック収集ポイント**
   - オンボーディングで詰まった箇所
   - 期待と違うSQLが生成された質問
   - 示唆の粒度・有用性
   - 可視化の選択の妥当性

---

## 10. 環境変数

```bash
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=

# Anthropic
ANTHROPIC_API_KEY=

# Vercel KV
KV_URL=
KV_REST_API_URL=
KV_REST_API_TOKEN=
KV_REST_API_READ_ONLY_TOKEN=
```

---

## 11. 次フェーズへの引き継ぎ事項

本プロトタイプで意図的に省略しているが、商用化時に対応必須な項目:

1. **OAuth App Verification**: Googleの審査を通過しないと「未検証アプリ」警告のまま
2. **サービスアカウント移行**: 複数クライアントを扱うならOAuthよりサービスアカウントが管理しやすい
3. **dbt-ga4 自動デプロイ**: Text-to-SQL精度を64.5%→90%に引き上げるため必須
4. **Cube.js導入**: 決定論的SQL生成で精度98%＋プリアグリゲーションでコスト削減
5. **データアイソレーション**: Analytics Hub によるゼロコピー共有への移行
6. **監査ログ**: BQ Audit Logs + Cloud Logging Sink
7. **スライド生成**: python-pptx または Google Slides API
8. **課金システム**: Stripe連携、プラン別のクエリ上限管理
9. **改善提案エージェント**: 単なる示唆から「具体的なA/Bテスト案」「施策リコメンド」への進化