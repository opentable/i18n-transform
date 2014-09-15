var hoek = require("hoek");

var _extractPrimaryLanguage = function(r){
    var language = {};
    r.i18n.forEach(function(l){
        if(l.Language.IETF.toUpperCase() === r.PrimaryLanguage.toUpperCase()){
            language = l;
        }
    });

    return language;
},

_extractPreferredLanguage = function(r, languages){
    var language = null;

    languages.forEach(function(l){
        r.i18n.forEach(function(rl){
            if(l.code === "*"){
                language = language || l.code;
            }

            if(l.code.toUpperCase() === rl.Language.Code.toUpperCase() && 
                ((l.region === undefined || rl.Language.Region === undefined ) || 
                    l.region.toUpperCase() === rl.Language.Region.toUpperCase())) {
                language = language || rl;
            }
        });
    });

    if(language === "*"){
        return _extractPrimaryLanguage(r);
    }

    return language;
},

_mergeSelectedLanguage = function(destination, language){
  if(!language){
    return destination;
  }
  return hoek.merge(destination, language);
},

_getSelectedLanguage = function(source, languages){
    // expects the language object from the request to be passed in:
    // [
    //   { code: 'en', region: 'US', quality: 1.0 },
    //   { code: 'en',               quality: 0.8 },
    //    ...
    // ]
    if(!languages || languages.length === 0){
        return  _extractPrimaryLanguage(source);
    }
    else {
        languages.sort(function(a, b){
          return b.quality - a.quality;
        });

        return _extractPreferredLanguage(source, languages);
    }
};

module.exports.transform = function(source, languages){
    if(!source.i18n){
        return source;
    }

    var selectedLanguage = _getSelectedLanguage(source, languages);
    if (!selectedLanguage){
        return;
    }

    var result = _mergeSelectedLanguage(source, selectedLanguage);
    delete result.i18n;
    return result;
};

module.exports.transformDestination = function(source, destinationToAddLanguageTo, languages, callback){
    if(!source.i18n){
        return source;
    }

    var selectedLanguage = _getSelectedLanguage(source, languages);

    if (!selectedLanguage) {
        if (callback) {
            callback(new Error("Could not find desired language"));
            return;
        }
    }

    _mergeSelectedLanguage(destinationToAddLanguageTo, selectedLanguage);

    if (callback) {
        callback();
    }
};