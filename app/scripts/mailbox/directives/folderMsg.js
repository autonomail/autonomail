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
    _.each(['processing', 'error'], function(s) {
      msg.on(s, function() {
        $scope.state = s;
      });
    });

    _.each(['verifying', 'decrypting'], function(s) {
      msg.on(s, function() {
        $scope.processingState = s;
      });
    });

    // when basic stuff loaded
    msg.on('loadedBasicInfo', function() {
      var data = msg.processed;

      $scope.date = moment(data.date).format('MMM d');
      $scope.typeOutbound = msg.isOutbound;
      $scope.to = data.to;
      $scope.from = data.from;
      $scope.subject = _.str.prune(data.subject, 30);
    });

    // when loading body
    msg.on('loadingBody', function(charsLoaded) {
      $scope.processingState = 'loadingBody';
      $scope.loadedSoFar = (charsLoaded || 0) * 2;  // each char is UTF-16
    });

    // once loaded preview
    msg.on('loadedPreview', function(charsLoaded) {
      $scope.preview = _.str.prune(msg.processed.preview, 70);
    });

    // once processed
    msg.on('processed', function(charsLoaded) {
      $scope.processingState = null;
      $scope.state = 'processed';
      $scope.msgType = msg.decryptedBody ? 'secure' : 'insecure';
    });

    msg.process(); // process the msg
  });

}(angular.module('App.mailbox', [])));

