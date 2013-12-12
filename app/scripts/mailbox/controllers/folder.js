'use strict';

(function(app) {

  app.controller('FolderCtrl', function ($stateParams, $scope, Log) {
    var folderId = $stateParams.folderId;

    var log = Log.create('FolderCtrl(' + folderId + ')');
    $scope.folderId = folderId;

    $scope.mailbox = $scope.$parent.mailbox;

    $scope.mailbox.folder = folderId;

    $scope.view = $scope.mailbox.createView({
      perPage: 10,
      page: 1,
      onCount: function(count) {
        $scope.totalItems = count;
      },
      onMessages: function(messages) {
        $scope.messages = messages;
        $scope.msgIds = _.pluck(messages, 'id');
        log.debug('Got ' + $scope.msgIds.length + ' messages for page ' + $scope.view.page);
      }
    });

  });

}(angular.module('App.mailbox', ['App.common', 'App.user', 'ui.bootstrap.pagination'])));

