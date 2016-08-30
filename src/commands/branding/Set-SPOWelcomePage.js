'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const chalk = require("chalk");
const _ = require("lodash");

const interfacer = require('./../../util/interfacer');

const setWelcomePage = (function () {
    let exec = Promise.coroutine(function* (ctx, url, options) {

        let response = yield ctx.requestAsync({
            method: "POST",
            url: URI.joinPaths('/_api/web/RootFolder/').href(),
            headers: {
                "X-HTTP-Method": "PATCH",
            },
            body: {
                "__metadata": {
                    type: "SP.Folder"
                },
                "WelcomePage": url
            }
        });

        if (response.statusCode === 204) {
            this.log(chalk.green(`WelcomePage set to ${url}`));
            return url;
        }

        this.dir(response);
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return setWelcomePage;
    }

    vorpal.api.setWelcomePage = setWelcomePage;
    vorpal
        .command('Set-SPOWelcomePage <url>', 'Sets the URL to the welcome page')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: setWelcomePage,
                spContext: vorpal.spContext,
                args: args.url || "",
                async: true,
                callback
            });
        });
};