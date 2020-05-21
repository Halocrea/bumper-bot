import * as discord from 'discord.js';
import * as dotenv from 'dotenv';

dotenv.config();
const bumperBot = new discord.Client();

bumperBot.once('ready', () => {
  bumperBot.user?.setActivity(`les tryharders`, {
    type: 'LISTENING',
  });
});

bumperBot.on('message', (msg) => {
    console.log(msg.embeds);
  if (msg.content === 'test') {
    msg.channel.send({
      embed: {
        title: 'BUMP',
        description: `Bump effectué les tryharders *Mpfmfmfmfpfffmpff* ${msg.author} `,
      },
    });
  } else {
    if (msg.embeds.length > 0 && msg.embeds[0].description?.match(/👍/)) {
      const bumper = msg.embeds[0].description;
      msg.channel.send('yolo');
    }
  }
});

// bumperBot.on('presenceUpdate', (oldPresence, newPresence) => {
//   console.log(oldPresence);
//   console.log(newPresence);
// });

bumperBot.on('rateLimit', async () => {
  const server = bumperBot.guilds.resolve(process.env.GUILD_ID!);
  const commandsChannel = server?.channels.resolve(process.env.COMMANDS_CHANNEL_ID!);
  if (commandsChannel && commandsChannel instanceof discord.TextChannel) {
    commandsChannel.send(`Il semblerait qu'on ait fait sauter le rate limit les mecs, du coup il doit y avoir un bug quelque part, contactez mes devs svp.`);
  }
})

bumperBot.login(process.env.TOKEN);