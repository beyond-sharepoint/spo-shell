'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const path = require("path");
const fs = require("fs");
const fsAutocomplete = require('vorpal-autocomplete-fs');
const progress = require("request-progress");
const Gauge = require("gauge");

const interfacer = require('./../../util/interfacer');

const uploadFile = (function () {
    let uploadFile = Promise.coroutine(function*(ctx, localFilePath, targetFolderServerRelativeUrl, targetFilename, options) {

        let opts = {
            method: "POST",
            url: URI.joinPaths(`/_api/web/getfolderbyserverrelativeurl('${URI.encode(targetFolderServerRelativeUrl)}')/files/add(overwrite=${options.Overwrite}, url='${URI.encode(targetFilename)}')`).href()
        };

        var gauge = new Gauge({
            updateInterval: 50
        });

        let self = this;
        gauge.show(targetFilename, 0)

        let waitPromise = new Promise(function(resolve, reject) {
             let fileBuffer =  fs.readFileSync(localFilePath);
             var uploadRequest = ctx.request(opts);
             uploadRequest.body = fileBuffer;

             let result = progress(uploadRequest, {
                 throttle: 250
             })
                .on('progress', function(state) {
                    gauge.show(`${targetFileName} : ${(state.percentage * 100).toFixed(2)}%`, state.percentage)
                })
                .on('error', function(err) {
                    reject(err);
                })
                .on('end', function() {
                    gauge.hide();
                    gauge.disable();
                    resolve(result);
                });
        });

        try {
            let request = yield waitPromise;
            request.removeAllListeners();

            switch(request.response.statusCode) {
                case 200:
                    this.log(`Done! ${request.headers['content-length']} bytes written to ${targetFolderServerRelativeUrl}${path.sep}${targetFilename}`);
                    break;
                case 400:
                    this.log("The specified file already exists in the target folder. Specify the -o option to overwrite the file.");
                    break;
                default:
                    if (request.response.body && request.response.body.error)
                        this.log(request.response.body.error.message);
                    else
                        this.log(`An error occurred. StatusCode: ${request.response.statusCode}`);
                    break;
            }
        } catch(ex) {
            this.log(ex);
        }
    });

    let createFolder= Promise.coroutine(function*(ctx, localDirectoryPath, targetFolderServerRelativeUrl, targetRootFolder, options) {

        //If the targetRootFolder does not exist, create it.
        let opts = {
            method: "POST",
            url: URI.joinPaths(`/_api/web/getfolderbyserverrelativeurl('${URI.encode(targetFolderServerRelativeUrl)}')/folders/add(url='${URI.encode(targetRootFolder)}')`).href(),
        };

        let result = yield ctx.requestAsync(opts);

        //Folder created.
        if (result.statusCode === 200) {
            this.dir(result);
            return result.body.d;
        }

        this.dir(result);
    });

    let exec = Promise.coroutine(function* (ctx, localFilename, targetFolderServerRelativeUrl, options) {
        options.Overwrite = options.Overwrite ? !!options.Overwrite : false;

        if (!localFilename)
            throw Error("The path to a file to upload must be specified.");

        if (!targetFolderServerRelativeUrl)
            throw Error("The target folder server relative url must be specified.");
        
        targetFolderServerRelativeUrl = ctx.getPathRelativeToCurrent(targetFolderServerRelativeUrl);

        let localFilePath = path.join(process.cwd(), localFilename);

        let mode = "file";
        try
        {
            let stat = fs.statSync(localFilePath);
            if (stat.isFile())
                mode = "file";
            if (stat.isDirectory())
                mode = "directory";
        }
        catch (err)
        {
            throw Error("The  file or folder to upload cannot be found.");
        }

        if (mode === "file") {
            let targetFilename = path.basename(localFilePath);
            if (options.Filename) {
                targetFilename = options.Filename;
            }

            yield uploadFile.call(this, ctx, localFilePath, targetFolderServerRelativeUrl, targetFilename, options);
        } else {
            let targetRootFolder = path.basename(localFilePath);
            if (options.RootFolder) {
                targetRootFolder = options.RootFolder;
            }

            yield createFolder.call(this, ctx, localFilePath, targetFolderServerRelativeUrl, targetRootFolder, options);
        }
    });
    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return uploadFile;
    }
    vorpal.api.uploadFile = uploadFile;
    vorpal
        .command('Upload-SPOFile <localFileName> [targetFolderServerRelativeUrl]', 'Uploads the specified file to the specified url')
        .alias('ul')
        .autocomplete(fsAutocomplete({all: true}))
        .option('-o, --Overwrite', 'Overwrite the file if it already exists')
        .option('-n, --Filename <fileName', 'Specify the target file name if it should differ from the local file name.')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: uploadFile,
                spContext: vorpal.spContext,
                args: [ args.localFileName || "", args.targetFolderServerRelativeUrl || "." ],
                options: args.options || {},
                async: true,
                callback
            });
        });
};