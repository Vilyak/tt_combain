import { Page as PPage, CDPSession, ElementHandle as PPElementHandle } from "puppeteer-core";
/** Recast Puppeteer private properties **/
type Page = Omit<PPage, "_client"> & {
    readonly _client: CDPSession;
};
type ElementHandle = Omit<PPElementHandle, "_page"> & {
    readonly _page: Page;
};
/**
 * Sends a synthetic scroll gesture via CDP.
 *
 * @param {Page} page
 * @param {number} distance
 * @return {Promise<void>}
 */
export declare const scrollDown: (page: Page, distance: number) => Promise<void>;
/**
 * Primary vertical scroll function.
 * Accepts a target element and scrolls a randomized distance until intersecting viewport.
 *
 * @param {ElementHandle} el
 * @return {Promise<void>}
 */
export declare const scrollTo: (el: ElementHandle) => Promise<void>;
export {};
