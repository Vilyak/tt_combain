import {Browser, Page} from 'puppeteer';
import {BaseTTProps} from "./types";
import {resolve} from "path";
import {exec} from 'child_process';
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
        console.log(text);
        BaseBrowser.sendLog(text);
    }

    static sendLog(text: string) {
        exec(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
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

    log(text: string) {
        const msg = `[Автоответчик] - ${text}`;
        AutoResponser.sendLog(msg);
        console.log(msg);
    }

    async start() {
        let result = await super.start();

        result = 'Запущено';
        this.process();

        return result;
    }

    async process() {
        const page = this.page;

        while (true) {
            await page.goto('https://www.tiktok.com/messages', {timeout: 120000});

            await page.waitForSelector('div:has(> span[class*=SpanNewMessage])', {timeout: 2592000});

            await delay(2000);

            await page.click('div:has(> span[class*=SpanNewMessage])');

            await page.waitForSelector('div[data-e2e=message-input-area]', {timeout: 2592000});

            await delay(2000);

            const element = await page.$('p[data-e2e=chat-uniqueid]')
            const nickname = await page.evaluate(el => el.textContent, element);

            const otherMessages = await page.$$(`div[class*=DivMessageContainer] > a[href*="/${nickname}"]`)
            const allMessages = await page.$$(`div[class*=DivMessageContainer]`)

            if ((allMessages.length - otherMessages.length) !== 0) {
                const messages = this.props.autoResponder?.messages || [];

                for (const message of messages) {
                    const randomizedMessage = this.randomizeMessageLetters(message);

                    await page.waitForSelector('div[data-e2e=message-input-area] > div[class*=DivEditorContainer]', {timeout: 60000});

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
        exec(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
    }
}

export class AutoFollower extends BaseBrowser {
    async start() {
        let result = await super.start();

        const contentOfFollowers: Buffer = await fs.readFile(resolve(__dirname, this.props.autoFollower.followersPath));
        const followers = contentOfFollowers.toString().split('\n').filter(item => item !== '');

        if (followers.length) {
            result = 'Запущено';
            this.process(followers);
        }
        return result;
    }

    async process(followers: string[]) {
        const page = this.page;

        for (const login of followers) {
            await page.goto(`https://www.tiktok.com/@${login}`);

            await page.waitForSelector(`button[data-e2e=follow-button]`, {timeout: 120000});
            const followBtnIcon = await page.$$(`button[data-e2e=follow-button] > svg`);

            const error = await page.$$(`p[class*="Title emuynwa"]`);
            const error2 = await page.$$(`p[class*="e1ksppba9"]`);

            if (!error.length || !error2.length) {
                if (!followBtnIcon.length) {
                    await page.waitForSelector('button[data-e2e=follow-button]',{timeout: 30000});

                    await page.click('button[data-e2e=follow-button]');

                    await page.goto(`https://www.tiktok.com/@${login}`);

                    await page.waitForSelector('button[data-e2e=follow-button]',{timeout: 120000});
                    const followBtnIcon = await page.$$(`button[data-e2e=follow-button] > svg`);

                    if (!followBtnIcon) {
                        this.log(`Бот #${this.props.id} не смог полписаться на пользователя @${login}! ВОЗМОЖНО ТЕНЕВОЙ БАН`);
                    }
                    else {
                        this.log(`Бот #${this.props.id} успешно подписался на пользователя @${login}!`);
                    }

                    await page.goto(`https://www.tiktok.com/setting?lang=en`);

                    await delay(600000);
                }
                else {
                    this.log(`[Внимание] Бот #${this.props.id} уже подписан на пользователя @${login}!`);
                }
            }
            else {
                this.log(`[Ошибка] пользователь @${login} не найден!`);
            }
        }

        this.log(`[Внимание] Бот #${this.props.id} ЗАВЕРШИЛ ПОДПИСКУ НА ЛЮДЕЙ!`);
    }

    sendLog(text: string) {
        console.log(text);
        exec(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
    }
}

function randomInt(min: number, max: number) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

async function delay(ms: number) {
    return await new Promise(resolve => setTimeout(resolve, ms));
}
