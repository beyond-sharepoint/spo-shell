'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const interfacer = require('./../util/interfacer');

const curl = (function () {
    let exec = Promise.coroutine(function* (ctx, url, options) {
        options.Method = options.Method || "GET";

        let opts = {
            method: options.Method,
            url: URI.joinPaths(url).href()
        };

        let result = yield ctx.requestAsync(opts);

        if (!result.body) {
            this.dir(result);
            return;
        }

        if (result.body.error) {
            this.log(result.body.error.message.value);
            return;
        }

        this.dir(result.body);
        return result.body;
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
        .command('curl <url>', "Execute direct requests using the current SPO session")
        .option("-m, --Method <method>", "Specifies the HTTP Verb to use. Default is 'GET'")
        .validate(function (args) {
            if (!args.url) {
                return "A url must be specified.";
            }
            return;
        })
        .action(function (args, callback) {
            interfacer.call(this, {
                command: curl,
                spContext: vorpal.spContext,
                args: args.url || "",
                options: args.options || {},
                async: true,
                callback
            });
        });
};