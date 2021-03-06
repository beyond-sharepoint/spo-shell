'use strict';

const util = require("util");
const _ = require("lodash");
const debug = require('debug')('interfacer');
const inquirer = require("inquirer");

let _lastResult;
module.exports = function (opt) {
    const self = this;
    let stdout = '';

    opt.options = opt.options || {};
    opt.callback = opt.callback || function () { };
    opt.command = opt.command || { exec() { } };

    //Object that is set as the 'this' object of each command.
    const commandApi = {
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
                return self.log(out);
            }
        },
        dir(obj) {
            return self.log(util.inspect(obj, false, null));
        },
        prompt() {
            return inquirer.prompt.apply(self, arguments);
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
        if (_.isArray(opt.args))
            fnArgs = _.concat(fnArgs, opt.args);
        else
            fnArgs.push(opt.args);
    }

    if (!_.isNil(opt.options)) {
        fnArgs.push(opt.options);
    }

    let fn = function() {
        var result = opt.command.exec.apply(commandApi, fnArgs);
        _lastResult = result;
        return result;
    };

    //This logic is a little weird...
    let commandName;
    if (self.command)
        commandName = self.command;
    else
        commandName = self.commandWrapper.command;
    
    debug(`Calling ${commandName}`);

    if (opt.async === true) {
        return fn()
            .then(function(result) {
                debug(`${commandName} completed.`);
                return result;
            })
            .then(onResult);
    }
    return onResult(fn());
};