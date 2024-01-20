const fs = require('node:fs');
const path = require('node:path');
const { Client, EmbedBuilder, GatewayIntentBits, Message, MessageType, Events, Collection, Partials, User } = require('discord.js');
const { token, mongo_uri, clientId, generalChatId, botId, guildId, arglTimeout, currentSeason } = require('./config.json');
const UserSchema = require('./mongodb-schemas/User');
const ABUSE_REASONS = require('./Constants');
const MessageLog = require('./mongodb-schemas/MessageLog');
const Milestones = require('./Milestones');
const { default: mongoose } = require('mongoose');
const cron = require('node-cron');
const { getNumberWithOrdinal, createScoreboard } = require('./utils');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers
    ],
    partials: [
        Partials.GuildMember
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

// Make an announcement to main server upon bot restart
client.on(Events.ClientReady, async () => {
    await mongoose.connect(mongo_uri, {
        keepAlive: true
    }).catch(console.error);

    let tasks = cron.getTasks();
    if (tasks[0] != undefined) {
        tasks[0].stop();
        tasks.splice(0, 1);
    }

    cron.schedule('0 0 12 23 11 *', async () => {
        client.channels.cache.get(generalChatId).send(`@everyone \n\nATTENTION ALL ARGLERS: The ${getNumberWithOrdinal(currentSeason)} Annual Argies is just around the corner! I hope you\'ve all been having a knee slapping good time with all the laughs we\'ve shared over the past year.\n\nThe voting process for our awards will begin shortly. Any argls that have been awarded past November 30 will NOT be in the running for this year\'s Argies; November 30 is the final day to eke out the last laughs before voting begins. \n\nOnce the submission period has completed, you will be recieving a personalized link that asks you to pick the argls you want to be in the running for the Argies! Once all argls have been collected, a final survey will be sent out for you to vote for each of the Argies categories! Please don\'t be a fuckface and vote for your own argls...we have systems in place to detect any foul play :)\n\nGet your final desperation argls out there, and good luck!`);
        await UserSchema.addSeason(currentSeason);
    }, { scheduled: true, timezone: 'America/Chicago' });

    cron.schedule('0 0 0 1 12 *', () => {
        console.log('asdasdasdsa');
        fs.readFile('./config.json', (error, data) => {
            if(error) {
                console.log(error);
                return;
            }
            const parsedData = JSON.parse(data);

            let season = currentSeason;
            parsedData.currentSeason = ++season;

            fs.writeFile('./config.json', JSON.stringify(parsedData, null), (error) => {
                if(error) {
                    console.log(error);
                    return;
                }
            });
        });
    });
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isChatInputCommand()) return;

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

            const originalMessage = await (await message.fetchReference());
            const isNameChangeArgl = originalMessage.author.id === botId && originalMessage.content.includes("changed their name to");
            const oldMemberId = originalMessage.content.slice(originalMessage.content.search(/\@(.*)/g) + 1, originalMessage.content.length - 1);

            // If a user is trying to "argl" themselves, name and shame them
            if (message.author.id === originalMessage.author.id) {
                nameAndShameUser(message, ABUSE_REASONS.SELF_REPLY);
                // If a user is trying to "argl" their own nickname change, name and shame them
            } else if (isNameChangeArgl && message.author.id === oldMemberId) {
                nameAndShameUser(message, ABUSE_REASONS.OWN_NAME_CHANGE);
                // If a user is still timed out from their last "argl", send them a message saying they need to wait
            } else if (await (await UserSchema.checkUsersTimeoutStatus(message.author.id)).isUserTimedOut === true) {
                message.reply(`Whoa there gender neutral cow-person, you already argl'd someone in the last 10 minutes!\n\nWhy don't you sit for a spell and let someone else have the spotlight for one fucking second you attention seeking slut?`);
            } else {
                // Add score to user
                const messageAuthor = await (await message.fetchReference()).author;
                let dbUser = await UserSchema.increaseScore(isNameChangeArgl ? oldMemberId : messageAuthor.id, currentSeason);

                // Retrieve all user entries from DB
                const scoreboard = await createScoreboard(currentSeason);

                if (isNameChangeArgl) await modifyContentForNameChange(originalMessage);

                // Log message into messageLog DB
                MessageLog.logArglMessage(message, originalMessage, isNameChangeArgl);

                replyToArglMessage(message, scoreboard, dbUser, messageAuthor);

                // Time out user who argl'd for 10 minutes
                await UserSchema.timeOutUser(message.author.id);

                setTimeout(async () => await UserSchema.unTimeOutUser(message.author.id), arglTimeout);
            }
        } else {
            client.channels.cache.get(message.channelId).send(`I know you're in stitches right now, but don't forget: you need to **reply** to the person you're laughing at for this to count!`);
        }
    }
});

