'use strict';

(function(app) {

  app.controller('MailboxCtrl', function ($scope, $state, Log, UserMgr, Mail) {
    var log = Log.create('MailboxCtrl');

    Mail.open(UserMgr.getCurrentUser())
      .catch(function(err) { log.error(err); })
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
          // shift inner state
          $state.go('mail.folder', {
            folderId: folderId
          });
          return false;
        };


        // TODO: watch for changes to current folder

      })
    ;

  });

}(angular.module('App.mailbox', ['App.server', 'ui.validate'])));

