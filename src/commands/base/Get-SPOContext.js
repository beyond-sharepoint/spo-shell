'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const interfacer = require('./../../util/interfacer');

const getContext = (function () {
    let exec = Promise.coroutine(function* (ctx, url, options) {
        this.dir(ctx.contextInfo);
        return ctx.contextInfo;
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return getContext;
    }

    vorpal.api.getContext = getContext;
    vorpal
        .command('Get-SPOContext')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: getContext,
                spContext: vorpal.spContext,
                args: args.url || "",
                options: args.options || {},
                async: true,
                callback
            });
        });
};