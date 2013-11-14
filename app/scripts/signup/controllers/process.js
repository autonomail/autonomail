'use strict';

(function(app) {

  app.controller('SignupProcessCtrl', function ($q, $log, $scope, $timeout, SignupManager, SecureData, GPG) {

    $scope.progressBar = {
      value: 0,
      type: 'success'
    };

    $scope.error = null;

    $scope.startProcess = function() {
      var signupFormData = SignupManager.getSavedSignupFormData(),
        emailAddress = signupFormData.email;

      SecureData.get(emailAddress, 'pgp')
        .then(function ensurePGPKeys(pgpData) {
          if (pgpData) {
            return GPG.restore(pgpData);
          } else {
            return GPG.generateKeyPair(emailAddress, 2048)
              .then(function savePGPData() {
                $log.info('Created PGP keypair for ' + emailAddress);

                return GPG.backup()
                  .then(function saveData(pgpData) {
                    $log.debug('Saving PGP data to secure store', pgpData);

                    return SecureData.set(emailAddress, 'pgp', pgpData);
                  });
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

