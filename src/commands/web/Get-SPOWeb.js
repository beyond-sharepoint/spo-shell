'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const interfacer = require('./../../util/interfacer');

const getWeb = (function () {
    let exec = Promise.coroutine(function* (ctx, url, options) {
        let result = yield ctx.requestAsync({
            method: "GET",
            url: URI.joinPaths("/_api/Web/").href(),
        });

        if (result.body.error) {
            this.log(result.body.error.message.value);
            return;
        }

        this.dir(result.body.d);
        return result.body.d;
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return getWeb;
    }

    vorpal.api.getWeb = getWeb;
    vorpal
        .command('Get-SPOWeb [url]')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: getWeb,
                spContext: vorpal.spContext,
                args: args.url || "",
                options: args.options || {},
                async: true,
                callback
            });
        });
};