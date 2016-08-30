'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const getSite = (function () {
    let exec = Promise.coroutine(function* (ctx, siteRelativeUrl, options) {
        const self = this;
        options = options || {};

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
            return "A site at the specified url could not be found.";
        }

         if (result.body.error) {
            return result.body.error.message.value;
        }

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
            args.options = args.options || {};
            return getSite.exec(vorpal.spContext, args.siteRelativeUrl, args.options).then(callback);
        });
};