var i18n = require('../lib/i18n-transform');
should = require('should');

describe('i18n tansformByFields tests', function () {

  describe('when all requested locales are present', function () {
    var translations = null;
    beforeEach(function () {
      translations = {
        i18n: [
          {
            Name: "gonna drink some beer and shoot some stuff y'all",
            Description: "This is a description in US English",
            Language: {
              IETF: "en-US",
              Code: "en",
              Region: "US"
            }
          },
          {
            Name: "pip pip tally ho crumpets and tea",
            Description: "This is a description in GB English",
            Language: {
              IETF: "en-GB",
              Code: "en",
              Region: "GB"
            }
          }
        ],
        PrimaryLanguage: "en-US"
      };
    });

    it('should return all required fields in the requested locale', function () {

      var result = i18n.transformByField(translations, [{
        code: "en",
        region: "US",
        quality: 1.0
      }], {
        required: [
          'Name',
          'Description'
        ],
      });

      result.translations.Name.should.eql("gonna drink some beer and shoot some stuff y'all");
      result.translations.Description.should.eql("This is a description in US English");
      result.localization.Name.should.eql('en-US');
      result.localization.Description.should.eql('en-US');
    });

    it('should fallback to primary locale when * is used', function () {
      var result = i18n.transformByField(translations, [{
        code: "*",
      }], {
        required: [
          'Name',
          'Description'
        ],
      });

      result.translations.Name.should.eql('gonna drink some beer and shoot some stuff y\'all');
      result.translations.Description.should.eql('This is a description in US English');

      result.localization.Name.should.eql('en-US');
      result.localization.Description.should.eql('en-US');

    });

    it('should fallback to primary locale when * is anywhere in the set', function () {
      var result = i18n.transformByField(translations, [
          { code: "es", region: "MX", quality: 1.0 },
          { code: "*", quality: 0.8 },
          { code: "fr", region: "CA", quality: 0.6 },
          { code: "en", region: "GB", quality: 0.4 }],
        {
          required: [
            'Name',
            'Description'
          ],
        });

      result.translations.Name.should.eql('gonna drink some beer and shoot some stuff y\'all');
      result.translations.Description.should.eql('This is a description in US English');

      result.localization.Name.should.eql('en-US');
      result.localization.Description.should.eql('en-US');

    });

  });

  describe('when translations are missing for fields', function () {
    var translations = null;

    beforeEach(function () {
      translations = {
        i18n: [
          {
            Name: "pip pip tally ho crumpets and tea",
            Description: "This is a description in GB English",
            Language: {
              IETF: "en-GB",
              Code: "en",
              Region: "GB"
            }
          },
          {
            Name: "gonna drink some beer and shoot some stuff y'all",
            Description: "This is a description in US English",
            DressCode: "Smart Casual",
            PriceBand: 'Budget',
            Area: 'Orlando',
            Language: {
              IETF: "en-US",
              Code: "en",
              Region: "US"
            },
            AddtionalDetails: []
          },
          {
            Name: 'Benvenuti in un mondo di cibo',
            Description: null,
            Language: {
              IETF: "it-IT",
              Code: "it",
              Region: "IT"
            }
          }
        ],
        PrimaryLanguage: "en-US"
      };
    });

    it('should set optional fields if not present to null', function () {
      var result = i18n.transformByField(translations, [{
        code: "it",
        region: "IT",
        quality: 1.0
      }], {
        required: [
          'Name',
          'Description'
        ],
        optional: [
          'Area'
        ]
      });

      (result.translations.Area === null).should.be.true;
      (result.localization.Area === undefined).should.be.true;
    });

    it('should fallback to a specified secondary locale', function () {
      var result = i18n.transformByField(translations, [{
        code: "it",
        region: "IT",
        quality: 1.0
      },
        {
          code: "en",
          region: "US",
          quality: 0.9
        }], {
        required: [
          'Name',
          'Description'
        ],
      });

      result.translations.Name.should.eql('Benvenuti in un mondo di cibo');
      result.translations.Description.should.eql('This is a description in US English');

      result.localization.Name.should.eql('it-IT');
      result.localization.Description.should.eql('en-US');
    });

    it('should fallback to primary locale for required field if locale not present', function () {
      var result = i18n.transformByField(translations, [{
        code: "es",
        region: "ES",
        quality: 1.0
      }], {
        required: [
          'Name',
          'Description'
        ],
        optional: [
          'PriceBand'
        ]
      });

      result.translations.Name.should.eql('gonna drink some beer and shoot some stuff y\'all');
      result.translations.Description.should.eql('This is a description in US English');

      result.localization.Name.should.eql('en-US');
      result.localization.Description.should.eql('en-US');

      (result.translations.PriceBand == null).should.be.true;
      (result.localization.PriceBand == null).should.be.true;
    });

    it('should not fallback to primary locale for optional field if not present', function () {
      var result = i18n.transformByField(translations, [{
        code: "it",
        region: "IT",
        quality: 1.0
      }], {
        optional: [
          'PriceBand'
        ]
      });

      (result.translations.PriceBand === null).should.be.true;
      (result.localization.PriceBand === undefined).should.be.true;
    });

    it('should match for accept-lang without region for an optional field', function () {
      var result = i18n.transformByField(translations, [{
        code: "en",
        quality: 1.0
      }], {
        optional: [
          'DressCode'
        ]
      });

      result.translations.DressCode.should.eql('Smart Casual');
      result.localization.DressCode.should.eql('en-US');
    });

    it('should select primary language for partial accept-lang when multiply available', function () {
      var result = i18n.transformByField(translations, [{
        code: "en",
        quality: 1.0
      }], {
        optional: [
          'Name'
        ]
      });

      result.translations.Name.should.eql('gonna drink some beer and shoot some stuff y\'all');
      result.localization.Name.should.eql('en-US');
    });

    it('should select primary language when no accept-lang supplied', function () {
      var result = i18n.transformByField(translations, [], {
        required: [
          'Name'
        ]
      });

      result.translations.Name.should.eql('gonna drink some beer and shoot some stuff y\'all');
      result.localization.Name.should.eql('en-US');
    });

    it('should not set localization for field when source property is null', function () {
      var result = i18n.transformByField(translations, [{
        code: "it",
        region: "IT",
        quality: 1.0
      }], {
        optional: [
          'Description'
        ]
      });

      (result.translations.Description === null).should.be.true;
      (result.localization.Description === undefined).should.be.true;
    });

    it('should treat empty arrays as a match', function () {
      var result = i18n.transformByField(translations, [{
        code: "en",
        region: "US",
        quality: 1.0
      }], {
        optional: [
          'AddtionalDetails'
        ]
      });

      result.translations.AddtionalDetails.should.eql([]);
      result.localization.AddtionalDetails.should.eql('en-US');
    });
  });

  describe('when there\'s missing primary translations', function () {
    var translations = null;

    beforeEach(function () {
      translations = {
        i18n: [
          {
            Name: "pip pip tally ho crumpets and tea",
            Language: {
              IETF: "en-GB",
              Code: "en",
              Region: "GB"
            }
          }
        ],
        PrimaryLanguage: "fr-CA"
      };
    });

    it('should throw an error', function () {
      var transformFunc = function() {
        return i18n.transformByField(translations, [{
          code: "xx",
          region: "XX",
          quality: 1.0
        }], {
          required: [
            'Name'
          ]
        });
      };

      transformFunc.should.throw('Primary translations are not available');

    });
  });
});