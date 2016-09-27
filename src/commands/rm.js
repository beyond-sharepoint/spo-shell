'use strict';

const path = require("path");
const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const _ = require("lodash");

const spoAutocomplete = require('./../util/spoAutocomplete');
const delimiter = require('./../delimiter');
const interfacer = require('./../util/interfacer');

const rmdir = (function () {
    let exec = Promise.coroutine(function* (ctx, vorpal, files, options) {

        if (!files || files.length === 0) {
            return;
        }

        for (let file of files) {
            file = ctx.getPathRelativeToCurrent(file);
            let filePath = path.parse(file);
            let isFolder = true;

            let getFolderResult = yield ctx.requestAsync({
                method: "GET",
                url: URI.joinPaths("/_api/Web/", `GetFolderByServerRelativeUrl('${URI.encode(file)}')/`).href()
            });

            if (getFolderResult === 404)
                isFolder = false;

            let url;

            if (!isFolder) {
                url = URI.joinPaths("/_api/Web/", `GetFolderByServerRelativeUrl('${URI.encode(filePath.dir)}')/Files('${URI.encode(filePath.base)}')`).href();
            } else {
                url = URI.joinPaths("/_api/Web/", `GetFolderByServerRelativeUrl('${URI.encode(file)}')/`).href();
            }

            let result = yield ctx.requestAsync({
                method: "POST",
                url: url,
                headers: {
                    "X-HTTP-Method": "DELETE",
                },
            });

            if (options.Force == true)
                continue;

            switch (result.statusCode) {
                case 404:
                case 500:
                    let tmpDir = ctx.getPathRelativeToCurrent(file);
                    this.log(`rm: ${tmpDir}: No such file or directory`);
                    break;
                case 200:
                    //Success, do nothing.
                    break;
                default:
                    if (result.body && result.body.error) {
                        this.log(result.body.error.message.value);
                    } else {
                        this.dir(result)
                    }
                    break;
            }
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
        .command('rm [files...]')
        .autocomplete({
            data: function () {
                return spoAutocomplete(vorpal.spContext);
            }
        })
        .option("-f, --Force", "Ignore nonexistant files, and never prompt before removing.")
        .action(function (args, callback) {
            interfacer.call(this, {
                command: rmdir,
                spContext: vorpal.spContext,
                args: [vorpal, args.files],
                options: args.options || {},
                async: true,
                callback
            });
        });
};