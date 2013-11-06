'use strict';

(function(angular) {

  var app = angular.module('App', [
    'ui.router',
    'App.common',
    'App.server',
    'App.crypto',
    'App.signup'
  ]);

  app.config(function ($stateProvider, $urlRouterProvider, ServerProvider) {
    $urlRouterProvider.otherwise('/signup');

    $stateProvider
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/signup/index.html',
        controller: function($state) {
          $state.go('signup.form');
        }
      })
      .state('signup.form', {
        templateUrl: 'app/signup/form.html'
      })
      .state('signup.process', {
        templateUrl: 'app/signup/process.html'
      })
    ;

    // simulate the back-end for now.
    ServerProvider.setBackend(ServerProvider.BACKEND_TYPES.SIMULATION);
  });

  app.run(function(Random) {
    Random.startEntropyCollection();
  });

}(angular));

