'use strict';

const os = require('os');
const chalk = require('chalk');
const isWindows = process.platform === 'win32';

module.exports = {

    refresh: function (vorpal) {
        if (!vorpal.spContext) {
            vorpal.delimiter('spo$');
            return;
        }

        let delimiter = `spo:${vorpal.spContext.currentPath}$`;

        // If we're on linux-based systems, color
        // the prompt so we don't get confused.
        if (!isWindows) {
            delimiter = chalk.green(delimiter);
        }
        vorpal.delimiter(delimiter);
    }
};