var async = require('async')
var http = require('http')

function get(uri, cb) {
  console.log(uri)
  var r = http.get(uri, function(res) {
    if (res.statusCode) return cb(new Error('404'))
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
          console.log('aws', err)
          awsCallback(err)
      })
    }),
    // GCP
    async.reflect(function(gcpCallback) {
      var baseUrl = 'http://169.254.169.254'
      async.series([
        function(callback) {
          get(baseUrl+'/computeMetadata/v1/instance/id', function(err, res) {
            if (err) return callback(err)
            cloud = 'gcp'
            meta = Object.assign({}, meta, { id: res })
            callback(null) 
          })
        },
        function(callback) {
          get(baseUrl+'/computeMetadata/v1/instance/tags', function(err, res) {
            if (err) return callback(err)
            meta = Object.assign({}, meta, { tags: JSON.parse(res) })
            callback(null) 
          })
        }
      ], function(err) {
        console.log('gcp', err)
        gcpCallback(err)
      })
    })
  ], function(err, results) {
    // DONE
    console.log('==== done ====')
    console.log('err: ', err)
    console.log('res: ', results)
    console.log(cloud, meta)
    // If no cloud - return err
    // If cloud != unknown - assume everything went well/
    topCallback(cloud, meta)
  }) 
}
