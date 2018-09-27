/// <reference types="node" />
import bluebird = require('bluebird');
export interface IData {
    "meta": {
        "status": number;
    };
    "data": {
        "result": IDataItem[];
    };
}
export interface IDataItem {
    "id"?: number;
    "meta"?: {
        "width"?: number;
        "height"?: number;
        "source_url"?: string;
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
    data?: IDataItem;
    source_url?: string;
    drm_hash?: string;
    buffer?: Buffer;
}
export declare function decodeData<T extends IDataItem>(item: T, fileSaveToPath?: string): bluebird<IDataItemGet>;
export declare function decodeData<T extends IDataItemGet>(item: T, fileSaveToPath?: string): bluebird<IDataItemGet>;
export declare function decodeData(item: any, fileSaveToPath?: string): bluebird<IDataItemGet>;
export declare function saveAllFromApiData(json: IData, dirSaveToPath?: string): bluebird<IDataItemGet[]>;
export declare function getDataFromApiData(item: IData): IDataItemGet[];
export declare function getDataFromApiData(item: IData, fakeASync: true): bluebird<IDataItemGet[]>;
export declare function getDataFromApiData(item: IData, fakeASync: false): IDataItemGet[];
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
export declare function downloadEncodeImage(url: string): Promise<Buffer>;
export declare function generateKeyMap(drm_hash: string): number[];
export declare function decodeBuffer(image: Buffer, keymap: number[]): Buffer;
import self = require("./index");
export default self;
