'use strict';

(function(app) {

  app.controller('MailboxCtrl', function ($scope, $state, Log, UserMgr, Mail) {
    var log = Log.create('MailboxCtrl');

    UserMgr.ensureSecureDataHasBeenSetup()
      .catch(function(err) { log.error(err); })
      .then(function readyToOpenMailbox() {
        return Mail.open(UserMgr.getCurrentUser());
      })
      .then(function getFolders(mailbox) {
        $scope.mailbox = mailbox;
        return $scope.mailbox.getFolders();
      })
      .then(function showFolders(folders) {
        $scope.folders = folders;
      })
      .then(function setupFolderAction() {

        // when user wants to open a folder
        $scope.openFolder = function(folderId) {
          // set it as current folder in the mailbox
          $scope.mailbox.setFolder(folderId);
          // shift inner state
          $state.go('mail.folder', {
            folderId: folderId
          });
        };

      })
    ;

  });

}(angular.module('App.mailbox', ['App.server', 'ui.validate'])));

