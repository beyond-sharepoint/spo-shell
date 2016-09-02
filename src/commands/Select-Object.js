'use strict';

const _ = require("lodash");
const Promise = require('bluebird');
require("bluebird-co");

const interfacer = require('./../util/interfacer');

const selectObject = (function () {
    let exec = Promise.coroutine(function* (ctx, options) {
        let lastResultPromise = this.getLastResult();
        let lastResult =  yield lastResultPromise;

        if (!lastResult) {
            this.log("No Result.");
            return;
        }

        //TODO: ExpandProperty, wildcards, etc...
        let output = lastResult;
        if (_.isArray(output)) {
            let tmp = [];
            for(let val of output) {
                val = _.pick(val, options.Property);
                val = _.omit(val, options.ExcludeProperty);
                tmp.push(val);
            }
            output = tmp;
        } else {
            if (!_.isNil(options.Property)) {
                output = _.pick(output, options.Property);
            }

            if (!_.isNil(options.ExcludeProperty)) {
                output = _.omit(output, options.ExcludeProperty);
            }
        }

        //Expand objects by determining if they have a __deferred uri, if they do, get the deferred value.
        if (!_.isArray(options.ExpandProperty))
            options.ExpandProperty = [options.ExpandProperty];

        let expandDeferreds = [];
        for (let propertyPath of options.ExpandProperty) {
            let deferredUri = _.get(output, [propertyPath, "__deferred", "uri"]);

            if (deferredUri) {
                let deferred = ctx.requestAsync({
                    method: "GET",
                    baseUrl: "",
                    url: deferredUri
                }).then(function(response) {
                    let value = _.get(response, "body.d");
                    if (value) {
                        _.set(output, propertyPath, value);
                    }
                    else {
                        let errorMessage = _.get(response, "body.e.error.message");
                        if (errorMessage) {
                            _.set(output, propertyPath, errorMessage);
                        } else {
                            _.set(output, propertyPath, `Error retrieving deferred: ${response.statusCode}`);
                        }
                    }
                });

                expandDeferreds.push(deferred);
            }
        }
        //TODO: Recursive ExpandProperties.

        yield Promise.all(expandDeferreds);

        this.dir(output);
        return output;
    });

    return {
        exec
    }
})();

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return selectObject;
    }
    
    vorpal
        .command('Select-Object', "Selects objects or object properties.")
        .alias("select")
        .option('-p, --Property <name>', 'Specifies the properties to select. Wildcards are permitted.')
        .option('-e, --ExpandProperty <name>', 'Specifies a property to select, and indicates that an attempt should be made to expand that property. Wildcards are permitted in the property name.')
        .option('-x, --ExcludeProperty <name>', 'Specifies the properties that this cmdlet excludes from the operation. Wildcards are permitted. This parameter is effective only when the command also includes the Property parameter.')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: selectObject,
                spContext: vorpal.spContext,
                options: args.options || {},
                async: true,
                callback
            });
        });
};