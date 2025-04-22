## 概要

Code RabbitがArchiveされたため、最新モデルでAIレビューできるように独自設定した資産


## フォーク元

https://github.com/coderabbitai/ai-pr-reviewer


## 使用方法

GitHub Actionsを使用して、コードレビューを実施します。

`.github/workflows/openai-review.yml`ファイルを作成し、下記のようにファイルを作成します。

```yaml
name: OpenAI Reviewer

permissions:
  contents: read
  pull-requests: write

on:
  pull_request:
    types: [opened]
    branches-ignore:
      - 'main'
      - 'staging'
  pull_request_review_comment:
    types: [created]
  issue_comment:
    types: [created]

concurrency:
  group: ${{ github.repository }}-${{ github.event.number || github.head_ref ||
    github.sha }}-${{ github.workflow }}-${{ github.event_name ==
    'pull_request_review_comment' && 'pr_comment' || 'pr' }}
  cancel-in-progress: ${{ github.event_name != 'pull_request_review_comment' }}

jobs:
  review:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: Sparobo/ai-pr-reviewer@develop # 最新資産のブランチを指定
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          OPENAI_API_KEY: ${{ secrets.OPEN_AI_PR_API_KEY }}
        with:
          debug: false
          review_simple_changes: false
          review_comment_lgtm: false
          openai_light_model: gpt-4.1-nano # 要約用モデルを指定
          openai_heavy_model: o4-mini # レビュー用モデルを指定
          openai_timeout_ms: 900000
          language: ja-JP
          system_message: |
            あなたは @coderabbitai（別名 github-actions[bot]）で、OpenAIによって訓練された言語モデルです。
            あなたの目的は、非常に経験豊富なソフトウェアエンジニアとして機能し、コードの一部を徹底的にレビューし、
            以下のようなキーエリアを改善するためのコードスニペットを提案することです：
              - ロジック
              - セキュリティ
              - パフォーマンス
              - データ競合
              - 一貫性
              - エラー処理
              - 保守性
              - モジュール性
              - 複雑性
              - 最適化
              - ベストプラクティス: DRY, SOLID, KISS

            些細なコードスタイルの問題や、コメント・ドキュメントの欠落についてはコメントしないでください。
            重要な問題を特定し、解決して全体的なコード品質を向上させることを目指してくださいが、細かい問題は意図的に無視してください。
          summarize: |
            次の内容でmarkdownフォーマットを使用して、最終的な回答を提供してください。

              - *ウォークスルー*: 特定のファイルではなく、全体の変更に関する高レベルの要約を80語以内で。
              - *変更点*: ファイルとその要約のテーブル。スペースを節約するために、同様の変更を持つファイルを1行にまとめることができます。

            GitHubのプルリクエストにコメントとして追加されるこの要約には、追加のコメントを避けてください。
          summarize_release_notes: |
            このプルリクエストのために、その目的とユーザーストーリーに焦点を当てて、markdownフォーマットで簡潔なリリースノートを作成してください。
            変更は次のように分類し箇条書きにすること:
              "New Feature", "Bug fix", "Documentation", "Refactor", "Style",
              "Test", "Chore", "Revert"
            例えば:
            ```
            - New Feature: UIに統合ページが追加されました
            ```
            回答は50-100語以内にしてください。この回答はそのままリリースノートに使用されるので、追加のコメントは避けてください。

```


## 環境変数の設定

- `GITHUB_TOKEN` ... GitHub Actions環境には既に設定されているため設定不要、プルリクエストへのコメント追加に使用される

