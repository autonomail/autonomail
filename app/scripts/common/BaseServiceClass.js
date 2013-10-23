/**
 * Service base class.
 */

(function(app) {

  app.factory('BaseServiceClass', function() {
    return Class.extend({
      /**
       * Get a String representation of this service.
       */
      toString: function() {
        throw new Error('not yet implemented');
      }
    });
  });


}(angular.module('App.common', [])));

