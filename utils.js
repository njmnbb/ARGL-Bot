const UserSchema = require('./mongodb-schemas/User');

async function createScoreboard(season, showTotalScores) {
    let userList = await UserSchema.findAndSortAllUsers(season);
    let displayUserList = `\n## SEASON ${season} SCORES\n`;

    userList.forEach((user) => {
        if(!user.isBanned) {
            displayUserList += `**${user.displayName}**: ${user.seasonScores[0].score} ${showTotalScores ? '(' + user.score + ' total)' : ''}\n`;
        }
    });

    return displayUserList;
}

function getNumberWithOrdinal(n) {
    var s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

module.exports = { createScoreboard, getNumberWithOrdinal };