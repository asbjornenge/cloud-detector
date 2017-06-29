# Cloud Detector

Small module to detect cloud environment. It will poke around the network and try to figure out which cloud it is and also collect metadata about itself.

## Use

### cli

```sh
npm install -g cloud-detector
cloud-detector
```

### module

```js
require('cloud-detector')(function(err, cloud, meta) {
  console.log(err, cloud, meta)
})
```

## Notes

For now it only supports `AWS` and `GCP`, but will gladly accept PRs for other environments :grin: :tada:

enjoy.
