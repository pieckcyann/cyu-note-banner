/* eslint-disable @typescript-eslint/no-this-alias */
import { Plugin } from "obsidian";
import { unloadAllBanners } from "./banner";
import BannerEvents from "./BannerEvents";
import loadCommands from "./commands";
import { loadExtensions } from "./editing";
import { loadPostProcessor } from "./reading";
import { loadSettings } from "./settings";
import { unsetCssVars } from "./settings/CssSettingsHandler";
import type { BannerSettings } from "./settings/structure";
import { scanBannerImages } from "./utils";

export let plug: BannersPlugin;

export default class BannersPlugin extends Plugin {
    settings!: BannerSettings;
    events!: BannerEvents;

    async onload() {
        plug = this;
        this.events = new BannerEvents();

        // await scanBannerImages(this);

        await loadSettings();
        loadPostProcessor();
        loadExtensions();
        loadCommands();
        this.events.loadEvents();
    }

    async onunload() {
        unloadAllBanners();
        unsetCssVars();
    }
}
