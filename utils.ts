import UserSchema from './mongodb-schemas/User';

export async function createScoreboard(season: number, showTotalScores: boolean): Promise<string> {
    const userList = await UserSchema.findAndSortAllUsers(season);
    let displayUserList = `\n## SEASON ${season} SCORES\n`;

    userList.forEach(user => {
        if (!user.isBanned) {
            displayUserList += `**${user.displayName}**: ${user.seasonScores[0].score} ${showTotalScores ? '(' + user.score + ' total)' : ''}\n`;
        }
    });
    return displayUserList;
}

export function getNumberWithOrdinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
