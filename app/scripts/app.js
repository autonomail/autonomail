'use strict';

(function(angular) {

  var app = angular.module('App', [
    'ui.router',
    'App.controllers',
    'App.crypto'
  ]);

  app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise('/');

    $stateProvider
      .state('home', {
        url: '/',
        templateUrl: 'views/home.html',
        controller: 'MainCtrl'
      });
  });

  app.run(function(Random) {
    Random.startEntropyCollection();
  });

}(angular));

