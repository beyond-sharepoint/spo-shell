"use strict";
require("hjson/lib/require-config");
const requireUncached = require("require-uncached");
const Promise = require('bluebird');
require("bluebird-co");

const chalk = require("chalk");
const _ = require("lodash");
const spo = require("@beyond-sharepoint/spo-remote-auth");

//ALL the configuration!
const inquirer = require('inquirer');
const Vorpal = require('vorpal');
require('dotenv').config({ silent: true });

const app = (function () {
  let _config = {};
  let _commands = [];
  let _importedCommands = [];
  let vorpal = new Vorpal();

  //Configure Vorpal
  vorpal
    .history('beyond-sharepoint_spo-shell')
    .localStorage('beyond-sharepoint_spo-shell');

  vorpal.api = {};

  /**
 * Utility function to retrieve a value from process.env or prompt for it.
 */
  let getConfiguationValue = Promise.coroutine(function* (config, configName, envName, prompt) {
    config[configName] = process.env[envName];
    if (!config[configName]) {
      let answer = yield inquirer.prompt(prompt);
      config[configName] = answer[prompt.name];
    }
    return config[configName];
  });

  /**
   * Initializes configuration by retrieving it from .env, environment or prompting for it.
   */
  let init = Promise.coroutine(function* () {
    yield getConfiguationValue(_config, "tenantUrl", "spo-shell_tenanturl", {
      type: 'input',
      message: `Enter the url to your SharePoint Online tenant`,
      name: 'tenantUrl'
    });

    yield getConfiguationValue(_config, "username", "spo-shell_username", {
      type: 'input',
      message: `Enter the username for ${_config.tenantUrl}`,
      name: 'username'
    });

    yield getConfiguationValue(_config, "password", "spo-shell_password", {
      type: 'password',
      message: `Enter the password for ${_config.tenantUrl}`,
      name: 'password'
    });
  });

  let loadImportedCommands = Promise.coroutine(function* () {
    let commandsDef = requireUncached('./../commands.hjson');
    _importedCommands = commandsDef.importedCommands;

    _importedCommands.forEach(function (cmd) {
      try {
        vorpal.use(cmd);
      } catch (e) {
        /* istanbul ignore next */
        vorpal.log(`Error loading command ${cmd}: `, e);
      }
    });
  });

  /**
   * Loads and initializes commands defined in ./commands.hjson
   */
  let loadCommands = Promise.coroutine(function* (isReloading) {

    let commandsDef = requireUncached('./../commands.hjson');
    _commands = commandsDef.commands;
    _commands.forEach(function (cmd) {

      //Remove the existing command if it exists.
      let cmdName = cmd.substring(cmd.lastIndexOf('/') + 1);
      const existingCmdObj = vorpal.find(cmdName);
      if (existingCmdObj) {
        if (isReloading) {
          existingCmdObj.remove();
        } else {
          vorpal.log(`Duplicate Command: ${cmd}`);
        }
      }

      try {
        const mod = requireUncached(`./commands/${cmd}.js`);
        let help;
        try {
          help = requireUncached(`./help/${cmd}.js`);
          help = String(help).replace(/^\n|\n$/g, '');
        } catch (e) {
          // .. whatever
        }

        vorpal.use(mod, {
          parent: app
        });

        const cmdObj = vorpal.find(cmd);
        if (cmdObj && help) {
          /* istanbul ignore next */
          cmdObj.help(function (args, cb) {
            cb(help);
          });
        }
      } catch (e) {
        /* istanbul ignore next */
        vorpal.log(`Error loading command ${cmd}: `, e);
      }
    });
  });

  /**
   * Connects and authenticates with SharePoint
   */
  let connect = Promise.coroutine(function* () {
    vorpal.log(chalk.blue(`Connecting to ${_config.tenantUrl}...`));
    try {
      let ctx = yield spo.authenticate(_config.tenantUrl, _config.username, _config.password);
      vorpal.log(chalk.green(`Connected.`));
      vorpal.log(`SiteFullUrl: ${ctx.contextInfo.SiteFullUrl}. LibraryVersion: ${ctx.contextInfo.LibraryVersion}.`);
      vorpal.spContext = ctx;
      return ctx;
    }
    catch (ex) {
      if (ex.message === "The entered and stored passwords do not match.") {
        return Promise.reject(chalk.red("The specified password was incorrect."));
      }

      //Unknown error: throw.
      throw ex;
    }

  });

  return {
    vorpal,
    init,
    loadImportedCommands,
    loadCommands,
    connect
  }
})();

app.init()
  .then(app.loadImportedCommands)
  .then(app.loadCommands)
  .then(app.connect)
  .then(function () {

    let argv = app.vorpal
      .parse(process.argv, { use: 'minimist' });

    if (!argv._) {
      app.vorpal.log("Entering interactive command mode.");

      app.vorpal
        .delimiter('spo$')
        .show();
    }
    else {
      app.vorpal.parse(process.argv);
    }
  }, function (error) {
    app.vorpal.log(error);
    app.vorpal.log("Exiting...");
  });