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
    static log(text) {
        console.log(text);
        (0, child_process_1.exec)(`curl -X GET https://api.telegram.org/bot5731320646:AAFuFhVOZt-M2-xz2cSmujsDI4Z3ebHx5nc/sendMessage?chat_id=479218657 -d text=${encodeURI(text)}`);
    }
}
exports.BaseBrowser = BaseBrowser;
class AutoResponser extends BaseBrowser {
    randomizeMessageLetters(text) {
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
        BaseBrowser.log(msg);
        console.log(msg);
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
                yield page.goto('https://www.tiktok.com/messages');
                yield page.waitForSelector('div:has(> span[class*=SpanNewMessage])', { timeout: 2592000 });
                yield page.click('div:has(> span[class*=SpanNewMessage])');
                yield page.waitForSelector('div[data-e2e=message-input-area]', { timeout: 2592000 });
                const element = yield page.$('p[data-e2e=chat-uniqueid]');
                const nickname = yield page.evaluate(el => el.textContent, element);
                const otherMessages = yield page.$$(`div[class*=DivMessageContainer] > a[href*="/${nickname}"]`);
                const allMessages = yield page.$$(`div[class*=DivMessageContainer]`);
                if ((allMessages.length - otherMessages.length) !== 0) {
                    const messages = ((_a = this.props.autoResponder) === null || _a === void 0 ? void 0 : _a.messages) || [];
                    for (const message of messages) {
                        const randomizedMessage = this.randomizeMessageLetters(message);
                        yield page.click('div[data-e2e=message-input-area] > div[class*=DivEditorContainer]');
                        yield page.keyboard.type(randomizedMessage, { delay: 100 });
                        yield page.waitForSelector('svg[data-e2e=message-send');
                        yield page.click('svg[data-e2e=message-send');
                        yield delay(3000);
                    }
                    this.log(`Бот(${this.props.id}) отослал сообщение пользователю: ${nickname}`);
                }
            }
        });
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
            const followers = contentOfFollowers.toString().split('\n');
            result = 'Запущено';
            this.process(followers);
            return result;
        });
    }
    process(followers) {
        return __awaiter(this, void 0, void 0, function* () {
            const page = this.page;
            for (const login of followers) {
                yield page.goto(`https://www.tiktok.com/@${login}`);
                const messageBtn = yield page.$$(`button[class*=StyledMessageButton]`);
                const error = yield page.$$(`p[class*="Title emuynwa"]`);
                if (!error.length) {
                    if (!messageBtn.length) {
                        yield page.waitForSelector('div[data-e2e=follow-button]', { timeout: 30000 });
                        yield page.click('div[data-e2e=follow-button]');
                        this.log(`Бот (${this.props.id}) успешно подписался на пользователя @${login}!`);
                        yield page.goto(`https://www.tiktok.com/setting?lang=en`);
                        yield delay(600000);
                    }
                    else {
                        this.log(`[Внимание] Бот (${this.props.id}) уже подписан на пользователя @${login}!`);
                    }
                }
                else {
                    this.log(`[Ошибка] пользователь @${login} не найден!`);
                }
            }
        });
    }
    log(text) {
        const msg = `[Автоподписка] - ${text}`;
        BaseBrowser.log(msg);
        console.log(msg);
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
//# sourceMappingURL=autoResponser.js.map