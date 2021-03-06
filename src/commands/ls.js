'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");
const _ = require("lodash");
const chalk = require("chalk");

const interfacer = require('./../util/interfacer');
const columnify = require('./../util/columnify');

const ls = (function () {
    let exec = Promise.coroutine(function* (ctx, options) {
        let currentPath = ctx.currentPath;

        let filesPromise = ctx.requestAsync({
            method: "GET",
            url: URI.joinPaths(`_api/web/GetFolderByServerRelativeUrl('${currentPath}')/Files`).href()
        });

        let foldersPromise = ctx.requestAsync({
            method: "GET",
            url: URI.joinPaths(`_api/web/GetFolderByServerRelativeUrl('${currentPath}')/Folders`).href()
        });

        let allResponses = yield Promise.all([
            filesPromise,
            foldersPromise
        ]);

        let filesAndFolders = _.flatMap(allResponses, 'body.d.results');
        filesAndFolders = _.orderBy(filesAndFolders, ['__metadata.type', 'Name'], ['desc', 'asc']);

        let names = [];
        for(let item of filesAndFolders) {
            let name = _.get(item, "Name");

            switch(item.__metadata.type) {
                case "SP.Folder":
                    name = chalk.cyan(name);
                    break;
                default:
                    name = chalk.white(name);
                    break;
            }
            names.push(name);
        }

        this.log(columnify(names));
        return filesAndFolders;
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return ls;
    }
    
    vorpal
        .command('ls [paths...]', 'list file and directory names, also list file/directory attributes')
        .alias("dir")
        .action(function (args, callback) {
            interfacer.call(this, {
                command: ls,
                spContext: vorpal.spContext,
                args: args.paths || [],
                async: true,
                callback
            });
        });
};