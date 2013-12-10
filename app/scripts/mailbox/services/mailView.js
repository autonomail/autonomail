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

            self.log = Log.create('Mailview(' + self.mailbox.folder + ')');

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

            self.log.debug('Checking for new messages');

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


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
