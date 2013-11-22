'use strict';

(function(app) {

  app.controller('InboxCtrl', function ($scope, $state, Log, UserMgr, Mail) {
    var log = Log.create('inbox');

    UserMgr.ensureSecureDataHasBeenSetup()
      .catch(function(err) { log.error(err); })
      .then(function allOk() {

        // init mailbox access
        $scope._mailbox = Mail.open(UserMgr.getCurrentUser());


        // TODO: load initial messages

      });
  });

}(angular.module('App.signup', ['App.server', 'ui.validate'])));

