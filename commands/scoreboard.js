const { SlashCommandBuilder } = require('discord.js');
const { createScoreboard } = require('../utils');
const { currentSeason } = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scoreboard')
        .setDescription('Displays the "ARGL" scoreboard'),
    async execute(interaction) {
        interaction.reply(`${await createScoreboard(currentSeason, true)}`);

    }
};