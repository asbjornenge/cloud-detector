#!/usr/bin/env node
var cd = require('./index')
cd(function(err, cloud, meta) {
  if (err) {
    console.log(err.length+' error(s)')
    console.error(err[0])
    process.exit(1)
  }
  console.log('Cloud:', cloud)
  console.log('Meta:', meta)
  process.exit(0)
})
