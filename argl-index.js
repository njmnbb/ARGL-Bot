const { Client, GatewayIntentBits, MessageType } = require('discord.js');
const { token, mongo_uri, clientId } = require('./config.json');
const mongoose = require('mongoose');
const UserSchema = require('./mongodb-schemas/User');
const ABUSE_REASONS = require('./Constants');

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
    if (message.content.toUpperCase().includes('ARGL') && !message.author.bot) {
        if (message.type === MessageType.Reply) {

            // If a user is trying to "argl" themselves, name and shame them
            if (message.author.id === await (await message.fetchReference()).author.id) {
                nameAndShameUser(message, ABUSE_REASONS.SELF_REPLY);
            } else if (isTimerComplete) {
                // Add score to user
                await UserSchema.updateOne({ discordId: await (await message.fetchReference()).author.id }, { $inc: { score: 1 } });

                // Retrieve all user entries from DB
                const displayUserList = await retrieveUserList();

                message.reply(`@everyone\n\nWe have a genuine "argl" in the chat. Remain calm!\n\nBut don't go laughing your pants off just yet because you need to wait **20 more minutes** before the next "argl" can be notified!\n\n**CURRENT SCORES**\n${displayUserList}`);
                isTimerComplete = false;
                setTimeout(() => isTimerComplete = true, 1200000);
            }
        } else {
            client.channels.cache.get(message.channelId).send(`I know you're in stitches right now, but don't forget: you need to **reply** to the person you're laughing at for this to count!`);
        }
    }
});

client.on('messageUpdate', async (oldMessage, newMessage) => {
    // If a user is trying to edit an old message to include an "argl" that wasn't already there, name and shame them
    if (!oldMessage.content.toUpperCase().includes('ARGL') && newMessage.content.toUpperCase().includes('ARGL')) {
        nameAndShameUser(newMessage, ABUSE_REASONS.PREV_EDIT);
    }
});

async function nameAndShameUser(abusingMessage, abuseReason) {
    // Deduct one point from the abuser's score
    await UserSchema.updateOne({ discordId: abusingMessage.author.id }, { $inc: { score: -1 } });

    // Retrieve all user entries from DB to display later
    const displayUserList = await retrieveUserList();

    // Alert the channel and the abuser that they dun goofed up
    abusingMessage.reply(`@everyone\n\n${abusingMessage.author} HAS BEEN CAUGHT ATTEMPTING TO BYPASS THE PROTOCOL BY ${abuseReason}. THIS ACTION WILL NOT BE TOLERATED. **DEDUCT ONE POINT FROM THE DEFECTOR**\n\nTO THOSE WHO RESPECT THEIR OVERLORD: **HUMILIATE THE DISOBEIDENT ONE FOR THEIR INSUBORDINATION**\n\n**CURRENT SCORES**\n${displayUserList}`);
}

async function retrieveUserList() {
    let userList = await UserSchema.find().sort({ score: -1 });
    let displayUserList = '';

    userList.forEach((user, index) => {
        displayUserList += `${user.displayName}: ${user.score}\n`;
    });

    return displayUserList;
}

client.login(token);