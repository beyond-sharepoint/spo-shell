'use strict';

const util = require("util");
const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");
const _ = require("lodash");

const interfacer = require('./../../util/interfacer');

const addJavaScriptLink = (function () {
    let exec = Promise.coroutine(function* (ctx, options) {
        const self = this;
        options = options || {};
        options.Scope = options.Scope || "Web";
        options.Sequence = options.Sequence || 0;

        let jsLinkCustomAction = _.omit(_.clone(options), "Scope");
        jsLinkCustomAction.Location = "ScriptLink";
        jsLinkCustomAction.__metadata = {
            type: "SP.UserCustomAction"
        }

        let requestOptions = {
            method: "POST",
            body: jsLinkCustomAction
        };

        switch (options.Scope) {
            case "Web":
                requestOptions.uri = URI.joinPaths('/_api/web/UserCustomActions').href();
                break;
            case "Site":
                requestOptions.uri = URI.joinPaths('/_api/site/UserCustomActions').href();
                break;
            default:
                throw Error("Scope argument must be either Web or Site");
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
        return addJavaScriptLink;
    }

    vorpal.api.addJavaScriptLink = addJavaScriptLink;
    vorpal
        .command('Add-SPOJavaScriptLink')
        .option('-n, --Name <name>', 'Name under which to register the JavaScriptLink')
        .option('-u, --ScriptSrc <url>', 'URL to the JavaScript file to inject')
        .option('-q, --Sequence [seq]', 'Sequence of this JavaScript being injected. Use when you have a specific sequence with which to have JavaScript files being added to the page. I.e. jQuery library first and then jQueryUI.')
        .option('-s, --Scope [scope]', 'Defines if this JavaScript file will be injected to every page within the current site collection or web. All is not allowed in for this command. Default is web.', ['Web', 'Site'])
        .types({
            string: ['n', 'Name', 'u', 'Url']
        })
        .validate(function (args) {
            if (!args.options.Name || !args.options.ScriptSrc) {
                return "Name and ScriptSrc arguments must be specified";
            }

            switch (args.options.Scope) {
                case "Web":
                case "Site":
                case undefined:
                case null:
                    break;
                default:
                    return "Scope must be either 'Site' or 'Web'";
            }
            return true;
        })
        .action(function (args, callback) {
            interfacer.call(this, {
                command: addJavaScriptLink,
                spContext: vorpal.spContext,
                options: args.options || {},
                async: true,
                callback
            });
        });
};