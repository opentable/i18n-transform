var _ = require("lodash");

var _getLanguageFromI18n = function (i18nObj) {
    if (i18nObj.Language) {
        return {
            code: i18nObj.Language.Code,
            region: i18nObj.Language.Region,
            ietf: i18nObj.Language.IETF
        };
    }

    return null;
},

    _getI18n = function (source) {
        if (source.i18n) {
            return {
                name: 'i18n',
                value: source.i18n
            };
        } else if (source.I18n) {
            return {
                name: 'I18n',
                value: source.I18n
            };
        }

        return null;
    },

    _isWildcard = function (language) {
        return language.code === "*";
    },

    _isLanguageCodeMatch = function (i18nLanguage, language) {
        return language.code.toUpperCase() === i18nLanguage.code.toUpperCase();
    },

    _isLanguageRegionMatch = function (i18nLanguage, language) {
        return (language.region === undefined || i18nLanguage.region === undefined) ||
            language.region.toUpperCase() === i18nLanguage.region.toUpperCase();
    },

    _isLanguageMatch = function (i18n, language) {
        var i18nLanguage = _getLanguageFromI18n(i18n);

        return _isLanguageCodeMatch(i18nLanguage, language) && _isLanguageRegionMatch(i18nLanguage, language);
    },

    _isPrimaryLanguageMatch = function (language, primaryLanguageCode) {
        return _isWildcard(language) ||
            !language.region && primaryLanguageCode.split('-')[0] === language.code;
    },

    _extractPrimaryLanguage = function (i18nArray, primaryLanguageCode) {
        if (!primaryLanguageCode) {
            //just use whatever is available
            if (i18nArray[0]) {
                return i18nArray[0];
            }

            return null;
        }

        var language = null;

        i18nArray.forEach(function (i18n) {
            var i18nLanguage = _getLanguageFromI18n(i18n);
            if (i18nLanguage && i18nLanguage.ietf) {
                if (i18nLanguage.ietf.toUpperCase() === primaryLanguageCode.toUpperCase()) {
                    language = i18n;
                }
            }
        });

        return language;
    },

    _mapAcceptLanguagesToTranslations = function (acceptedLanguages, i18nArray, primaryLanguageCode) {
        var results = _.map(acceptedLanguages, function (language) {

            if (_isPrimaryLanguageMatch(language, primaryLanguageCode)) {
                return _extractPrimaryLanguage(i18nArray, primaryLanguageCode);
            }

                return _.find(i18nArray, function (i18n) {
                    return _isLanguageMatch(i18n, language, primaryLanguageCode);
                });
        });

        return _.pull(results, undefined);
    },

    _extractPerField = function (fields, acceptedLanguages, i18nArray, primaryTranslations, required) {
        var results = {
            translations: {},
            localization: {}
        };

        var primaryLanguageCode = _getLanguageFromI18n(primaryTranslations).ietf;
        var mappedTranslations = _mapAcceptLanguagesToTranslations(acceptedLanguages, i18nArray, primaryLanguageCode);

        _.each(fields, function (field) {
            _.each(mappedTranslations, function (translations) {

                if (!_.isUndefined(translations[field])) {
                    results.translations[field] = translations[field];
                    results.localization[field] = translations.Language.IETF;
                    return false;
                }
            });

            if (!results.translations[field]) {
                if (required) {
                    results.translations[field] = primaryTranslations[field];
                    results.localization[field] = primaryTranslations.Language.IETF;
                } else {
                    results.translations[field] = null;
                }
            }

        });

        return results;
    },

    _extractPreferredLanguagePerField = function (source, i18nArray, acceptedLanguages, fields) {
        var translations = {};
        var primaryTranslations = _extractPrimaryLanguage(i18nArray, source.PrimaryLanguage);

        if (fields.required) {
            _.merge(translations, _extractPerField(fields.required, acceptedLanguages,
                i18nArray,
                primaryTranslations,
                true));
        }

        if (fields.optional) {
            _.merge(translations, _extractPerField(fields.optional, acceptedLanguages,
                i18nArray,
                primaryTranslations,
                false));
        }

        return translations;
    },

    _extractPreferredLanguage = function (source, i18nArray, acceptedLanguages) {
        var result = null;

        var primaryLanguageCode = source.PrimaryLanguage;
        var mappedTranslations = _mapAcceptLanguagesToTranslations(acceptedLanguages, i18nArray, primaryLanguageCode);

        if (mappedTranslations) {
            return mappedTranslations[0];
        }

        return result;
    },

    _mergeSelectedLanguage = function (destination, language) {
        if (!language) {
            return destination;
        }
        return _.assign(destination, language);
    },

    _getSelectedLanguage = function (source, i18nArray, acceptedLanguages, fields) {
        // expects the language object from the request to be passed in:
        // [
        //   { code: 'en', region: 'US', quality: 1.0 },
        //   { code: 'en',               quality: 0.8 },
        //    ...
        // ]
        if (!acceptedLanguages || acceptedLanguages.length === 0) {
            return _extractPrimaryLanguage(i18nArray, source.PrimaryLanguage);
        }
        else {
            acceptedLanguages.sort(function (a, b) {
                return b.quality - a.quality;
            });

            return fields ? _extractPreferredLanguagePerField(source, i18nArray, acceptedLanguages, fields)
                : _extractPreferredLanguage(source, i18nArray, acceptedLanguages);
        }
    },

    _transform = function (source, acceptedLanguages, fields) {
        var i18nInfo = _getI18n(source);

        if (!i18nInfo) {
            return source;
        }

        var selectedLanguage = _getSelectedLanguage(source, i18nInfo.value, acceptedLanguages, fields);
        if (!selectedLanguage) {
            return;
        }

        var result = _mergeSelectedLanguage(source, selectedLanguage);
        delete result[i18nInfo.name];
        return result;
    },

    _transformDestination = function (source, destinationToAddLanguageTo, acceptedLanguages, fields, callback) {
        var i18nInfo = _getI18n(source);

        if (!i18nInfo) {
            return source;
        }

        var selectedLanguage = _getSelectedLanguage(source, i18nInfo.value, acceptedLanguages, fields);

        if (!selectedLanguage) {
            if (callback) {
                callback(new Error("Could not find desired language: " + JSON.stringify(acceptedLanguages)));
            }
            return;
        }

        _mergeSelectedLanguage(destinationToAddLanguageTo, selectedLanguage);

        if (callback) {
            callback();
        }
    };

module.exports.transformByField = function (source, acceptedLanguages, fields) {
    return _transform(source, acceptedLanguages, fields);
};

module.exports.transform = function (source, acceptedLanguages) {
    return _transform(source, acceptedLanguages);
};

module.exports.transformByFieldDestination = function (source, destinationToAddLanguageTo, acceptedLanguages, fields, callback) {
    return _transformDestination(source, destinationToAddLanguageTo, acceptedLanguages, fields, callback);
};

module.exports.transformDestination = function (source, destinationToAddLanguageTo, acceptedLanguages, callback) {
    return _transformDestination(source, destinationToAddLanguageTo, acceptedLanguages, null, callback);
};