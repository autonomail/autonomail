'use strict';

(function(app) {

  app.controller('LoginFormCtrl', function ($scope, $state, Log, AuthCredentials, Server, Storage, UserMgr) {
    var log = Log.create('Login');

    // get last used username
    Storage.get('lastUser')
      .catch(function (err) { log.error(err); })
      .then(function(lastUser) {
        $scope.user = {
          domain: lastUser ? lastUser.domain : 'autonomail.com',
          name: lastUser ? lastUser.name : '',
          passphrase: 'this is my world'
        };
      });


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
      $scope.error = null;

      Server.login($scope.user)
        .then(function setCurrentUser(){
          console.log($scope.user);
          var userId = AuthCredentials.set($scope.user);

          return UserMgr.setCurrentUser(userId);
        })
        .then(function saveUsernameForNextTime() {
          return Storage.set('lastUser', {
            domain: $scope.user.domain,
            name: $scope.user.name
          });
        })
        .then(function showNextState() {
          $state.go(UserMgr.postLoginState || 'user.mail');
        })
        .catch(function (err) {
          log.error(err);
          $scope.error = 'Sorry, you entered incorrect details';
        })
    };
  });

}(angular.module('App.login', ['App.server', 'App.user', 'App.data'])));

