'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const _ = require("lodash");

const delimiter = require('./../delimiter');
const interfacer = require('./../util/interfacer');

const cd = (function () {
    let exec = Promise.coroutine(function* (ctx, vorpal, dir, options) {

        if (!dir) {
            return;
        }

        let targetFolder = URI.joinPaths(ctx.currentPath, dir);

        //Make sure it exists.
        let result = yield ctx.requestAsync({
            method: "GET",
            url: URI.joinPaths("/_api/Web/", `GetFolderByServerRelativeUrl('${URI.encode(targetFolder)}')/`).href(),
        });

        if (result.statusCode == 500) {
            let tmpDir = ctx.getPathRelativeToCurrent(dir);
            this.log(`cd: ${tmpDir}: No such file or directory`);
            return;
        } else if (result.body.error) {
            this.log(result.body.error.message.value);
            return;
        }

        let currentPath = _.get(result, "body.d.ServerRelativeUrl");
        if (currentPath) {
            ctx.currentPath = currentPath
            delimiter.refresh(vorpal);
        }

        //Do nothing.
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return cd;
    }
    
    vorpal
        .command('cd [dir]')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: cd,
                spContext: vorpal.spContext,
                args: [vorpal, args.dir || ""],
                options: args.options || {},
                async: true,
                callback
            });
        });
};