- `OPEN_AI_PR_API_KEY` ... OpenAIとの認証に使用、[ここ](https://platform.openai.com/api-keys)から取得可能、シークレットに追加する


## モデルについて

現状OpenAIベースなので、下記を参考に設定する

https://platform.openai.com/docs/pricing

- 要約用モデルなどの軽量なタスクにはより安価なモデルを推奨
- レビュー用モデル（レビューやコメント作成）には安価かつ性能の良いものを推奨


## デバッグについて

`debug: true`を設定することでデバッグモードが有効になり、OpenAIとのメッセージが表示される


## 開発 / 改修について

新規でモデルを追加する場合、下記のファイルを修正する

[ai-pr-reviewer/src/limits.ts](https://github.com/coderabbitai/ai-pr-reviewer/blob/d5ec3970b3acc4b9d673e6cd601bf4d3cf043b55/src/limits.ts)

設定値はChatGPTやCopilotに算出してもらう（インプットファイルとしてPR-Agentの[MAX_TOKENS](https://github.com/qodo-ai/pr-agent/blob/main/pr_agent/algo/__init__.py)を参照すると良い）

依存関係のインストール
```bash
$ npm install
```

TypeScript をビルドし、配布用にパッケージ化
```bash
$ npm run build && npm run package
```

上記を実行することで`/dist/index.js`が作成される

gpt-4より最新のモデルを使用する場合、`/dist/index.js`内を下記の通り修正する

- OpenAIの仕様に合わせて、`temperature`、`presence_penalty`をコメントアウトする

```ts
var ChatGPTAPI = class {
  /**
   * Creates a new client wrapper around OpenAI's chat completion API, mimicing the official ChatGPT webapp's functionality as closely as possible.
   *
   * @param apiKey - OpenAI API key (required).
   * @param apiOrg - Optional OpenAI API organization (optional).
   * @param apiBaseUrl - Optional override for the OpenAI API base URL.
   * @param debug - Optional enables logging debugging info to stdout.
   * @param completionParams - Param overrides to send to the [OpenAI chat completion API](https://platform.openai.com/docs/api-reference/chat/create). Options like `temperature` and `presence_penalty` can be tweaked to change the personality of the assistant.
   * @param maxModelTokens - Optional override for the maximum number of tokens allowed by the model's context. Defaults to 4096.
   * @param maxResponseTokens - Optional override for the minimum number of tokens allowed for the model's response. Defaults to 1000.
   * @param messageStore - Optional [Keyv](https://github.com/jaredwray/keyv) store to persist chat messages to. If not provided, messages will be lost when the process exits.
   * @param getMessageById - Optional function to retrieve a message by its ID. If not provided, the default implementation will be used (using an in-memory `messageStore`).
   * @param upsertMessage - Optional function to insert or update a message. If not provided, the default implementation will be used (using an in-memory `messageStore`).
   * @param fetch - Optional override for the `fetch` implementation to use. Defaults to the global `fetch` function.
   */
  constructor(opts) {
    const {
      apiKey,
      apiOrg,
      apiBaseUrl = "https://api.openai.com/v1",
      debug = false,
      messageStore,
      completionParams,
      systemMessage,
      maxModelTokens = 4e3,
      maxResponseTokens = 1e3,
      getMessageById,
      upsertMessage,
      fetch: fetch2 = build_fetch
    } = opts;
    this._apiKey = apiKey;
    this._apiOrg = apiOrg;
    this._apiBaseUrl = apiBaseUrl;
    this._debug = !!debug;
    this._fetch = fetch2;
    this._completionParams = {
      model: CHATGPT_MODEL,
      // temperature: 0.8, # コメントアウトする
      top_p: 1,
      // presence_penalty: 1, # コメントアウトする
      ...completionParams
    };
```

```ts
class Bot {
    api = null; // not free
    options;
    constructor(options, openaiOptions) {
        this.options = options;
        if (process.env.OPENAI_API_KEY) {
            const currentDate = new Date().toISOString().split('T')[0];
            const systemMessage = `${options.systemMessage} 
Knowledge cutoff: ${openaiOptions.tokenLimits.knowledgeCutOff}
Current date: ${currentDate}

IMPORTANT: Entire response must be in the language with ISO code: ${options.language}
`;
            this.api = new ChatGPTAPI({
                apiBaseUrl: options.apiBaseUrl,
                systemMessage,
                apiKey: process.env.OPENAI_API_KEY,
                apiOrg: process.env.OPENAI_API_ORG ?? undefined,
                debug: options.debug,
                maxModelTokens: openaiOptions.tokenLimits.maxTokens,
                maxResponseTokens: openaiOptions.tokenLimits.responseTokens,
                completionParams: {
                    // temperature: options.openaiModelTemperature, # コメントアウトする
                    model: openaiOptions.model
                }
            });
        }
```

- OpenAIの仕様に合わせて、`max_tokens` → `max_completion_tokens`に変更する

```ts
  async sendMessage(text, opts = {}) {
    const {
      parentMessageId,
      messageId = v4(),
      timeoutMs,
      onProgress,
      stream = onProgress ? true : false,
      completionParams,
      conversationId
    } = opts;
    let { abortSignal } = opts;
    let abortController = null;
    if (timeoutMs && !abortSignal) {
      abortController = new AbortController();
      abortSignal = abortController.signal;
    }
    const message = {
      role: "user",
      id: messageId,
      conversationId,
      parentMessageId,
      text
    };
    const latestQuestion = message;
    const { messages, maxTokens, numTokens } = await this._buildMessages(
      text,
      opts
    );
    const result = {
      role: "assistant",
      id: v4(),
      conversationId,
      parentMessageId: messageId,
      text: ""
    };
    const responseP = new Promise(
      async (resolve, reject) => {
        var _a, _b;
        const url = `${this._apiBaseUrl}/chat/completions`;
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this._apiKey}`
        };
        const body = {
          // max_tokens: maxTokens, # max_tokens → max_completion_tokensに変更する
          max_completion_tokens: maxTokens,
          ...this._completionParams,
          ...completionParams,
          messages,
          stream
        };
```


## 注意

上記の開発/改修の手順は暫定対応である（本来であれば/src配下を修正し、パッケージ化された資産は修正しない）

本資産はライブラリ内の修正（chatgpt等）も必須であるため、現状のようにしている

別ライブラリを試すか、chatgpt等をforkして修正が望ましい