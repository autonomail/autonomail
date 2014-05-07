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

  app.config(function ($stateProvider, $urlRouterProvider, LogProvider, 
        ServerProvider, StorageProvider, GPGProvider, MailViewProvider) 
  {
    LogProvider.logToConsole(true);
    
    $urlRouterProvider.otherwise('/login');

    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'app/anon/login.html'
      })
      .state('logout', {
        url: '/logout',
        controller: function(UserMgr, $state) {
          UserMgr.setCurrentUser(null)
            .then(function showLoginPage() {
              $state.go('login');
            });
        }
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/anon/signup.html'
      })
      .state('user', {
        auth: true,
        url: '/u',
        templateUrl: 'app/user/index.html'
      })
      .state('user.keys', {
        auth: true,
        url: '/k',
        templateUrl: 'app/user/keys.html'
      })
      .state('user.mail', {
        auth: true,
        url: '/m',
        templateUrl: 'app/user/mail/index.html',
        controller: function($state) {
          $state.go('user.mail.folder', {
            folderId: 'inbox'
          });
        }
      })
      .state('user.mail.compose', {
        auth: true,
        url: '/c',
        templateUrl: 'app/user/mail/compose.html'
      })
      .state('user.mail.folder', {
        auth: true,
        url: '/f/:folderId',
        templateUrl: 'app/user/mail/folder.html'
      })
    ;

    // web workers
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

