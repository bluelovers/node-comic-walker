#!/usr/bin/env node

import updateNotifier = require( 'update-notifier' );
import yargs = require( 'yargs' );
import pkg = require( '../package.json' );

import { IArgv } from 'tieba-sign/bin/tieba-sign';
import { downloadID, console } from '../index';
import fs = require('fs-extra');
import bluebird = require('bluebird');
import path = require('path');

updateNotifier({ pkg }).notify();

let argv = yargs
	.option('output', {
		alias: ['o'],
		string: true,
		normalize: true,
	})
	.command('$0', '', function (yargs)
	{
		return yargs.option('skipCache', {
			alias: ['s', 'skip'],
			type: 'boolean',
		})
	}, function (argv)
	{
		return downloadID(argv._[0], {
			output: argv.output,
			log: true,
		})
			.tap(function (ls)
			{
				console.info(`下載完成 總共 ${ls.length} P`);
			})
			;
	})
	.argv
;
