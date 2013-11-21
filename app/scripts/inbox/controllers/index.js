'use strict';

(function(app) {

  app.controller('InboxCtrl', function ($scope, $state, Log, UserMgr) {
    var log = Log.create('inbox');

    UserMgr.ensureSecureDataHasBeenSetup()
      .catch(function(err) { log.error(err); })
      .then(function allOk() {

        log.info('in inbox!');

      });
  });

}(angular.module('App.signup', ['App.server', 'ui.validate'])));

