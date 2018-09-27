"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fetch = require("cross-fetch");
const fs = require("fs-extra");
const bluebird = require("bluebird");
const path = require("path");
const FILE_EXT = '.jpg';
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
    return getDataFromApiData(json, true)
        .map(async function (item, idx) {
        let data = await decodeData(item);
        item.buffer = data.buffer;
        let id = String(idx).padStart(5, '0');
        if (dirSaveToPath) {
            let file = path.join(dirSaveToPath, id + FILE_EXT);
            await fs.outputFile(file, item.buffer);
        }
        //console.log(id);
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
const self = require("./index");
exports.default = self;
