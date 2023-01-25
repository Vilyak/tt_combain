import { Browser, Page } from 'puppeteer';
import { BaseTTProps } from "./types";
export declare class BaseBrowser {
    protected browser: Browser;
    protected props: BaseTTProps;
    protected page: Page;
    constructor(browser: Browser, props: BaseTTProps);
    setCookies(): Promise<void>;
    start(): Promise<void>;
}
export declare class AutoResponser extends BaseBrowser {
    randomizeMessageLetters(text: string): string;
    start(): Promise<void>;
}
export declare class AutoFollower extends BaseBrowser {
    start(): Promise<void>;
}
