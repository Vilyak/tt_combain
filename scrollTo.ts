import { randomInt } from "node:crypto"
import { Page as PPage, CDPSession, ElementHandle as PPElementHandle} from "puppeteer-core"

/** Recast Puppeteer private properties **/

type Page = Omit<PPage, "_client"> & {
    readonly _client: CDPSession
}

type ElementHandle = Omit<PPElementHandle, "_page"> & {
    readonly _page: Page
}

/**
 * Determine viewport height to use as base for each scroll distance.
 *
 * @param {Page} page
 * @return {number}
 */
const getViewportHeight = (page: Page): number => {
    const height: number | undefined = page.viewport()?.height
    if (height) {
        return height
    } else {
        throw new Error(`Viewport not available on page.`)
    }
}

/**
 * Generate a random distance between 30% - 70% of the viewport height.
 *
 * @param {number} distance
 * @return {number}
 */
const randomDistance = (distance: number): number =>
    randomInt(distance * 0.3, distance * 0.7)

/**
 * Sends a synthetic scroll gesture via CDP.
 *
 * @param {Page} page
 * @param {number} distance
 * @return {Promise<void>}
 */
export const scrollDown = async (
    page: Page,
    distance: number
): Promise<void> => {
    await page._client.send("Input.synthesizeScrollGesture", {
        x: 0,
        y: 0,
        xDistance: 0,
        yDistance: distance
    })
}

/**
 * Primary vertical scroll function.
 * Accepts a target element and scrolls a randomized distance until intersecting viewport.
 *
 * @param {ElementHandle} el
 * @return {Promise<void>}
 */
export const scrollTo = async (el: ElementHandle): Promise<void> => {
    // Extract the page from the element handle.
    const page: Page = el._page
    // Use the viewport height as a baseline to randomize each scroll distance.
    const viewportHeight: number = getViewportHeight(page)
    // Continue to scroll random distance until element is in viewport.
    // @ts-ignore
    while (!(await el.isIntersectingViewport())) {
        await scrollDown(page, randomDistance(viewportHeight))
        await page.waitForTimeout(randomInt(50, 500))
    }
}
