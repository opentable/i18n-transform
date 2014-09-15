#i18n-transform
[![Build Status](https://travis-ci.org/opentable/i18n-transform.png?branch=master)](https://travis-ci.org/opentable/i18n-transform) [![NPM version](https://badge.fury.io/js/i18n-transform.png)](http://badge.fury.io/js/i18n-transform) ![Dependencies](https://david-dm.org/opentable/i18n-transform.png)
---

apply i18n transforms to a json object.

### Methods

#### `.transform({source}, [languages]);`

The source object to be transformed must include an `i18n` field, with the following schema:

```
{
    ...
    "i18n": [
        {
            ...
            "language": {
                "code": "en",  // two letter language code
                "region": "GB" // iso8601 region code
            },
            ...
        },
        ...
    ],
    ...
}
```

The languages array should be an array of objects with the following schema:

```
[
    {
        "code": "en",
        "region": "GB",
        "quality": 1.0
    }
]
```

If language selection fails (no matching languages), then the transform returns null.

#### `.transformDestination({source object}, {destination object}, [languages]);`

This method does the same as the above, but it transforms the destination object with language fields from the source object.
There is no return value from this method.

If language selection fails (no matching languages), then an Error will be thrown.

##### Note

This module is designed to work with the [accept-language-parser](https://github.com/andyroyle/accept-language-parser).

### Installation:

```
npm install i18n-transform
```

### Usage:

```
var transformer = require("i18n-transform");

var result = transformer.transform(
    {
        "id": 123,
        "someinvariantfield": 45.45,
        "i18n": [
            {
                "name": "the thing",
                "somelocalisedfield": "local value",
                "language": {
                    "code": "en",
                    "region": "GB"
                },
                "gb-specific-field": "some en-GB value"
            },
            {
                "name": "the thang",
                "somelocalisedfield": "local value 2",
                "language": {
                    "code": "en",
                    "region": "US"
                },
                "us-specific-field": "some en-US value"
            }
        ]
    },
    [
        {
            "code": "en",
            "region": "GB",
            "quality": 1.0
        },
        {
            "code": "en",
            "region": "US",
            "quality": 0.8
        }
    ]
);

console.dir(result);
```

output:

```
{
    "id": 123,
    "someinvariantfield": 45.45,
    "name": "the thing",
    "somelocalisedfield": "local value",
    "language": {
      "code": "en",
      "region": "GB"
    },
    "gb-specific-field": "some en-GB value"
}
```
