'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const interfacer = require('./../../util/interfacer');

const getFolderByServerRelativeUrl = (function () {
    let exec = Promise.coroutine(function* (ctx, url, options) {
        const self = this;
        options = options || {};

        let result = yield ctx.requestAsync({
            method: "GET",
            url: URI.joinPaths("/_api/Web/", `GetFolderByServerRelativeUrl('${URI.encode(url)}')/`).href(),
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
        return getFolderByServerRelativeUrl;
    }

    vorpal.api.getFolderByServerRelativeUrl = getFolderByServerRelativeUrl;
    vorpal
        .command('Get-SPOFolderByServerRelativeUrl <url>')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: getFolderByServerRelativeUrl,
                spContext: vorpal.spContext,
                args: args.url || "",
                options: args.options || {},
                async: true,
                callback
            });
        });
};