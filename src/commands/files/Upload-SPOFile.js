'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const fs = require("fs");
const fsAutocomplete = require('vorpal-autocomplete-fs');
const progress = require("request-progress");
const Gauge = require("gauge");

const interfacer = require('./../../util/interfacer');

const uploadFile = (function () {
    let exec = Promise.coroutine(function* (ctx, localFilename, targetFolderServerRelativeUrl, options) {
        options.Overwrite = options.Overwrite ? !!options.Overwrite : false;

        if (!localFilename)
            throw Error("The path to a file to upload must be specified.");

        if (!targetFolderServerRelativeUrl)
            throw Error("The target folder server relative url must be specified.");

        let targetFilename = localFilename.substring(localFilename.lastIndexOf("/") + 1);
        if (options.Filename) {
            targetFilename = options.Filename;
        }

        console.log(targetFolderServerRelativeUrl, targetFilename);

        try
        {
            fs.statSync(localFilename).isFile();
        }
        catch (err)
        {
            throw Error("The specified file doesn't exist.");
        }

        let opts = {
            method: "POST",
            url: URI.joinPaths(`/_api/web/getfolderbyserverrelativeurl('${URI.encode(targetFolderServerRelativeUrl)}')/files/add(overwrite=${options.Overwrite}, url='${URI.encode(targetFilename)}')`).href(),
            body: fs.createReadStream(localFilename)
        };

        // var res = yield ctx.requestAsync(opts);
        // console.log(res);
        // fs.createReadStream(localFilename)
        //     .pipe(ctx.request(opts, function(err, res) {
        //         console.log('foo');
        //         console.log(res);
        //         if (res.body.error) {
        //             console.log(res.body.error.message);
        //         }
        //     }));

        var gauge = new Gauge({
            updateInterval: 50
        });

        gauge.show(targetFilename, 0)

        let waitPromise = new Promise(function(resolve, reject) {
             let result = progress(ctx.request(opts), {
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
            switch(request.response.statusCode) {
                case 200:
                    this.log(`Done! ${request.headers['content-length']} bytes written to ${targetFilename} at ${targetFolderServerRelativeUrl}`);
                    break;
                case 400:
                    this.log("The specified file already exists in the target folder. Specify the -o option to overwrite the file.");
                    break;
                default:
                    if (request.response.body.error)
                        this.log(request.response.body.error.message);
                    else
                        this.log(`An error occurred. StatusCode: ${request.response.statusCode}`);
                    break;
            }
        } catch(ex) {
            this.log(ex);
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
        .command('Upload-SPOFile <localFileName> <targetFolderServerRelativeUrl>', 'Uploads the specified file to the specified url')
        .alias('ul')
        .autocomplete(fsAutocomplete())
        .option('-o, --Overwrite', 'Overwrite the file if it already exists')
        .option('-n, --Filename <fileName', 'Specify the target file name if it should differ from the local file name.')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: uploadFile,
                spContext: vorpal.spContext,
                args: [ args.localFileName || "", args.targetFolderServerRelativeUrl || "" ],
                options: args.options || {},
                async: true,
                callback
            });
        });
};