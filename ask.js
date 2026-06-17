const Anthropic = require('@anthropic-ai/sdk');

if (typeof fetch === 'undefined') {
    const nodeFetch = require('node-fetch');
    globalThis.fetch = nodeFetch;
    globalThis.Headers = nodeFetch.Headers;
    globalThis.Request = nodeFetch.Request;
    globalThis.Response = nodeFetch.Response;
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const HISTORY_LIMIT = 100;
const DISCORD_MESSAGE_LIMIT = 2000;

async function fetchChannelTranscript(channel) {
    const messages = await channel.messages.fetch({ limit: HISTORY_LIMIT });

    return [...messages.values()]
        .filter(message => message.content.length > 0)
        .reverse()
        .map(message => `${message.author.username}: ${message.content}`)
        .join('\n');
}

async function answerQuestion(channel, question) {
    console.log(process.env.ANTHROPIC_API_KEY)
    const transcript = await fetchChannelTranscript(channel);

    const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: 'You are a helpful assistant embedded in a Discord server. Use the provided recent channel messages as context when relevant to answer the user\'s question. If the messages aren\'t relevant, just answer the question normally. Keep answers concise.',
        messages: [
            {
                role: 'user',
                content: `Recent channel messages:\n${transcript}\n\nQuestion: ${question}`
            }
        ]
    });

    return response.content
        .filter(block => block.type === 'text')
        .map(block => block.text)
        .join('\n');
}

function splitForDiscord(text) {
    const chunks = [];
    for (let i = 0; i < text.length; i += DISCORD_MESSAGE_LIMIT) {
        chunks.push(text.slice(i, i + DISCORD_MESSAGE_LIMIT));
    }
    return chunks;
}

module.exports = { answerQuestion, splitForDiscord };
