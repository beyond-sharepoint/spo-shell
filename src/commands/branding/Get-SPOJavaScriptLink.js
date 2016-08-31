'use strict';

const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");
const _ = require("lodash");

const interfacer = require('./../../util/interfacer');

const getJavaScriptLink = (function () {
    let exec = Promise.coroutine(function* (ctx, options) {
        options = options || {};
        options.Scope = options.Scope || "All";

        let siteCustomActions = [], webCustomActions = [];
        
        if (options.Scope === "All" || options.Scope === "Site") {
            let siteCustomActionsResponse = yield ctx.requestAsync({
                method: "GET",
                url: URI.joinPaths('/_api/site/UserCustomActions').href(),
            });

            if (siteCustomActionsResponse.body.error) {
                return siteCustomActionsResponse.body.error.message.value;
            }

            siteCustomActions = siteCustomActionsResponse.body.d.results;
        }

        if (options.Scope === "All" || options.Scope === "Web") {
            let webCustomActionsResponse = yield ctx.requestAsync({
                method: "GET",
                url: URI.joinPaths('/_api/web/UserCustomActions').href(),
            });

            if (webCustomActionsResponse.body.error) {
                return webCustomActionsResponse.body.error.message.value;
            }

            webCustomActions = webCustomActionsResponse.body.d.results;
        }

        let customActions = _.concat(siteCustomActions, webCustomActions);
        customActions = _.filter(customActions, {"Location": "ScriptLink"});
        customActions = _.orderBy(customActions, ['Sequence'], ['asc']);

        if (options.Name) {
            let result =  _.find(customActions, { "Name": options.Name });
            if (!result)
                return;
            return [result];
        }

        if (!options.Silent) {
            this.dir(customActions);
        }
        
        return customActions;
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return getJavaScriptLink;
    }

    vorpal.api.getJavaScriptLink = getJavaScriptLink;
    vorpal
        .command('Get-SPOJavaScriptLink')
        .option('-s, --Scope [scope]', 'Scope of the action, either Web, Site or All to return both', ['All', 'Web', 'Site'])
        .option('-n, --Name [name]', 'Gets the JavaScriptLink with the specified name.')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: getJavaScriptLink,
                spContext: vorpal.spContext,
                options: args.options || {},
                async: true,
                callback
            });
        });
};