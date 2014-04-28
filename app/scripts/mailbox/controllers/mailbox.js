'use strict';

(function(app) {

  app.controller('MailboxCtrl', function ($scope, $q, $state, Log, UserMgr, Mail) {
    var log = Log.create('MailboxCtrl');

    /** 
     * Mailbox
     * @type {Object}
     * @private
     */
    var _mailbox = null;

    /**
     * Get mailbox for current user.
     *
     * 
     * @return {Promise}
     */
    $scope.getMailbox = function() {
      if (_mailbox) {
        return $q.when(_mailbox);
      } else {
        return Mail.open(UserMgr.getCurrentUser())
          .then(function(mailbox) {
            _mailbox = mailbox;

            return _mailbox;
          })
      }
    };


    // initialise
    $scope.getMailbox()
      .then(function getFolders(mailbox) {
        return mailbox.getFolders();
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

