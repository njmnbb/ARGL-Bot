const { SlashCommandBuilder } = require('discord.js');
const index = require('../argl-index');
const UserSchema = require('../mongodb-schemas/User')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scoreboard')
        .setDescription('Displays the "ARGL" scoreboard'),
    async execute(interaction) {
        interaction.reply(`**CURRENT SCORES**\n${await index.formatUserList()}`);

    }
};