import { App, Notice, requestUrl } from "obsidian";
import { IMAGE_EXTENSIONS } from "src/bannerData";
import { plug } from "src/main";
import { bannerImageMap } from "src/utils";

const FILE_REGEX = /^\[\[.+\]\]/;
const imageCache: Record<string, string> = {};

export const getInternalImage = (link: string, currentPath: string): string => {
    if (link.contains("[[")) link = link.slice(2, -2);
    const file = plug.app.metadataCache.getFirstLinkpathDest(link, currentPath);
    if (!file) {
        throw new Error(`${link} file does not exist!`);
    } else if (!IMAGE_EXTENSIONS.includes(file.extension)) {
        throw new Error(`${file.name} is not an image!`);
    }

    // console.log("file.name: " + file.name);

    const resourcePath = plug.app.vault.getResourcePath(file).split("?")[0];

    // let resourcePath = plug.app.vault.getResourcePath(file);
    // resourcePath = "app://018763cce436733d0b1a1a4009e98e844d14/E:/OB%20vault/Endless-learning/Attachment/banners/@%E6%B7%B1%E5%87%A1%20%E5%85%94%E5%B9%B4%E4%B8%80%E8%B5%B7%E5%90%83jio....%E9%A5%BA%E7%A0%B8.png?1752156181801"

    // imageCache[file.path] = resourcePath;

    // const fileName = link.slice(2, -2).toLowerCase();
    // const resourcePath = bannerImageMap.get(fileName) ?? "";
    // imageCache[currentPath] = resourcePath;

    return resourcePath;
};

const getRemoteImage = async (src: string) => {
    try {
        // Error out if the string isn't a valid URL
        new URL(src);

        const resp = await requestUrl(src);
        const blob = new Blob([resp.arrayBuffer], {
            type: resp.headers["content-type"],
        });
        return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                const result = reader.result as string;
                imageCache[src] = result;
                resolve(result);
            };
            reader.onerror = (error) => reject(error);
        });
    } catch (error) {
        console.error(error);
        throw new Error(`Failed to fetch image from "${src}"!`);
    }
};

export const fetchImage = async (
    src: string,
    currentPath: string
): Promise<string | null> => {
    // Check the image cache first
    // if (imageCache[src]) return imageCache[src];

    if (FILE_REGEX.test(src)) {
        return getInternalImage(src, currentPath);
    } else {
        return getRemoteImage(src);
    }
};

export const flushImageCache = () => {
    for (const key in imageCache) delete imageCache[key];
};
