import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { createScoreboard } from '../utils';
import config from '../config';
import type { Command } from '../types';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('scoreboard')
        .setDescription('Displays the "ARGL" scoreboard'),
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.reply(`${await createScoreboard(config.currentSeason, false)}`);
    }
};

module.exports = command;
