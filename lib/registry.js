'use strict';

const winext = require('winext');
const consul = require('consul');

function Registry(params = {}) {
  console.log('🚀 ~ file: registry.js ~ line 7 ~ Registry ~ params', params);
}

exports = module.exports = new Registry();
exports.register = Registry;
