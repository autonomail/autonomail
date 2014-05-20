'use strict';

(function(app) {

  app.controller('MessageCtrl', function ($stateParams, $scope, Log, Alert) {
    var msgId = $stateParams.id;
    if (!msgId) return; //guard

    var log = Log.create('MessageCtrl(' + msgId + ')', $scope);

    $scope.error = null;

    $scope.showFullInfo = false;

    $scope.$parent.getMailbox()
      .then(function(mailbox) {

        log.debug('Retrieving message...');

        return mailbox.getMessage(msgId)
          .then(function(msg) {

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
              $scope.body = msg.decryptedBody || msg.rawBody;
              $scope.msgType = msg.decryptedBody ? 'secure' : 'insecure';
              $scope.isEncrypted = msg.isEncrypted;
              $scope.decryptedOk = !!msg.decryptedBody;
              $scope.hasSignature = msg.hasSignature;
              $scope.hasVerifiedSignature = msg.hasVerifiedSignature;
            });

            msg.on('loadedMeta', function() {
              var data = msg.processed;
              $scope.date = data.date;
              $scope.typeOutbound = msg.isOutbound;
              $scope.to = data.to;
              $scope.from = data.from;
              $scope.subject = data.subject;
            });

            msg.on('loadedPreview', function() {
              $scope.preview = msg.processed.preview;
            });

            msg.on('error', function(err) {
              log.error('Sorry, an error occurred processing this message', err);
            });

            msg.process();  // start
          });

      })
      .catch(function(err) {
        log.error('Sorry, an error occurred processing this message', err);
      })

  });

}(angular.module('App.mailbox', ['App.common', 'App.user'])));

