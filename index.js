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
  var data = { 
    id: '',
    zone: '',
    cloud: '',
    labels: {}}
  async.parallel([
    async.reflect(function(awsCallback) {
      var baseUrl = 'http://169.254.169.254'
      async.series([
        function(callback) {
          get(baseUrl+'/latest/meta-data/instance-id', function(err, res) {
            if (err) return callback(err)
            data = Object.assign({}, data, { id: res })
            callback(null) 
          })
        },
        function(callback) {
          get(baseUrl+'/latest/meta-data/placement/availability-zone', function(err, res) {
            if (err) return callback(err)
            data = Object.assign({}, data, { zone: res })
            callback(null) 
          })
        },
        function(callback) {
          get(baseUrl+'/latest/user-data/', function(err, res) {
            if (err) return callback(err)
            try {
              data = Object.assign({}, data, { labels: JSON.parse(res) })
            } catch(e) {
              log('Unable to parse aws user-data as json labels', res)
            }
            callback(null) 
          })
        }], function(err) {
          log('aws', err)
          if (!err) data = Object.assign({}, data, { cloud: 'aws' })
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
            data = Object.assign({}, data, { id: res })
            callback(null) 
          })
        },
        function(callback) {
          get(Object.assign({}, baseOpts, { path: '/computeMetadata/v1/instance/zone' }), function(err, res) {
            if (err) return callback(err)
            var zonepath = res.split('/')
            data = Object.assign({}, data, { zone: zonepath[zonepath.length-1] })
            callback(null) 
          })
        },
        function(callback) {
          get(Object.assign({}, baseOpts, { path: '/computeMetadata/v1/instance/attributes/?recursive=true' }), function(err, res) {
            if (err) return callback(err)
            data = Object.assign({}, data, { labels: JSON.parse(res) })
            callback(null) 
          })
        }
      ], function(err) {
        log('gcp', err)
        if (!err) data = Object.assign({}, data, { cloud: 'gcp' })
        gcpCallback(err)
      })
    })
  ], function(err, results) {
    log('==== DONE ====')
    // OK
    if (data.cloud != '') return topCallback(null, data)
    // ERRORS
    var errors = results.map(function(r) { return r.error })
    topCallback(errors, data)
  }) 
}
