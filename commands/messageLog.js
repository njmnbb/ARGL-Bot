const { SlashCommandBuilder } = require('discord.js');
const index = require('../argl-index');
const MessageLog = require('../mongodb-schemas/MessageLog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('message_log')
        .setDescription('Displays a log of all previous "ARGL"s'),
    async execute(interaction) {
        const messages = await MessageLog.retrieveLog();
        let displayMessageLogs = '';

        messages.forEach(message => {
            const formattedMessageDate = `${message.messageDate.getMonth() + 1}/${message.messageDate.getDate()}/${message.messageDate.getFullYear()}`;
            displayMessageLogs += `**${message.messageReplierDisplayName}** gave **${message.messageAuthorDisplayName}** an ARGL on ${formattedMessageDate} for the following message:\n\n\`${message.messageContent}\`\n\nSee the whole context here: https://discord.com/channels/${message.serverId}/${message.channelId}/${message.messageId}\n\n--------------------------------------------------------------------------------------------------\n\n`;
        });

        interaction.reply(displayMessageLogs);
    }
};