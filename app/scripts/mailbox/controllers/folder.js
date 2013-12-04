'use strict';

(function(app) {

  app.controller('FolderCtrl', function ($stateParams, $scope, Log, Mail, UserMgr) {
    var folderId = $stateParams.folderId;

    var log = Log.create('FolderCtrl(' + folderId + ')');
    $scope.folderId = folderId;

    Mail.open(UserMgr.getCurrentUser())
      .catch(function(err) { log.error(err); })
      .then(function gotMailbox(mailbox) {
        $scope.mailbox = mailbox;
      })
      .then(function setCurrentFolder() {
        $scope.mailbox.setFolder(folderId);
      })
      .then(function setupInitialView() {
        $scope.view = $scope.mailbox.createView({
          perPage: 10,
          page: 1,
          onMessages: function(messages) {
            log.debug('Got messages: ' + messages.count);
            $scope.messages = messages;
          }
        });
      })
    ;
  });

}(angular.module('App.mailbox', ['App.common', 'App.user'])));

