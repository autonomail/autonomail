'use strict';

(function(angular) {

  var app = angular.module('App', [
    'ui.router',
    'App.common',
    'App.crypto',
    'App.data',
    'App.server',
    'App.user',
    'App.login',
    'App.mailbox',
    'App.signup'
  ]);

  app.config(function ($stateProvider, $urlRouterProvider, ServerProvider, StorageProvider, WebWorkerProvider, GPGProvider, MailViewProvider) {
    $urlRouterProvider.otherwise('/login');

    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'app/login/form.html'
      })
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
      .state('mail', {
        url: '/mail',
        templateUrl: 'app/mailbox/index.html',
        controller: function($state) {
          $state.go('mail.folder', {
            folderId: 'inbox'
          });
        }
      })
      .state('mail.folder', {
        url: '/:folderId',
        templateUrl: 'app/mailbox/folder.html'
      })
    ;

    // web workers
    WebWorkerProvider.addImportScript('/scripts/webworker-imports.generated.js');
    GPGProvider.setWorkerScript('/scripts/gpg2-worker.generated.js');

    ServerProvider.setBackend(ServerProvider.BACKEND_TYPES.SIMULATION);
    StorageProvider.setBackend(StorageProvider.BACKEND_TYPES.LOCAL_STORAGE);

    MailViewProvider.setInterval(5000);
  });

  app.run(function(Random) {
    Random.startEntropyCollection();
  });

}(angular));

