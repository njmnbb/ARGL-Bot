const { SlashCommandBuilder } = require('discord.js');
const { retrieveUserList } = require('../argl-index');
const UserSchema = require('../mongodb-schemas/User')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scoreboard')
        .setDescription('Displays the "ARGL" scoreboard'),
    async execute(interaction) {
        let foo = retrieveUserList();
        let userList = await UserSchema.find().sort({ score: -1 });
        let displayUserList = '';
    
        userList.forEach((user, index) => {
            displayUserList += `${user.displayName}: ${user.score}\n`;
        });

        interaction.reply(`**CURRENT SCORES**\n${displayUserList}`);

    }
};