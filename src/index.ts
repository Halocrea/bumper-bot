import * as discord from 'discord.js';
import * as dotenv from 'dotenv';
import { updateLastBump, getTimeDifferenceWithLastBump } from './models/LastBump';
import {
  getPreviousBumpers,
  addLastBumper,
  getLastBumpers,
  deletePreviousBumpers,
} from './models/LastBumpers';

dotenv.config();
const bumperBot = new discord.Client({
  intents: [
    'GUILDS',
    'GUILD_MEMBERS',
    'GUILD_MESSAGES',
    'GUILD_PRESENCES'
  ]
});

// To help handle multi bumps
let timeoutId: NodeJS.Timeout;
// To refresh the bump countdown
let intervalId: NodeJS.Timeout;
// To reset the countdown when the disboard bot is alive again
let disboardTimeoutId: NodeJS.Timeout;

// gifs for when we have to handle bumps ourselves
const successfulBump = [
  'https://media.discordapp.net/attachments/443844498074632192/674203710909579264/halfjaw-speech.gif',
  'https://media.discordapp.net/attachments/572511139632775204/679346631178715146/giphy.gif',
  'https://media.discordapp.net/attachments/614835042023112707/675388268598263822/ezgif.com-video-to-gif_14.gif',
];

bumperBot.once('ready', () => {
  bumperBot.user?.setActivity(`halocrea.com`, {
    type: 'WATCHING',
  });

  handleCountdown(true);
});

bumperBot.on('rateLimit', async (rateLimitInfo) => {
  // send the error info to the bot's maintainer
  try {
    const maintainer = await bumperBot.users.fetch(process.env.MAINTAINER_ID || '');
    if (maintainer) {
      await maintainer.send(
        {
          embeds: [
            new discord.MessageEmbed()
              .setColor('#ff0000')
              .setTitle('RateLimit atteint')
              .setDescription(
                'L\'évènement "rateLimit" a été déclenché pour moi ; j\'ai obtenu les infos suivantes :'
              )
              .addField('Méthode qui a déclenchée le rate limit', rateLimitInfo.method)
              .addField('Chemin', rateLimitInfo.path)
              .addField('Route', rateLimitInfo.route)
              .addField('Timeout', `${rateLimitInfo.timeout}`, true)
              .addField('Limite', `${rateLimitInfo.limit}`, true)
          ]
        }
      );
    } else console.log(`couldn't send the rateLimitInfo to Grena`);
  } catch (err) {
    console.log(err);
  }
});

