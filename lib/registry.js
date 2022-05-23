'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const chalk = winext.require('chalk');
const lodash = winext.require('lodash');
const consul = require('consul');
const { get, isEmpty } = lodash;
const { name, version } = require('../package.json');

function ServiceRegistry(params = {}) {
  const config = get(params, 'config');
  const loggerFactory = get(params, 'loggerFactory');
  const loggerTracer = get(params, 'loggerTracer');
  const errorManager = get(params, 'errorManager');

  const enable = get(config, 'consul.enable', false);
  const initConsul = get(config, 'consul.init', {});
  const registerConsul = get(config, 'consul.register');

  /**
   * init services
   */
  this.initServices = function (request, response, next) {
    try {
      if (isEmpty(config) || !enable) {
        loggerFactory.data(`Init service registry not connect complete`);
        loggerTracer.fatal(chalk.magenta(`Not load init service registry by ${name}-${version}`));
        return next;
      }
      const newConsul = consul(initConsul);
      loggerFactory.data(`Init service registry connect complete`);
      loggerTracer.fatal(chalk.magenta(`Load service registry by ${name}-${version} successfully!`));
      return newConsul;
    } catch (err) {
      loggerFactory.error(`Init service registry has error`, {
        args: { err },
      });
      return Promise.reject(err);
    }
  };
  /**
   * register services
   */
  this.registerServices = function (request, response, next) {
    try {
      if (isEmpty(config) || !enable) {
        loggerFactory.data(`Register service not connect complete`);
        loggerTracer.fatal(chalk.magenta(`Not load register service by ${name}-${version}`));
        return next;
      }
      const serviceName = get(registerConsul, 'name');
      return this.initServices(request, response, next).agent.service.register(registerConsul, (err) => {
        if (err) {
          loggerTracer.error(chalk.red(`Register service with consul has error ${err}`));
          throw new errorManager.consulError(err);
        } else {
          loggerTracer.fatal(chalk.magenta(`${serviceName} register service with consul successfully!`));
        }
      });
    } catch (err) {
      loggerFactory.error(`Register service has error`, {
        args: { err },
      });
      return Promise.reject(err);
    }
  };
  /**
   * lookup service
   * @param {*} idService
   */
  this.lookupService = async function (idService) {
    try {
      if (isEmpty(config) || !enable) {
        loggerFactory.data(`Register service not connect complete`);
        loggerTracer.fatal(chalk.magenta(`Not load register service by ${name}-${version}`));
        return;
      }
      loggerTracer.fatal(chalk.magenta(`Not load register service by ${name}-${version}`));

      const services = await this.initServices().agent.service();

      const serviceById = services[idService];
      const portServiceById = serviceById.Port;
      const addressServiceById = serviceById.Address;

      loggerFactory.data(`LookupService has complete with ip address service`, {
        args: {
          ip: `${addressServiceById}:${portServiceById}`,
        },
      });

      return `${addressServiceById}:${portServiceById}`;
    } catch (err) {
      loggerFactory.error(`Register service has error`, {
        args: { err },
      });
      return Promise.reject(err);
    }
  };
}

exports = module.exports = new ServiceRegistry();
exports.register = ServiceRegistry;
