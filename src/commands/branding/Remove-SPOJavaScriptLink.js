'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");

const _ = require("lodash");
const inquirer = require("inquirer");

const interfacer = require('./../../util/interfacer');
const requireUncached = require('require-uncached');
const getSPOJavaScriptLink = requireUncached("./Get-SPOJavaScriptLink")();

const removeJavaScriptLink = (function () {
    let exec = Promise.coroutine(function* (ctx, options) {
        options = options || {};
        options.Scope = options.Scope || "All";
        options.Silent = true;

        let scriptLinks = yield getSPOJavaScriptLink.exec.call(this, ctx, options);

        if (!scriptLinks || scriptLinks.length == 0)
            return;

        scriptLinks = _.orderBy(scriptLinks, ['Sequence'], ['asc']);

        let answers = yield inquirer.prompt({
            name: "scriptLinksToRemove",
            type: "checkbox",
            message: "Select JavaScriptLink(s) to remove",
            choices: function () {
                return _.map(scriptLinks, function (scriptLink) {
                    let sl = scriptLink
                    return {
                        name: `${sl.Name} (${sl.ScriptSrc})`,
                        value: sl
                    }
                });
            }
        });

        let result = [];
        for (let scriptLinkToRemove of answers.scriptLinksToRemove) {
            let sl = scriptLinkToRemove;
            let url = URI.joinPaths(`/_api/Site/UserCustomActions('${sl.Id}')`).href();
            if (sl.Scope === 3)
                url = URI.joinPaths(`/_api/Web/UserCustomActions('${sl.Id}')`).href();

            let response = yield ctx.requestAsync({
                method: "DELETE",
                url: url
            });

            if (response.statusCode === 200) {
                this.log(`${sl.Name} (${sl.ScriptSrc}) removed.`);
            }
            else if (response.body.error) {
                this.log(response.body.error.message.value);
            }
        }
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return removeJavaScriptLink;
    }

    vorpal.api.removeJavaScriptLink = removeJavaScriptLink;
    vorpal
        .command('Remove-SPOJavaScriptLink')
        .option('-n, --Name <name>', 'Name under which to register the JavaScriptLink')
        .option('-s, --Scope [scope]', 'Define if the JavaScriptLink is to be found at the web or site collection scope. Specify All to allow deletion from either web or site collection.', ['All', 'Web', 'Site'])
        .types({
            string: ['n', 'Name']
        })
        .validate(function (args) {
            switch (args.options.Scope) {
                case "All":
                case "Web":
                case "Site":
                case undefined:
                case null:
                    break;
                default:
                    return "Scope must be either 'Site' 'Web' or 'All'";
            }
            return true;
        })
        .action(function (args, callback) {
            interfacer.call(this, {
                command: removeJavaScriptLink,
                spContext: vorpal.spContext,
                options: args.options,
                async: true,
                callback
            });
        });
};