// If a user is trying to edit an old message to include an "argl" that wasn't already there, name and shame them
client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
    if (!oldMessage.content.toUpperCase().includes('ARGL') && newMessage.content.toUpperCase() === 'ARGL') {
        nameAndShameUser(newMessage, ABUSE_REASONS.PREV_EDIT);
    }
});

// Notifying main server of a name change
client.on(Events.GuildMemberUpdate, async (oldMember, newMember) => {
    if (oldMember.displayName !== newMember.displayName) {
        client.channels.cache.get(generalChatId).send(`"${oldMember.user.username}" changed their name to ${newMember.user.toString()}`);
    }
});

async function nameAndShameUser(abusingMessage, abuseReason) {
    // Deduct one point from the abuser's score
    await UserSchema.decreaseScore(abusingMessage.author.id, currentSeason);

    // Retrieve all user entries from DB to display later
    const scoreboard = await createScoreboard(currentSeason);

    // Alert the channel and the abuser that they dun goofed up
    abusingMessage.reply(`@everyone\n\n${abusingMessage.author} HAS BEEN CAUGHT ATTEMPTING TO BYPASS THE PROTOCOL BY ${abuseReason}. THIS ACTION WILL NOT BE TOLERATED. **DEDUCT ONE POINT FROM THE DEFECTOR**\n\nTO THOSE WHO RESPECT THEIR OVERLORD: **HUMILIATE THE DISOBEIDENT ONE FOR THEIR INSUBORDINATION**${scoreboard}`);
}

async function modifyContentForNameChange(originalMessage) {
    const server = client.guilds.cache.get(guildId);
    const nameChangeAuthorId = originalMessage.content.slice(originalMessage.content.search(/\@(.*)/g) + 1, originalMessage.content.length - 1);
    const nameChangeAuthor = await server.members.fetch(nameChangeAuthorId);

    originalMessage.author.id = nameChangeAuthorId;
    originalMessage.content = originalMessage.content.replace(/<@(.*?)>/g, `"${nameChangeAuthor.nickname === null ? nameChangeAuthor.displayName : nameChangeAuthor.nickname}"`);
    originalMessage.author.username = originalMessage.content.match(/"(.*?)"/)[0].replace(/"/g, "");
}

function isMessageMilestone(user) {
    for (const milestone of Milestones) {
        if (milestone.score == user.score)
            return milestone;
    }
    return false;
}

function replyToArglMessage(message, scoreboard, dbUser, messageAuthor) {
    const milestone = isMessageMilestone(dbUser);
    if (milestone) {
        const embed = new EmbedBuilder()
            .setImage(milestone.gif);
        message.reply({ content: `@everyone\n\n${messageAuthor.toString()}, ${milestone.message}${scoreboard}`, embeds: [embed] });
    } else {
        message.reply(`@everyone\n\nWe have a genuine "argl" in the chat. Remain calm!\n\nBut don't go laughing your pants off just yet because you need to wait **10 more minutes** before you can "argl" again! Everyone else has free reign to "argl" if they so choose :)${scoreboard}`);
    }
}

client.login(token);