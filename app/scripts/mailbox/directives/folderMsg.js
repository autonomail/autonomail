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

    $scope.id = msg.id;

    msg.on('verifying', 'decrypting', function() {
      $scope.state = 'processing';
    });

    msg.on('loadingBody', function(chars) {
      $scope.state = 'downloading';
      $scope.charsLoaded = chars / 2;  // each char is UTF-16
    });

    msg.on('loadedBody', 'doneCrypto', function() {
      $scope.state = 'processed';
      $scope.msgType = msg.decryptedBody ? 'secure' : 'insecure';
    });

    msg.on('loadedMeta', function() {
      var data = msg.processed;
      $scope.date = moment(data.date).format('MMM d');
      $scope.typeOutbound = msg.isOutbound;
      $scope.to = data.to;
      $scope.from = data.from;
      $scope.subject = _.str.prune(data.subject, 30);
    });

    msg.on('loadedPreview', function() {
      $scope.preview = _.str.prune(msg.processed.preview, 70);
    });

    msg.on('error', function(err) {
      $scope.state = 'error';
      $scope.errorMsg = err.toString();
    });

    msg.process();  // start

  });

}(angular.module('App.mailbox', [])));

