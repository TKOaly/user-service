'use strict'

module.exports = {
  exit: true,
  require: ['ts-node/register', 'source-map-support/register'],
  recursive: true,
  timeout: 10000,
  watchExtensions: 'tsx,ts',
  spec: 'test/**/*.test.ts'
}
