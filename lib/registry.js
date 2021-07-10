'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const dotenv = winext.require('dotenv');
const chalk = winext.require('chalk');
const lodash = winext.require('lodash');
const consul = require('consul');
const address = winext.require('ip').address();
const { get, isEmpty } = lodash;
const { name, version } = require('../package.json');

function Registry(params = {}) {
  const config = get(params, 'config');
  const requestId = get(params, 'requestId');
  const loggerFactory = get(params, 'loggerFactory');
  const loggerTracer = get(params, 'loggerTracer');
  const errorManager = get(params, 'errorManager');

  const enable = get(config, 'consul.enable', false);
  const initConsul = get(config, 'consul.init', {});
  const registerConsul = get(config, 'consul.register');

  // config env
  dotenv.config();

  /**
   * init services
   */
  this.initServices = function () {
    try {
      if (isEmpty(config) || !enable) {
        loggerFactory.info(`Init service registry not connect complete`, {
          requestId: `${requestId}`
        });
        loggerTracer.info(chalk.magenta(`Not load init service registry by ${name}-${version}`));
        return;
      }
      const newConsul = consul(initConsul);
      loggerTracer.info(chalk.green(`Init service registry by ${name}-${version} successfully!`));
      return newConsul;
    } catch (err) {
      loggerFactory.error(`Init service registry has error`, {
        requestId: `${requestId}`,
        args: { err }
      });
      return Promise.reject(err);
    }
  };
  /**
   * register services
   */
  this.registerServices = function () {
    try {
      if (isEmpty(config) || !enable) {
        loggerFactory.info(`Register service not connect complete`, {
          requestId: `${requestId}`
        });
        loggerTracer.debug(chalk.blue(`Not load register service by ${name}-${version}`));
        return;
      }
      const serviceId = get(registerConsul, 'id');
      const serviceName = get(registerConsul, 'name');
      const servicePort = get(registerConsul, 'port');
      const checkHealth = get(registerConsul, 'check', {});

      return this.initServices().agent.service.register({
        id: serviceId,
        name: serviceName,
        port: servicePort,
        address: process.env.CONSUL_HOST || address,
        check: checkHealth
      }, (err) => {
        if (err) {
          loggerTracer.error(chalk.red(`Register service with consul has error ${err}`));
          throw new errorManager.consulError(err);
        } else {
          loggerTracer.info(chalk.green(`${serviceName} register service with consul successfully!`));
        }
      });
    } catch (err) {
      loggerFactory.error(`Register service has error`, {
        requestId: `${requestId}`,
        args: { err }
      });
      return Promise.reject(err);
    }
  };
  /**
   * lookup service
   */
  this.lookupService = async function (idService) {
    try {
      if (isEmpty(config) || !enable) {
        loggerFactory.info(`Register service not connect complete`, {
          requestId: `${requestId}`
        });
        loggerTracer.info(chalk.purple(`Not load register service by ${name}-${version}`));
        return;
      }
      const services = await this.initServices().agent.service();

      const serviceById = services[idService];
      const portServiceById = serviceById.Port;
      const addressServiceById = serviceById.Address;

      return `${addressServiceById}:${portServiceById}`;
    } catch (err) {
      loggerFactory.error(`Register service has error`, {
        requestId: `${requestId}`,
        args: { err }
      });
      return Promise.reject(err);
    }
  };
}

exports = module.exports = new Registry();
exports.register = Registry;
