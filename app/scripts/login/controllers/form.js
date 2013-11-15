'use strict';

(function(app) {

  app.controller('LoginFormCtrl', function ($log, $scope, $state, Server, UserMgr) {

    var log

    $scope.user = {
      domain: 'autonomail.com',
      name: '',
      password: ''
    };

    /**
     * Check whether the form can be submitted
     * @returns {$dirty|*|$valid}
     */
    $scope.canSubmit = function() {
      return $scope.signupForm.$valid;
    };


    /**
     * Submit the form.
     */
    $scope.submit = function() {
      Server.login($scope.user)
        .then(function loginOk(){
          UserMgr.setUser($scope.user);
          $state.go('inbox');
        })
        .catch(function (err) {
          Log.errorAlert('Login failed: ' + err.toString());
        })

    };
  });

}(angular.module('App.login', ['App.server'])));

