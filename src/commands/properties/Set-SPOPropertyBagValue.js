'use strict';

const util = require("util");
const URI = require("urijs");
const Promise = require('bluebird');
require("bluebird-co");
const _ = require("lodash");
const mustache = require("mustache");

const interfacer = require('./../../util/interfacer');

const requestTemplate = `<Request AddExpandoFieldTypeSuffix="true" SchemaVersion="15.0.0.0" LibraryVersion="16.0.0.0" ApplicationName=".NET Library" xmlns="http://schemas.microsoft.com/sharepoint/clientquery/2009">
        <Actions>
            <ObjectPath Id="2" ObjectPathId="1" />
            <ObjectPath Id="4" ObjectPathId="3" />
            <ObjectPath Id="6" ObjectPathId="5" />
            <Method Name="SetFieldValue" Id="7" ObjectPathId="5">
                <Parameters>
                    <Parameter Type="String">{{key}}</Parameter>
                    <Parameter Type="String">{{value}}</Parameter>
                </Parameters>
            </Method>
            <Method Name="Update" Id="8" ObjectPathId="3" />
        </Actions>
        <ObjectPaths>
            <StaticProperty Id="1" TypeId="{3747adcd-a3c3-41b9-bfab-4a64dd2f1e0a}" Name="Current" />
            <Property Id="3" ParentId="1" Name="{{scope}}" />
            <Property Id="5" ParentId="3" Name="AllProperties" />
        </ObjectPaths>
</Request>`;

const setPropertyBagValue = (function () {
    let exec = Promise.coroutine(function* (ctx, options) {
        const self = this;
        options = options || {};
        options.Scope = options.Scope || "Web";
        options.Sequence = options.Sequence || 0;

        let templateValues = {
                key: options.Key,
                value: options.Value
        };

        let requestOptions = {
            method: "POST",
            headers: {
                "Content-Type": "text/xml",
                "X-RequestForceAuthentication": true,
                "Host": "baristalabs.sharepoint.com"
            },
            uri: URI.joinPaths('/_vti_bin/client.svc/ProcessQuery').href(),
            json: false
        };

        switch (options.Scope) {
            case "Web":
                templateValues.scope = "Web";
                break;
            case "Site":
                templateValues.scope = "Site";
                break;
            default:
                throw Error("Scope argument must be either Web or Site");
        }

        requestOptions.body = mustache.render(requestTemplate, templateValues);
        let response = yield ctx.requestAsync(requestOptions);

        if (response.body.error) {
            this.log(response.body.error.message.value);
        }

        this.dir(response.body);
        return response.body;
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
        return setPropertyBagValue;
    }

    vorpal.api.setPropertyBagValue = setPropertyBagValue;
    vorpal
        .command('Set-SPOPropertyBagValue')
        .option('-k, --Key <key>', 'Key of the Property Bag Property')
        .option('-v, --Value <value>', 'Value of the Property Bag Property')
        .option('-s, --Scope [scope]', 'Defines what object that property bag will be set on. Default is web.', ['Web', 'Site'])
        .types({
            string: ['k', 'Key']
        })
        .validate(function (args) {
            if (!args.options.Key || !args.options.Value) {
                return "Key and Value arguments must be specified";
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
                command: setPropertyBagValue,
                spContext: vorpal.spContext,
                options: args.options || {},
                async: true,
                callback
            });
        });
};