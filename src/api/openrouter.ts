import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { ApiHandler } from "."
import { ApiConfiguration } from "../shared/api"

/**
 * OpenRouterHandler implements the ApiHandler interface for the OpenRouter API.
 * This class handles communication with OpenRouter, allowing the use of various AI models.
 *
 * To add support for a new model:
 * 1. Update the ApiOptions component in webview-ui/src/components/ApiOptions.tsx
 *    to include the new model in the dropdown options.
 * 2. If the new model requires different parameters or handling, modify the
 *    createMessage method below to accommodate these differences.
 * 3. Update any relevant types or interfaces in src/shared/api.ts if necessary.
 * 4. Consider adding or updating tests to cover the new model's functionality.
 */
export class OpenRouterHandler implements ApiHandler {
    private options: ApiConfiguration
    private client: OpenAI
    private model: string

    constructor(options: ApiConfiguration) {
        this.options = options
        this.model = options.openRouterModel || "anthropic/claude-3-sonnet-20240229"
        this.client = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: this.options.openRouterApiKey,
            defaultHeaders: {
                "HTTP-Referer": "https://github.com/saoudrizwan/claude-dev",
                "X-Title": "claude-dev",
            },
        })
    }

    async createMessage(
        systemPrompt: string,
        messages: Anthropic.Messages.MessageParam[],
        tools: Anthropic.Messages.Tool[]
    ): Promise<Anthropic.Messages.Message> {
        try {
            const openAiMessages = [
                { role: "system", content: systemPrompt },
                ...this.convertToOpenAiMessages(messages),
            ]

            const openAiTools = tools.map(tool => ({
                type: "function" as const,
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters,
                },
            }))

            const completion = await this.client.chat.completions.create({
                model: this.model,
                max_tokens: 4096,
                messages: openAiMessages,
                tools: openAiTools,
                tool_choice: "auto",
            })

            const response = completion.choices[0]
            const anthropicMessage: Anthropic.Messages.Message = {
                role: "assistant",
                content: response.message.content ?? "",
                model: this.model,
                stop_reason: this.mapFinishReason(response.finish_reason),
                stop_sequence: null,
                usage: {
                    input_tokens: completion.usage?.prompt_tokens || 0,
                    output_tokens: completion.usage?.completion_tokens || 0,
                },
            }

            return anthropicMessage
        } catch (error) {
            console.error("Error in OpenRouterHandler createMessage:", error)
            throw new Error("Failed to create message using OpenRouter API")
        }
    }

    private mapFinishReason(
        finishReason: OpenAI.Chat.ChatCompletion.Choice["finish_reason"]
    ): Anthropic.Messages.Message["stop_reason"] {
        switch (finishReason) {
            case "stop":
                return "end_turn"
            case "length":
                return "max_tokens"
            case "tool_calls":
                return "tool_use"
            case "content_filter":
                return null
            default:
                return null
        }
    }

    convertToOpenAiMessages(
        anthropicMessages: Anthropic.Messages.MessageParam[]
    ): OpenAI.Chat.ChatCompletionMessageParam[] {
        return anthropicMessages.map(msg => ({
            role: msg.role,
            content: Array.isArray(msg.content)
                ? msg.content.map(c => 'text' in c ? c.text : JSON.stringify(c)).join("\n")
                : msg.content,
        }))
    }

    createUserReadableRequest(
        userContent: Array<
            | Anthropic.TextBlockParam
            | Anthropic.ImageBlockParam
            | Anthropic.ToolUseBlockParam
            | Anthropic.ToolResultBlockParam
        >
    ): any {
        return {
            model: this.model,
            max_tokens: 4096,
            messages: [{ conversation_history: "..." }, { role: "user", content: userContent }],
            tools: "(see tools in src/ClaudeDev.ts)",
            tool_choice: "auto",
        }
    }
}
