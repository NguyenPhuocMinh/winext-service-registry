'use strict';

const winext = require('winext');
const Promise = winext.require('bluebird');
const lodash = winext.require('lodash');
const consul = require('consul');
const { get, isEmpty } = lodash;

function ServiceRegistry(params = {}) {
  const config = get(params, 'config');
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
        loggerTracer.silly(`Init service registry not connect complete`);
        return next;
      }
      const newConsul = consul(initConsul);
      loggerTracer.silly(`Init service registry connect complete`);
      return newConsul;
    } catch (err) {
      loggerTracer.error(`Init service registry has error`, {
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
        loggerTracer.silly(`Register service not connect complete`);
        return next;
      }
      const serviceName = get(registerConsul, 'name');
      return this.initServices(request, response, next).agent.service.register(registerConsul, (err) => {
        if (err) {
          throw new errorManager.consulError(err);
        } else {
          loggerTracer.silly(`${serviceName} register service with consul successfully!`);
        }
      });
    } catch (err) {
      loggerTracer.error(`Register service has error`, {
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
        loggerTracer.silly(`Register service not connect complete`);
        return;
      }

      const services = await this.initServices().agent.service();

      const serviceById = services[idService];
      const portServiceById = serviceById.Port;
      const addressServiceById = serviceById.Address;

      loggerTracer.silly(`LookupService has complete with ip address service`, {
        args: {
          ip: `${addressServiceById}:${portServiceById}`,
        },
      });

      return `${addressServiceById}:${portServiceById}`;
    } catch (err) {
      loggerTracer.error(`Register service has error`, {
        args: { err },
      });
      return Promise.reject(err);
    }
  };
}

exports = module.exports = new ServiceRegistry();
exports.register = ServiceRegistry;
