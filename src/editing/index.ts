import { destroyBanner, leafBannerMap } from "src/banner";
import { plug } from "src/main";
import type { MarkdownViewState } from "src/types";
import {
    doesLeafHaveMarkdownMode,
    iterateMarkdownLeaves,
    registerSettingChangeEvent,
} from "src/utils";
import bannerExtender from "./extensions/bannerExtender";
import bannerField from "./extensions/bannerField";
import {
    openNoteEffect,
    refreshEffect,
    removeBannerEffect,
} from "./extensions/utils";

export const loadExtensions = () => {
    plug.registerEditorExtension([bannerExtender, bannerField]);

    // Properly insert a banner upon loading the banner
    // 加载横幅时正确插入横幅
    iterateMarkdownLeaves((leaf) => {
        const editor = leaf.view.editor;
        const cm = editor?.cm;
        if (cm) {
            cm.dispatch({ effects: openNoteEffect.of(null) });
        }
    }, "editing");
};

export const registerEditorBannerEvents = () => {
    // Refresh banner for specific setting changes
    registerSettingChangeEvent(
        ["frontmatterField", "useHeaderByDefault", "defaultHeaderValue"],
        () => {
            iterateMarkdownLeaves((leaf) => {
                const editor = leaf.view.editor;
                const cm = editor?.cm;
                if (cm) {
                    cm.dispatch({
                        effects: refreshEffect.of(null),
                    });
                }
            }, "editing");
        }
    );

    /* Remove unused banners when switching to reading view,
    as well as assign the correct banners when opening/switching notes in an editor */
    plug.registerEvent(
        plug.app.workspace.on("layout-change", () => {
            plug.app.workspace.iterateRootLeaves((leaf) => {
                const { id, view } = leaf;
                if (doesLeafHaveMarkdownMode(leaf)) {
                    const { mode } = (leaf.getViewState() as MarkdownViewState)
                        .state;
                    const effects =
                        mode === "source"
                            ? openNoteEffect.of(null)
                            : removeBannerEffect.of(null);

                    const editor = view.editor;
                    const cm = editor?.cm;
                    if (cm) {
                        cm.dispatch({ effects });
                    }
                } else if (leafBannerMap[id]) {
                    // When switching to a view where the editor isn't available, remove the banner manually
                    destroyBanner(id);
                }
            });
        })
    );
};
