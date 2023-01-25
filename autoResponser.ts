import {Browser, Page} from 'puppeteer';
import {BaseTTProps} from "./types";
import {resolve} from "path";
const fs = require('fs').promises;

export class BaseBrowser {

    protected page: Page;

    constructor(
        protected browser: Browser,
        protected props: BaseTTProps,
    ) {}

    async setCookies() {
        const cookieJson = await fs.readFile(this.props.cookiesPath);
        const cookies = JSON.parse(cookieJson);
        await this.page.setCookie(...cookies);
    }

    async start() {
        this.page = await this.browser.newPage();
        if (this.props.proxy
            && this.props.proxy.host
            && this.props.proxy.login
            && this.props.proxy.password
        ) {
            await this.page.authenticate({
                username: this.props.proxy.login,
                password: this.props.proxy.password
            });
        }
        await this.setCookies();
    }
}

export class AutoResponser extends BaseBrowser {

    randomizeMessageLetters(text: string) {
        let result = '';

        for (const char of text) {
            let res = char;

            if (char === 'o') {
                res = ['o', 'о'][randomInt(0, 1)];
            }
            if (char === 'e') {
                res = ['e', 'е'][randomInt(0, 1)];
            }
            if (char === 'a') {
                res = ['a', 'а'][randomInt(0, 1)];
            }

            result = result + res;
        }

        return result;
    }

    async start() {
        await super.start();
        const page = this.page;

        while (true) {
            await page.goto('https://www.tiktok.com/messages');

            await page.waitForSelector('div:has(> span[class*=SpanNewMessage])', {timeout: 2592000});

            await page.click('div:has(> span[class*=SpanNewMessage])');

            await page.waitForSelector('div[data-e2e=message-input-area]', {timeout: 2592000});

            const element = await page.$('p[data-e2e=chat-uniqueid]')
            const nickname = await page.evaluate(el => el.textContent, element);
            console.log(nickname);

            const otherMessages = await page.$$(`div[class*=DivMessageContainer] > a[href*="/${nickname}"]`)
            const allMessages = await page.$$(`div[class*=DivMessageContainer]`)

            if ((allMessages.length - otherMessages.length) === 0) {
                const messages = this.props.autoResponder?.messages || [];

                for (const message of messages) {
                    const randomizedMessage = this.randomizeMessageLetters(message);

                    await page.click('div[data-e2e=message-input-area] > div[class*=DivEditorContainer]');

                    await page.keyboard.type(randomizedMessage, {delay: 100})

                    await page.waitForSelector('svg[data-e2e=message-send');

                    await page.click('svg[data-e2e=message-send');

                    await delay(3000);
                }
            }
        }
    }
}

export class AutoFollower extends BaseBrowser {
    async start() {
        await super.start();
        const page = this.page;

        const contentOfFollowers: Buffer = await fs.readFile(resolve(__dirname, this.props.autoFollower.followersPath));
        const followers = contentOfFollowers.toString().split('\n');

        for (const login of followers) {
            await page.goto(`https://www.tiktok.com/@${login}`);

            const messageBtn = await page.$$(`button[class*=StyledMessageButton]`);

            if (!messageBtn.length) {
                await page.waitForSelector('div[data-e2e=follow-button]');

                await page.click('div[data-e2e=follow-button]');

                await page.goto(`https://www.tiktok.com/setting?lang=en`);

                await delay(600000);
            }
        }
    }
}

function randomInt(min: number, max: number) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

async function delay(ms: number) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}
