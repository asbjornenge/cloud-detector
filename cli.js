#!/usr/bin/env node
require('./')(function(err, data) {
  if (err) {
    console.log(err.length+' error(s)')
    console.error(err[0])
    process.exit(1)
  }
  console.log(data)
  process.exit(0)
})
