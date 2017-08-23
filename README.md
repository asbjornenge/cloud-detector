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
require('cloud-detector')(function(err, cloud) {
  console.log(err, cloud)
})
```

## Notes

For now it only supports `AWS` and `GCP`, but will gladly accept PRs for other environments :grin: :tada:

## Changelog

### 2.0.0

* Aligned data fetched from all clouds
* Fetching more data
* Bugfixes 

### 1.0.x

* Pre changelog.
* Initial releae and such :tada:

enjoy.
