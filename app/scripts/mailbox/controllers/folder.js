'use strict';

(function(app) {

  app.controller('FolderCtrl', function ($stateParams, $scope, Log, Mail, UserMgr) {
    var folderId = $stateParams.folderId;

    var log = Log.create('FolderCtrl(' + folderId + ')');
    $scope.folderId = folderId;

    // TODO: store the current folder in the Mailbox service instance - MailboxCtrl should watch this for changes and highlight the appropriate link accordingly.

    Mail.open(UserMgr.getCurrentUser())
      .catch(function(err) { log.error(err); })
      .then(function getMessagesInFolder(mailbox) {
        $scope._mailbox = mailbox;
      })
    ;
  });

}(angular.module('App.mailbox', ['App.common', 'App.user'])));

