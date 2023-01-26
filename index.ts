import {AutoFollower, AutoResponser, BaseBrowser} from "./autoResponser";
import * as path from "path";
import {promises as fs} from "fs";
import {BaseTTProps} from "./types";
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import puppeteer from 'puppeteer-extra'
import {executablePath} from 'puppeteer'

(async () => {
    const buffer: Buffer = await fs.readFile(path.resolve(__dirname, '../config.json'));
    const accounts = JSON.parse(buffer.toString()).filter((item: BaseTTProps) => !!item.enabled);

    const status: any[] = [];

    for (const account of accounts) {
        const accountConfig: BaseTTProps = {
            ...account,
            cookiesPath: path.resolve(__dirname, account.cookiesPath),
        }

        puppeteer.use(StealthPlugin())
        const baseParams = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080',];
        const options = process.env.debug ? {
            headless: false,
            executablePath: executablePath(),
            args: accountConfig.proxy?.host ? [`--proxy-server=${accountConfig.proxy.host}`, ...baseParams] : baseParams,
        } : {
            headless: true,
            executablePath: '/usr/bin/chromium-browser',
            args: accountConfig.proxy?.host ? [`--proxy-server=${accountConfig.proxy.host}`, '--no-sandbox', '--disable-setuid-sandbox'] : ['--no-sandbox', '--disable-setuid-sandbox'],
        };
        const browser = await puppeteer.launch(options);
        const responser = new AutoResponser(browser, accountConfig);
        const autoFollower = new AutoFollower(browser, accountConfig);

        const responserResult = await responser.start();
        const autoFollowerResult = await autoFollower.start();

        status.push({name: `Акк #${accountConfig.id}`, autoResponser: responserResult, autoFollower: autoFollowerResult})
    }
    const statusData = JSON.stringify(status.map((item) => `${item.name}| [${item.autoResponser} | ${item.autoFollower}]`), null, '  ');
    console.log(statusData)
    BaseBrowser.sendLog(statusData);
})();
