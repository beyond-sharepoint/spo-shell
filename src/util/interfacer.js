'use strict';

const util = require("util");
const _ = require("lodash");
const debug = require('debug')('interfacer');

let _lastResult;
module.exports = function (opt) {
    const self = this;
    let stdout = '';

    opt.options = opt.options || {};
    opt.callback = opt.callback || function () { };
    opt.command = opt.command || { exec() { } };

    const logger = {
        getLastResult() {
            return _lastResult;
        },
        setLastResult(lastResult) {
            _lastResult = lastResult;
        },
        log(out) {
            stdout += `${out}\n`;
            if (opt.silent !== true) {
                // process.stdout.write(out) // to do - handle newline problem.
                self.log(out);
            }
        },
        dir(obj) {
            self.log(util.inspect(obj, false, null));
        }
    };

    function onResult(result) {
        opt.callback(null, stdout);
        return stdout;
    }

    let fnArgs = [];

    if (!_.isNil(opt.spContext)) {
        fnArgs.push(opt.spContext);
    }

    if (!_.isNil(opt.args)) {
        fnArgs.push(opt.args);
    }

    if (!_.isNil(opt.options)) {
        fnArgs.push(opt.options);
    }

    let fn = function() {
        var result = opt.command.exec.apply(logger, fnArgs);
        _lastResult = result;
        return result;
    };

    //This logic is a little weird...
    if (self.command)
        debug(`Calling ${self.command}`);
    else
        debug(`Calling ${self.commandWrapper.command}`);

    if (opt.async === true) {
        return fn().then(onResult);
    }
    return onResult(fn());
};