const { SlashCommandBuilder } = require('discord.js');
const { answerQuestion, splitForDiscord } = require('../ask');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask the bot a question, using recent channel messages as context')
        .addStringOption(option =>
            option.setName('question')
                .setDescription('The question to ask')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const question = interaction.options.getString('question');
            const answer = await answerQuestion(interaction.channel, question);
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
