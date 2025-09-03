export class TokenLimits {
  maxTokens: number
  requestTokens: number
  responseTokens: number
  knowledgeCutOff: string

  constructor(model = 'gpt-4.1-nano') {
    const modelLimits: Record<
      string,
      {
        maxTokens: number
        responseTokens: number
        knowledgeCutOff: string
      }
    > = {
      'gpt-3.5-turbo': {
        maxTokens: 16000,
        responseTokens: 1000,
        knowledgeCutOff: '2021-09-01'
      },
      'gpt-4': {
        maxTokens: 8000,
        responseTokens: 2000,
        knowledgeCutOff: '2023-03-01'
      },
      'gpt-4-turbo': {
        maxTokens: 128000,
        responseTokens: 5000,
        knowledgeCutOff: '2024-01-01'
      },
      'gpt-4.1': {
        maxTokens: 1047576,
        responseTokens: 10000,
        knowledgeCutOff: '2024-06-01'
      },
      'gpt-4.1-nano': {
        maxTokens: 5000,
        responseTokens: 1000,
        knowledgeCutOff: '2024-06-01'
      },
      'o3-mini': {
        maxTokens: 204800,
        responseTokens: 4000,
        knowledgeCutOff: '2025-01-01'
      },
      'o4-mini': {
        maxTokens: 200000,
        responseTokens: 4000,
        knowledgeCutOff: '2025-04-01'
      },
      'gpt-5': {
        maxTokens: 400000,
        responseTokens: 128000,
        knowledgeCutOff: '2025-08-07'
      },
      'gpt-5-mini': {
        maxTokens: 400000,
        responseTokens: 128000,
        knowledgeCutOff: '2025-08-07'
      },
      'gpt-5-nano': {
        maxTokens: 400000,
        responseTokens: 128000,
        knowledgeCutOff: '2025-08-07'
      }
    }

    if (modelLimits[model]) {
      this.maxTokens = modelLimits[model].maxTokens
      this.responseTokens = modelLimits[model].responseTokens
      this.knowledgeCutOff = modelLimits[model].knowledgeCutOff
    } else {
      // デフォルト値
      this.maxTokens = 4000
      this.responseTokens = 1000
      this.knowledgeCutOff = '2021-09-01'
    }

    // provide some margin for the request tokens
    this.requestTokens = this.maxTokens - this.responseTokens - 100
  }

  string(): string {
    return `max_tokens=${this.maxTokens}, request_tokens=${this.requestTokens}, response_tokens=${this.responseTokens}, knowledge_cutoff=${this.knowledgeCutOff}`
  }
}
