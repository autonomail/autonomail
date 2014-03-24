'use strict';

(function(app) {

  app.controller('KeysCtrl', function (UserMgr, $scope, Log) {
    $scope.userId = UserMgr.getCurrentUser();

    var log = Log.create('KeysCtrl(' + $scope.userId + ')');

    // TODO: extract keys from the PGP keychain
    

    log.debug('OK!');

  });

}(angular.module('App.user', ['App.common', 'ui.bootstrap.pagination'])));

