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
            log.debug('Got messages: ' + messages.length);

            $scope.messages = _.map(messages, function(message) {
              return {
                date: moment(message.date).format('MMM d'),
                from: _.str.prune(message.from.name || message.from.email, 30),
                subject: _.str.prune(message.subject, 30),
                preview: _.str.prune(message.body, 70)
              };
            });
          }
        });
      })
    ;
  });

}(angular.module('App.mailbox', ['App.common', 'App.user'])));

