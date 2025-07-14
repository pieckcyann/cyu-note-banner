<script lang="ts">
    import { createEventDispatcher } from "svelte";
    import type { BannerDataWrite } from "src/bannerData";
    import { settings } from "src/settings/store";
    import dragBanner from "./actions/dragBanner";
    import type { DragParams, XY } from "./actions/dragBanner";
    // import lockIcon from "./actions/lockIcon";
    import type { Embedded } from ".";
    import { Notice } from "obsidian";

    interface BannerImageDispatch {
        "drag-banner": Partial<BannerDataWrite>;
        "toggle-lock": null;
    }
    const dispatch = createEventDispatcher<BannerImageDispatch>();

    export let src: string | null;
    export let x: number;
    export let y: number;
    export let lock: boolean;
    export let embed: Embedded;
    $: ({
        adjustWidthToReadableLineWidth: readableWidth,
        bannerDragModifier,
        enableDragInInternalEmbed,
        enableDragInPopover,
        style,
    } = $settings);
    let objectPos = { x, y };
    let hovering = false;
    let draggable = !bannerDragModifier;
    let dragging = false;

    const hoverOn = () => {
        hovering = true;
    };
    const hoverOff = () => {
        hovering = false;
    };
    const dragStart = () => {
        dragging = true;
    };
    const dragMove = ({ detail }: CustomEvent<XY>) => {
        objectPos = detail;
    };
    const dragEnd = ({ detail }: CustomEvent<Partial<BannerDataWrite>>) => {
        dispatch("drag-banner", detail);
        dragging = false;
    };
    const toggleDrag = ({ detail }: CustomEvent<boolean>) => {
        draggable = detail;
    };
    const toggleLock = () => dispatch("toggle-lock");

    let loadStartTime: number;

    $: if (src) {
        loadStartTime = performance.now();
    }

    let dragParam: boolean;
    $: {
        if (lock) dragParam = false;
        if (embed === "internal") dragParam = enableDragInInternalEmbed;
        if (embed === "popover") dragParam = enableDragInPopover;
        dragParam = true;
    }

    let dragBannerParams: DragParams;
    $: dragBannerParams = {
        x,
        y,
        draggable: dragParam,
        modKey: bannerDragModifier,
    };

    $: gradient = style === "gradient";
    $: objectPosStyle = `${objectPos.x * 100}% ${objectPos.y * 100}%`;
    $: translateY = objectPos.y * 100;
</script>

<!-- style:object-position={objectPosStyle} -->
<div class="banner-wrapper" class:gradient>
    <img
        {src}
        alt="Banner"
        class:readable-width={readableWidth}
        class:draggable
        class:dragging
        style="transform: translateY(-{translateY}%);"
        draggable={false}
        aria-hidden={true}
        on:mouseenter={hoverOn}
        on:mouseleave={hoverOff}
        use:dragBanner={dragBannerParams}
        on:dragBannerStart={dragStart}
        on:dragBannerMove={dragMove}
        on:dragBannerEnd={dragEnd}
        on:toggleDrag={toggleDrag}
        on:load={() => {
            const duration = performance.now() - loadStartTime;
            new Notice(`[Banner] 图片加载耗时: ${duration.toFixed(2)}ms`);
        }}
    />
</div>

<style lang="scss">
    .banner-wrapper {
        height: var(--banners-height, 330px);
        overflow: hidden;
        position: relative;
        border-radius: 15px;
        width: 100%;

        &.gradient {
            mask-image: linear-gradient(to bottom, black 50%, transparent);
            -webkit-mask-image: linear-gradient(
                to bottom,
                black 50%,
                transparent
            );
        }

        &.gradient {
            mask-image: linear-gradient(to bottom, black 70%, transparent);
            -webkit-mask-image: linear-gradient(
                to bottom,
                black 70%,
                transparent
            );
        }
    }

    img {
        display: block;
        width: 100%;
        position: relative;
        max-width: none;
        user-select: none;

        // :global(.obsidian-banner-wrapper) & {
        //     height: var(--banners-height);
        // }
        // :global(.is-mobile .obsidian-banner-wrapper) & {
        //     height: var(--banners-mobile-height);
        // }
        // :global(.obsidian-banner-wrapper.in-popover) & {
        //     height: var(--banners-popover-height);
        // }
        // :global(.obsidian-banner-wrapper.in-internal-embed) & {
        //     height: var(--banners-internal-embed-height);
        // }

        &.readable-width {
            max-width: var(--file-line-width);
            margin: 0 auto;
        }

        &.draggable {
            cursor: grab;
        }
        &.dragging {
            cursor: grabbing;
        }
    }
</style>
