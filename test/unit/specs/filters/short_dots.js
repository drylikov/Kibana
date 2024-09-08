define(function (require) {
  var angular = require('angular');
  var _ = require('lodash');

  // Load the kibana app dependencies.
  require('angular-route');
  require('apps/discover/index');
  require('filters/short_dots');

  var filter, config;

  var init = function (expandable) {
    // Load the application
    module('kibana');

    // Create the scope
    inject(function ($filter, _config_) {
      config = _config_;
      filter = $filter('shortDots');
    });
  };


  describe('shortDots filter', function () {

    beforeEach(function () {
      init();
    });

    it('should have a uriescape filter', function () {
      expect(filter).to.not.be(null);
    });

    it('should shorten foo.bar.baz to f.b.baz when shortDots:enable is true', function () {
      config.set('shortDots:enable', true);
      expect(filter('foo.bar.baz')).to.be('f.b.baz');
    });

    it('should not shorten when shortDots:enable is false', function () {
      config.set('shortDots:enable', false);
      expect(filter('foo.bar.baz')).to.be('foo.bar.baz');
    });

    it('should not shorten floating point numbers in any case', function () {
      config.set('shortDots:enable', false);
      expect(filter(12345.6789)).to.be(12345.6789);
      config.set('shortDots:enable', true);
      expect(filter(12345.6789)).to.be(12345.6789);
    });


  });

});
