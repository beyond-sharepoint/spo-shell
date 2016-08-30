'use strict';

const util = require("util");
const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const curl = (function () {
    let exec = Promise.coroutine(function* (ctx, url, options) {
        const self = this;
        options = options || {};

        //TODO: add options
        let opts = {
            method: "GET",
            url: URI.joinPaths(url).href()
        };

        let result = yield ctx.requestAsync(opts);

         if (result.body.error) {
            this.log(result.body.error.message.value);
            return;
        }

        this.log(util.inspect(result.body, false, null));
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return curl;
    }
    vorpal.api.curl = curl;
    vorpal
        .command('curl [url]', "Execute direct requests using the current SPO session")
        .validate(function(args) {
            if (!args.url) {
                return "A url must be specified.";
            }
            return;
        })
        .action(function (args, callback) {
            args.options = args.options || {};
            return curl.exec.call(this, vorpal.spContext, args.url, args.options).then(callback);
        });
};