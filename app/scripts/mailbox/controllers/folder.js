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
      onMessages: function(messages) {
        $scope.messages = messages;
        $scope.msgIds = _.pluck(messages, 'id');
        log.debug('Got messages: ' + $scope.msgIds.length);
      }
    });
  });

}(angular.module('App.mailbox', ['App.common', 'App.user'])));

