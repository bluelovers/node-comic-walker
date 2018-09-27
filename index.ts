import fetch = require('cross-fetch');
import fs = require('fs-extra');
import bluebird = require('bluebird');
import path = require('path');

const FILE_EXT = '.jpg';

export interface IData
{
	"meta": {
		"status": number;
	};
	"data": {
		"result": IDataItem[];
	};
}

export interface IDataItem
{
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

export interface IDataItemGet
{
	data?: IDataItem,
	source_url?: string,
	drm_hash?: string,
	buffer?: Buffer,
}

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

export function saveAllFromApiData(json: IData, dirSaveToPath?: string)
{
	return getDataFromApiData(json, true)
		.map(async function (item, idx)
		{
			let data = await decodeData(item);
			item.buffer = data.buffer;

			let id = String(idx).padStart(5, '0');

			if (dirSaveToPath)
			{


				let file = path.join(dirSaveToPath, id + FILE_EXT);

				await fs.outputFile(file, item.buffer);
			}

			//console.log(id);

			return item;
		})
	;
}

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

export function decodeBuffer(image: Buffer, keymap: number[])
{
	return image.reduce(function (binary, data, i)
	{
		binary[i] = data ^ keymap[i % 8];

		return binary;
	}, Buffer.alloc(image.length));
}

import self = require("./index");

export default self;
