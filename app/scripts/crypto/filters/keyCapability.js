/**
 * Pretty-print PGP key capabilities
 */

(function(app) {

  app.filter('keyCapability', function() {
    return function(inputCaps) {
      return _.keys(inputCaps || {}).map(function(k) {
        return _.str.capitalize(k);
      }).join(', ');
    };
  });

}(angular.module('App.common', [])));

