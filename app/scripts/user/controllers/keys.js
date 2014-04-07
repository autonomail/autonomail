'use strict';

(function(app) {

  app.controller('KeysCtrl', function (GPG, UserMgr, AuthCredentials, $scope, Log) {
    $scope.userId = UserMgr.getCurrentUser();
    var log = Log.create('KeysCtrl(' + $scope.userId + ')');

    $scope.user = AuthCredentials.get($scope.userId);

    UserMgr.ensureUserHasSecureDataSetup()
      .then(function() {
        log.debug('Fetching GPG keys...');
        return GPG.getAllKeys($scope.user.email);
      })
      .then(function(keys) {
        $scope.keys = keys;
      })
      .catch(function(err) {
        log.error(err.message);
      });
  });

}(angular.module('App.user', ['App.common', 'ui.bootstrap.pagination'])));
  