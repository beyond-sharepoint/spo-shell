'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const interfacer = require('./../../util/interfacer');

const getSite = (function () {
    let exec = Promise.coroutine(function* (ctx, siteRelativeUrl, options) {
        let opts = {
            method: "GET",
            url: URI.joinPaths('/_api/site').href(),
        };

        if (siteRelativeUrl) {
            opts = {
                method: "GET",
                url: URI.joinPaths(siteRelativeUrl, '/_api/site').href(),
            }
        }

        let result = yield ctx.requestAsync(opts);

        if (result.statusCode === 404) {
            this.log("A site at the specified url could not be found.");
        }

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
        return getSite;
    }
    vorpal.api.getSite = getSite;
    vorpal
        .command('Get-SPOSite [siteRelativeUrl]')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: getSite,
                spContext: vorpal.spContext,
                args: args.siteRelativeUrl || "",
                options: args.options || {},
                async: true,
                callback
            });
        });
};