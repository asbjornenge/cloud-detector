var async = require('async')
var http = require('http')
var log = require('debug-log')('cloud-detector')

function get(uri, cb) {
  log(uri)
  var r = http.get(uri, function(res) {
    if (res.statusCode != 200) return cb(new Error(res.statusCode))
    res.setEncoding('utf8')
    var rawData = ''
    res.on('data', function(chunk) { rawData += chunk; })
    res.on('end', function() {
      cb(null, rawData)
    })
  })
  r.on('error', cb)
  r.setTimeout(2000, function() {
    cb(new Error('Request timeout'))
  })
}

module.exports = function(topCallback) {
  var cloud = 'unknown'
  var meta = {}
  async.parallel([
    // AWS
    async.reflect(function(awsCallback) {
      var baseUrl = 'http://169.254.169.254'
      async.series([
        function(callback) {
          get(baseUrl+'/latest/dynamic/instance-identity/document', function(err, res) {
            if (err) return callback(err)
            cloud = 'aws'
            meta = Object.assign({}, meta, JSON.parse(res))
            callback(null) 
          })
        }], function(err) {
          log('aws', err)
          awsCallback(err)
      })
    }),
    // GCP
    async.reflect(function(gcpCallback) {
      var baseOpts = {
        hostname: '169.254.169.254',
        port: 80,
        path: '/replace',
        headers: {
          'Metadata-Flavor': 'Google'
        }
      }
      async.series([
        function(callback) {
          get(Object.assign({}, baseOpts, { path: '/computeMetadata/v1/instance/id' }), function(err, res) {
            if (err) return callback(err)
            cloud = 'gcp'
            meta = Object.assign({}, meta, { id: res })
            callback(null) 
          })
        },
        function(callback) {
          get(Object.assign({}, baseOpts, { path: '/computeMetadata/v1/instance/tags' }), function(err, res) {
            if (err) return callback(err)
            meta = Object.assign({}, meta, { tags: JSON.parse(res) })
            callback(null) 
          })
        }
      ], function(err) {
        log('gcp', err)
        gcpCallback(err)
      })
    })
  ], function(err, results) {
    log('==== DONE ====')
    // OK
    if (cloud != 'unknown') return topCallback(null, cloud, meta)
    // ERRORS
    var errors = results.map(function(r) { return r.error })
    topCallback(errors, cloud, meta)
  }) 
}
