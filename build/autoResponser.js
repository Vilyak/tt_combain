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
exports.AutoFollower = exports.AutoResponser = exports.BaseBrowser = void 0;
const path_1 = require("path");
const child_process_1 = require("child_process");
const fs = require('fs').promises;
class BaseBrowser {
    constructor(browser, props) {
        this.browser = browser;
        this.props = props;
    }
    setCookies() {
        return __awaiter(this, void 0, void 0, function* () {
            const cookieJson = yield fs.readFile(this.props.cookiesPath);
            const cookies = JSON.parse(cookieJson);
            yield this.page.setCookie(...cookies);
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.page = yield this.browser.newPage();
            if (this.props.proxy
                && this.props.proxy.host
                && this.props.proxy.login
                && this.props.proxy.password) {
                yield this.page.authenticate({
                    username: this.props.proxy.login,
                    password: this.props.proxy.password
                });
            }
            yield this.setCookies();
            return 'НЕ Запущено!';
        });
    }
    log(text) {
        BaseBrowser.sendLog(text);
    }
    static sendLog(text) {
        console.log(text);
        if (!process.env.debug) {
            (0, child_process_1.exec)(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
        }
    }
}
exports.BaseBrowser = BaseBrowser;
class AutoResponser extends BaseBrowser {
    randomizeMessageLetters(text) {
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
    log(text) {
        const msg = `[Автоответчик] - ${text}`;
        AutoResponser.sendLog(msg);
    }
    start() {
        const _super = Object.create(null, {
            start: { get: () => super.start }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield _super.start.call(this);
            result = 'Запущено';
            this.process();
            return result;
        });
    }
    process() {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            const page = this.page;
            while (true) {
                yield page.goto('https://www.tiktok.com/messages', { timeout: 120000 });
                const selector = yield waitForAnySelector(page, [
                    { type: 'css', text: 'div:has(> span[class*=SpanNewMessage])' },
                    // { type: 'xpath', text: '//p[2]/span[contains(text(),\'This message type\')]' },
                    // { type: 'xpath', text: '//p[2]/span[string-length() = 0]' },
                ]);
                yield delay(2000);
                const sel = selector;
                if (sel.type === 'css') {
                    yield page.click(sel.text);
                }
                else {
                    const el = yield page.$x(sel.text);
                    // @ts-ignore
                    yield el[0].click();
                }
                yield delay(2000);
                yield page.waitForSelector('div[data-e2e=message-input-area]', { timeout: 259200 });
                yield delay(2000);
                const element = yield page.$('p[data-e2e=chat-uniqueid]');
                const nickname = yield page.evaluate(el => el.textContent, element);
                const otherMessages = yield page.$$(`div[class*=DivMessageContainer] > a[href*="/${nickname}"]`);
                const allMessages = yield page.$$(`div[class*=DivMessageContainer]`);
                if ((allMessages.length - otherMessages.length) === 0) {
                    const messages = ((_a = this.props.autoResponder) === null || _a === void 0 ? void 0 : _a.messages) || [];
                    for (const message of messages) {
                        const randomizedMessage = this.randomizeMessageLetters(message);
                        yield page.waitForSelector('div[data-e2e=message-input-area] > div[class*=DivEditorContainer]', { timeout: 25920 });
                        yield delay(2000);
                        yield page.click('div[data-e2e=message-input-area] > div[class*=DivEditorContainer]');
                        yield page.keyboard.type(randomizedMessage, { delay: 100 });
                        yield page.waitForSelector('svg[data-e2e=message-send');
                        yield delay(2000);
                        yield page.click('svg[data-e2e=message-send');
                        yield delay(3000);
                    }
                    this.sendLog(`Бот #${this.props.id} отослал сообщение пользователю: ${nickname}`);
                }
            }
        });
    }
    sendLog(text) {
        console.log(text);
        if (!process.env.debug) {
            (0, child_process_1.exec)(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
        }
    }
}
exports.AutoResponser = AutoResponser;
class AutoFollower extends BaseBrowser {
    start() {
        const _super = Object.create(null, {
            start: { get: () => super.start }
        });
        return __awaiter(this, void 0, void 0, function* () {
            let result = yield _super.start.call(this);
            const contentOfFollowers = yield fs.readFile((0, path_1.resolve)(__dirname, this.props.autoFollower.followersPath));
            const followers = yield this.getFilteredFollowers(contentOfFollowers.toString().split('\n').filter(item => item !== '').map(item => item.replace('‬', '')));
            if (followers.length) {
                result = 'Запущено';
                this.process(followers);
            }
            return result;
        });
    }
    process(followers) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = this.page;
            for (const login of followers) {
                yield page.goto(`https://www.tiktok.com/@${login}`);
                yield page.waitForSelector('div[class*=DivErrorContainer]');
                const error1 = yield page.$$(`main > div[class*=DivErrorContainer] > p`);
                const error1Text = error1.length ? yield page.$$eval(`main > div[class*=DivErrorContainer] > p`, (element) => element[0].textContent) : '';
                if (error1Text !== 'Couldn\'t find this account') {
                    yield page.waitForSelector(`button[data-e2e=follow-button]`, { timeout: 120000 });
                    const followText = yield page.$$eval(`button[data-e2e=follow-button]`, (element) => element[0].textContent);
                    yield delay(2000);
                    if (followText === 'Follow') {
                        yield page.waitForSelector('button[data-e2e=follow-button]', { timeout: 30000 });
                        yield page.click('button[data-e2e=follow-button]');
                        yield delay(3000);
                        yield page.goto(`https://www.tiktok.com/@${login}`);
                        yield page.waitForSelector(`button[data-e2e=follow-button]`, { timeout: 120000 });
                        const btnText = yield page.$$eval(`button[data-e2e=follow-button]`, (element) => element[0].textContent);
                        yield delay(2000);
                        if (btnText === 'Follow') {
                            this.log(`Бот #${this.props.id} не смог подписаться на пользователя @${login}! ТЕНЕВОЙ БАН`);
                        }
                        else {
                            this.log(`Бот #${this.props.id} успешно подписался на пользователя @${login}!`);
                            yield this.cacheFollower(login);
                        }
                        yield page.goto(`https://www.tiktok.com/setting?lang=en`);
                        yield delay(600000);
                    }
                    else {
                        this.log(`[Внимание] Бот #${this.props.id} уже подписан на пользователя @${login}!`);
                        yield this.cacheFollower(login);
                    }
                }
                else {
                    this.log(`[Ошибка] пользователь @${login} не найден!`);
                    yield this.cacheFollower(login);
                }
            }
            yield delay(2000);
            this.log(`[Внимание] Бот #${this.props.id} ЗАВЕРШИЛ ПОДПИСКУ НА ЛЮДЕЙ!`);
        });
    }
    cacheFollower(follower) {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.appendFile((0, path_1.resolve)(__dirname, `../cache/${this.props.id}.txt`), `${follower}\n`);
        });
    }
    getFilteredFollowers(allFollowers) {
        return __awaiter(this, void 0, void 0, function* () {
            const buffer = yield fs.readFile((0, path_1.resolve)(__dirname, `../cache/${this.props.id}.txt`), { flag: 'a+' });
            const cachedFollowers = buffer.toString().split('\n').filter(item => item !== '');
            return allFollowers.filter(usr => !cachedFollowers.includes(usr));
        });
    }
    sendLog(text) {
        console.log(text);
        if (!process.env.debug) {
            (0, child_process_1.exec)(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
        }
    }
}
exports.AutoFollower = AutoFollower;
function randomInt(min, max) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}
function delay(ms) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield new Promise(resolve => setTimeout(resolve, ms));
    });
}
const waitForAnySelector = (page, selectors) => new Promise((resolve, reject) => {
    let hasFound = false;
    selectors.forEach(selector => {
        if (selector.type === 'css') {
            page.waitForSelector(selector.text, { timeout: 2147483646, visible: false })
                .then(() => {
                if (!hasFound) {
                    hasFound = true;
                    resolve(selector);
                }
            });
        }
        else {
            page.waitForXPath(selector.text, { timeout: 2147483646, visible: false })
                .then(() => {
                if (!hasFound) {
                    hasFound = true;
                    resolve(selector);
                }
            });
        }
    });
});
//# sourceMappingURL=autoResponser.js.map