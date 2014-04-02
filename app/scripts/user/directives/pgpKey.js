/**
 * PGP key item.
 */

(function(app) {

  app.directive('pgpKey', function() {
    return {
      controller: 'PgpKeyDirectiveCtrl',
      templateUrl: 'app/directives/pgpKey.html'
    };
  });


  app.controller('PgpKeyDirectiveCtrl', function($element, $attrs, $scope) {
    var self = this;

    $scope.key = $scope.id;
  });

}(angular.module('App.user', [])));

