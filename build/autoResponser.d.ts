import { Browser, Page } from 'puppeteer';
import { BaseTTProps } from "./types";
export declare class BaseBrowser {
    protected browser: Browser;
    protected props: BaseTTProps;
    protected page: Page;
    constructor(browser: Browser, props: BaseTTProps);
    setCookies(): Promise<void>;
    start(): Promise<string>;
    log(text: string): void;
    static sendLog(text: string): void;
}
export declare class AutoResponser extends BaseBrowser {
    randomizeMessageLetters(text: string): string;
    log(text: string): void;
    start(): Promise<string>;
    process(): Promise<void>;
    sendLog(text: string): void;
}
export declare class AutoFollower extends BaseBrowser {
    start(): Promise<string>;
    process(followers: string[]): Promise<void>;
    sendLog(text: string): void;
}
