"use strict";


(function(app) {

  app.controller('ComposeFormCtrl', function ($q, $scope, $timeout, Log, GPG) {
    var log = Log.create('ComposeFormCtrl', $scope);

    $scope.msg = {
      to: 'alice@foo.bar',
      body: 'Hello world!'
    };

    $scope.showCcBcc = false;

    $scope.missingKeys = {};

    $scope.canEncrypt = function() {
      return 0 === 
        (_.get($scope.missingKeys, 'to.length', 0) + 
          _.get($scope.missingKeys, 'cc.length', 0) + 
          _.get($scope.missingKeys, 'bcc.length', 0))
    };



    /**
     * Check to see if we have public keys for given user-input addresses.
     *
     * We will notify user if we don't have a key for an address. We will 
     * also notify them if we can only sign (and not also encrypt) the email.
     *
     * We also cache results so that we don't check that same address twice.
     *
     * Because this will get called whenever the field changes (and for each 
     * field when page first loads) we use a flag - `_gpgKeyListInProgress` - 
     * to ensure GPG doesn't get hit more than once. And we also cache the GPG 
     * call result into `_gpgKeyListCache` to ensure we only ever need to call 
     * it once.
     * 
     * @param {String} fieldName The input field.
     * @param {String} fieldValue The value.
     */
    var _checkPublicKeys = function(fieldName, fieldValue) {
      $q.when()
        .then(function getAllKeys() {
          if (!_gpgKeyListCache && !_gpgKeyListInProgress) {            
            _gpgKeyListInProgress = true;

            return GPG.getAllKeys()
              .then(function parseKeys(keys) {  
                _gpgKeyListInProgress = false;
                
                _gpgKeyListCache = _.chain(keys)
                  .pluck('identities')  // [[{}]]
                  .flatten() // [{}]
                  .pluck('text') // []
                  .value();
              });
          }
        })
        .then(function check() {
          var emails = _.chain(_.str.extractNamesAndEmailAddresses(
            fieldValue || ''
          ))
            .pluck('email')
            .value()
          ;

          // clear list
          $scope.missingKeys[fieldName] = null;

          _.each(emails, function(email) {
            var checkStr = '<' + email + '>';

            var found = _.find(_gpgKeyListCache, function(txt) {
              return 0 <= txt.indexOf(checkStr);
            });

            // if not found
            if (undefined === found) {
              $scope.missingKeys[fieldName] = 
                  $scope.missingKeys[fieldName] || [];

              $scope.missingKeys[fieldName].push(email);
            }
          });
        })
        .catch(function(err) {
          log.error('An error occurred whilst checking for PGP keys. Please check the logs for details.', err);
        });
    };
    // list of keys obtained from GPG
    var _gpgKeyListCache = null;
    // flag to indicate that we've already called to GPG
    var _gpgKeyListInProgress = false;


    // watch to, cc and bcc fields
    _.each(['to', 'cc', 'bcc'], function(fieldName) {
      $scope.$watch(function() {
        return $scope.msg[fieldName]
      }, function(newValue) {
        _checkPublicKeys(fieldName, newValue);
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

}(angular.module('App.mailbox', ['App.common', 'App.user', 'ui.bootstrap.pagination', 'ui.bootstrap.pagination', 'ui.event'])));

