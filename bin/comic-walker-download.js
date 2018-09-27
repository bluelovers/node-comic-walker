#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const updateNotifier = require("update-notifier");
const yargs = require("yargs");
const pkg = require("../package.json");
const index_1 = require("../index");
updateNotifier({ pkg }).notify();
let argv = yargs
    .option('output', {
    alias: ['o'],
    string: true,
    normalize: true,
})
    .command('$0', '', function (yargs) {
    return yargs.option('skipCache', {
        alias: ['s', 'skip'],
        type: 'boolean',
    });
}, function (argv) {
    return index_1.downloadID(argv._[0], {
        output: argv.output,
        log: true,
    })
        .tap(function (ls) {
        index_1.console.info(`下載完成 總共 ${ls.length} P`);
    });
})
    .argv;
