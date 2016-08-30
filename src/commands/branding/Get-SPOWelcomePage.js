'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");
const _ = require("lodash");

const interfacer = require('./../../util/interfacer');

const getWelcomePage = (function () {
    let exec = Promise.coroutine(function* (ctx, options) {

        let response = yield ctx.requestAsync({
            method: "GET",
            url: URI.joinPaths('/_api/web/RootFolder/').href(),
        });

        if (response.body.error) {
            this.log(response.body.error.message.value);
        }

        let welcomePage = response.body.d.WelcomePage;

        if (!welcomePage)
            welcomePage = "default.aspx";

        this.dir(welcomePage);
        return welcomePage;
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return getWelcomePage;
    }

    vorpal.api.getWelcomePage = getWelcomePage;
    vorpal
        .command('Get-SPOWelcomePage', 'Gets the URL to the welcome page')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: getWelcomePage,
                spContext: vorpal.spContext,
                async: true,
                callback
            });
        });
};