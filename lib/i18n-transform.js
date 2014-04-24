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

_extractSelectedLanguage = function(r, languages){
    var language = null;

    languages.forEach(function(l){
        r.i18n.forEach(function(rl){
            if(l.code === "*"){
                language = language || l.code;
            }

            if(l.code.toUpperCase() === rl.Language.Code.toUpperCase()
                && ((l.region === undefined || rl.Language.Region === undefined )
                        || l.region.toUpperCase() === rl.Language.Region.toUpperCase())) {
                language = language || rl;
            }
        });
    });

    if(language === "*"){
        return _extractPrimaryLanguage(r);
    }

    return language;
},

_transform = function(r, language){
    if(!language){
        return;
    }

    r = hoek.merge(r, language);
    delete r.i18n;
    return r;
};

// expects the language object from the request to be passed in:
// [
//   { code: 'en', region: 'US', quality: 1.0 },
//   { code: 'en',               quality: 0.8 },
//    ...
// ]

module.exports.transform = function(r, languages){

    if(!r.i18n){
        return r;
    }

    if(!languages || languages.length === 0){
        return _transform(r, _extractPrimaryLanguage(r));
    }

    languages.sort(function(a, b){
        return b.quality - a.quality;
    });

    return _transform(r, _extractSelectedLanguage(r, languages));
};
