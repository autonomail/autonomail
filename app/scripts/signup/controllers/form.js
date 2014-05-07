'use strict';

(function(app) {

  app.controller('SignupFormCtrl', function ($log, $scope, $state, AuthCredentials, Server, UserMgr) {

    $scope.user = {
      domain: 'autonomail.com',
      name: 'username1',
      passphrase: 'this is my world',
      confirm: 'this is my world',
      agree: true
    };

    /**
     * Check whether the form can be submitted
     * @returns {$dirty|*|$valid}
     */
    $scope.canSubmit = function() {
      return $scope.signupForm.$valid;
    };


    /**
     * Check that passphrase contents are valid.
     * @param passphrase {string} the passphrase user entered.
     * @returns {boolean} true if ok; false otherwise.
     */
    $scope.validatePassphraseContents = function(passphrase) {
      try {
        Passphrase.check(passphrase);
        return true;
      } catch (err) {
        $scope.signupForm.passphrase.$error.contentsErrorMsg = err.message;

        return false;
      }
    };


    /**
     * Check that user confirmed the passphrase correctly.
     * @param confirm {string} what the user entered.
     * @returns {boolean} true if confirmation was good.
     */
    $scope.validatePassphraseConfirmation = function(confirm) {
      return confirm === $scope.user.passphrase;
    };

    /**
     * Check that the username is available.
     * @param username {string} user entry.
     * @return {Promise}
     */
    $scope.validateNameAvailable = function(username) {
      return Server.checkUsernameAvailable(username, $scope.user.domain);
    };


    /**
     * Submit the form.
     */
    $scope.submit = function() {
      Server.register($scope.user)
        .then(function registeredOk() {
          var userId = AuthCredentials.set($scope.user);
          UserMgr.setCurrentUser(userId);
          $state.go('user.mail');
        })
        .catch(function (err) {
          $scope.error = '' + err;
        });
    };

  });

}(angular.module('App.signup', ['App.server', 'App.user', 'ui.validate'])));

