'use strict';

const _ = require("lodash");
const Promise = require('bluebird');
require("bluebird-co");

const interfacer = require('./../util/interfacer');

const selectObject = (function () {
    let exec = Promise.coroutine(function* (options) {
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
            output = _.pick(output, options.Property);
            output = _.omit(output, options.ExcludeProperty);
        }

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
    vorpal.api.selectObject = selectObject;
    vorpal
        .command('Select-Object', "Selects objects or object properties.")
        .alias("select")
        .option('-p, --Property <name>', 'Specifies the properties to select. Wildcards are permitted.')
        .option('-e, --ExpandProperty <name>', 'Specifies a property to select, and indicates that an attempt should be made to expand that property. Wildcards are permitted in the property name.')
        .option('-x, --ExcludeProperty <name>', 'Specifies the properties that this cmdlet excludes from the operation. Wildcards are permitted. This parameter is effective only when the command also includes the Property parameter.')
        .action(function (args, callback) {
            interfacer.call(this, {
                command: selectObject,
                options: args.options || {},
                async: true,
                callback
            });
        });
};