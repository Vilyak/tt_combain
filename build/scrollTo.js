"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrollTo = exports.scrollDown = void 0;
const node_crypto_1 = require("node:crypto");
/**
 * Determine viewport height to use as base for each scroll distance.
 *
 * @param {Page} page
 * @return {number}
 */
const getViewportHeight = (page) => {
    var _a;
    const height = (_a = page.viewport()) === null || _a === void 0 ? void 0 : _a.height;
    if (height) {
        return height;
    }
    else {
        throw new Error(`Viewport not available on page.`);
    }
};
/**
 * Generate a random distance between 30% - 70% of the viewport height.
 *
 * @param {number} distance
 * @return {number}
 */
const randomDistance = (distance) => (0, node_crypto_1.randomInt)(distance * 0.3, distance * 0.7);
/**
 * Sends a synthetic scroll gesture via CDP.
 *
 * @param {Page} page
 * @param {number} distance
 * @return {Promise<void>}
 */
const scrollDown = (page, distance) => __awaiter(void 0, void 0, void 0, function* () {
    yield page._client.send("Input.synthesizeScrollGesture", {
        x: 0,
        y: 0,
        xDistance: 0,
        yDistance: distance
    });
});
exports.scrollDown = scrollDown;
/**
 * Primary vertical scroll function.
 * Accepts a target element and scrolls a randomized distance until intersecting viewport.
 *
 * @param {ElementHandle} el
 * @return {Promise<void>}
 */
const scrollTo = (el) => __awaiter(void 0, void 0, void 0, function* () {
    // Extract the page from the element handle.
    const page = el._page;
    // Use the viewport height as a baseline to randomize each scroll distance.
    const viewportHeight = getViewportHeight(page);
    // Continue to scroll random distance until element is in viewport.
    // @ts-ignore
    while (!(yield el.isIntersectingViewport())) {
        yield (0, exports.scrollDown)(page, randomDistance(viewportHeight));
        yield page.waitForTimeout((0, node_crypto_1.randomInt)(50, 500));
    }
});
exports.scrollTo = scrollTo;
//# sourceMappingURL=scrollTo.js.map