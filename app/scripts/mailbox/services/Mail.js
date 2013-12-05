/**
 * Class for accessing the user's mail messages.
 *
 * We present this through a factory interface so that we can track which mailboxes are being accessed, and also so that
 * we use singletons - i.e. each user id should map to just one mailbox instance. This makes it feasible for mailboxes
 * to listen for new messages and to cache data received from the server. Overall, what we are doing here is enabling
 * multiple mailboxes to be opened simultaneously.
 */

(function(app) {
  'use strict';

  app.factory('Mail', function($q, Log, Mailbox) {
    var log = Log.create('Mail');

    /** Keep track of mailbox instances. */
    var mailBoxes = {};

    return {
      /**
       * Open mailbox for given user.
       *
       * @param userId {string} user id.
       * @return {Promise} resolves to Object.
       */
      open: function(userId) {
        if (!mailBoxes[userId]) {
          log.info('Opening Mailbox: ' + userId);
          mailBoxes[userId] = new Mailbox(userId);
        }
        var defer = $q.defer();
        defer.resolve(mailBoxes[userId]);
        return defer.promise;
      },

      /**
       * Close mailbox for given user (if it was previously opened).
       * @param userId {string} user id.
       * @return {Promise}
       */
      close: function(userId) {
        var defer = $q.defer();

        if (mailBoxes[userId]) {
          log.info('Closing Mailbox: ' + userId);
          var mailbox = mailBoxes[userId];
          delete mailBoxes[userId];
          mailbox.close()
            .then(defer.resolve)
            .catch(defer.reject);
        } else {
          defer.resolve();
        }

        return defer.promise;
      }
    };

  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
