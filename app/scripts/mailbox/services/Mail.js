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

  /**
   * Clients should not create this directly, but should instead use the 'Mail' service.
   */
  app.factory('_Mailbox', function(Log, Server) {

    return Class.extend({

      /**
       * Constructor.
       * @param userId {string} the user whose mailbox we wish to access.
       */
      init: function(userId) {
        var self = this;

        self.userId = userId;
        self.log = Log.create('Mail(' + userId + ')');
      },

      /**
       * Get messages.
       *
       * @param from {string} retrieve messages older than this timestamp.
       * @param [count] {Integer} no. of messages to retrieve. Default is 10.
       *
       * @return {Promise} resolves to Array of messages.
       */
      get: function(from, count) {
        count = count || 10;
        return Server.getMsg(this.userId, 'inbox', from, count);
      },


      /**
       * Get total no. of messages in mailbox.
       *
       * @return {Promise} resolves to integer.
       */
      count: function() {
        return Server.getMsgCount(this.userId, 'inbox');
      },


      /**
       * Close this mailbox.
       *
       * This will internally de-register all event handlers, etc.
       *
       * @return {Promise}
       */
      close: function() {
        var defer = $q.defer();
        defer.resolve();
        return defer.promise;
      }

    });

  });



  app.factory('Mail', function($q, Log, _Mailbox) {
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
          mailBoxes[userId] = new _Mailbox(userId);
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


}(angular.module('App.user', ['App.common', 'App.data'])));
