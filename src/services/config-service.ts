import { logWarn, logError, logDebug, logVerbose } from "../utils/logger";
import fs = require('fs');
import jsonminify = require("jsonminify");
import { __ } from 'i18n';
import { BotSettings } from "../models/bot-settings";
import { ErrorHandler } from "../errorhandler";

// because of webpack madness
const confFile = require('Settings');
const exampleConfFile = require('SettingsExample');

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

		this._ensureConfigExists();

		const jsoncToJson = jsonminify(confFile);
		console.log("jsoncToJson: ", jsoncToJson);
		const json = JSON.parse(jsoncToJson);
		logVerbose(JSON.stringify(json));
		if ((json.token == "BOT_TOKEN" || "") || (json.youtubeKey == "YOUTUBE_KEY" || "")) new ErrorHandler().byError('no_config');

		this._settings = json;
		return this._settings;
	}
	// set settings ...

	private _ensureConfigExists() {
		// console.log('confFile: ', confFile);
		// console.log('exampleConfFile: ', exampleConfFile);

		if (!confFile) { // se non esiste settings.jsonc
			console.log('NON esiste!');
			try {
				/* if (!fs.existsSync(exampleConfFile)) { // se non esiste settings.example.jsonc , ricreo l'esempio dal modello e settings.jsonc stesso
					const initConfig = JSON.stringify(new BotSettings(), null, 4);
					fs.writeFileSync(exampleConfFile, initConfig, { encoding: "utf8" });
					fs.writeFileSync(confFile, initConfig, { encoding: "utf8" });
				} else fs.copyFileSync(exampleConfFile, confFile); // se c'è l'esempio, lo copio
				*/
				new ErrorHandler().byError('no_config');
			} catch (err) {
				logError(`${__("Can't copy '{{fileName}}'", { fileName: 'settings.example.jsonc' })}: ${err}`);
			}
		} else console.log('Esiste!');
	}

}