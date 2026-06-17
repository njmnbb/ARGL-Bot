import fs from 'node:fs';
import path from 'node:path';

interface Config {
    token: string;
    clientId: string;
    guildId: string;
    generalChatId: string;
    botId: string;
    mongo_uri: string;
    arglTimeout: string;
    currentSeason: number;
    botChannelId: number;
    timeoutFeatureflag: boolean;
}

// __dirname is the project root when run via ts-node, but dist/ once compiled, so check both locations
const candidatePaths = [path.join(__dirname, 'config.json'), path.join(__dirname, '..', 'config.json')];
const configPath = candidatePaths.find(candidate => fs.existsSync(candidate)) ?? candidatePaths[0];
const config: Config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

export default config;
