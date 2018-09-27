import fetch = require('cross-fetch');
import fs = require('fs-extra');
import bluebird = require('bluebird');
import path = require('path');
import { Console } from 'debug-color2';

const FILE_EXT = '.jpg';

export const console = new Console();

export interface IOptions
{
	/**
	 * 作為判定目前資料夾位置
	 */
	cwd?: string,
	/**
	 * 輸出資料夾
	 */
	output?: string,
	/**
	 * 是否輸出訊息 避免覺得太寂寞
	 */
	log?: boolean,
}

export interface IDataItem
{
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

export interface IDataItemGet
{
	/**
	 * 如果輸入參數來自於 IDataItem 的話 data 就會等於輸入的內容
	 */
	data?: IDataItem,
	source_url?: string,
	drm_hash?: string,
	/**
	 * 解密後的 圖片 buffer
	 */
	buffer?: Buffer,
}

/**
 * 解密 DATA
 *
 * @param item
 * @param fileSaveToPath 如果此參數存在時 會在解密後 同時輸出檔案至此路徑
 */
export function decodeData<T extends IDataItem>(item: T, fileSaveToPath?: string): bluebird<IDataItemGet>
export function decodeData<T extends IDataItemGet>(item: T, fileSaveToPath?: string): bluebird<IDataItemGet>
export function decodeData(item, fileSaveToPath?: string): bluebird<IDataItemGet>
export function decodeData(item: IDataItem, fileSaveToPath?: string): bluebird<IDataItemGet>
{
	return getData(item, true)
		.then(async function (data)
		{
			if (!data)
			{
				throw new TypeError(`not a valid data`)
			}

			let key = await generateKeyMap(data.drm_hash);
			let image = await downloadEncodeImage(data.source_url);

			data.buffer = await decodeBuffer(image, key);

			return data as IDataItemGet
		})
		.tap(async function (data)
		{
			if (fileSaveToPath)
			{
				return fs.outputFile(fileSaveToPath, data.buffer);
			}
		})
		;
}

/**
 * 直接輸入從 API 取得的 json 內容
 *
 * @param json
 * @param dirSaveToPath 如果此參數存在時 會在取得資料的同時 順便將解密後的圖片輸出到此資料夾下
 */
export function saveAllFromApiData(json: IData, dirSaveToPath?: string | IOptions)
{
	let options: IOptions = dirSaveToPath && typeof dirSaveToPath === 'string' ? {
		output: dirSaveToPath,
	} : {
		// @ts-ignore
		...dirSaveToPath,
	};
	options.cwd = options.cwd || process.cwd();

	return getDataFromApiData(json, true)
		.tap(function ()
		{
			if (options.log)
			{
				console.info(`開始下載`);
			}
		})
		.map(async function (item, idx, len)
		{
			let data = await decodeData(item);
			item.buffer = data.buffer;

			let id = String(idx).padStart(5, '0');

			if (options.output)
			{
				let file = path.join(options.output, id + FILE_EXT);

				await fs.outputFile(file, item.buffer);

				if (options.log)
				{
					let i = String(idx)
						.padStart(String(len).length, '0')
					;

					console.success(`[${i}/${len}]`, id);
				}
			}

			return item;
		})
	;
}

/**
 * 分析並且解密 API 的 json 內容
 * 當 fakeASync 為 true 時會回傳假 async
 */
export function getDataFromApiData(item: IData): IDataItemGet[]
export function getDataFromApiData(item: IData, fakeASync: true): bluebird<IDataItemGet[]>
export function getDataFromApiData(item: IData, fakeASync: false): IDataItemGet[]
export function getDataFromApiData(json: IData, fakeASync?: boolean)
{
	if (json
		&& json.data
		&& Array.isArray(json.data.result)
	)
	{
		let ret = json.data.result
			.reduce(function (arr, item)
			{
				arr.push(getData(item, false));

				return arr
			}, [])
		;

		if (!fakeASync)
		{
			return ret;
		}

		return bluebird.resolve(ret);
	}

	return null;
}

/**
 * 嘗試判斷輸入內容 並且標準化之後 回傳
 * 當 fakeASync 為 true 時會回傳假 async
 */
export function getData<T extends IDataItemGet>(item: T): IDataItemGet
export function getData<T extends IDataItemGet>(item: T, fakeASync?: boolean): IDataItemGet & {
	then?<R>(cb: (data: IDataItemGet) => R | bluebird<R> | Promise<R>): bluebird<R>
}
export function getData<T extends IDataItem>(item: T): IDataItemGet
export function getData<T extends IDataItem>(item: T, fakeASync?: boolean): IDataItemGet & {
	then?<R>(cb: (data: IDataItemGet) => R | bluebird<R> | Promise<R>): bluebird<R>
}
export function getData(item): IDataItemGet
export function getData(item, fakeASync?: boolean): IDataItemGet & {
	then?<R>(cb: (data: IDataItemGet) => R | bluebird<R> | Promise<R>): bluebird<R>
}
export function getData<T = IDataItem | IDataItemGet>(item: T, fakeASync?: boolean): IDataItemGet & {
	then?<R>(cb: (data: IDataItemGet) => R | bluebird<R> | Promise<R>): bluebird<R>
}
{
	let meta: IDataItemGet;
	let data: IDataItem;

	if (item)
	{
		// @ts-ignore
		if (item.meta && typeof item.meta.source_url === 'string' && typeof item.meta.drm_hash === 'string')
		{
			// @ts-ignore
			data = item;
			// @ts-ignore
			meta = item.meta;
		}
		// @ts-ignore
		else if (typeof item.source_url === 'string' && typeof item.drm_hash === 'string')
		{
			// @ts-ignore
			meta = item;
		}
	}

	if (meta)
	{
		let { source_url, drm_hash } = meta;

		const ret: IDataItemGet = {
			data,
			source_url,
			drm_hash,
		};

		if (!fakeASync)
		{
			return ret;
		}

		// @ts-ignore
		return Object.assign({
			then<T>(cb: ((data: IDataItemGet) => T))
			{
				return new bluebird<T>(function (resolve, reject, onCancel)
				{
					return resolve(cb(ret))
				});
			},
		}, ret);
	}

	return null;
}

/**
 * 下載圖片並且轉換為 Buffer
 */
export async function downloadEncodeImage(url: string)
{
	return bluebird
		.resolve()
		.then(async function ()
		{
			let res = await fetch.fetch(url, {
				credentials: 'include',
			});

			let tmp = await res.arrayBuffer();

			let result = Buffer.from(new Uint8Array(tmp));

			return result;
		})
	;
}

/**
 * 產生解密用的 對應表
 */
export function generateKeyMap(drm_hash: string)
{
	let result: number[] = [];
	let code: number;
	for (let i = 0; i < 16; i++)
	{
		code = drm_hash.charCodeAt(i);
		if (code >= 97)
		{
			code = code - 87;
		}
		else
		{
			code = code - 48;
		}

		if (i % 2 === 0)
		{
			result.push(code * 16);
		}
		else
		{
			result[(i - 1) / 2] += code;
		}
	}

	return result;
}

/**
 * 將 加密的 圖片 Buffer 解密
 *
 * @param image
 * @param keymap
 */
export function decodeBuffer(image: Buffer, keymap: number[])
{
	return image.reduce(function (binary, data, i)
	{
		binary[i] = data ^ keymap[i % 8];

		return binary;
	}, Buffer.alloc(image.length));
}

/**
 * 分析輸入網址 回傳 漫畫 ID
 *
 * @param input
 */
export function getApiID(input: string)
{
	let m: RegExpExecArray;
	let id: string;

	if (m = /^(\w+_\w+\d+_\w+)$/.exec(input))
	{
		id = m[1];
	}
	else if (m = /ssl.seiga.nicovideo.jp\/api\/v1\/comicwalker\/episodes\/(\w+_\w+_\w+)/.exec(input))
	{
		id = m[1];
	}
	else if (m = /comic-walker\.com\/viewer\/\?(?:.+&)?cid=(\w+_\w+_\w+)/.exec(input))
	{
		id = m[1];
	}
	else if (m = /comic-walker\.com\/contents\/detail\/(\w+_\w+_\w+)/i.exec(input))
	{
		id = m[1];
	}

	return id;
}

/**
 * 將漫畫 ID 轉換為 API JSON 網址
 *
 * @param id
 */
export function createApiUrl(id: string)
{
	id = getApiID(id);

	if (!id)
	{
		throw new TypeError(`not a valid id`)
	}

	//id = id.replace(/0(_\w+)$/, '1$1');

	return `https://ssl.seiga.nicovideo.jp/api/v1/comicwalker/episodes/${id}/frames`;
}

/**
 * 懶人包 下載 指定 ID 的漫畫內容
 *
 * @param input
 * @param dirSaveToPath
 */
export function downloadID(input: string, dirSaveToPath?: string | IOptions)
{
	let id = getApiID(input);
	let url = createApiUrl(id);

	//console.dir(url);

	let options: IOptions = dirSaveToPath && typeof dirSaveToPath === 'string' ? {
		output: dirSaveToPath,
	} : {
		// @ts-ignore
		...dirSaveToPath,
	};

	options.cwd = options.cwd || process.cwd();

	return bluebird
		.resolve()
		.then(async function ()
		{
			let res = await fetch.fetch(url, {
				credentials: 'include',
			})
				.catch(function ()
				{
					id = id.replace(/0(_\w+)$/, '1$1');
					url = createApiUrl(id);

					return fetch.fetch(url, {
						credentials: 'include',
					})
				})
			;

			return res.json();
		})
		.then(function (json)
		{
			if (!options.output)
			{
				options.output = path.join(options.cwd, id);
			}

			return saveAllFromApiData(json, options)
		})
		;
}

export interface IData
{
	"meta": {
		"status": number;
	};
	"data": {
		"result": IDataItem[];
	};
}

import self = require("./index");

export default self;
