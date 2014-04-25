"use strict";


(function(app) {

  app.controller('ComposeFormCtrl', function ($scope, Log) {
    var log = Log.create('ComposeFormCtrl');

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
      var msg = $scope.msg;

      $scope.mailbox.sendMessage({
        to: _.str.extractEmailAddresses(msg.to),
        cc: _.str.extractEmailAddresses(msg.cc || ''),
        bcc: _.str.extractEmailAddresses(msg.bcc || ''),
        subject: msg.subject || '',
        body: msg.body
      })
        .catch(function(err) {
          $scope.error = err.toString();
        });
    };
  });

}(angular.module('App.mailbox', ['App.common', 'App.user', 'ui.bootstrap.pagination'])));

