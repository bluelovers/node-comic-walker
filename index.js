"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("cross-fetch");
const fs = require("fs-extra");
const bluebird = require("bluebird");
const path = require("path");
const debug_color2_1 = require("debug-color2");
const FILE_EXT = '.jpg';
exports.console = new debug_color2_1.Console();
function decodeData(item, fileSaveToPath) {
    return getData(item, true)
        .then(async function (data) {
        if (!data) {
            throw new TypeError(`not a valid data`);
        }
        let key = await generateKeyMap(data.drm_hash);
        let image = await downloadEncodeImage(data.source_url);
        data.buffer = await decodeBuffer(image, key);
        return data;
    })
        .tap(async function (data) {
        if (fileSaveToPath) {
            return fs.outputFile(fileSaveToPath, data.buffer);
        }
    });
}
exports.decodeData = decodeData;
function saveAllFromApiData(json, dirSaveToPath) {
    let options = dirSaveToPath && typeof dirSaveToPath === 'string' ? {
        output: dirSaveToPath,
    } : Object.assign({}, dirSaveToPath);
    options.cwd = options.cwd || process.cwd();
    return getDataFromApiData(json, true)
        .tap(function () {
        if (options.log) {
            exports.console.info(`開始下載`);
        }
    })
        .map(async function (item, idx, len) {
        let data = await decodeData(item);
        item.buffer = data.buffer;
        let id = String(idx).padStart(5, '0');
        if (options.output) {
            let file = path.join(options.output, id + FILE_EXT);
            await fs.outputFile(file, item.buffer);
            if (options.log) {
                let i = String(idx)
                    .padStart(String(len).length, '0');
                exports.console.success(`[${i}/${len}]`, id);
            }
        }
        return item;
    });
}
exports.saveAllFromApiData = saveAllFromApiData;
function getDataFromApiData(json, fakeASync) {
    if (json
        && json.data
        && Array.isArray(json.data.result)) {
        let ret = json.data.result
            .reduce(function (arr, item) {
            arr.push(getData(item, false));
            return arr;
        }, []);
        if (!fakeASync) {
            return ret;
        }
        return bluebird.resolve(ret);
    }
    return null;
}
exports.getDataFromApiData = getDataFromApiData;
function getData(item, fakeASync) {
    let meta;
    let data;
    if (item) {
        // @ts-ignore
        if (item.meta && typeof item.meta.source_url === 'string' && typeof item.meta.drm_hash === 'string') {
            // @ts-ignore
            data = item;
            // @ts-ignore
            meta = item.meta;
        }
        // @ts-ignore
        else if (typeof item.source_url === 'string' && typeof item.drm_hash === 'string') {
            // @ts-ignore
            meta = item;
        }
    }
    if (meta) {
        let { source_url, drm_hash } = meta;
        const ret = {
            data,
            source_url,
            drm_hash,
        };
        if (!fakeASync) {
            return ret;
        }
        // @ts-ignore
        return Object.assign({
            then(cb) {
                return new bluebird(function (resolve, reject, onCancel) {
                    return resolve(cb(ret));
                });
            },
        }, ret);
    }
    return null;
}
exports.getData = getData;
async function downloadEncodeImage(url) {
    return bluebird
        .resolve()
        .then(async function () {
        let res = await fetch.fetch(url, {
            credentials: 'include',
        });
        let tmp = await res.arrayBuffer();
        let result = Buffer.from(new Uint8Array(tmp));
        return result;
    });
}
exports.downloadEncodeImage = downloadEncodeImage;
function generateKeyMap(drm_hash) {
    let result = [];
    let code;
    for (let i = 0; i < 16; i++) {
        code = drm_hash.charCodeAt(i);
        if (code >= 97) {
            code = code - 87;
        }
        else {
            code = code - 48;
        }
        if (i % 2 === 0) {
            result.push(code * 16);
        }
        else {
            result[(i - 1) / 2] += code;
        }
    }
    return result;
}
exports.generateKeyMap = generateKeyMap;
function decodeBuffer(image, keymap) {
    return image.reduce(function (binary, data, i) {
        binary[i] = data ^ keymap[i % 8];
        return binary;
    }, Buffer.alloc(image.length));
}
exports.decodeBuffer = decodeBuffer;
function getApiID(input) {
    let m;
    let id;
    if (m = /^(\w+_\w+\d+_\w+)$/.exec(input)) {
        id = m[1];
    }
    else if (m = /ssl.seiga.nicovideo.jp\/api\/v1\/comicwalker\/episodes\/(\w+_\w+_\w+)/.exec(input)) {
        id = m[1];
    }
    else if (m = /comic-walker\.com\/viewer\/\?(?:.+&)?cid=(\w+_\w+_\w+)/.exec(input)) {
        id = m[1];
    }
    else if (m = /comic-walker\.com\/contents\/detail\/(\w+_\w+_\w+)/i.exec(input)) {
        id = m[1];
    }
    return id;
}
exports.getApiID = getApiID;
function createApiUrl(id) {
    id = getApiID(id);
    if (!id) {
        throw new TypeError(`not a valid id`);
    }
    //id = id.replace(/0(_\w+)$/, '1$1');
    return `https://ssl.seiga.nicovideo.jp/api/v1/comicwalker/episodes/${id}/frames`;
}
exports.createApiUrl = createApiUrl;
function downloadID(input, dirSaveToPath) {
    let id = getApiID(input);
    let url = createApiUrl(id);
    //console.dir(url);
    let options = dirSaveToPath && typeof dirSaveToPath === 'string' ? {
        output: dirSaveToPath,
    } : Object.assign({}, dirSaveToPath);
    options.cwd = options.cwd || process.cwd();
    return bluebird
        .resolve()
        .then(async function () {
        let res = await fetch.fetch(url, {
            credentials: 'include',
        })
            .catch(function () {
            id = id.replace(/0(_\w+)$/, '1$1');
            url = createApiUrl(id);
            return fetch.fetch(url, {
                credentials: 'include',
            });
        });
        return res.json();
    })
        .then(function (json) {
        if (!options.output) {
            options.output = path.join(options.cwd, id);
        }
        return saveAllFromApiData(json, options);
    });
}
exports.downloadID = downloadID;
const self = require("./index");
exports.default = self;
