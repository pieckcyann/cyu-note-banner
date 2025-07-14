import type { DataAdapter, EventRef, WorkspaceLeaf, Plugin } from "obsidian";
import { plug } from "./main";
import type { BannerSettings } from "./settings/structure";
import type { MarkdownViewState } from "./types";

type Settings = keyof BannerSettings | Array<keyof BannerSettings>;

// Helper to check if a leaf is a Markdown file view, and if specified, if it's a specific mode
export const doesLeafHaveMarkdownMode = (
    leaf: WorkspaceLeaf,
    mode?: "reading" | "editing"
) => {
    const { type, state } = leaf.getViewState();
    if (type !== "markdown") return false;
    if (!mode) return true;
    return mode === "reading"
        ? state.mode === "preview"
        : state.mode === "source";
};

// Helper to iterate through all markdown leaves, and if specified, those with a specific view
export const iterateMarkdownLeaves = (
    cb: (leaf: WorkspaceLeaf) => void,
    mode?: "reading" | "editing"
) => {
    let leaves = plug.app.workspace.getLeavesOfType("markdown");
    if (mode) {
        leaves = leaves.filter((leaf) => {
            const { state } = leaf.getViewState() as MarkdownViewState;
            return mode === "reading"
                ? state.mode === "preview"
                : state.mode === "source";
        });
    }
    for (const leaf of leaves) cb(leaf);
};

// Helper to register multiple events at once
export const registerEvents = (events: EventRef[]) => {
    for (const event of events) plug.registerEvent(event);
};

// Helper to register a `setting-change` event
export const registerSettingChangeEvent = (
    settings: Settings,
    cb: CallableFunction
) => {
    const keys = typeof settings === "string" ? [settings] : settings;
    plug.registerEvent(
        plug.events.on("setting-change", (changed) => {
            if (keys.some((key) => Object.hasOwn(changed, key))) cb();
        })
    );
};

//

export const bannerImageMap = new Map<string, string>();

export async function scanBannerImages(plugin: Plugin) {
    const folder = "Attachment/banners";
    const folderExists = await plugin.app.vault.adapter.exists(folder);
    if (!folderExists) return;

    const files = await collectFilesRecursive(plugin.app.vault.adapter, folder);

    for (const path of files) {
        // const fileName = path.split("/").pop();
        const fileName = path.split("/").pop()?.toLowerCase();
        if (fileName) {
            const imgPath = plugin.app.vault.adapter.getResourcePath(path);
            bannerImageMap.set(fileName, imgPath);
        }
    }
}

async function collectFilesRecursive(
    adapter: DataAdapter,
    dir: string
): Promise<string[]> {
    const result: string[] = [];
    const entries = await adapter.list(dir);

    for (const file of entries.files) {
        result.push(file);
    }

    for (const subdir of entries.folders) {
        const subfiles = await collectFilesRecursive(adapter, subdir);
        result.push(...subfiles);
    }

    return result;
}
