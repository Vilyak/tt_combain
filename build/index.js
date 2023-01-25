"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const autoResponser_1 = require("./autoResponser");
const path = __importStar(require("path"));
const fs_1 = require("fs");
const puppeteer_extra_plugin_stealth_1 = __importDefault(require("puppeteer-extra-plugin-stealth"));
const puppeteer_extra_1 = __importDefault(require("puppeteer-extra"));
const puppeteer_1 = require("puppeteer");
(() => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const buffer = yield fs_1.promises.readFile(path.resolve(__dirname, '../config.json'));
    const accounts = JSON.parse(buffer.toString());
    for (const account of accounts) {
        const accountConfig = Object.assign(Object.assign({}, account), { cookiesPath: path.resolve(__dirname, account.cookiesPath) });
        puppeteer_extra_1.default.use((0, puppeteer_extra_plugin_stealth_1.default)());
        const browser = yield puppeteer_extra_1.default.launch({
            headless: true,
            executablePath: (0, puppeteer_1.executablePath)(),
            args: ((_a = accountConfig.proxy) === null || _a === void 0 ? void 0 : _a.host) ? [`--proxy-server=${accountConfig.proxy.host}`, '--no-sandbox'] : ['--no-sandbox'],
        });
        const responser = new autoResponser_1.AutoResponser(browser, accountConfig);
        const autoFollower = new autoResponser_1.AutoFollower(browser, accountConfig);
        responser.start();
        autoFollower.start();
    }
}))();
//# sourceMappingURL=index.js.map