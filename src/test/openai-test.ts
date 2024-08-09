import { buildApiHandler } from '../api';
import { ApiConfiguration } from '../shared/api';
import { Anthropic } from '@anthropic-ai/sdk';

type Message = Anthropic.Messages.MessageParam;

async function testOpenAI() {
    const configuration: ApiConfiguration = {
        apiProvider: 'openai',
        apiKey: 'your-openai-api-key-here',
        openaiModel: 'gpt-3.5-turbo', // or any other model you want to test
        openaiBaseUrl: 'https://api.openai.com/v1' // you can change this for other OpenAI-compatible APIs
    };

    const handler = buildApiHandler(configuration);

    const systemPrompt = "You are a helpful assistant.";
    const messages: Message[] = [
        { role: 'user', content: "Hello, what's the weather like today?" }
    ];
    const tools: Anthropic.Messages.Tool[] = []; // Add any tools if needed

    try {
        const response = await handler.createMessage(systemPrompt, messages, tools);
        console.log('Response:', response);
    } catch (error) {
        console.error('Error:', error);
    }
}

testOpenAI();

// To run this test, use the following command in the terminal:
// npx ts-node src/test/openai-test.ts