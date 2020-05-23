import * as discord from 'discord.js';
import * as dotenv from 'dotenv';
import { updateLastBump } from './models/LastBump';
import {
  getPreviousBumpers,
  addLastBumper,
  getLastBumpers,
  deletePreviousBumpers,
} from './models/LastBumpers';

dotenv.config();
const bumperBot = new discord.Client();

// To help handle multi bumps
let timeoutId: NodeJS.Timeout;
// To refresh the bump countdown
let intervalId: NodeJS.Timeout;

bumperBot.once('ready', () => {
  bumperBot.user?.setActivity(`les tryharders`, {
    type: 'LISTENING',
  });
  getMembersCount(bumperBot);
});

bumperBot.on('rateLimit', async () => {
  const server = bumperBot.guilds.resolve(process.env.GUILD_ID!);
  const commandsChannel = server?.channels.resolve(
    process.env.COMMANDS_CHANNEL_ID!
  );
  if (commandsChannel && commandsChannel instanceof discord.TextChannel) {
    commandsChannel.send(
      `Il semblerait qu'on ait fait sauter le rate limit les mecs, du coup il doit y avoir un bug quelque part, contactez les admins et/ou mes devs svp.`
    );
  }
});

bumperBot.on('voiceStateUpdate', () => {
  getMembersCount(bumperBot);
});

bumperBot.on('presenceUpdate', (oldPresence, newPresence) => {
  if (
    newPresence.status === 'offline' ||
    (oldPresence && oldPresence.status === 'offline')
  ) {
    getMembersCount(bumperBot);
    // We want to display the disboard status if something happened
    if (
      newPresence.userID === process.env.DISBOARD_BOT_ID ||
      oldPresence?.userID === process.env.DISBOARD_BOT_ID
    ) {
      const server = bumperBot.guilds.resolve(process.env.GUILD_ID!);
      const countdownChannel = server?.channels.cache.get(
        process.env.BUMP_COUNTDOWN_CHANNEL_ID!
      );
      if (newPresence.status === 'offline') {
        countdownChannel?.setName('⚰️ Bumps off atm');
      } else {
        countdownChannel?.setName('😇 Bumps revenus');
      }
    }
  }
});

bumperBot.on('message', (msg) => {
  if (!msg.guild) return; // no DM allowed

  /* 
    TO DO:
    - Clean code
  */

  if (msg.content.startsWith('test')) {
    if (msg.author.id === '153809151221301257') msg.channel.send('test');
    msg.channel.send({
      embed: {
        title: 'BUMP',
        description: `Bump effectué les tryharders *Mpfmfmfmfpfffmpff* ${msg.author} 👍`,
      },
    });
  } else {
    if (
      msg.author.id === process.env.DISBOARD_BOT_ID &&
      msg.embeds.length > 0 &&
      msg.embeds[0].description?.match(/👍/)
    ) {
      // We save the last bump date
      const bumpDate = updateLastBump();
      const idMatching = msg.embeds[0].description.match(/[0-9]{18}/);
      if (idMatching) {
        const bumperId = idMatching[0];
        const bumper = msg.guild.members.resolve(bumperId);
        if (bumper) {
          // We get back at the bump message to see if the bump is gifted or not
          const bumpingMessage = bumper.lastMessage;
          if (
            bumpingMessage?.mentions.members &&
            bumpingMessage?.mentions.members.size > 0
          ) {
            const giftedMember = bumpingMessage?.mentions.members.first();
            handleBumper(giftedMember!, msg.guild, bumpDate);
          } else {
            handleBumper(bumper, msg.guild, bumpDate);
          }
        }
      }
    }
  }
});

async function handleBumper(
  bumper: discord.GuildMember,
  server: discord.Guild,
  bumpDate: Date
) {
  const bumperRole = server.roles.cache.get(process.env.BUMPER_ROLE_ID!);
  const previousBumpers = getPreviousBumpers(bumpDate);

  addLastBumper({ bumpedAt: bumpDate, bumperId: bumper.id });
  if (previousBumpers && previousBumpers.length > 0) {
    // We don't want to update the role on someone who had the previous bump
    if (
      !previousBumpers?.some(
        (previousBumper) => previousBumper.bumperId === bumper.id
      )
    ) {
      await bumper.roles.add(process.env.BUMPER_ROLE_ID!);
    }

    // We clear the previous bumpers to keep the database clean
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      const lastBumpers = getLastBumpers(bumpDate).map(
        (bumper) => bumper.bumperId
      );
      for (let previousBumper of previousBumpers) {
        if (!lastBumpers.includes(previousBumper.bumperId)) {
          const bumperToRemoveRole = bumperRole?.members.get(
            previousBumper.bumperId
          );
          await bumperToRemoveRole?.roles.remove(process.env.BUMPER_ROLE_ID!);
        }
      }
      deletePreviousBumpers(bumpDate);
    }, 1500);

    handleCountdown(bumperBot, server);
  } else {
    await bumper.roles.add(process.env.BUMPER_ROLE_ID!);
  }
}

function handleCountdown(bumperBot: discord.Client, server: discord.Guild) {
  const countdownChannel = server.channels.cache.get(
    process.env.BUMP_COUNTDOWN_CHANNEL_ID!
  );

  // Initialization
  clearInterval(intervalId);
  let countdownMinutes = 120;
  countdownChannel?.setName(`⏳ 2h00 avant le bump !`);

  // Every minute, we refresh the countdown
  intervalId = setInterval(() => {
    countdownMinutes--;
    const hours = Math.floor(countdownMinutes / 60);
    const minutes = countdownMinutes % 60;
    if (hours === 0 && minutes === 0) {
      countdownChannel?.setName(`🔔 C'est l'heure du bump ! 🔔`);
      clearInterval(intervalId);
    } else {
      countdownChannel?.setName(
        `⏳ ${hours}h${minutes < 10 ? '0' + minutes : minutes} avant le bump !`
      );
    }
  }, 60000);
}

// We want to display the amount of people in voice chat
// Else we want to display the amount of people online
function getMembersCount(bumperBot: discord.Client) {
  const server = bumperBot.guilds.resolve(process.env.GUILD_ID!);
  if (server) {
    let peopleInVoice = 0;
    const voiceChannels = server.channels.cache.filter(
      (channel) => channel.type === 'voice'
    );

    if (voiceChannels && voiceChannels.size > 0) {
      voiceChannels.each((channel) => {
        peopleInVoice += channel.members.size;
      });
    }

    const countingChannel = server.channels.cache.get(
      process.env.MEMBERS_COUNT_CHANNEL_ID!
    );
    if (countingChannel) {
      if (peopleInVoice < 1) {
        const peopleOnline = server.members.cache.filter(
          (member) => member.presence.status !== 'offline'
        ).size;
        const newName = `⚡ ${peopleOnline} membres en ligne`;
        if (countingChannel.name !== newName) {
          countingChannel.setName(newName);
        }
      } else {
        const newName = `📣 ${peopleInVoice} membres en vocal`;
        if (countingChannel.name !== newName) {
          countingChannel.setName(`📣 ${peopleInVoice} membres en vocal`);
        }
      }
    }
  }
}

bumperBot.login(process.env.TOKEN);
