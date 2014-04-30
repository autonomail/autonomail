"use strict";


(function(app) {

  app.controller('ComposeFormCtrl', function ($scope, Log, OutboundMessage) {
    var log = Log.create('ComposeFormCtrl', $scope);

    var outboundMessage = new OutboundMessage();

    $scope.msg = outboundMessage.raw;
    $scope.msg.to = 'alice@foo.bar';
    $scope.msg.body = 'Hello world!';

    $scope.missingKeys = outboundMessage.missingKeys;

    $scope.showCcBcc = false;



    // watch to, cc and bcc fields
    _.each(['to', 'cc', 'bcc'], function(fieldName) {
      $scope.$watch(function() {
        return $scope.msg[fieldName]
      }, function(newValue) {
        // process()-ing checks to see if any public keys are missing
        outboundMessage.process();
      });
    });



    /**
     * Check whether the form can be submitted
     * @returns {$dirty|*|$valid}
     */
    $scope.canSubmit = function() {
      return $scope.composeForm.$valid;
    };


    /**
     * Submit the form.
     */
    $scope.submit = function() {
      $scope.error = null;
      
      var msg = $scope.msg;

      // $scope.$parent.getMailbox()
      //   .then(function(mailbox) {
      //     return mailbox.sendMessage({
      //       to: _.str.extractEmailAddresses(msg.to),
      //       cc: _.str.extractEmailAddresses(msg.cc || ''),
      //       bcc: _.str.extractEmailAddresses(msg.bcc || ''),
      //       subject: msg.subject || '',
      //       body: msg.body            
      //     });
      //   })
      //   .catch(function(err) {
      //     log.error('Sorry, there was an unexpected error. Please check the logs for details.', err);
      //   });
    };
  });

}(angular.module('App.mailbox', ['App.common', 'App.user', 'ui.bootstrap.pagination', 'ui.bootstrap.pagination', 'ui.event'])));

