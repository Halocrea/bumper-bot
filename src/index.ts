import * as discord from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();
const bumperBot = new discord.Client();

bumperBot.once('ready', () => {
  console.log(`I'm ready!`);
});

bumperBot.login(process.env.TOKEN);