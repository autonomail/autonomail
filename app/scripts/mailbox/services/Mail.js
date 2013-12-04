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
   * Represents a view of a mailbox.
   *
   * This acts as an intermediary to the mailbox's message fetching APIs to make message fetching easy. It also allows
   * us to expose a pub-sub pattern API to the client to make it feel like messages show as soon as they arrive.
   *
   * This uses a timer to keep its view updated every so often.
   */
  app.provider('MailView', function() {
    var fetchIntervalMs = 60000; // 60 seconds

    return {
      /**
       * Set the delay between subsequent message fetches.
       * @param intervalMs {Integer} delay in milliseconds.
       */
      setInterval: function(intervalMs) {
        fetchIntervalMs = intervalMs;
      },

      $get: function(RuntimeError, Log, $timeout) {
        return Class.extend({
          /**
           * Constructor.
           * @param mailbox {_Mailbox} the mailbox to create this view on.
           * @param options {Object} view configuration options.
           * @param options.perPage {Number} no. of messages to show per page.
           * @param options.page {Number} the page to show.
           * @param options.onMessages {Function} handler to call when the messages in view change, signature: (Array messages)
           */
          init: function(mailbox, options) {
            var self = this;

            self.perPage = options.perPage;
            self.page = options.page;
            self.onMessages = options.onMessages;
            self.mailbox = mailbox;

            self.log = Log.create('Mailview(' + self.folderId + ')');

            self.timerActive = true;
            self._check();
          },


          /**
           * Check for new messages.
           * @private
           */
          _check: function() {
            var self = this;

            if (!self.timerActive) return;

            self.mailbox.getMessages((self.page - 1) * self.perPage, self.perPage)
              .catch(function (err) {
                self.log.error(new RuntimeError('Error checking for new messages', err));
              })
              .then(function publishMessages(messages) {
                self.onMessages.call(null, messages);
              })
              .then(function setTimer() {
                $timeout(function() {
                  self._check.call(self);
                }, 60000);
              })
            ;
          },

          /**
           * Destroy this mail view.
           */
          destroy: function() {
            this.timerActive = false;
          }
        });
      }
    };
  });




  /**
   * Clients should not create this directly, but should instead use the 'Mail' service.
   */
  app.factory('Mailbox', function(Log, Server, MailView) {

    return Class.extend({

      /**
       * Constructor.
       * @param userId {string} the user whose mailbox we wish to access.
       */
      init: function(userId) {
        var self = this;

        self.userId = userId;
        self.log = Log.create('Mail(' + userId + ')');

        self.currentFolder = 'inbox'; // initial folder is always inbox
      },



      /**
       * Get folders.
       *
       * @return {Promise} resolves to Array of folders.
       */
      getFolders: function() {
        return Server.getFolders(this.userId);
      },



      /**
       * Set currently active folder.
       *
       * @param folderId {string} folder id.
       */
      setFolder: function(folderId) {
        this.currentFolder = folderId;
      },




      /**
       * Get messages in current folder.
       *
       * @param from {string} retrieve messages older than this timestamp.
       * @param [count] {Integer} no. of messages to retrieve. Default is 10.
       *
       * @return {Promise} resolves to Array of messages.
       */
      getMessages: function(from, count) {
        count = count || 10;
        return Server.getMsg(this.userId, this.currentFolder, from, count);
      },


      /**
       * Get total no. of messages in current folder.
       *
       * @return {Promise} resolves to integer.
       */
      getCount: function() {
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
      },


      /**
       * Create a view of the contents of this mailbox.
       *
       * Only *one* view is active at any given time, meaning that any previously created view is automatically stopped.
       *
       * @param options {Object} configuration options.
       * @param options.perPage {Number} no. of messages to show per page.
       * @param options.page {Number} the page to show.
       * @param options.onMessages {Function} handler to call when the messages in view change, signature: (Array messages)
       *
       * @return {MailView}
       */
      createView: function(options) {
        var self = this;

        // destroy existing view
        if (self._mailView) {
          self._mailView.destroy();
        }

        return (self._mailView = new MailView(this, options));
      }
    });

  });



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
