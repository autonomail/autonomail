"use strict";


(function(app) {

  app.controller('LoggedInCtrl', function ($scope, Mail, UserMgr) {
    var log = Log.create('LoggedInCtrl', $scope);

    var userId = UserMgr.getCurrentUser();

    Mail.open(userId)
      .then(function gotMailbox(mailbox) {

        $scope.currentMailFolder = function() {
          return mailbox.folder;
        };

      })
      .catch(function(err) {
        log.error(err);
      })
    ;

  });

}(angular.module('App.user', ['App.common', 'App.user'])));

