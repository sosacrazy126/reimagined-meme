import { Anthropic } from "@anthropic-ai/sdk";
import { ApiHandler } from "./index";
import { ApiConfiguration } from "../shared/api";

export class OpenAIHandler implements ApiHandler {
    private apiKey: string;
    private baseUrl: string;
    private model: string;

    constructor(options: ApiConfiguration) {
        if (!options.apiKey) {
            throw new Error("API key is required");
        }
        this.apiKey = options.apiKey;
        this.baseUrl = options.openaiBaseUrl || "https://api.openai.com/v1";
        this.model = options.openaiModel || "gpt-3.5-turbo";
    }

    async createMessage(
        systemPrompt: string,
        messages: Anthropic.Messages.MessageParam[],
        tools: Anthropic.Messages.Tool[]
    ): Promise<Anthropic.Messages.Message> {
        const openaiMessages = [
            { role: "system", content: systemPrompt },
            ...messages.map(msg => ({
                role: msg.role === "user" ? "user" : "assistant",
                content: Array.isArray(msg.content) 
                    ? msg.content.map(c => 'text' in c ? c.text : JSON.stringify(c)).join("\n")
                    : msg.content
            }))
        ];

        const response = await fetch(`${this.baseUrl}/chat/completions`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify({
                model: this.model,
                messages: openaiMessages,
                functions: tools.map(tool => ({
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters
                }))
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            role: "assistant",
            content: data.choices[0].message.content,
            model: data.model,
            stop_reason: data.choices[0].finish_reason,
            stop_sequence: null,
            usage: {
                input_tokens: data.usage.prompt_tokens,
                output_tokens: data.usage.completion_tokens
            }
        };
    }

    createUserReadableRequest(
        userContent: Array<
            | Anthropic.TextBlockParam
            | Anthropic.ImageBlockParam
            | Anthropic.ToolUseBlockParam
            | Anthropic.ToolResultBlockParam
        >
    ): any {
        return userContent.map(content => {
            if ('text' in content) {
                return content.text;
            }
            return JSON.stringify(content);
        }).join("\n");
    }
}