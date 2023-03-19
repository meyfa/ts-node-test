#!/usr/bin/env node

import { main } from './index.js'
import yargs from 'yargs'

await yargs(process.argv.slice(2)).command('* <paths...>', 'Run tests', (yargs) => {
  return yargs.options({
    'test-name-pattern': {
      type: 'string',
      array: true,
      nargs: 1,
      description: 'A regular expression that configures the test runner to only execute tests whose name matches the provided pattern.'
    },
    'test-reporter': {
      type: 'string',
      array: true,
      nargs: 1,
      description: 'A test reporter to use when running tests.'
    },
    'test-reporter-destination': {
      type: 'string',
      array: true,
      nargs: 1,
      description: 'The destination for the corresponding test reporter.'
    },
    'test-only': {
      type: 'boolean',
      default: false,
      description: 'Configures the test runner to only execute top level tests that have the `only` option set.'
    },
    watch: {
      type: 'boolean',
      default: false,
      description: 'Starts Node.js in watch mode.'
    },
    'watch-preserve-output': {
      type: 'boolean',
      default: false,
      description: 'Disable the clearing of the console when watch mode restarts the process.'
    },
    'experimental-test-coverage': {
      type: 'boolean',
      default: false,
      description: 'When used in conjunction with the `node:test` module, a code coverage report is generated as part of the test runner output.'
    }
  }).positional('paths', {
    type: 'string',
    array: true,
    demandOption: true,
    description: 'Paths to test files'
  })
}, async (parsedArgs) => {
  await main(parsedArgs.paths, parsedArgs)
}).parse()
