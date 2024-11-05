const UserSchema = require('./mongodb-schemas/User');

async function createScoreboard(season, showTotalScores) {
    let userList = await UserSchema.findAndSortAllUsers(season);
    let displayUserList = `\n## SEASON ${season} SCORES\n`;
console.log('showtotalscores: ' + showTotalScores);
    userList.forEach((user, i) => {
        if (!user.isBanned) {
            displayUserList += `**${isUserInFirstOrSecondPlace(i) ? '🤫' : user.displayName}**: ${isUserInFirstOrSecondPlace(i) ? '🤫' : user.seasonScores[0].score} ${showTotalScores ? '(' + user.score + ' total)' : ''}\n`;
        }
    });
    return displayUserList;
}

function getNumberWithOrdinal(n) {
    var s = ["th", "st", "nd", "rd"],
        v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function isUserInFirstOrSecondPlace(i) {
    if (i === 0 || i === 1) {
        return true;
    } else {
        return false;
    }
}

module.exports = { createScoreboard, getNumberWithOrdinal };