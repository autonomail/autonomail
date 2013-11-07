'use strict';

(function(angular) {

  var app = angular.module('App', [
    'ui.router',
    'App.common',
    'App.crypto',
    'App.data',
    'App.server',
    'App.signup'
  ]);

  app.config(function ($stateProvider, $urlRouterProvider, ServerProvider, StorageProvider, WebWorkerProvider, GPGProvider) {
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

    // web workers
    WebWorkerProvider.addImportScript('/scripts/webworker-imports.generated.js');
    GPGProvider.setWorkerScript('/scripts/gpg2-worker.generated.js');

    ServerProvider.setBackend(ServerProvider.BACKEND_TYPES.SIMULATION);
    StorageProvider.setBackend(StorageProvider.BACKEND_TYPES.LOCAL_STORAGE);
  });

  app.run(function(Random) {
    Random.startEntropyCollection();
  });

}(angular));

