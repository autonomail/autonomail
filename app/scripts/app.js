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

  app.config(function ($stateProvider, $urlRouterProvider, LogProvider, ServerProvider, StorageProvider, WebWorkerProvider, GPGProvider, MailViewProvider) {
    LogProvider.logToConsole(true);
    
    $urlRouterProvider.otherwise('/login');

    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'app/login/form.html'
      })
      .state('logout', {
        url: '/logout',
        controller: function(UserMgr, $state) {
          UserMgr.setCurrentUser(null);
          $state.go('login');
        }
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
      .state('pgpKeys', {
        auth: true,
        url: '/k',
        templateUrl: 'app/keys/view.html'
      })
      .state('mail', {
        auth: true,
        url: '/m',
        templateUrl: 'app/mailbox/index.html',
        controller: function($state) {
          $state.go('mail.folder', {
            folderId: 'inbox'
          });
        }
      })
      .state('mail.compose', {
        auth: true,
        url: '/compose',
        templateUrl: 'app/mailbox/compose.html'
      })
      .state('mail.folder', {
        auth: true,
        url: '/v/:folderId',
        templateUrl: 'app/mailbox/folder.html'
      })
    ;

    // web workers
    WebWorkerProvider.addImportScript('/scripts/webworker-imports.generated.js');
    GPGProvider.setWorkerScript('/scripts/gpg2-worker.generated.js');

    ServerProvider.setBackend(ServerProvider.BACKEND_TYPES.SIMULATION);
    StorageProvider.setBackend(StorageProvider.BACKEND_TYPES.LOCAL_STORAGE);

    MailViewProvider.setInterval(300000);
  });

  app.run(function($rootScope, $state, Log, UserMgr, Random) {
    var log = Log.create('App');

    // start entropy collector
    Random.startEntropyCollection();


    $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {
      log.debug('State transition: ' + toState.name);

      // authentication for new states which need it
      if (toState.auth && !UserMgr.getCurrentUser()) {
        event.preventDefault();

        log.debug('Ask user to login');
        
        UserMgr.postLoginState = toState.name;

        $state.go('login');
      }
    });

    $rootScope.$on('$stateChangeError', 
      function(event, toState, toParams, fromState, fromParams, error) {
        log.error('State transition error', toState.name, error);
      }
    );


    $rootScope.loggedIn = function() {
      return !!(UserMgr.getCurrentUser());
    }
  });

}(angular));

