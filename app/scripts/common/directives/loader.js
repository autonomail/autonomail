/**
 * Custom loader animation.
 */

(function(app) {

  app.directive('loader', function() {
    return {
      templateUrl: 'app/directives/loader.html'
    };
  });

}(angular.module('App.common', [])));

