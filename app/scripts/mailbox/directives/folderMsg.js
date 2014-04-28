/**
 * Folder message item.
 */

(function(app) {

  app.directive('folderMsg', function() {
    return {
      controller: 'FolderMsgDirectiveCtrl',
      templateUrl: 'app/directives/folderMsg.html'
    };
  });


  app.controller('FolderMsgDirectiveCtrl', function($element, $attrs, $scope) {
    var self = this;

    var msg = $scope.$parent.messages[$scope.id];

    $scope.from = '...';
    $scope.subject = '...';
    $scope.preview = '...';
    $scope.date = '...';

    // wait for notifications from message
    self.notify = function(status) {
      if ('processed' === status) {
        $scope.typeOutbound = ('out' === msg.type);
        $scope.date = moment(msg.date).format('MMM d');
        $scope.from = _.str.prune(msg.from.name || msg.from.email, 30);
        $scope.subject = _.str.prune(msg.subject, 30);
        $scope.preview = _.str.prune(msg.body, 70);
      }
    };
    msg.registerObserver(self);
    msg.process(); // process the msg
  });

}(angular.module('App.mailbox', [])));

