'use strict';

(function(angular) {

  var app = angular.module('App', ['ui.router']);

  app.config(function ($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise("/");

    $stateProvider
      .state('home', {
        url: "/",
        templateUrl: "views/home.html",
        controller: 'MainCtrl'
      });
  });

}(angular));

