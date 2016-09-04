'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const _ = require("lodash");

const delimiter = require('./../delimiter');
const interfacer = require('./../util/interfacer');

const rmdir = (function () {
    let exec = Promise.coroutine(function* (ctx, vorpal, dir, options) {

        if (!dir) {
            return;
        }

        let targetFolder = URI.joinPaths(ctx.currentPath, dir);

        //Make sure it exists.
        let result = yield ctx.requestAsync({
            method: "POST",
            url: URI.joinPaths("/_api/Web/", `GetFolderByServerRelativeUrl('${URI.encode(targetFolder)}')/`).href(),
            headers: {
                "X-HTTP-Method": "DELETE",
            },
        });

        if (result.statusCode === 500) {
            let tmpDir = ctx.getPathRelativeToCurrent(dir);
            this.log(`rmdir: ${tmpDir}: No such file or directory`);
            return;
        } else if (result.body && result.body.error) {
            this.log(result.body.error.message.value);
            return;
        }
        
        if (result.statusCode !== 200){
            this.dir(result)
            return;
        }
        
        //No result.
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return rmdir;
    }
    
    //Add rmdir to the api.
    vorpal.api = rmdir;

    //Define the command.
    vorpal
        .command('rmdir <dir>')
        .alias("rd")
        .action(function (args, callback) {
            interfacer.call(this, {
                command: rmdir,
                spContext: vorpal.spContext,
                args: [vorpal, args.dir || "."],
                options: args.options || {},
                async: true,
                callback
            });
        });
};