import { logWarn, logError, logDebug, logVerbose } from "../utils/logger";
import fs = require('fs');
import path = require('path');
import jsonminify = require("jsonminify");
import { __ } from 'i18n';
import { BotSettings } from "../models/bot-settings";
import { ErrorHandler } from "../errorhandler";

export class ConfigService {
	private static _instance: ConfigService;
	private _settings: BotSettings;

	configFolder: string = path.resolve(__dirname, '../', '../', 'config');

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

		this._ensureConfigExists();

		const confFile: string = fs.readFileSync(`${this.configFolder}/settings.jsonc`, { encoding: "utf8" });
		const json = JSON.parse(jsonminify(confFile));
		logVerbose(JSON.stringify(json));
		if ((json.token == "BOT_TOKEN" || "") || (json.youtubeKey == "YOUTUBE_KEY" || "")) new ErrorHandler().byError('no_config');

		this._settings = json;
		return this._settings;
	}
	// set settings ...

	private _ensureConfigExists() {
		const exampleConfFilePath: string = path.resolve(this.configFolder, "./", "settings.example.jsonc");
		const confFilePath: string = path.resolve(this.configFolder, "./", "settings.jsonc");

		if (!fs.existsSync(this.configFolder)) { // se non esiste ./config/
			logWarn("Cartella config inesistente! Ricreo...");
			fs.mkdirSync(this.configFolder);
		}
		if (!fs.existsSync(confFilePath)) { // se non esiste settings.jsonc
			try {
				if (!fs.existsSync(exampleConfFilePath)) { // se non esiste settings.example.jsonc , ricreo l'esempio dal modello e settings.jsonc stesso
					const initConfig = JSON.stringify(new BotSettings(), null, 4);
					fs.writeFileSync(exampleConfFilePath, initConfig, { encoding: "utf8" });
					fs.writeFileSync(confFilePath, initConfig, { encoding: "utf8" });
				} else fs.copyFileSync(exampleConfFilePath, confFilePath); // se c'è l'esempio, lo copio

				new ErrorHandler().byError('no_config');
			} catch (err) {
				logError(`${__("Can't copy '{{fileName}}'", { fileName: 'settings.example.jsonc' })}: ${err}`);
			}
		}
	}

}