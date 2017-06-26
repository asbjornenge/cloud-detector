var async = require('async')
var http = require('http')

function get(uri, opts, cb) {
  if (typeof opts === 'function') { cb = opts; opts = {} }
  http.get(uri, opts, function(res) {
    if (res.statusCode) return cb(new Error('404'))
    res.setEncoding('utf8')
    var rawData = ''
    res.on('data', function(chunk) { rawData += chunk; })
    res.on('end', function() {
      cb(null, rawData)
    })
  })
}

module.exports = function(topCallback) {
  var cloud = 'unknown'
  var meta = {}
  async.parallel([
    // AWS
    function(awsCallback) {
      var baseUrl = 'http://169.254.169.254'
      async.series([
        function(callback) {
          get(baseUrl+'/latest/dynamic/instance-identity/document', function(err, res) {
            if (err) callback(err)
            cloud = 'aws'
            meta = Object.assign({}, meta, JSON.parse(res))
            callback(null) 
          })
        },
      ], function(err) {
        awsCallback(err, null)
      })
    },
    // GCP
    function(gcpCallback) {
      var baseUrl = 'http://169.254.169.254'
      async.series([
        function(callback) {
          get(baseUrl+'/computeMetadata/v1/instance/id', function(err, res) {
            if (err) callback(err)
            cloud = 'gcp'
            meta = Object.assign({}, meta, { id: res })
            callback(null) 
          })
        },
        function(callback) {
          get(baseUrl+'/computeMetadata/v1/instance/tags', function(err, res) {
            if (err) callback(err)
            cloud = 'gcp'
            meta = Object.assign({}, meta, { tags: JSON.parse(res) })
            callback(null) 
          })
        }
      ], function(err) {
        gcpCallback(err, null)
      })
    },
    // TODO - add more
  ], function(err, results) {
    console.log(err, results, cloud, meta)
  }) 
}
