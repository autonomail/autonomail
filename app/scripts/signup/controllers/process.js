'use strict';

(function(app) {

  app.controller('SignupProcessCtrl', function ($log, $scope, $timeout, SignupManager, SecureData, Encrypt) {

    $scope.progressBar = {
      value: 0,
      type: 'success'
    };

    $scope.error = null;

    $scope.startProcess = function() {
      var signupFormData = SignupManager.getSavedSignupFormData(),
        emailAddress = signupFormData.email;

      SecureData.get(emailAddress)
        .then(function generatePGPKeys(data) {
          if (data.pgp) {
            return true;
          } else {
            return Encrypt.createPGPKeys(emailAddress)
              .then(function savePGPKeys(keyPair) {
                return SecureData.set(emailAddress, 'pgp', keyPair);
              });
          }
        })
        .then(function allDone() {
          $log.info('All setup!');
        })
        .catch(function promiseErr(err) {
          $log.error(err);
        })
      ;
    };

    $scope.startProcess();
  });

}(angular.module('App.signup', ['App.server', 'App.data', 'App.crypto', 'ui.bootstrap.progressbar'])));

