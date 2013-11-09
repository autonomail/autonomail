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

      SecureData.get(emailAddress, 'pgp')
        .then(function generatePGPKeys(pgpKeyPair) {
          if (pgpKeyPair) {
            return true;
          } else {
            return Encrypt.createPGPKeys(emailAddress)
              .then(function savePGPKeys(keyPair) {
                $log.info('Created PGP keypair for ' + emailAddress, keyPair);
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

