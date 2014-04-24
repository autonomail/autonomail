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

    Random.startEntropyCollection();

    // this will get flipped whenever user successfully logs in
    $rootScope.loggedIn = function() {
      return !!(UserMgr.getCurrentUser());
    };

    $rootScope.$on('$stateChangeStart', function(event, toState){
      // authentication for states which need it
      if (toState.auth) {
        UserMgr.ensureUserHasSecureDataSetup()
          .catch(function(err) {
            event.preventDefault();
            log.warn(err);

            UserMgr.postLoginState = toState.name;

            $state.go('login');
          });
      }
    });

  });

}(angular));