bumperBot.on('messageCreate', async (msg) => {
  if (!msg.guild) return; // no DM allowed

  const disboardBot = await bumperBot!.guilds
    .resolve(process.env.GUILD_ID!)!
    .members.fetch(process.env.DISBOARD_BOT_ID!);

  // if (msg.content.startsWith(process.env.COMMAND_PREFIX!)) {
  //   // To know precisely when the next bump gonna happen
  //   const timeDifference = getTimeDifferenceWithLastBump();
  //   if (0 < timeDifference && timeDifference >= 7200000) {
  //     msg.channel.send(
  //       new discord.MessageEmbed()
  //         .setColor(8781568)
  //         .setTitle('🔔 Bump disponible')
  //         .setDescription('Le bump est dispo, fonce !')
  //     );
  //   } else {
  //     let countdownMinutes = 120 - Math.floor(timeDifference / 60000);
  //     const timeRemaining = getTimeRemaining(countdownMinutes);
  //     const seconds = (7200 - Math.floor(timeDifference / 1000)) % 60;
  //     msg.channel.send(
  //       new discord.MessageEmbed()
  //         .setColor(15968821)
  //         .setTitle('⏳ Compte à rebours')
  //         .setDescription(
  //           `Temps jusqu'au prochain bump: ${timeRemaining.hours}h${
  //             timeRemaining.minutes < 10
  //               ? '0' + (timeRemaining.minutes - 1)
  //               : timeRemaining.minutes - 1
  //           } et ${seconds} secondes (à peu près)`
  //         )
  //     );
  //   }
  // } else if (msg.content.startsWith('!d bump') && disboardBot.presence.status === 'offline') {
  if (msg.content.startsWith('!d bump') && disboardBot.presence?.status === 'offline') {
    const timeDifference = getTimeDifferenceWithLastBump();
    if (timeDifference === 0 || timeDifference >= 7200000) {
      // Bumper validation -> handle if the bump is gifted or not
      findBumper(msg, true);

      // Validation message
      const pepeKing = bumperBot.emojis.cache.find((emoji) => emoji.name === 'Pepe_King');
      msg.channel.send({
        embeds: [
          new discord.MessageEmbed()
          .setColor('#00ae86')
          .setTitle('MAJOR LEAGUE BUMPING')
          .setURL('https://halocrea.com/')
          .setDescription(
            `${msg.author}, \nBump effectué 👍 \n${pepeKing} Le rôle "Bumper" est maintenant au bénéficiaire !`
          )
          .setImage(successfulBump[Math.floor(Math.random() * successfulBump.length)])
        ]
      });
    } else {
      msg.channel.send({
        embeds: [
          new discord.MessageEmbed()
            .setColor('#eb4c61')
            .setTitle("Eeeeet c'est NON !")
            .setURL('https://halocrea.com/')
            .setDescription(
              `Faut bumper au bon moment, ${msg.author}. Tu sais, quand le gros compte à rebours en haut à gauche dit "🔔 C'est l'heure du bump ! 🔔".`
            )
            .setImage(
              'https://media.discordapp.net/attachments/443844498074632192/674694609389092872/ezgif.com-video-to-gif_15.gif'
            )
        ]
      });
    }
  } else {
    if (
      msg.author.id === process.env.DISBOARD_BOT_ID &&
      msg.embeds.length > 0 &&
      (msg.embeds[0].description?.match(/:thumbsup:/) || msg.embeds[0].description?.match(/👍/))
    ) {
      // Bumper validation -> handle if the bump is gifted or not
      findBumper(msg);
    }
  }
});

function findBumper(msg: discord.Message, disboardBotOff = false) {
  // We save the last bump date
  const bumpDate = updateLastBump();
  const idMatching = disboardBotOff
    ? [msg.author.id]
    : msg.embeds[0].description!.match(/[0-9]{18}/);
  if (idMatching) {
    const bumperId = idMatching[0];
    const bumper = msg.guild!.members.resolve(bumperId);
    if (bumper) {
      // We get back at the bump message to see if the bump is gifted or not
      // const bumpingMessage = bumper.lastMessage;
      // if (bumpingMessage?.mentions.members && bumpingMessage?.mentions.members.size > 0) {
      //   const giftedMember = bumpingMessage?.mentions.members.first();
      //   handleBumper(giftedMember!, msg.guild!, bumpDate, msg);
      // } else {
        handleBumper(bumper, msg.guild!, bumpDate, msg);
      // }
    }
  }
}

async function handleBumper(
  bumper: discord.GuildMember,
  server: discord.Guild,
  bumpDate: Date,
  msg: discord.Message
) {
  const bumperRole = server.roles.cache.get(process.env.BUMPER_ROLE_ID!);
  const previousBumpers = getPreviousBumpers(bumpDate);

  addLastBumper({ bumpedAt: bumpDate, bumperId: bumper.id });
  msg.channel.send(`✅ Bump effectué pour : ***${bumper.nickname ?? bumper.user.username}***`);
  if (previousBumpers && previousBumpers.length > 0) {
    // We don't want to update the role on someone who had the previous bump
    if (!previousBumpers?.some((previousBumper) => previousBumper.bumperId === bumper.id)) {
      await bumper.roles.add(process.env.BUMPER_ROLE_ID!);
    }

    // We clear the previous bumpers to keep the database clean
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
      const lastBumpers = getLastBumpers(bumpDate).map((bumper) => bumper.bumperId);
      for (let previousBumper of previousBumpers) {
        if (!lastBumpers.includes(previousBumper.bumperId)) {
          const bumperToRemoveRole = bumperRole?.members.get(previousBumper.bumperId);
          await bumperToRemoveRole?.roles.remove(process.env.BUMPER_ROLE_ID!);
        }
      }
      deletePreviousBumpers(bumpDate);
    }, 1500);

    handleCountdown();
  } else {
    await bumper.roles.add(process.env.BUMPER_ROLE_ID!);
    handleCountdown();
  }
}

