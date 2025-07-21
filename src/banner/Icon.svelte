<script lang="ts">
    /* eslint-disable-next-line import/default, import/no-named-as-default,
import/no-named-as-default-member */
    import twemoji from "@twemoji/api";
    import { createEventDispatcher } from "svelte";
    import type { IconString } from "src/bannerData";
    import { settings } from "src/settings/store";
    import { getInternalImage } from "./utils";
    import { Notice, TFile } from "obsidian";

    const dispatch = createEventDispatcher();

    export let icon: IconString;
    export let isEmbed: boolean;

    export let file: TFile;

    const handleIconClick = () => {
        if (isEmbed) return;
        dispatch("open-icon-modal");
    };

    $: ({ headerDecor: decor, useTwemoji } = $settings);
    $: ({ type, value } = icon);

    $: html =
        type === "emoji" && useTwemoji
            ? twemoji.parse(value, { className: "banner-emoji" }) // 返回解析后的 IMG 标签
            : `<img class="banner-emoji" draggable="false" alt="💯" src="${getInternalImage(value, file.path)}">`;

    // $: html = `<img class="banner-emoji" draggable="false" alt="💯" src="app://43ac2bffef225e4e37c2de680d07ec89b983/E:/OB%20vault/Endless-learning/Attachment/others/gal/ガルドマ-女子寮の管理人-After/%e3%82%ac%e3%83%ab%e3%83%89%e3%83%9e-%e5%a5%b3%e5%ad%90%e5%af%ae%e3%81%ae%e7%ae%a1%e7%90%86%e4%ba%ba-After.ico">`;

    // $: html = `<img class="banner-emoji" draggable="false" alt="💯" src="${getInternalImage(value, file.path)}">`;
</script>

<div
    class="banner-icon"
    class:embed={isEmbed}
    class:text-icon={type === "text"}
    class:emoji-icon={type === "emoji"}
    class:shadow={decor === "shadow"}
    class:border={decor === "border"}
    role="button"
    tabindex="-1"
    on:click={handleIconClick}
    on:keydown={(e) => e.code === "Enter" && handleIconClick()}
>
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html html}
</div>

<style lang="scss">
    .banner-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: calc(1em + 8px);
        width: calc(1em + 8px);
        border-radius: 6px;
        transition: ease 0.2s background;
        font-size: var(--banners-icon-font-size);

        &:not(.embed) {
            cursor: pointer;
            &:hover {
                background: #aaa4;
            }
        }

        &.emoji-icon {
            &.shadow :global(img.banner-emoji) {
                filter: drop-shadow(0 0 3px var(--background-primary));
            }
            &.border :global(img.banner-emoji) {
                filter: drop-shadow(1px 1px 0 var(--background-primary))
                    drop-shadow(1px -1px 0 var(--background-primary))
                    drop-shadow(-1px 1px 0 var(--background-primary))
                    drop-shadow(-1px -1px 0 var(--background-primary));
            }
        }

        :global(img.banner-emoji) {
            height: 1em;
            width: 1em;

            &.banner-image-icon {
                border-radius: 50%;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            }
        }
    }
</style>
