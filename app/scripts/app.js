'use strict';

angular.module('App', ['ui.router'])
  .config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.otherwise("/");

    $stateProvider
      .state('home', {
        url: "/",
        templateUrl: "views/home.html",
        controller: 'MainCtrl'
      });
  });