function handleCountdown(countdownUpdate = false) {
  const server = bumperBot.guilds.resolve(process.env.GUILD_ID!);
  if (server) {
    const countdownChannel = server.channels.cache.get(process.env.BUMP_COUNTDOWN_CHANNEL_ID!);
    if (countdownChannel) {
      // We clear the Disboard timeout because if we're here, it means that we don't need it anymore
      clearTimeout(disboardTimeoutId);
      clearInterval(intervalId);

      if (countdownUpdate) {
        const timeDifference = getTimeDifferenceWithLastBump();
        if (0 < timeDifference && timeDifference <= 7200000) {
          let countdownMinutes = 120 - Math.floor(timeDifference / 60000);
          const timeRemaining = getTimeRemaining(countdownMinutes);
          countdownChannel?.setName(
            `⏳ ${timeRemaining.hours}h${
              timeRemaining.minutes < 10 ? '0' + timeRemaining.minutes : timeRemaining.minutes
            } avant le bump !`
          );

          // We recalibrate the countdown so it goes 10 minutes by 10 minutes
          const minutesToCalibrate = countdownMinutes % 10;
          if (minutesToCalibrate > 0) {
            setTimeout(() => {
              const minutes = timeRemaining.minutes - minutesToCalibrate;
              countdownChannel?.setName(
                `⏳ ${timeRemaining.hours}h${
                  minutes < 10 ? '0' + minutes : minutes
                } avant le bump !`
              );
              setCountdownInterval(countdownMinutes);
            }, minutesToCalibrate * 60000);
          } else {
            setCountdownInterval(countdownMinutes);
          }
        } else {
          countdownChannel?.setName(`🔔 C'est l'heure du bump ! 🔔`);
        }
      } else {
        // Initialization
        let countdownMinutes = 120;
        countdownChannel?.setName(`⏳ 2h00 avant le bump !`);

        setCountdownInterval(countdownMinutes);
      }
    }
  }
}

async function setCountdownInterval(countdownMinutes: number) {
  // Every 10 minutes, we refresh the countdown
  intervalId = setInterval(async () => {
    const server = bumperBot.guilds.resolve(process.env.GUILD_ID!);
    if (server) {
      const countdownChannel = server.channels.cache.get(process.env.BUMP_COUNTDOWN_CHANNEL_ID!);
      if (countdownChannel) {
        countdownMinutes = countdownMinutes - 10;
        const timeRemaining = getTimeRemaining(countdownMinutes);
        if (timeRemaining.hours <= 0 && timeRemaining.minutes <= 0) {
          try {
            const newName = `🔔 C'est l'heure du bump ! 🔔`;
            await countdownChannel.setName(newName);
            clearInterval(intervalId);
          } catch (error) {
            console.error(error);
          }
        } else {
          try {
            const newName = `⏳ ${timeRemaining.hours}h${
              timeRemaining.minutes < 10 ? '0' + timeRemaining.minutes : timeRemaining.minutes
            } avant le bump !`;
            await countdownChannel.setName(newName);
          } catch (error) {
            console.error(error);
          }
        }
      }
    }
  }, 10 * 60000);
}

function getTimeRemaining(countdownMinutes: number): { hours: number; minutes: number } {
  const hours = Math.floor(countdownMinutes / 60);
  const minutes = countdownMinutes % 60;
  return { hours, minutes };
}

bumperBot.login(process.env.TOKEN);
