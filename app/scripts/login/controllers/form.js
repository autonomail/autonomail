'use strict';

(function(app) {

  app.controller('LoginFormCtrl', function ($scope, $state, AuthCredentials, Server, UserMgr) {

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
      return $scope.loginForm.$valid;
    };


    /**
     * Submit the form.
     */
    $scope.submit = function() {
      Server.login($scope.user)
        .then(function loginOk(){
          var userId = AuthCredentials.set($scope.user);
          UserMgr.setCurrentUser(userId);
          $state.go('inbox');
        })
        .catch(function (err) {
          $scope.error = '' + err;
        })

    };
  });

}(angular.module('App.login', ['App.server', 'App.user'])));

