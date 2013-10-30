'use strict';

(function(angular) {

  var app = angular.module('App', [
    'ui.router',
    'App.common',
    'App.controllers',
    'App.crypto'
  ]);

  app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('signup', {
        url: '/',
        templateUrl: 'views/signup.html'
      });
  });

  app.run(function(Random, $q) {
    Random.startEntropyCollection();
  });

}(angular));

