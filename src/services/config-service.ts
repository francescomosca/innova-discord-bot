import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { __ } from 'i18n';
import jsonminify = require('jsonminify');
import { resolve } from 'path';

import { ErrorHandler } from '../errorhandler';
import { BotSettings } from '../models/bot-settings';
import { logDebug, logError, logVerbose, logWarn } from '../utils/logger';
import { E } from '../models/errors';

export class ConfigService {
	private static _instance: ConfigService;
	private _settings: BotSettings;

	configFolder: string = resolve(__dirname, '../', '../', 'config');

	/** Singleton */
	private constructor() { }
	static getInstance() {
		if (!ConfigService._instance) {
			ConfigService._instance = new ConfigService();
			logDebug('ConfigService instance created');
		}
		return ConfigService._instance;
	}

	get settings(): BotSettings {
		if (this._settings) return this._settings;

		this._ensureConfigExists();

		const confFile: string = readFileSync(`${this.configFolder}/settings.jsonc`, { encoding: "utf8" });
		const json = JSON.parse(jsonminify(confFile));
		logVerbose(JSON.stringify(json));
		if ((json.token == "BOT_TOKEN" || "") || (json.youtubeKey == "YOUTUBE_KEY" || "")) new ErrorHandler().byError(E.NoConfig);

		this._settings = json;
		return this._settings;
	}
	// set settings ...

	private _ensureConfigExists() {
		const exampleConfFilePath: string = resolve(this.configFolder, "./", "settings.example.jsonc");
		const confFilePath: string = resolve(this.configFolder, "./", "settings.jsonc");

		if (!existsSync(this.configFolder)) { // se non esiste ./config/
			logWarn("Cartella config inesistente! Ricreo...");
			mkdirSync(this.configFolder);
		}
		if (!existsSync(confFilePath)) { // se non esiste settings.jsonc
			try {
				if (!existsSync(exampleConfFilePath)) { // se non esiste settings.example.jsonc , ricreo l'esempio dal modello e settings.jsonc stesso
					const initConfig = JSON.stringify(new BotSettings(), null, 4);
					writeFileSync(exampleConfFilePath, initConfig, { encoding: "utf8" });
					writeFileSync(confFilePath, initConfig, { encoding: "utf8" });
				} else copyFileSync(exampleConfFilePath, confFilePath); // se c'è l'esempio, lo copio

				new ErrorHandler().byError(E.NoConfig);
			} catch (err) {
				logError(`${__("Can't copy '{{fileName}}'", { fileName: 'settings.example.jsonc' })}: ${err}`);
			}
		}
	}

}