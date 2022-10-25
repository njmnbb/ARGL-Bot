const { Client, GatewayIntentBits, MessageType } = require('discord.js');
const { token, mongo_uri } = require('./config.json');
const mongoose = require('mongoose');
const testSchema = require('./test-schema');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages
    ]
});

let isTimerComplete = true;

client.on('ready', async () => {
    await mongoose.connect(mongo_uri, {
        keepAlive: true
    }).catch(console.error); 
});

// Detect when a message is sent and check for argl-iness
client.on('messageCreate', async (message) => {
    if (message.content.toUpperCase().includes('ARGL') && !message.author.bot && isTimerComplete) {
        if (message.type === MessageType.Reply) {
            if(message.author.id === await (await message.fetchReference()).author.id) {
                message.reply(`@everyone\n\nATTEMPTING TO BYPASS THE PROTOCOL WILL NOT BE TOLERATED. **DEDUCT ONE POINT FROM THE DEFECTOR**\n\nTO THOSE WHO RESPECT THEIR OVERLORD: **HUMILIATE THE DISOBEIDENT ONE FOR THEIR INSUBORDINATION**`);

                await testSchema.updateOne({discordId: await (await message.fetchReference()).author.id}, {$inc: {score: -1}});
            } else {
                // Add score to user
                await testSchema.updateOne({discordId: await (await message.fetchReference()).author.id}, {$inc: {score: 1}});

                // Retrieve all user entries from DB
                let userList = await testSchema.find().sort({score: -1});
                let displayUserList = '';

                userList.forEach((user, index) => {
                    displayUserList += `${user.displayName}: ${user.score}\n`;
                });

                message.reply(`@everyone\n\nWe have a genuine "argl" in the chat. Remain calm!\n\nBut don't go laughing your pants off just yet because you need to wait **20 more minutes** before the next "argl" can be notified!\n\n**CURRENT SCORES**\n${displayUserList}`);
                isTimerComplete = false;
                setTimeout(() => isTimerComplete = true, 1200000); 
            }
        } else {
            client.channels.cache.get(message.channelId).send(`I know you're in stitches right now, but don't forget: you need to **reply** to the person you're laughing at for this to count!`);
        }

    }
});

client.login(token);