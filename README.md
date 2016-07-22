# i18n-transform
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

#### `.transformDestination({source object}, {destination object}, [languages], callback function(err));`

This method does the same as the above, but it transforms the destination object with language fields from the source object.
There is no return value from this method.

If language selection fails (no matching languages), the callback will contain an error.


#### `.transformByField({source}, [languages], {fields});`

This method applies the transform on a field by field basis as opposed to comparing a whole `i18n`
block like the `transform` method does.

The `fields` object should adhere to the following schema:

```
{
    "required": [
        "Name",
        "Address"
    ],

    "optional": [
        "Description",
        "DressCode"
    ]
}
```

For `required` fields, if a language match fails, the field from the primary language will be used. `Optional` fields
will only be returned if a language is explicitly matched.

The return value is different from `transform` as it returns the following schema:

```
{
    "translations": {
        "Name": "The Fat Duck",
        "DressCode": "Salle à manger formelle"
    },
    "localization": {
        "Name": "en-GB" // ISO 639-1 code
        "DressCode": "fr-FR" // ISO 639-1 code
    }
}
```

- This method will only return values that are specified within the `fields`.

- If the same field appears in both `required` and `optional` then the `required` value takes precedent.

#### `.transformByFieldDestination({source}, [languages], {fields}, callback function(err));`

This method does the same as the above, but it transforms the destination object with the `translations` & `localization` fields.

There is no return value from this method.

If language selection fails (no matching languages), the callback will contain an error.

##### Note

This module is designed to work with the [accept-language-parser](https://github.com/opentable/accept-language-parser).

### Installation:

```
npm install --save i18n-transform
```

### Usage (transform) :

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
### Usage (transformByField) :

```
var transformer = require("i18n-transform");

var result = transformer.transformByField(
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
    ],
    {
        "required":{
            "name",
            "somelocalisedfield",
        },
        "optional":{
            "us-specific-field"
        }
    }
);
```

output:

```
{
    "translations": {
        "name": "the thing",
        "somelocalisedfield": "local value",
        "us-specific-field": "some en-US value"
    },
    "localization":{
        "name": "en-GB",
        "somelocalisedfield": "en-GB",
        "us-specific-field": "en-US"
    }
}
```