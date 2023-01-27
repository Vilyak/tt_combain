import {Browser, ElementHandle, Page} from 'puppeteer';
import {BaseTTProps, Selector} from "./types";
import {resolve} from "path";
import {exec} from 'child_process';
import {scrollTo} from "./scrollTo";
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
        return 'НЕ Запущено!';
    }

    log(text: string) {
        BaseBrowser.sendLog(text);
    }

    static sendLog(text: string) {
        console.log(text);
        if (!process.env.debug) {
            exec(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
        }
    }
}

export class AutoResponser extends BaseBrowser {

    randomizeMessageLetters(text: string) {
        if (text.startsWith('https://')) {
            return text;
        }
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

    log(text: string) {
        const msg = `[Автоответчик] - ${text}`;
        AutoResponser.sendLog(msg);
    }

    async start() {
        let result = await super.start();

        result = 'Запущено';
        this.process();

        return result;
    }

    async process() {
        const page = this.page;

        await page.setDefaultNavigationTimeout(0);
        while (true) {
            await page.goto('https://www.tiktok.com/messages', {timeout: 120000});

            const selector = await waitForAnySelector(page, [
                { type: 'css', text: 'div:has(> span[class*=SpanNewMessage])' },
                // { type: 'xpath', text: '//p[2]/span[contains(text(),\'This message type\')]' },
                // { type: 'xpath', text: '//p[2]/span[string-length() = 0]' },
            ]);

            await delay(2000);

            const sel = (selector as Selector);
            if (sel.type === 'css') {
                await page.click(sel.text);
            }
            else {
                const el = await page.$x(sel.text);
                // @ts-ignore
                await el[0].click();
            }

            await delay(2000);

            await page.waitForSelector('div[data-e2e=message-input-area]', {timeout: 259200});

            await delay(2000);

            const element = await page.$('p[data-e2e=chat-uniqueid]')
            const nickname = await page.evaluate(el => el.textContent, element);

            const otherMessages = await page.$$(`div[class*=DivMessageContainer] > a[href*="/${nickname}"]`)
            const allMessages = await page.$$(`div[class*=DivMessageContainer]`)

            if ((allMessages.length - otherMessages.length) === 0) {
                const messages = this.props.autoResponder?.messages || [];

                for (const message of messages) {
                    const randomizedMessage = this.randomizeMessageLetters(message);

                    await page.waitForSelector('div[data-e2e=message-input-area] > div[class*=DivEditorContainer]', {timeout: 25920});

                    await delay(2000);

                    await page.click('div[data-e2e=message-input-area] > div[class*=DivEditorContainer]');

                    await page.keyboard.type(randomizedMessage, {delay: 100})

                    await page.waitForSelector('svg[data-e2e=message-send');

                    await delay(2000);

                    await page.click('svg[data-e2e=message-send');

                    await delay(3000);
                }
                this.sendLog(`Бот #${this.props.id} отослал сообщение пользователю: ${nickname}`);
            }
        }
    }

    sendLog(text: string) {
        console.log(text);
        if (!process.env.debug) {
            exec(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
        }
    }
}

export class AutoFollower extends BaseBrowser {
    async start() {
        let result = await super.start();

        const contentOfFollowers: Buffer = await fs.readFile(resolve(__dirname, this.props.autoFollower.followersPath));
        const followers = await this.getFilteredFollowers(contentOfFollowers.toString().split('\n').filter(item => item !== '').map(item => item.replace('‬', '')));

        if (followers.length) {
            result = 'Запущено';
            this.process(followers);
        }
        return result;
    }

    async process(followers: string[]) {
        const page = this.page;
        await page.setDefaultNavigationTimeout(0);

        for (const login of followers) {
            await page.goto(`https://www.tiktok.com/@${login}`);

            await page.waitForSelector('div[class*=DivErrorContainer]');
            const error1 = await page.$$(`main > div[class*=DivErrorContainer] > p`);
            const error1Text = error1.length ? await page.$$eval(`main > div[class*=DivErrorContainer] > p`, (element: Array<Element>) => element[0].textContent) : '';

            if (error1Text !== 'Couldn\'t find this account') {
                await page.waitForSelector(`button[data-e2e=follow-button]`, {timeout: 120000});
                const followText = await page.$$eval(`button[data-e2e=follow-button]`, (element: Array<Element>) => element[0].textContent);

                await delay(2000);

                if (followText === 'Follow') {
                    await page.waitForSelector('button[data-e2e=follow-button]',{timeout: 30000});

                    await page.click('button[data-e2e=follow-button]');

                    await delay(3000);

                    await page.goto(`https://www.tiktok.com/@${login}`);

                    await page.waitForSelector(`button[data-e2e=follow-button]`, {timeout: 120000});

                    const btnText = await page.$$eval(`button[data-e2e=follow-button]`, (element: Array<Element>) => element[0].textContent);

                    await delay(2000);

                    if (btnText === 'Follow') {
                        this.log(`Бот #${this.props.id} не смог подписаться на пользователя @${login}! ТЕНЕВОЙ БАН`);
                    }
                    else {
                        this.log(`Бот #${this.props.id} успешно подписался на пользователя @${login}!`);
                        await this.cacheFollower(login);
                    }

                    await page.goto(`https://www.tiktok.com/setting?lang=en`);

                    await delay(600000);
                }
                else {
                    this.log(`[Внимание] Бот #${this.props.id} уже подписан на пользователя @${login}!`);
                    await this.cacheFollower(login);
                }
            }
            else {
                this.log(`[Ошибка] пользователь @${login} не найден!`);
                await this.cacheFollower(login);
            }
        }

        await delay(2000);
        this.log(`[Внимание] Бот #${this.props.id} ЗАВЕРШИЛ ПОДПИСКУ НА ЛЮДЕЙ!`);
    }

    async cacheFollower(follower: string) {
        await fs.appendFile(resolve(__dirname, `../cache/${this.props.id}.txt`), `${follower}\n`);
    }

    async getFilteredFollowers(allFollowers: string[]) {
        const buffer: Buffer = await fs.readFile(resolve(__dirname, `../cache/${this.props.id}.txt`), {flag: 'a+'});
        const cachedFollowers = buffer.toString().split('\n').filter(item => item !== '');
        return allFollowers.filter(usr => !cachedFollowers.includes(usr));
    }


    sendLog(text: string) {
        console.log(text);
        if (!process.env.debug) {
            exec(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
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

const waitForAnySelector = (page: Page, selectors: Selector[]) => new Promise((resolve, reject) => {
    let hasFound = false
    selectors.forEach(selector => {
        if (selector.type === 'css') {
            page.waitForSelector(selector.text, {timeout: 2147483646, visible: false})
                .then(() => {
                    if (!hasFound) {
                        hasFound = true
                        resolve(selector)
                    }
                });
        }
        else {
            page.waitForXPath(selector.text, {timeout: 2147483646, visible: false})
                .then(() => {
                    if (!hasFound) {
                        hasFound = true
                        resolve(selector)
                    }
                });
        }
    })
})
