import { Keymap, Notice } from "obsidian";
import type { Action } from "svelte/action";
import type { BannerDataWrite } from "src/bannerData";
import type { BannerDragModOption } from "src/settings/structure";

let minY = 0;
let maxY = 0;

type MTEvent = MouseEvent | TouchEvent;

export interface XY {
    x: number;
    y: number;
}
export interface DragParams extends XY {
    draggable: boolean;
    modKey: BannerDragModOption;
}

interface DragAttributes {
    "on:dragBannerStart": (e: CustomEvent) => void;
    "on:dragBannerMove": (e: CustomEvent<XY>) => void;
    "on:dragBannerEnd": (e: CustomEvent<Partial<BannerDataWrite>>) => void;
    "on:toggleDrag": (e: CustomEvent<boolean>) => void;
}

type DragBannerAction = Action<HTMLImageElement, DragParams, DragAttributes>;

// Clamp a value if needed, otherwise round it to 3 decimals
// 如果需要，限制一个值，否则将其四舍五入到小数点后 3 位
const clampAndRound = (min: number, value: number, max: number) => {
    if (value > max) return max;
    if (value < min) return min;
    return Math.round(value * 1000) / 1000;
};

const getMousePos = (e: MTEvent): [number, number] => {
    const { clientX, clientY } =
        e instanceof MouseEvent ? e : e.targetTouches[0];
    return [clientX, clientY];
};

// Svelte action for banner dragging
const dragBanner: DragBannerAction = (img, params) => {
    const { x, y, draggable: _draggable, modKey: _modKey } = params;
    let draggable = _draggable;
    let dragging = false;
    let isVerticalDrag = false;
    let imageSize = { width: 0, height: 0 };
    let prev = { x: 0, y: 0 };
    let objectPos = { x, y };
    let modKey = _modKey;

    const dragStart = (e: MTEvent) => {
        if (modKey !== "None" && !Keymap.isModifier(e, modKey)) return;

        const [x, y] = getMousePos(e);
        prev = { x, y };
        dragging = true;

        // Get "drag area" dimensions (image size with "covered" area, then subtract image dimensions)
        // 获取“拖动区域”尺寸（图像大小加上“覆盖”区域，然后减去图像尺寸）
        // const { clientHeight, clientWidth, naturalHeight, naturalWidth } = img; // 	实际渲染宽高度、图片自身原始宽高度
        const { naturalHeight, naturalWidth } = img; // 实际渲染宽高度
        const clientHeight = 330;
        const clientWidth = naturalWidth;

        const clientRatio = clientWidth / clientHeight;
        const naturalRatio = naturalWidth / naturalHeight;
        isVerticalDrag = naturalRatio <= clientRatio;

        if (isVerticalDrag && imageSize.height > 0) {
            const imageRenderedHeight = clientWidth / naturalRatio;
            const overflowHeight = imageRenderedHeight - clientHeight;

            // 图片可视区域最多上移的百分比（相对于整张图片）
            maxY = overflowHeight / imageRenderedHeight;
            minY = 0;
        } else {
            // 不垂直拖动时 y 不动
            minY = objectPos.y;
            maxY = objectPos.y;
        }

        imageSize = isVerticalDrag
            ? { width: 0, height: clientWidth / naturalRatio - clientHeight }
            : { width: clientHeight * naturalRatio - clientWidth, height: 0 };
        img.dispatchEvent(new CustomEvent("dragBannerStart"));
    };

    const dragMove = (e: MTEvent) => {
        if (!dragging) return;

        // Get the movement delta
        // 获取移动增量
        const [x, y] = getMousePos(e);
        const delta = { x: prev.x - x, y: prev.y - y };
        prev = { x, y };

        // Calculate the drag offset and add this result to the object-position percentages
        // 计算拖动偏移并将此结果添加到对象位置百分比
        const drag = {
            x: isVerticalDrag ? 0 : delta.x / imageSize.width,
            y: isVerticalDrag ? delta.y / imageSize.height : 0,
        };
        objectPos = {
            x: clampAndRound(0, objectPos.x + drag.x, 1),
            y: clampAndRound(minY, objectPos.y + drag.y, 1 - maxY),
        };
        // new Notice(`${objectPos.x}、${objectPos.y}`);

        img.dispatchEvent(
            new CustomEvent<XY>("dragBannerMove", { detail: objectPos })
        );
    };

    const dragEnd = () => {
        if (!dragging) return;

        dragging = false;
        const detail = isVerticalDrag ? { y: objectPos.y } : { x: objectPos.x };
        img.dispatchEvent(
            new CustomEvent<Partial<BannerDataWrite>>("dragBannerEnd", {
                detail,
            })
        );
    };

    const modKeyHeld = (e: KeyboardEvent) => {
        if (e.repeat) return;
        const detail =
            draggable && (modKey === "None" || Keymap.isModifier(e, modKey));
        img.dispatchEvent(new CustomEvent<boolean>("toggleDrag", { detail }));
    };

    // Drag listeners
    const addDragListeners = () => {
        img.addEventListener("mousedown", dragStart);
        img.addEventListener("mousemove", dragMove);
        img.addEventListener("mouseup", dragEnd);
        document.addEventListener("mouseup", dragEnd);
    };

    const removeDragListeners = () => {
        img.removeEventListener("mousedown", dragStart);
        img.removeEventListener("mousemove", dragMove);
        img.removeEventListener("mouseup", dragEnd);
        document.removeEventListener("mouseup", dragEnd);
    };

    const toggleDragListeners = (newDraggable: boolean) => {
        draggable = newDraggable;
        if (draggable) addDragListeners();
        else removeDragListeners();
    };

    // Toggle listeners
    const addToggleListeners = () => {
        document.addEventListener("keydown", modKeyHeld);
        document.addEventListener("keyup", modKeyHeld);
    };

    const removeToggleListeners = () => {
        document.removeEventListener("keydown", modKeyHeld);
        document.removeEventListener("keyup", modKeyHeld);
    };

    const toggleToggleListeners = (newModKey: BannerDragModOption) => {
        modKey = newModKey;
        if (modKey === "None") removeToggleListeners();
        else addToggleListeners();
    };

    if (draggable) addDragListeners();
    if (modKey !== "None") addToggleListeners();

    return {
        update(params) {
            const { x, y, draggable: newDraggable, modKey: newModKey } = params;
            if (draggable !== newDraggable) toggleDragListeners(newDraggable);
            if (modKey !== newModKey) toggleToggleListeners(newModKey);

            objectPos = { x, y };
            img.dispatchEvent(
                new CustomEvent<XY>("dragBannerMove", { detail: objectPos })
            );
        },
        destroy() {
            removeDragListeners();
            removeToggleListeners();
        },
    };
};

export default dragBanner;
