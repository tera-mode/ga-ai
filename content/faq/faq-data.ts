export type FaqCategory =
  | 'getting-started'
  | 'connection-choice'
  | 'bq-setup'
  | 'permissions'
  | 'cost'
  | 'data-limits'
  | 'troubleshooting';

export type OnboardingStep =
  | 'landing'
  | 'step1-project'
  | 'step2-property'
  | 'step3-bq-diagnosis'
  | 'step3a-bq-setup'
  | 'step4-test'
  | 'step5-schema'
  | 'analysis';

export type FaqItem = {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
  relevantSteps: OnboardingStep[];
  priority: number;
  tags?: string[];
};

export const FAQS: FaqItem[] = [
  // ── getting-started ──────────────────────────────────────────────────────
  {
    id: 'what-is-this-service',
    category: 'getting-started',
    question: 'このサービスでは何ができますか？',
    answer: `GA4のデータに対して、**自然言語で質問するだけでAIが分析してくれる**サービスです。

**できること**
- 「先月のランディングページ別セッション数トップ10は？」→ 集計・グラフ化
- 「コンバージョン率が高いチャネルは？」→ ランキングと示唆
- 「離脱率が急に上がったページを見つけて」→ 異常検知

SQLが書けなくても、GA4の使い方に詳しくなくても、豊富なGA4データを活用できます。`,
    relevantSteps: ['landing'],
    priority: 1,
    tags: ['概要', 'サービス', 'できること'],
  },
  {
    id: 'prerequisites',
    category: 'getting-started',
    question: '使うために必要なものは？',
    answer: `**最小構成**（Data API方式で始める場合）
- GA4プロパティへの閲覧権限

**推奨構成**（BigQuery Export方式で始める場合）
- GA4プロパティへの編集権限
- GCPプロジェクト（なければ無料で作成可）
- GCPプロジェクトのオーナー権限

どちらの場合も、**サインイン時のGoogleアカウント**でこれらにアクセスできる必要があります。`,
    relevantSteps: ['landing'],
    priority: 2,
    tags: ['必要なもの', '権限', '前提条件'],
  },

  // ── connection-choice ─────────────────────────────────────────────────────
  {
    id: 'bq-vs-api-which',
    category: 'connection-choice',
    question: 'BigQuery Export と GA4 Data API、どちらを選べばよいですか？',
    answer: `本格的に分析を活用したい方には **BigQuery Export** を強く推奨します。
費用を抑えてまず試したい方は **Data API** で始められます（後からBQに切り替えも可能です）。

**BigQuery Export が向いている方**
- AIエージェントの能力をフルに使いたい
- ページURL別・ユーザー単位など、深い分析をしたい
- 広告データやCRMとの連携も視野に入れている
- 月額$20〜$200程度のGCP費用が許容できる

**Data API が向いている方**
- まず使用感を確かめたい
- 追加費用なしで始めたい
- GCPの設定に時間をかけたくない
- 基本的なレポート確認が主な用途

迷ったら Data API で始めて、気に入ったら BigQuery Export へ移行するのが無難です。`,
    relevantSteps: ['landing', 'step3-bq-diagnosis'],
    priority: 1,
    tags: ['BigQuery', 'Data API', '選び方', '接続方式'],
  },
  {
    id: 'switch-to-bq-later',
    category: 'connection-choice',
    question: '後から BigQuery Export に切り替えることはできますか？',
    answer: `はい、いつでも切り替え可能です。

Data APIで始めた場合でも、設定画面から「BigQuery Exportに切り替える」を選べば
セットアップガイドが再度表示されます。ただし、BigQuery Exportの性質上、
**リンク作成時点より前のデータは遡って取得できません**。早めに設定しておくほど、
長期データでの分析が可能になります。`,
    relevantSteps: ['step3-bq-diagnosis'],
    priority: 2,
    tags: ['切り替え', 'BigQuery', 'Data API'],
  },
  {
    id: 'data-difference',
    category: 'connection-choice',
    question: '2つの方式のデータは同じものですか？',
    answer: `いいえ、質が異なります。

**BigQuery Export**: イベント単位の生データ。1ユーザーの1クリック、1ページビューまで
すべて個別に記録されています。そのため自由なSQLで、GA4の画面にはないカスタム分析が可能です。

**Data API**: 集計済みのレポートデータ。「ページAは1,234セッション」のような形で返されます。
GA4管理画面で見ているのと同じ種類のデータです。

AIエージェントの分析精度・深さはBigQuery Exportの方が圧倒的に高くなります。`,
    relevantSteps: ['step3-bq-diagnosis'],
    priority: 3,
    tags: ['データ品質', 'BigQuery', 'Data API', '違い'],
  },

  // ── cost ──────────────────────────────────────────────────────────────────
  {
    id: 'bq-cost-estimate',
    category: 'cost',
    question: 'BigQuery Export を選ぶと、いくらかかりますか？',
    answer: `お客様のサイト規模によって異なりますが、中規模サイトで**月額$20〜$200程度**が目安です。

| サイト規模 | 月間ストレージ | 月間クエリコスト | 合計目安 |
|---|---|---|---|
| 月間500万PV | $5〜15 | $10〜30 | **$20〜50** |
| 月間2000万PV | $15〜40 | $20〜80 | **$40〜120** |
| 月間5000万PV | $30〜80 | $30〜150 | **$50〜200** |

**費用の内訳**
- ストレージ: $0.02/GB/月
- クエリ: $6.25/TiB（**各月1TiBまでは無料**）

費用はお客様のGCPプロジェクトに直接請求されます（弊社経由ではありません）。
GCPコンソールで予算アラートを設定しておくと安心です。`,
    relevantSteps: ['step3-bq-diagnosis', 'step3a-bq-setup'],
    priority: 1,
    tags: ['費用', 'コスト', 'BigQuery', '料金'],
  },
  {
    id: 'api-cost',
    category: 'cost',
    question: 'GA4 Data API の利用に費用はかかりますか？',
    answer: `APIコール自体は**完全無料**です。

ただし、Googleが定めるクォータ制限があり、大量のリクエストを短時間に送ると
一時的に制限がかかる場合があります。通常の利用で制限に到達することはほぼありません。`,
    relevantSteps: ['step3-bq-diagnosis'],
    priority: 2,
    tags: ['費用', 'Data API', '無料', 'クォータ'],
  },
  {
    id: 'bq-cost-optimization',
    category: 'cost',
    question: 'BigQuery Export の費用を抑えるコツはありますか？',
    answer: `以下を設定しておくと、想定外の高額請求を防げます。

1. **予算アラート**: GCPコンソール → お支払い → 予算とアラート で、
   月額上限（例: $100）を超えそうになったらメール通知を設定
2. **クエリコスト上限**: 本サービス側で1クエリあたりの上限を10GB（約$0.06）に
   設定済みのため、暴走クエリは自動停止します
3. **ストリーミングエクスポートの要否を検討**: リアルタイム性が不要なら
   「日次のみ」にすることで $0.05/GB の追加費用を節約できます`,
    relevantSteps: ['step3a-bq-setup'],
    priority: 3,
    tags: ['費用', 'コスト削減', '予算アラート', 'BigQuery'],
  },
  {
    id: 'ga4-360-required',
    category: 'cost',
    question: 'GA4 360 が必要になるのはどんなときですか？',
    answer: `標準版GA4では、BigQuery Exportに**日次100万イベント**の上限があります。
超過するとデータの欠落が発生します。

一般的な目安として、**月間100万PV以上のサイト**では上限に達する可能性があります。
イベント数（PVだけでなくクリック・スクロール等も含む）で判定されるため、
トラッキング設定によってはより早く上限に達する場合もあります。

GA4 360（年額約1,500万円）では日次200億イベントまで対応可能です。
お客様のサイト規模が該当する場合、接続時に警告を表示します。`,
    relevantSteps: ['step3-bq-diagnosis', 'step3a-bq-setup'],
    priority: 4,
    tags: ['GA4 360', 'イベント上限', '大規模サイト'],
  },

  // ── permissions ───────────────────────────────────────────────────────────
  {
    id: 'data-residency',
    category: 'permissions',
    question: 'このサービスは私のデータをコピーして保存しますか？',
    answer: `**いいえ、データは一切コピー・保存しません。**

- BigQuery Export方式: データはお客様のGCPプロジェクトに留まります。
  本サービスは「読み取り専用」の権限でクエリを実行するのみです
- Data API方式: データはGA4内から出ません

本サービス側で保持するのは、会話履歴と、スキーマ情報（カラム名など）の
キャッシュのみです。実際のアクセスログや個別ユーザーデータは保存しません。`,
    relevantSteps: ['landing', 'step3-bq-diagnosis', 'step3a-bq-setup'],
    priority: 1,
    tags: ['データ保存', 'プライバシー', 'セキュリティ', 'read-only'],
  },
  {
    id: 'audit-log',
    category: 'permissions',
    question: '本サービスがどんなクエリを実行したか、確認できますか？',
    answer: `はい、完全に追跡可能です。

**BigQuery Export方式**
すべてのクエリはお客様のGCP「Cloud Audit Logs」に記録されます。
「誰が・いつ・どんなSQLを・どれだけのデータをスキャンしたか」を後から確認できます。

**Data API方式**
GA4管理画面の「管理者アクセスレポート」で、本サービスからのアクセス履歴を確認できます。

本サービス画面内でも、各分析で実行されたSQLや取得データ量を
いつでも見返せるようになっています。`,
    relevantSteps: ['step3-bq-diagnosis', 'step3a-bq-setup'],
    priority: 2,
    tags: ['監査ログ', 'Cloud Audit Logs', 'セキュリティ', 'トレーサビリティ'],
  },
  {
    id: 'revoke-access',
    category: 'permissions',
    question: '権限を後から取り消すにはどうすればよいですか？',
    answer: `いつでもワンクリックで取り消せます。

**Googleアカウント側で一括取り消し**
[Googleアカウント設定](https://myaccount.google.com/permissions) →
「サードパーティアプリとサービス」→ 本サービスを選択 → 「アクセスを削除」

**個別に取り消したい場合**
- GCPのIAM設定から、本サービスのアクセス権を削除
- GA4管理画面から、本サービスのユーザーを削除

取り消し後は、本サービスからお客様のデータへは一切アクセスできなくなります。`,
    relevantSteps: ['landing', 'step3-bq-diagnosis'],
    priority: 3,
    tags: ['権限取り消し', 'アクセス削除', 'セキュリティ'],
  },
  {
    id: 'pii-risk',
    category: 'permissions',
    question: 'GA4にPII（個人情報）が入っていた場合、どうなりますか？',
    answer: `重要な注意点です。

GA4には本来、PII（メールアドレス、電話番号、氏名など）を送信してはいけない
規約になっていますが、実装ミスによりURLパラメータやカスタムイベントに
PIIが含まれてしまうケースがあります。

**BigQuery Export方式**: イベント単位の生データにアクセスするため、
もしPIIが含まれていれば、本サービスのAIエージェントからも参照可能になります。

**Data API方式**: 集計済みデータのみを扱うため、個別ユーザーのPIIが
返されるリスクは構造的に低くなります。

**推奨対応**
1. 接続前に、GA4管理画面の「データストリーム」→「タグ付けの詳細設定」で、
   IPアドレスの匿名化が有効になっていることを確認
2. 定期的にGA4の収集データをレビューし、PIIが入っていないか確認
3. 心配な場合は、まずData API方式で試用し、リスクを理解した上でBQに移行`,
    relevantSteps: ['step3-bq-diagnosis', 'step3a-bq-setup'],
    priority: 4,
    tags: ['PII', '個人情報', 'プライバシー', 'GDPR'],
  },
  {
    id: 'required-scopes',
    category: 'permissions',
    question: '接続時にどんな権限が要求されますか？',
    answer: `本サービスは以下の権限を要求します。すべて**読み取り専用**です。

| 権限 | 用途 |
|---|---|
| メールアドレスの取得 | ログイン情報として |
| GA4の閲覧 | プロパティ一覧の表示、レポート取得 |
| BigQueryの閲覧 | SQLクエリの実行（Export方式選択時のみ） |
| GCPプロジェクト一覧の閲覧 | どのプロジェクトを使うかを選ぶため |

書き込み・削除の権限は一切要求しません。データの改変はできない設計です。`,
    relevantSteps: ['landing'],
    priority: 5,
    tags: ['権限', 'スコープ', 'OAuth', 'read-only'],
  },

  // ── bq-setup ──────────────────────────────────────────────────────────────
  {
    id: 'who-sets-up-bq',
    category: 'bq-setup',
    question: 'BigQuery Export の設定は誰がすればよいですか？',
    answer: `以下の権限を持つ方が必要です。

- **GA4**: 対象プロパティの「編集者」以上の権限
- **GCP**: 対象プロジェクトの「オーナー」または「BigQuery管理者」権限

権限がない場合は、社内の管理者に依頼してください。通常は情シス部門や
マーケティング部門のGA4管理者、GCP管理者が該当します。

作業自体は画面の指示通りに進めれば5分程度で完了します。`,
    relevantSteps: ['step3a-bq-setup'],
    priority: 1,
    tags: ['設定者', '権限', 'GA4管理者', 'GCP管理者'],
  },
  {
    id: 'when-data-arrives',
    category: 'bq-setup',
    question: '設定完了後、すぐに分析を始められますか？',
    answer: `いいえ、**初回データ到着まで24〜48時間かかります**。

BigQuery Export は、リンク設定後の翌日から日次でデータがエクスポートされる仕組みです。
そのため、設定直後は BigQuery にまだデータが存在しません。

**待ち時間中にできること**
- 暫定的に Data API 方式で分析を始める（後から切り替え可）
- データ到着時にメールで通知を受け取る設定をする

ストリーミングエクスポートも有効にしておくと、一部のデータは数分で反映されますが、
日次テーブルの確定まで待つ方が安定した分析ができます。`,
    relevantSteps: ['step3a-bq-setup'],
    priority: 2,
    tags: ['データ到着', '待ち時間', '24時間', 'ストリーミング'],
  },
  {
    id: 'historical-data',
    category: 'bq-setup',
    question: '過去のデータは遡って取得できますか？',
    answer: `**BigQueryへは、リンク作成日以降のデータのみがエクスポートされます。過去データの遡及はできません。**

これは Google の仕様で、本サービスの制限ではありません。
だからこそ、**BQ Export は早めに設定しておくことを推奨**しています。

「先月の分析がしたい」という場合、リンク設定がまだなら GA4 Data API 方式で
そのデータを分析できます（GA4の標準保持期間14ヶ月内のデータが対象）。`,
    relevantSteps: ['step3-bq-diagnosis', 'step3a-bq-setup'],
    priority: 3,
    tags: ['過去データ', '遡及', '履歴', 'BigQuery'],
  },
  {
    id: 'data-location',
    category: 'bq-setup',
    question: 'データロケーションはどこを選べばよいですか？',
    answer: `日本のサイトであれば **「Tokyo (asia-northeast1)」** を推奨します。

**選択の基準**
- クエリの速度: データと処理が近いリージョンの方が高速
- 法令対応: 国内データ保管が求められる場合は国内リージョン必須
- 他のGCPサービスとの連携: 連携先と同じリージョンに揃える

**重要**: ロケーションは**後から変更できません**。迷ったらTokyoを選んでおけば無難です。`,
    relevantSteps: ['step3a-bq-setup'],
    priority: 4,
    tags: ['データロケーション', 'Tokyo', 'リージョン', 'asia-northeast1'],
  },
  {
    id: 'streaming-vs-daily',
    category: 'bq-setup',
    question: '「ストリーミング」と「日次」の違いは？',
    answer: `**日次エクスポート**
- 前日分のデータが、翌日の夕方までにまとめて到着
- 追加費用なし
- 一部フィールドが充実（アトリビューション情報など）

**ストリーミングエクスポート**
- リアルタイムに近い速度でデータが到着（数分〜数十分）
- $0.05/GB の追加費用
- 一部フィールドが欠落することがある

**推奨**: 両方を有効にしておくのが理想です。
ただし、費用を抑えたい場合は日次のみでも十分に分析可能です。
「今この瞬間」のデータが必要ない限り、日次だけで問題ありません。`,
    relevantSteps: ['step3a-bq-setup'],
    priority: 5,
    tags: ['ストリーミング', '日次', 'エクスポート', 'リアルタイム'],
  },

  // ── data-limits ───────────────────────────────────────────────────────────
  {
    id: 'data-discrepancy',
    category: 'data-limits',
    question: 'GA4画面の数値と、本サービスの分析結果が一致しません',
    answer: `これは**正常な動作**です。Google自身も「GA4のUI画面とBigQueryのデータは一致することを想定していない」と公式に述べています。

**主な差異の理由**
- GA4 UIはHyperLogLog++という近似アルゴリズムでユーザー数を計算（2〜5%の誤差）
- GA4 UIにはConsent Modeによる推定値が含まれる（BQには含まれない）
- 高カーディナリティの項目（ページURLなど）はGA4 UIで「(other)」に丸められる
- Google Signalsによるクロスデバイス統合の有無

**BigQuery側のデータの方が「真の値」に近い**と考えてよいです。
サンプリングも(other)行もなく、全データで計算されています。`,
    relevantSteps: ['analysis'],
    priority: 1,
    tags: ['数値不一致', 'データ差異', 'GA4 UI', 'BigQuery'],
  },
  {
    id: 'what-is-sampling',
    category: 'data-limits',
    question: 'サンプリングとは何ですか？',
    answer: `データ量が多すぎる場合に、Googleが一部のデータだけを使って集計値を推定する仕組みです。
結果、数値の正確性が下がります。

- **BigQuery Export**: サンプリング **なし**。全データで計算
- **Data API**: 大規模なクエリでサンプリングが発生する場合あり

精度を重視する分析（コンバージョン数、売上など）では、
BigQuery Export方式が圧倒的に有利です。`,
    relevantSteps: ['step3-bq-diagnosis'],
    priority: 2,
    tags: ['サンプリング', 'データ精度', 'BigQuery'],
  },
  {
    id: 'what-is-other-row',
    category: 'data-limits',
    question: '「(other)行」とは何ですか？',
    answer: `GA4 UI と Data API では、1レポートあたりのユニーク値の数に上限があります。
上限を超えると、それ以外のすべてが「(other)」という行にまとめられてしまいます。

例: ページURLが10万種類あるサイトで、上位5万件しか個別表示されず、
残り5万件が「(other): 合計XXXセッション」となる

この結果、ロングテールの分析ができなくなります。
**BigQuery Export では (other)行は発生しません**。`,
    relevantSteps: ['step3-bq-diagnosis'],
    priority: 3,
    tags: ['(other)', 'ロングテール', 'データ制限', 'BigQuery'],
  },

  // ── troubleshooting ───────────────────────────────────────────────────────
  {
    id: 'no-bq-link',
    category: 'troubleshooting',
    question: '「BigQueryリンクが見つからない」と表示されます',
    answer: `対象のGA4プロパティに、まだBigQuery Exportが設定されていません。
画面の「BigQuery Exportを設定する」を選んで、セットアップガイドに沿って進めてください。

すでに設定したはずなのに表示される場合:
1. 正しいGA4プロパティを選択しているか確認
2. BigQueryリンクが作成されてから数分待って再診断
3. ブラウザを再読み込み`,
    relevantSteps: ['step3-bq-diagnosis'],
    priority: 1,
    tags: ['BigQueryリンク', 'エラー', 'トラブル'],
  },
  {
    id: 'bq-api-not-enabled',
    category: 'troubleshooting',
    question: '「このプロジェクトでBigQuery APIが有効化されていません」と表示されます',
    answer: `選択したGCPプロジェクトで、BigQuery APIを有効化する必要があります。

**手順**
1. エラーメッセージ内の「APIを有効化する」リンクをクリック
2. GCPコンソールが開くので「有効にする」ボタンを押す
3. 本サービスに戻り「再確認」をクリック

有効化には数十秒かかる場合があります。`,
    relevantSteps: ['step1-project'],
    priority: 2,
    tags: ['BigQuery API', '有効化', 'GCP', 'エラー'],
  },
  {
    id: 'property-not-shown',
    category: 'troubleshooting',
    question: 'GA4プロパティ一覧に、使いたいプロパティが表示されません',
    answer: `以下を確認してください。

- サインインしたGoogleアカウントが、対象GA4プロパティの**閲覧者以上**の権限を持っているか
- GA4管理画面にログインして、対象プロパティが表示されるか
- 会社アカウントと個人アカウントを混同していないか（複数アカウント切り替え）

権限がない場合、GA4管理者に権限付与を依頼してください。`,
    relevantSteps: ['step2-property'],
    priority: 3,
    tags: ['プロパティ', '表示されない', '権限', 'GA4'],
  },
  {
    id: 'slow-query',
    category: 'troubleshooting',
    question: 'クエリが遅い・タイムアウトする',
    answer: `以下を試してください。

- **日付範囲を狭める**: 「過去30日」など明示的に指定
- **対象を絞る**: 「全ページ」ではなく「トップページのみ」など
- **シンプルな質問に分解**: 1つの質問で複数の指標を同時に求めない

それでも遅い場合は、データ量が非常に大きい可能性があります。
サイトのPV規模が大きい場合は、特定の時間帯・特定のセグメントに絞った分析をお勧めします。`,
    relevantSteps: ['analysis'],
    priority: 4,
    tags: ['遅い', 'タイムアウト', 'クエリ', 'パフォーマンス'],
  },
];
