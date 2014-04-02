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
        $scope.messages = _.indexBy(messages, 'id');
        $scope.msgIds = _.keys($scope.messages);   // this causes the display to refresh
        log.debug('Got ' + $scope.msgIds.length + ' messages for page ' + $scope.view.page);
      }
    });


  });

}(angular.module('App.mailbox', ['App.common', 'App.user', 'ui.bootstrap.pagination'])));

