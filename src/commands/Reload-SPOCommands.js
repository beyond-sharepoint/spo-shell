'use strict';
const chalk = require("chalk");

module.exports = function (vorpal, context) {
    if (vorpal === undefined) {
        return getSite;
    }

    vorpal
        .command('Reload-SPOCommands', 'Reloads the available commands.')
        .action(function (args, callback) {
            context.parent.loadCommands(true);
            vorpal.log(chalk.cyan('Commands Reloaded!'));
            callback();
        });
};