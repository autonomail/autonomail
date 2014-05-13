'use strict';

(function(app) {

  app.controller('KeysCtrl', function (GPG, UserMgr, SecureData, AuthCredentials, $scope, $modal, Log) {
    $scope.userId = UserMgr.getCurrentUser();

    var log = Log.create('KeysCtrl(' + $scope.userId + ')', $scope);

    $scope.user = AuthCredentials.get($scope.userId);

    /**
     * Refresh the list of keys.
     * @return {Promise}
     */
    var refreshKeys = function() {
      $scope.error = null;

      log.debug('Fetching GPG keys...');

      return GPG.getAllKeys($scope.user.email)
        .then(function(keys) {
          $scope.keys = keys;          
        });
    };


    /**
     * Add a PGP key.
     */
    $scope.addKey = function() {
      $scope.error = null;

      // show a modal
      var modalInstance = $modal.open({
        templateUrl: 'app/modals/addKey.html',
        controller: 'AddKeyModalCtrl',
        keyboard: true,
        backdrop: 'static'
      });

      // once closed
      modalInstance.result.then(function() {
        refreshKeys();
      }, function(err) {
        if (err) {
          log.error(err.toString());          
        }
      });
    };


    refreshKeys()      
      .catch(function(err) {
        log.error('Sorry, there was an unexpected error. Please check the logs for details.', err);
      });
  });




  app.controller('AddKeyModalCtrl', function($scope, RuntimeError, $modalInstance, GPG, Log) {
    var log = Log.create('AddKeyModalCtrl');

    $scope.modal = $modalInstance;

    // once opened
    $modalInstance.opened.then(function() {
      // nothing to do
    }, function(err) {
      $modalInstance.dismiss(new RuntimeError('Unable to open add key modal', err));
    });
  });



  app.controller('AddKeyFormCtrl', function($scope, RuntimeError, GPG, UserMgr, Log, Alert) {
    var log = Log.create('AddKeyFormCtrl');

    /**
     * Get whether form can be submitted.
     * @return {Boolean} true if so; false otherwise.
     */
    $scope.canSubmit = function() {
      return !$scope.submitInProgress && $scope.addKeyForm.$valid;
    };  

    /**
     * Submit the form.
     */
    $scope.submit = function() {
      $scope.submitInProgress = true;
      $scope.error = null;

      log.debug('Import GPG key...');

      GPG.importKey($scope.publicKey)
        .then(function backupData() {
          return UserMgr.backupGPGData(UserMgr.getCurrentUser());
        })
        .then(function closeModal() {
          Alert.info('Key successfully imported!');
          $scope.modal.close();
        })
        .catch(function(err) {
          $scope.error = err.toString();
        })
        .finally(function() {
          $scope.submitInProgress = false;
        })
    };

  });


}(angular.module('App.user', ['App.common', 'ngSanitize'])));
  