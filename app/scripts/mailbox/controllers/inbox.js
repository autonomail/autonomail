'use strict';

(function(app) {

  app.controller('InboxCtrl', function ($scope, $state, Log, UserMgr, Mail) {
    var log = Log.create('inbox');

    UserMgr.ensureSecureDataHasBeenSetup()
      .catch(function(err) { log.error(err); })
      .then(function readyToOpenMailbox() {
        return Mail.open(UserMgr.getCurrentUser())
      })
      .then(function getFolders(mailbox) {
        $scope._mailbox = mailbox;
        return $scope._mailbox.folders();
      })
      .then(function showFolders(folders) {
        $scope.folders = folders;
      })
      .then(function showMessagesInCurrentfolder() {
        // TODO
      })
    ;


  });

}(angular.module('App.mailbox', ['App.server', 'ui.validate'])));

