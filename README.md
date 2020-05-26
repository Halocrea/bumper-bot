# Welcome to bumper-bot 👋

<p align="center">
  <img alt="Version" src="https://img.shields.io/badge/version-0.1.3-blue.svg?cacheSeconds=2592000" />
  <img src="https://img.shields.io/badge/node-%3E%3D12.16.1-blue.svg" />
  <img src="https://img.shields.io/badge/yarn-%3E%3D1.19.1-blue.svg" />
  <a href="https://choosealicense.com/licenses/gpl-3.0/" target="_blank">
    <img alt="License: GNU GPLv3" src="https://img.shields.io/badge/License-GNU GPLv3-yellow.svg" />
  </a>
  <img src="https://img.shields.io/maintenance/yes/2020" />
  <br />
  <a href="https://discord.gg/74UAq84" target="_blank">
    <img src="https://img.shields.io/discord/443833089966342145?color=7289DA&label=Halo%20Cr%C3%A9ation&logo=Discord" />
  </a>
  <a href="https://twitter.com/HaloCreation" target="_blank">
    <img src="https://img.shields.io/twitter/follow/HaloCreation?color=%232da1f3&logo=Twitter&style=flat-square" />
  </a>
</p>

> A Discord bot that handle Disboard bot bumps properly

## About

This bot is here to fill the specific needs of the Halo Creation Discord server, as the server uses a Discord bot called AmariBot to grant XP to members and as bumps done with the Disboard bot gives XP to bumping members. But this bot can be useful to you if you're searching for inspiration for your own bot that handles Disboard bot bumps.<br/><br/>
So, this bot:

- Gives a role to a member or a bump gifted member (Yes, Halo Creation members often give bumps to each other so they receive the XP haha)
- Displays a countdown to the next bump
- Displays the number of members in voice channels, or online members if there aren't

### Permissions required

In order to work properly, this bot will need this set of permissions globally:

- Manage Roles
- Manage Channels
- View Channels
- Send Messages
- Read Message History
- Connect

He also needs to be able to connect to the voice channels whose the IDs have been given.

## Install

### Create `.env` file and fill it with your information

```sh
cp sample.env .env
```

### Install and run with Docker

```sh
docker build -t voice-chat-bot .
docker run -d -v /absolute/host/path/to/saves/:app/saves --restart=always --name=voice-chat-bot voice-chat-bot
```

### Install with npm

#### Setup

```sh
npm install
```

#### Run development

```sh
npm run dev
```

#### Build

```sh
npm run build
```

#### Run build

```sh
npm start
```

## Author

👤 **Halo Creation**

- Website: https://halocrea.com
- Twitter: [@HaloCreation](https://twitter.com/HaloCreation)
- Github: [@Halocrea](https://github.com/Halocrea)

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

Feel free to check [issues page](https://github.com/Halocrea/bumper-bot/issues).

## Show your support

Give a ⭐️ if this project helped you!

---

_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_
