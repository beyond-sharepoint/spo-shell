'use strict';

const util = require("util");
const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");
const _ = require("lodash");

const interfacer = require('./../../util/interfacer');

const getAllPropertyBagValues = (function () {
    let exec = Promise.coroutine(function* (ctx, options) {
        const self = this;
        options = options || {};
        options.Scope = options.Scope || "Web";

        let jsLinkCustomAction = _.omit(_.clone(options), "Scope");
        jsLinkCustomAction.Location = "ScriptLink";
        jsLinkCustomAction.__metadata = {
            type: "SP.UserCustomAction"
        }

        let requestOptions = {
            method: "GET",
        };

        switch (options.Scope) {
            case "Web":
                requestOptions.uri = URI.joinPaths('/_api/web/AllProperties').href();
                break;
            default:
                throw Error("Scope argument must be Web");
        }

        let response = yield ctx.requestAsync(requestOptions);

        if (response.body.error) {
            this.log(response.body.error.message.value);
        }

        this.dir(response.body.d);
        return response.body.d;
    });

    let execCommand = Promise.coroutine(function* (ctx, options) {
        let result = yield exec(ctx, options);

        if (!result || result.length === 0) {
            this.log("Not Found.");
        }

        this.log(util.inspect(result, false, null));
    });

    return {
        exec,
        execCommand
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return getAllPropertyBagValues;
    }

    vorpal.api.getAllPropertyBagValues = getAllPropertyBagValues;
    vorpal
        .command('Get-SPOAllPropertyBagValues')
        .option('-n, --Name [name]', 'Name of the property to retrieve')
        .option('-s, --Scope [scope]', 'Indicates the scope of the property bag values to retrieve. Default is web.', ['Web'])
        .types({
            string: ['n', 'Name']
        })
        .validate(function (args) {
            switch (args.options.Scope) {
                case "Web":
                case undefined:
                case null:
                    break;
                default:
                    return "Scope must be 'Web' (for now)";
            }
            return true;
        })
        .action(function (args, callback) {
            interfacer.call(this, {
                command: getAllPropertyBagValues,
                spContext: vorpal.spContext,
                options: args.options || {},
                async: true,
                callback
            });
        });
};