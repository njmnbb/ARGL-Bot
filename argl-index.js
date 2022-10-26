const fs = require('node:fs');
const path = require('node:path');
const { Client, GatewayIntentBits, MessageType, Events, Collection } = require('discord.js');
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

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

let isTimerComplete = true;

client.on(Events.ClientReady, async () => {
    await mongoose.connect(mongo_uri, {
        keepAlive: true
    }).catch(console.error);
});

client.on(Events.InteractionCreate, async interaction => {
    if(!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

// Detect when a message is sent and check for argl-iness
client.on(Events.MessageCreate, async (message) => {
    if (message.content.toUpperCase() === 'ARGL' && !message.author.bot) {
        if (message.type === MessageType.Reply) {

            // If a user is trying to "argl" themselves, name and shame them
            if (message.author.id === await (await message.fetchReference()).author.id) {
                nameAndShameUser(message, ABUSE_REASONS.SELF_REPLY);
            } else if (isTimerComplete) {
                // Add score to user
                // await UserSchema.updateOne({ discordId: await (await message.fetchReference()).author.id }, { $inc: { score: 1 } });
                await UserSchema.increaseScore(await (await message.fetchReference()).author.id);

                // Retrieve all user entries from DB
                const scoreboard = await formatUserList();

                message.reply(`@everyone\n\nWe have a genuine "argl" in the chat. Remain calm!\n\nBut don't go laughing your pants off just yet because you need to wait **20 more minutes** before the next "argl" can be notified!\n\n**CURRENT SCORES**\n${scoreboard}`);
                isTimerComplete = false;
                setTimeout(() => isTimerComplete = true, 1200000);
            }
        } else {
            client.channels.cache.get(message.channelId).send(`I know you're in stitches right now, but don't forget: you need to **reply** to the person you're laughing at for this to count!`);
        }
    }
});

client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    // If a user is trying to edit an old message to include an "argl" that wasn't already there, name and shame them
    if (!oldMessage.content.toUpperCase().includes('ARGL') && newMessage.content.toUpperCase().includes('ARGL')) {
        nameAndShameUser(newMessage, ABUSE_REASONS.PREV_EDIT);
    }
});

async function nameAndShameUser(abusingMessage, abuseReason) {
    // Deduct one point from the abuser's score
    await UserSchema.decreaseScore(abusingMessage.author.id);

    // Retrieve all user entries from DB to display later
    const scoreboard = await formatUserList(); 

    // Alert the channel and the abuser that they dun goofed up
    abusingMessage.reply(`@everyone\n\n${abusingMessage.author} HAS BEEN CAUGHT ATTEMPTING TO BYPASS THE PROTOCOL BY ${abuseReason}. THIS ACTION WILL NOT BE TOLERATED. **DEDUCT ONE POINT FROM THE DEFECTOR**\n\nTO THOSE WHO RESPECT THEIR OVERLORD: **HUMILIATE THE DISOBEIDENT ONE FOR THEIR INSUBORDINATION**\n\n**CURRENT SCORES**\n${scoreboard}`);
}

async function formatUserList() {
    let userList = await UserSchema.findAndSortAllUsers();
    let displayUserList = '';

    userList.forEach((user, index) => {
        displayUserList += `${user.displayName}: ${user.score}\n`;
    });

    return displayUserList;
}

client.login(token);

exports.formatUserList = formatUserList;