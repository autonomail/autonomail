'use strict';

(function(app) {

  app.controller('SignupFormCtrl', function ($log, $scope, Server) {

    $scope.user = {
      name: '',
      password: '',
      confirm: '',
      agree: false
    };

    /**
     * Check whether the form can be submitted
     * @returns {$dirty|*|$valid}
     */
    $scope.canSubmit = function() {
      return $scope.signupForm.$dirty && $scope.signupForm.$valid;
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

  });

}(angular.module('App.signup', ['App.server', 'ui.validate'])));

