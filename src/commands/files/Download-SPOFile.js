'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const fs = require("fs");
const progress = require("request-progress");
const Gauge = require("gauge");

const interfacer = require('./../../util/interfacer');

const downloadFile = (function () {
    let exec = Promise.coroutine(function* (ctx, siteRelativeFileUrl, localFileName, options) {

        if (!siteRelativeFileUrl)
            throw Error("A URL must be specified of the target file to download.");

        if (!localFileName) {
            localFileName = siteRelativeFileUrl.substring(siteRelativeFileUrl.lastIndexOf('/') > -1 ? siteRelativeFileUrl.lastIndexOf('/') + 1 : 0);
        }

        let opts = {
            method: "GET",
            url: URI.joinPaths(siteRelativeFileUrl).href(),
        };

        var gauge = new Gauge({
            updateInterval: 50
        });

        gauge.show(localFileName, 0)

        let waitPromise = new Promise(function (resolve, reject) {
            let request = ctx.request(opts);
            progress(request, {
                throttle: 250
            })
                .on('progress', function (state) {
                    gauge.show(`${localFileName} : ${(state.percentage * 100).toFixed(2)}%`, state.percentage)
                })
                .on('error', function (err) {
                    reject(err);
                })
                .on('end', function () {
                    gauge.hide();
                    gauge.disable();
                    resolve(request);
                })
                .pipe(fs.createWriteStream(localFileName));
        });

        try {
            let request = yield waitPromise;

            switch (request.response.statusCode) {
                case 200:
                    this.log(`Done! ${request.response.headers['content-length']} bytes written to ${localFileName}`);
                    break;
                case 404:
                    this.log("A file could not be found at the specified url.");
                    break;
                default:
                    if (request.response.body.error)
                        this.log(request.response.body.error.message);
                    else
                        this.log(`An error occurred. StatusCode: ${request.response.statusCode}`);
                    break;
            }
        } catch (ex) {
            this.log(ex);
        }
    });
    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return downloadFile;
    }
    vorpal.api.downloadFile = downloadFile;
    vorpal
        .command('Download-SPOFile <fileUrl> [localFileName]', 'Downloads the file at the specified url')
        .alias('dl')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: downloadFile,
                spContext: vorpal.spContext,
                args: [args.fileUrl || "", args.localFileName || ""],
                options: args.options || {},
                async: true,
                callback
            });
        });
};