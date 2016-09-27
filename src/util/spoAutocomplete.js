'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");
const _ = require("lodash");

module.exports = function (ctx, options) {
    options = options || {
        includeFiles: true,
        includeFolders: true
    };

    return Promise.coroutine(function* () {
        let currentPath = ctx.currentPath;
        let promises = [];

        if (options.ncludeFiles) {
            let filesPromise = ctx.requestAsync({
                method: "GET",
                url: URI.joinPaths(`_api/web/GetFolderByServerRelativeUrl('${currentPath}')/Files`).href()
            });
            promises.push(filesPromise);
        }

        if (options.includeFolders) {
            let foldersPromise = ctx.requestAsync({
                method: "GET",
                url: URI.joinPaths(`_api/web/GetFolderByServerRelativeUrl('${currentPath}')/Folders`).href()
            });
            promises.push(foldersPromise);
        }

        let allResponses = yield Promise.all(promises);

        let filesAndFolders = _.flatMap(allResponses, 'body.d.results');
        filesAndFolders = _.orderBy(filesAndFolders, ['__metadata.type', 'Name'], ['desc', 'asc']);

        let names = [];
        for (let item of filesAndFolders) {
            let name = _.get(item, "Name");
            names.push(URI.encode(name));
        }
        return names;
    })().then(function (names) { return names });
};