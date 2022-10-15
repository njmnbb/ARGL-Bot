const { Client, GatewayIntentBits } = require('discord.js');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ]
});

let isTimerComplete = true;

// Detect when a message is sent and check for argl-iness
client.on('messageCreate', (message) => {

    if(message.content.toUpperCase().includes('ARGL') && !message.author.bot && isTimerComplete) {
        message.reply(`@everyone \n\n We have a genuine "argl" in the chat. Remain calm!`);
        isTimerComplete = false;
        setTimeout(() => isTimerComplete = true, 1200000);
    }
});

client.login(token);