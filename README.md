<h1 align="center">
Innova Discord Bot
</h1>

## Installation

### Requires:

- [Git](https://git-scm.com/downloads)
- Node.js ([Windows](https://nodejs.org/it/) | [macOS/Linux](https://github.com/nodesource/distributions/blob/master/README.md#installation-instructions))
- windows-build-tools: `npm i -g windows-build-tools` <!-- searching for another solution -->

1. Download the repo: `git clone https://github.com/francescomosca/innova-discord-bot.git`
2. Go to the project folder: `cd innova-discord-bot`
3. Install the project packages via the following command: `npm i`

## Configuration

1. Go to the folder `config` and rename `settings.example.jsonc` to `settings.jsonc`
2. Set `token`: Go to your [application page](https://discordapp.com/developers/applications/me) and get your token by following [this video](https://drive.google.com/file/d/1wZG_TBVfjQfj0CEYaRTzS60D-cbfeeYZ/view).
3. Set `youtubeKey`: [Get your key here](https://console.cloud.google.com/apis/library/youtube.googleapis.com)

## Usage

Launch the bot:
> npm run start

Launch the bot in development mode and live reload:
> npm run serve

## Todo
See: [Milestones](https://github.com/francescomosca/innova-discord-bot/milestones)

- [ ] Localization (70%)
- [ ] Command modules (probably merging with categories)
- [ ] Testing

## Credits

Creator: **Francesco Mosca** - <francesco.mosca@outlook.com> 

A special thanks to [DESPLATS Philippe](https://github.com/RedekProject/) for making his [DiscordJS TypeScript Starter](https://github.com/RedekProject/DiscordJS-TypeScript-Starter-Gulp).

#### Works with:
* [Discord.JS](https://github.com/discordjs/discord.js) - A powerful JavaScript library for interacting with the Discord API
* [TypeScript](https://github.com/Microsoft/TypeScript) - A superset of JavaScript that compiles to clean JavaScript output.

## License

This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/francescomosca/innova-discord-bot/blob/dev/LICENSE) file for details.