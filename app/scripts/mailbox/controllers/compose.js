"use strict";


(function(app) {

  app.controller('ComposeFormCtrl', function ($scope, Log) {
    var log = Log.create('ComposeFormCtrl', $scope);

    $scope.msg = {
      to: 'alice@foo.bar',
      body: 'Hello world!'
    };

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

      $scope.$parent.getMailbox()
        .then(function(mailbox) {
          return mailbox.sendMessage({
            to: _.str.extractEmailAddresses(msg.to),
            cc: _.str.extractEmailAddresses(msg.cc || ''),
            bcc: _.str.extractEmailAddresses(msg.bcc || ''),
            subject: msg.subject || '',
            body: msg.body            
          });
        })
        .catch(function(err) {
          log.error('Sorry, there was an unexpected error. Please check the logs for details.', err);
        });
    };
  });

}(angular.module('App.mailbox', ['App.common', 'App.user', 'ui.bootstrap.pagination'])));

