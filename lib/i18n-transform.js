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

    _isWildcardMatch = function (language) {
        return language.code === "*";
    },

    _isLanguageCodeMatch = function (languageA, languageB) {
        return languageA.code.toUpperCase() === languageB.code.toUpperCase();
    },

    _isLanguageRegionMatch = function (languageA, languageB) {
        return (languageA.region === undefined || languageB.region === undefined) ||
            languageA.region.toUpperCase() === languageB.region.toUpperCase();
    },

    _isLanguageMatch = function (languageA, languageB) {
        return _isLanguageCodeMatch(languageA, languageB) &&
            _isLanguageRegionMatch(languageA, languageB);
    },

    _parseLanguage = function (language) {
        if (language) {
            var parsed = language.split('-');
            return {
                code: parsed[0],
                region: parsed[1],
                ietf: language
            };
        }
    },

    _setMatchingPartialsToPrimaryLanguage = function (acceptLanguages, i18nArray, primaryLanguage) {
        return _.map(acceptLanguages, function (acceptLanguage) {
            if (_isWildcardMatch(acceptLanguage)) {
                return primaryLanguage ? primaryLanguage : _getLanguageFromI18n(i18nArray[0]);
            }

            if (_isLanguageCodeMatch(acceptLanguage, primaryLanguage) && !acceptLanguage.region) {
                primaryLanguage.quality = acceptLanguage.quality;
                return primaryLanguage;
            }
            return acceptLanguage;
        });
    },

    _extractLanguage = function (i18nArray, language, useFallback) {
        if (useFallback && (!language || !language.ietf)) {
            //just use whatever is available
            if (i18nArray[0]) {
                return i18nArray[0];
            }

            return null;
        }

        return _.find(i18nArray, function (i18n) {
            var i18nLanguage = _getLanguageFromI18n(i18n);
            if (i18nLanguage && i18nLanguage.ietf) {
                return i18nLanguage.ietf.toUpperCase() === language.ietf.toUpperCase();
            }
        });
    },

    _mapAcceptLanguagesToTranslations = function (acceptLanguages, i18nArray) {
        var results = _.map(acceptLanguages, function (acceptLanguage) {

            return _.find(i18nArray, function (i18n) {
                var i18nLanguage = _getLanguageFromI18n(i18n);
                return _isLanguageMatch(i18nLanguage, acceptLanguage);
            });
        });

        return _.pull(results, undefined);
    },

    _extractPerField = function (fields, acceptLanguages, i18nArray, primaryTranslations, required) {
        if(!primaryTranslations) {
            throw new Error('Primary translations are not available');
        }

        var results = {
            translations: {},
            localization: {}
        };

        var mappedTranslations = _mapAcceptLanguagesToTranslations(acceptLanguages, i18nArray);

        _.each(fields, function (field) {
            _.each(mappedTranslations, function (translations) {

                if (!_.isNil(translations[field])) {
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

    _extractPreferredLanguagePerField = function (i18nArray, acceptLanguages, primaryLanguage, fields) {
        var translations = {};
        var primaryTranslations = _extractLanguage(i18nArray, primaryLanguage, true);

        if (fields.required) {
            _.merge(translations, _extractPerField(fields.required, acceptLanguages,
                i18nArray,
                primaryTranslations,
                true));
        }

        if (fields.optional) {
            _.merge(translations, _extractPerField(fields.optional, acceptLanguages,
                i18nArray,
                primaryTranslations,
                false));
        }

        return translations;
    },

    _extractPreferredLanguage = function (i18nArray, acceptLanguages) {
        var mappedTranslations = _mapAcceptLanguagesToTranslations(acceptLanguages, i18nArray);

        if (mappedTranslations) {
            return mappedTranslations[0];
        }

        return null;
    },

    _mergeSelectedLanguage = function (destination, language) {
        if (!language) {
            return destination;
        }
        return _.merge(destination, language);
    },

    _getSelectedLanguage = function (source, i18nArray, acceptLanguages, fields) {
        var primaryLanguage = _parseLanguage(source.PrimaryLanguage);
        var languages = _setMatchingPartialsToPrimaryLanguage(acceptLanguages, i18nArray, primaryLanguage);

        if (!languages || languages.length === 0) {
            var translations = _extractLanguage(i18nArray, primaryLanguage, true);
            if (fields) {
                var localization = {};
                _.concat(fields.required, fields.optional)
                    .forEach(function (field) {
                        localization[field] = primaryLanguage.ietf;
                    });
                return {
                    translations: translations,
                    localization: localization
                };
            }
            return translations;
        }
        else {
            languages.sort(function (a, b) {
                return b.quality - a.quality;
            });

            return fields ? _extractPreferredLanguagePerField(i18nArray, languages, primaryLanguage, fields)
                : _extractPreferredLanguage(i18nArray, languages);
        }
    },

    _transform = function (source, acceptLanguages, fields) {
        var i18nInfo = _getI18n(source);

        if (!i18nInfo) {
            return source;
        }

        var selectedLanguage = _getSelectedLanguage(source, i18nInfo.value, acceptLanguages, fields);
        if (!selectedLanguage) {
            return;
        }

        var result = _mergeSelectedLanguage(source, selectedLanguage);
        delete result[i18nInfo.name];
        return result;
    },

    _transformDestination = function (source, destinationToAddLanguageTo, acceptLanguages, fields, callback) {
        var i18nInfo = _getI18n(source);

        if (!i18nInfo) {
            return source;
        }

        var selectedLanguage = null;
        try {
            selectedLanguage = _getSelectedLanguage(source, i18nInfo.value, acceptLanguages, fields);
        }
        catch (exception) {
            if(callback) {
                return callback(exception);
            }

            throw exception;
        }

        if (!selectedLanguage) {
            if (callback) {
                callback(new Error("Could not find desired language: " + JSON.stringify(acceptLanguages)));
            }
            return;
        }

        _mergeSelectedLanguage(destinationToAddLanguageTo, selectedLanguage);

        if (callback) {
            callback();
        }
    };

module.exports.transformByField = function (source, acceptLanguages, fields) {
    return _transform(source, acceptLanguages, fields);
};

module.exports.transform = function (source, acceptLanguages) {
    return _transform(source, acceptLanguages);
};

module.exports.transformByFieldDestination = function (source, destinationToAddLanguageTo, acceptLanguages, fields, callback) {
    return _transformDestination(source, destinationToAddLanguageTo, acceptLanguages, fields, callback);
};

module.exports.transformDestination = function (source, destinationToAddLanguageTo, acceptLanguages, callback) {
    return _transformDestination(source, destinationToAddLanguageTo, acceptLanguages, null, callback);
};