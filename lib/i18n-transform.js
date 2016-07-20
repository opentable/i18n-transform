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

    _extractPrimaryLanguage = function (r, i18nArray) {
        if (!r.PrimaryLanguage) {
            //just use whatever is available
            if (i18nArray[0]) {
                return i18nArray[0];
            }

            return null;
        }

        var language = null;

        i18nArray.forEach(function (l) {
            var i18nLanguage = _getLanguageFromI18n(l);
            if (i18nLanguage && i18nLanguage.ietf) {
                if (i18nLanguage.ietf.toUpperCase() === r.PrimaryLanguage.toUpperCase()) {
                    language = l;
                }
            }
        });

        return language;
    },

    _shouldUsePrimaryLanguage = function (primaryLanguage, languageCode) {
        return primaryLanguage &&
            !languageCode.region &&
            primaryLanguage.split('-')[0] === languageCode.code;
    },

    _extractPreferredLanguage = function (r, i18nArray, languages) {
        var language = null;

        languages.forEach(function (l) {
            i18nArray.forEach(function (rl) {
                var i18nLanguage = _getLanguageFromI18n(rl);

                if (l.code === "*") {
                    language = language || l.code;
                }

                if (_shouldUsePrimaryLanguage(r.PrimaryLanguage, l)) {
                    language = language || "*";
                }

                if (l.code.toUpperCase() === i18nLanguage.code.toUpperCase() &&
                    ((l.region === undefined || i18nLanguage.region === undefined) ||
                        l.region.toUpperCase() === i18nLanguage.region.toUpperCase())) {
                    language = language || rl;
                }
            });
        });

        if (language === "*") {
            return _extractPrimaryLanguage(r, i18nArray);
        }

        return language;
    },

    _mergeSelectedLanguage = function (destination, language) {
        if (!language) {
            return destination;
        }
        return _.assign(destination, language);
    },

    _getSelectedLanguage = function (source, i18nArray, languages) {
        // expects the language object from the request to be passed in:
        // [
        //   { code: 'en', region: 'US', quality: 1.0 },
        //   { code: 'en',               quality: 0.8 },
        //    ...
        // ]
        if (!languages || languages.length === 0) {
            return _extractPrimaryLanguage(source, i18nArray);
        }
        else {
            languages.sort(function (a, b) {
                return b.quality - a.quality;
            });

            return _extractPreferredLanguage(source, i18nArray, languages);
        }
    };

module.exports.transform = function (source, languages) {
    var i18nInfo = _getI18n(source);

    if (!i18nInfo) {
        return source;
    }

    var selectedLanguage = _getSelectedLanguage(source, i18nInfo.value, languages);
    if (!selectedLanguage) {
        return;
    }

    var result = _mergeSelectedLanguage(source, selectedLanguage);
    delete result[i18nInfo.name];
    return result;
};

module.exports.transformDestination = function (source, destinationToAddLanguageTo, languages, callback) {
    var i18nInfo = _getI18n(source);

    if (!i18nInfo) {
        return source;
    }

    var selectedLanguage = _getSelectedLanguage(source, i18nInfo.value, languages);

    if (!selectedLanguage) {
        if (callback) {
            callback(new Error("Could not find desired language"));
        }
        return;
    }

    _mergeSelectedLanguage(destinationToAddLanguageTo, selectedLanguage);

    if (callback) {
        callback();
    }
};