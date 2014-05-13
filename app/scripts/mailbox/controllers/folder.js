'use strict';

(function(app) {

  app.controller('FolderCtrl', function ($stateParams, $scope, Log, Alert) {
    var folderId = $stateParams.id;

    var log = Log.create('FolderCtrl(' + folderId + ')', $scope);

    $scope.error = null;

    $scope.$parent.getMailbox()
      .then(function(mailbox) {
        $scope.mailbox = mailbox;

        $scope.folderId = folderId;
        $scope.mailbox.folder = folderId;

        $scope.view = $scope.mailbox.createView({
          perPage: 10,
          page: 1,
          onCount: function(count) {
            $scope.totalItems = count;
          },
          onMessages: function(messages) {
            $scope.messages = _.indexBy(messages, 'id');
            $scope.msgIds = _.keys($scope.messages);   // this causes the display to refresh
            log.debug('Got ' + $scope.msgIds.length + ' messages for page ' + $scope.view.page);
          }
        });
      })
      .catch(function(err) {
        log.error('Sorry, there was an unexpected error. Please check the logs for details', err);
      })

  });

}(angular.module('App.mailbox', ['App.common', 'App.user', 'ui.bootstrap.pagination'])));

