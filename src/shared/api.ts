export type ApiProvider = "anthropic" | "openrouter" | "bedrock" | "openai"

export interface ApiHandlerOptions {
    apiKey?: string // anthropic
    openRouterApiKey?: string
    awsAccessKey?: string
    awsSecretKey?: string
    awsRegion?: string
    openaiApiKey?: string // OpenAI API key
    openaiBaseUrl?: string
    openaiModel?: string
}

export type ApiConfiguration = ApiHandlerOptions & {
    apiProvider?: ApiProvider
    openRouterModel?: string // OpenRouter model selection
}

export interface Tool {
    name: string
    description: string
    parameters: any // You might want to define a more specific type for parameters
}
