import { SlashCommandBuilder, ChatInputCommandInteraction, TextBasedChannelFields } from 'discord.js';
import { answerQuestion, splitForDiscord } from '../ask';
import type { Command } from '../types';

const command: Command = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask the bot a question, using recent channel messages as context')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question to ask')
                .setRequired(true)) as SlashCommandBuilder,
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply();

        try {
            const question = interaction.options.getString('question', true);
            const answer = await answerQuestion(interaction.channel as TextBasedChannelFields, question);
            const [firstChunk, ...restChunks] = splitForDiscord(answer);

            await interaction.editReply(firstChunk);
            for (const chunk of restChunks) {
                await interaction.followUp(chunk);
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply('Sorry, I ran into an error trying to answer that.');
        }
    }
};

module.exports = command;
