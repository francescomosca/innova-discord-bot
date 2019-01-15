import { logWarn, logError, logDebug } from "../utils/logger";
import fs = require('fs');
import path = require('path');
import jsonminify = require("jsonminify");
import { __ } from 'i18n';
import { BotSettings } from "../models/bot-settings";
import { ErrorHandler } from "../errorhandler";

export class ConfigService {
	private static _instance: ConfigService;
	private _settings: BotSettings;

	private constructor() { }
	/** Singleton */
	static getInstance() {
		if (!ConfigService._instance) {
			logDebug('CommandService instance created');
			ConfigService._instance = new ConfigService();
		}
		return ConfigService._instance;
	}

	get settings(): BotSettings {
		if (this._settings) return this._settings;

		const configFolder: string = path.resolve(__dirname, '../', '../', 'config');
		const exampleConfFilePath: string = path.resolve(configFolder, "./", "settings.example.json");
		const confFilePath: string = path.resolve(configFolder, "./", "settings.json");
		
		if (!fs.existsSync(configFolder)) { // se non esiste ./config/
			logWarn('Cartella config inesistente! Ricreo...');
			fs.mkdirSync(configFolder);
		}
		if (!fs.existsSync(confFilePath)) { // se non esiste settings.json
			try {
				if (!fs.existsSync(exampleConfFilePath)) { // se non esiste settings.example.json , ricreo l'esempio dal modello e settings.json stesso
					const initConfig = JSON.stringify(new BotSettings(), null, 4);
					fs.writeFileSync(exampleConfFilePath, initConfig, { encoding: "utf8" });
					fs.writeFileSync(confFilePath, initConfig, { encoding: "utf8" });
				} else fs.copyFileSync(exampleConfFilePath, confFilePath); // se c'è l'esempio, lo copio

				new ErrorHandler().byError('no_config');
			} catch (err) {
				logError('Non ho potuto copiare "settings.example.json": ' + err);
			}
		}
		const confFile: string = fs.readFileSync(`${configFolder}/settings.json`, { encoding: "utf8" });
		// console.log(confFile);

		const json = JSON.parse(jsonminify(confFile));
		this._settings = json;
		if ((this._settings.token == "BOT_TOKEN" || "") || (this._settings.youtubeKey == "YOUTUBE_KEY" || "")) new ErrorHandler().byError('no_config');
		return this._settings;
	}

	// set settings() ...

}