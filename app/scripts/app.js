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
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('signup', {
        url: '/',
        templateUrl: 'views/signup.html'
      });

    // simulate the back-end for now.
    ServerProvider.setBackend(ServerProvider.BACKEND_TYPES.SIMULATION);
  });

  app.run(function(Random, $q) {
    Random.startEntropyCollection();
  });

}(angular));

