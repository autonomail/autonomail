'use strict';

(function(app) {

  app.controller('SignupFormCtrl', function ($log, $scope, $state, Server, SignupManager) {

    $scope.user = {
      name: 'username1',
      password: 'password1',
      confirm: 'password1',
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
     * Check that password contents are valid.
     * @param password {string} the password user entered.
     * @returns {boolean} true if ok; false otherwise.
     */
    $scope.validatePasswordContents = function(password) {
      var hasLetter = false,
        hasNumber = false;

      if (!password || password.length === 0) return true;

      for (var i=0; i<password.length; ++i) {
        var charCode = password.charAt(i).toLowerCase().charCodeAt(0);
        if (97 <= charCode & 122 >= charCode) {
          hasLetter = true;
        }
        if (48 <= charCode && 57 >= charCode) {
          hasNumber = true;
        }
      }

      return hasLetter && hasNumber;
    };


    /**
     * Check that user confirmed the password correctly.
     * @param confirm {string} what the user entered.
     * @returns {boolean} true if confirmation was good.
     */
    $scope.validatePasswordConfirmation = function(confirm) {
      return confirm === $scope.user.password;
    };

    /**
     * Check that the username is available.
     * @param username {string} user entry.
     * @return {Promise}
     */
    $scope.validateNameAvailable = function(username) {
      return Server.checkUsernameAvailable(username);
    };


    /**
     * Submit the form.
     */
    $scope.submit = function() {
      SignupManager.saveSignupFormData($scope.user);
      $state.go('signup.process');
    };

  });

}(angular.module('App.signup', ['App.server', 'ui.validate'])));

