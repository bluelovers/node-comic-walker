/// <reference types="node" />
import bluebird = require('bluebird');
import { Console } from 'debug-color2';
export declare const console: Console;
export interface IOptions {
    /**
     * 作為判定目前資料夾位置
     */
    cwd?: string;
    /**
     * 輸出資料夾
     */
    output?: string;
    /**
     * 是否輸出訊息 避免覺得太寂寞
     */
    log?: boolean;
}
export interface IDataItem {
    "id"?: number;
    "meta"?: {
        "width"?: number;
        "height"?: number;
        /**
         * 已加密的圖片網址
         */
        "source_url"?: string;
        /**
         * 解密用的 HASH
         */
        "drm_hash"?: string;
        "duration"?: number;
        "link_url"?: any;
        "resource"?: {
            "bgm"?: any;
            "se"?: any;
        };
        "is_spread"?: boolean;
    };
}
export interface IDataItemGet {
    /**
     * 如果輸入參數來自於 IDataItem 的話 data 就會等於輸入的內容
     */
    data?: IDataItem;
    source_url?: string;
    drm_hash?: string;
    /**
     * 解密後的 圖片 buffer
     */
    buffer?: Buffer;
}
/**
 * 解密 DATA
 *
 * @param item
 * @param fileSaveToPath 如果此參數存在時 會在解密後 同時輸出檔案至此路徑
 */
export declare function decodeData<T extends IDataItem>(item: T, fileSaveToPath?: string): bluebird<IDataItemGet>;
export declare function decodeData<T extends IDataItemGet>(item: T, fileSaveToPath?: string): bluebird<IDataItemGet>;
export declare function decodeData(item: any, fileSaveToPath?: string): bluebird<IDataItemGet>;
/**
 * 直接輸入從 API 取得的 json 內容
 *
 * @param json
 * @param dirSaveToPath 如果此參數存在時 會在取得資料的同時 順便將解密後的圖片輸出到此資料夾下
 */
export declare function saveAllFromApiData(json: IData, dirSaveToPath?: string | IOptions): bluebird<IDataItemGet[]>;
/**
 * 分析並且解密 API 的 json 內容
 * 當 fakeASync 為 true 時會回傳假 async
 */
export declare function getDataFromApiData(item: IData): IDataItemGet[];
export declare function getDataFromApiData(item: IData, fakeASync: true): bluebird<IDataItemGet[]>;
export declare function getDataFromApiData(item: IData, fakeASync: false): IDataItemGet[];
/**
 * 嘗試判斷輸入內容 並且標準化之後 回傳
 * 當 fakeASync 為 true 時會回傳假 async
 */
export declare function getData<T extends IDataItemGet>(item: T): IDataItemGet;
export declare function getData<T extends IDataItemGet>(item: T, fakeASync?: boolean): IDataItemGet & {
    then?<R>(cb: (data: IDataItemGet) => R | bluebird<R> | Promise<R>): bluebird<R>;
};
export declare function getData<T extends IDataItem>(item: T): IDataItemGet;
export declare function getData<T extends IDataItem>(item: T, fakeASync?: boolean): IDataItemGet & {
    then?<R>(cb: (data: IDataItemGet) => R | bluebird<R> | Promise<R>): bluebird<R>;
};
export declare function getData(item: any): IDataItemGet;
export declare function getData(item: any, fakeASync?: boolean): IDataItemGet & {
    then?<R>(cb: (data: IDataItemGet) => R | bluebird<R> | Promise<R>): bluebird<R>;
};
/**
 * 下載圖片並且轉換為 Buffer
 */
export declare function downloadEncodeImage(url: string): Promise<Buffer>;
/**
 * 產生解密用的 對應表
 */
export declare function generateKeyMap(drm_hash: string): number[];
/**
 * 將 加密的 圖片 Buffer 解密
 *
 * @param image
 * @param keymap
 */
export declare function decodeBuffer(image: Buffer, keymap: number[]): Buffer;
/**
 * 分析輸入網址 回傳 漫畫 ID
 *
 * @param input
 */
export declare function getApiID(input: string): string;
/**
 * 將漫畫 ID 轉換為 API JSON 網址
 *
 * @param id
 */
export declare function createApiUrl(id: string): string;
/**
 * 懶人包 下載 指定 ID 的漫畫內容
 *
 * @param input
 * @param dirSaveToPath
 */
export declare function downloadID(input: string, dirSaveToPath?: string | IOptions): bluebird<IDataItemGet[]>;
export interface IData {
    "meta": {
        "status": number;
    };
    "data": {
        "result": IDataItem[];
    };
}
import self = require("./index");
export default self;
