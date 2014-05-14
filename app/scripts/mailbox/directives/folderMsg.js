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

    // watch for state changes
    msg.on('processing', function(state, arg) {
      switch (state) {
        case 'processing':
        case 'verifying':
        case 'decrypting':
          $scope.state = 'processing';
          break;
        case 'loadingBody':
          $scope.state = 'downloading';
          $scope.charsLoaded = arg / 2;  // each char is UTF-16
          break;
        case 'loadedBody':
          $scope.state = 'processed';
          break;
        case 'loadedMeta':
          var data = msg.processed;
          $scope.date = moment(data.date).format('MMM d');
          $scope.typeOutbound = msg.isOutbound;
          $scope.to = data.to;
          $scope.from = data.from;
          $scope.subject = _.str.prune(data.subject, 30);
          break;
        case 'loadedPreview':
          $scope.preview = _.str.prune(msg.processed.preview, 70);
          break;
        case 'doneCrypto':
          $scope.state = 'processed';
          $scope.msgType = msg.decryptedBody ? 'secure' : 'insecure';
          break;
        case 'error':
          $scope.state = 'error';
          $scope.errorMsg = arg.toString();
          break;
      }
    });

    msg.process(); // process the msg
  });

}(angular.module('App.mailbox', [])));

