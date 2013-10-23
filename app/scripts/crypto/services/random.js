'use strict';

(function(app) {

  app.factory('Random', ['BaseServiceClass', '$log', function(BaseServiceClass, $log) {

    return new (BaseServiceClass.extend({

      /**
       * Begin entropy collection.
       */
      startEntropyCollection: function() {
        $log.log('Starting RNG entropy collection...');
        sjcl.random.startCollectors();
      },





      /**
       * Get String representation of this service.
       * @returns {string}
       */
      toString: function() {
        return 'Cryptographically secure randomness generator';
      }
    }));

  }]);

}(angular.module('App.crypto', ['App.common'])));
