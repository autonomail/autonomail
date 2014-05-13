"use strict";


(function(app) {

  app.controller('ComposeFormCtrl', function ($state, $scope, Log, Alert, OutboundMessage) {
    var log = Log.create('ComposeFormCtrl', $scope);

    var outboundMessage = new OutboundMessage();

    $scope.msg = outboundMessage.raw;

    $scope.missingKeys = outboundMessage.missingKeys;

    $scope.showCcBcc = false;


    // watch to, cc and bcc fields
    _.each(['to', 'cc', 'bcc'], function(fieldName) {
      $scope.$watch(function() {
        return $scope.msg[fieldName];
      }, function(newValue) {
        outboundMessage.processUserInputs();
      });
    });



    /**
     * Check whether the message can be encrypted.
     */
    $scope.canEncrypt = function() {
      return outboundMessage.canEncrypt;
    };



    /**
     * Check whether the form can be submitted
     * @returns {$dirty|*|$valid}
     */
    $scope.canSubmit = function() {
      return $scope.composeForm.$valid && outboundMessage.canSend;
    };


    /**
     * Submit the form.
     */
    $scope.submit = function() {
      $scope.error = null;
      
      var msg = $scope.msg;

      $scope.$parent.getMailbox()
        .then(function gotMailbox(mailbox) {
          outboundMessage.send(mailbox);
        })
        .catch(function(err) {
          log.error('Error sending message. Please see logs for details.', err);
        });
    };



    outboundMessage.on('stateChange', function(state, err) {
      // failed?
      if ('error' === state) {
        log.error('Error sending message. Please see logs for details.', err);
      } 
      // done?
      else if ('sent' === state) {
        Alert.info('Sending message...');

        $state.go('user.mail');                  
      }
    });

  });

}(angular.module('App.mailbox', ['App.common', 'App.user', 'ui.validate', 'ui.bootstrap.pagination', 'ui.bootstrap.pagination', 'ui.event'])));

