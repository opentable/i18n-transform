var i18n = require('../lib/i18n-transform');
    should = require('should');

describe('i18n tests', function(){
    it('should merge the fields for the specified language', function(){
        var result = i18n.transform({
            i18n: [
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                },
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "en", region: "US", quality: 1.0 }
        ]);

        result.Name.should.eql("gonna drink some beer and shoot some stuff y'all");
        result.Language.IETF.should.eql("en-US");
    });

    it('should add the language fields to the destination when using transformDestination', function(){
      var destinationObject = {};
      i18n.transformDestination({
        i18n: [
          {
            Name: "gonna drink some beer and shoot some stuff y'all",
            Language: {
              IETF: "en-US",
              Code: "en",
              Region: "US"
            }
          },
          {
            Name: "pip pip tally ho crumpets and tea",
            Language: {
              IETF: "en-GB",
              Code: "en",
              Region: "GB"
            }
          }
        ],
        PrimaryLanguage: "en-US"
      },
      destinationObject,
      [
        { code: "en", region: "US", quality: 1.0 }
      ]);

      destinationObject.Name.should.eql("gonna drink some beer and shoot some stuff y'all");
      destinationObject.Language.IETF.should.eql("en-US");
    });

    it('should preserve fields in the root of the document', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                },
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "en", region: "US", quality: 1.0 }
        ]);

        result.DomainId.should.eql(123);
    });

    it('should select the primary language when no language is specified', function(){
        var result = i18n.transform({
            i18n:[
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                },
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, []);

        result.Name.should.eql("gonna drink some beer and shoot some stuff y'all");
        result.Language.IETF.should.eql("en-US");
    });

    it('should select the first available language based on the given set', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                },
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "es", region: "MX", quality: 1.0 },
            { code: "en", region: "US", quality: 0.8 }
        ]);

        result.Language.IETF.should.eql("en-US");
    });

    it('should select the primary language when a wildcard is specified', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                },
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "es", region: "MX", quality: 1.0 },
            { code: "fr", region: "CA", quality: 0.8 },
            { code: "*", quality: 0.4 }
        ]);

        result.Language.IETF.should.eql("en-US");
    });

    it('should select the primary language when a wildcard is specified anywhere in the set', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                },
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "es", region: "MX", quality: 1.0 },
            { code: "*", quality: 0.8 },
            { code: "fr", region: "CA", quality: 0.6 },
            { code: "en", region: "GB", quality: 0.4 }
        ]);

        result.Language.IETF.should.eql("en-US");
    });

    it('should select the first match when there are multiple matches', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                },
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "en", region: "AU", quality: 1.0 },
            { code: "en", quality: 0.8 }
        ]);

        result.Language.IETF.should.eql("en-GB");
    });

    it('should select the first match from a complex set', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                },
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                },
                {
                    Name: "j'ai du café et du croissant",
                    Language: {
                        IETF: "fr-CA",
                        Code: "fr",
                        Region: "CA"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "de", region: "DE", quality: 1.0 },
            { code: "fr",               quality: 0.8 },
            { code: "en", region: "US", quality: 0.6 },
            { code: "en",               quality: 0.4 },
            { code: "*",                quality: 0.1 }
        ]);

        result.Language.IETF.should.eql("fr-CA");
    });

    it('should sort the language set based on quality', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                },
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                },
                {
                    Name: "j'ai du café et du croissant",
                    Language: {
                        IETF: "fr-CA",
                        Code: "fr",
                        Region: "CA"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "en", region: "US", quality: 0.6 },
            { code: "de", region: "DE", quality: 1.0 },
            { code: "en",               quality: 0.4 },
            { code: "*",                quality: 0.1 },
            { code: "fr",               quality: 0.8 },
        ]);

        result.Language.IETF.should.eql("fr-CA");
    });

    it('should compare language codes in a case-insensitive manner', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "pip pip tally ho crumpets and tea",
                    Language: {
                        IETF: "en-GB",
                        Code: "en",
                        Region: "GB"
                    }
                },
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                }
            ],
            PrimaryLanguage: "en-GB"
        }, [
            { code: "En", region: "us", quality: 1 }
        ]);

        result.Language.IETF.should.eql("en-US");
    });

    it('should not break when region is undefined', function(){
        var result = i18n.transform({
            DomainId: 123,
            i18n: [
                {
                    Name: "japanese",
                    Language: {
                        IETF: "ja",
                        Code: "ja"
                    }
                },
                {
                    Name: "english",
                    Language: {
                        IETF: "en",
                        Code: "en"
                    }
                }
            ],
            PrimaryLanguage: "en"
        }, [
            { code: "En", region: "US", quality: 1 }
        ]);

        result.Language.IETF.should.eql("en");
    });

    it('should delete the i18n section', function(){
        var result = i18n.transform({
            i18n: [
                {
                    Name: "gonna drink some beer and shoot some stuff y'all",
                    Language: {
                        IETF: "en-US",
                        Code: "en",
                        Region: "US"
                    }
                }
            ],
            PrimaryLanguage: "en-US"
        }, [
            { code: "en", region: "US", quality: 1.0 }
        ]);

        (result.i18n === undefined).should.eql(true);
    });
});
