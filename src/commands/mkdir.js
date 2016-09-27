'use strict';

const path = require("path");
const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const _ = require("lodash");

const delimiter = require('./../delimiter');
const interfacer = require('./../util/interfacer');

let mkdir = (function () {
    let exec = Promise.coroutine(function* (ctx, vorpal, dir, options) {

        let opts = {
            method: "POST",
            url: URI.joinPaths(`/_api/web/getfolderbyserverrelativeurl('${URI.encode(ctx.currentPath)}')/folders/add(url='${URI.encode(dir)}')`).href(),
        };

        let result = yield ctx.requestAsync(opts);

        //Folder created.
        if (result.statusCode === 200) {
            return result.body.d;
        }
    });

    return {
        exec
    }
})();


module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return mkdir;
    }

    vorpal
        .command('mkdir [dir]')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: mkdir,
                spContext: vorpal.spContext,
                args: [vorpal, args.dir || ""],
                options: args.options || {},
                async: true,
                callback
            });
        });
};