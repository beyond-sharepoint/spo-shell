'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const getListByTitle = (function () {
    let exec = Promise.coroutine(function* (ctx, title, options) {
        const self = this;
        options = options || {};

        let result = yield ctx.requestAsync({
            method: "GET",
            url: URI.joinPaths("/_api/web/lists/", `GetByTitle('${URI.encode(title)}')/`).href(),
        });

        if (result.body.error) {
            this.log(result.body.error.message.value);
            return;
        }

        this.log(result.body.d);
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return getListByTitle;
    }

    vorpal.api.getListByTitle = getListByTitle;
    vorpal
        .command('Get-SPOListByTitle <title>')
        .action(function (args, callback) {
            args.options = args.options || {};

            return getListByTitle.exec.call(this, vorpal.spContext, args.title, args.options).then(callback);
        });
};