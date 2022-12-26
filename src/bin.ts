#!/usr/bin/env node

import { main } from './index.js'
import yargs from 'yargs'

const parsedArgs = yargs(process.argv.slice(2)).command('* <paths...>', 'Run tests', (yargs) => {
  return yargs.options({
    watch: {
      type: 'boolean',
      default: false,
      description: 'Run in watch mode'
    }
  }).positional('paths', {
    type: 'string',
    array: true,
    demandOption: true,
    description: 'Paths to test files'
  })
}).parseSync()

await main(parsedArgs.paths, parsedArgs)
