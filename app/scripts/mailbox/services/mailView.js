(function(app) {
  'use strict';

  /**
   * Represents a view of a mailbox.
   *
   * This acts as an intermediary to the mailbox's message fetching APIs to make message fetching easy. It also allows
   * us to expose a pub-sub pattern API to the client to make it feel like messages show as soon as they arrive.
   *
   * At the moment this polls the mailbox using a timer. In future we may switch to real-time pub-sub.
   *
   * Note how we don'use $scope.$watch() to keep track of when the configuration parameters (page, perPage, etc.) change.
   * Instead we use Object property setters - this is much more efficient than polling.
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

        var MailView = Class.extend({
          /**
           * Constructor.
           * @param mailbox {Mailbox} the mailbox to create this view on.
           * @param options {Object} view configuration options.
           * @param options.perPage {Number} no. of messages to show per page.
           * @param options.page {Number} the page to show.
           * @param options.onMessages {Function} handler to call when the messages in view change, signature: (Array)
           * @param options.onCount {Function} handler to call when the total messages in the folder changes, signature: (Number)
           */
          init: function(mailbox, options) {
            var self = this;

            // our properties (see property declarations below)
            self._perPage = options.perPage;
            self._page = options.page;

            self.onMessages = options.onMessages;
            self.onCount = options.onCount;
            self.mailbox = mailbox;

            self.log = Log.create('Mailview(' + self.mailbox.folder + ')');

            self.timerPromise = null;
            self.timerIsActive = true;
            self.refresh();
          },


          /**
           * Refresh messages.
           * @private
           */
          refresh: function() {
            var self = this;

            // we might have called this method manually - let's cancel any pending timer in that case
            if (self.timerPromise) {
              $timeout.cancel(self.timerPromise);
            }

            if (!self.timerIsActive) return;

            var startIndex = (self.page - 1) * self._perPage;
            var count = self._perPage;
            self.log.debug('Loading upto ' + count + ' messages from index ' + startIndex);

            self.mailbox.getMessages(startIndex, count)
              .catch(function (err) {
                self.log.error(new RuntimeError('Error loading messages', err));
              })
              .then(self.onMessages)
              .then(function getCount() {
                return self.mailbox.getCount();
              })
              .then(self.onCount)
              .then(function setTimer() {
                // are we still wanting to do this?
                if (self.timerIsActive) {
                  self.timerPromise = $timeout(function() {
                    self.refresh.call(self);
                  }, fetchIntervalMs, false /* don't do a digest() */);
                }
              })
            ;
          },

          /**
           * Destroy this mail view.
           */
          destroy: function() {
            this.timerIsActive = false;
            if (this.timerPromise) {
              $timeout.cancel(this.timerPromise);
            }
          }
        });

        /**
         * No. of messages to show per page
         */
        MailView.prop('perPage', {
          internal: '_perPage',
          set: function(val) {
            this._perPage = val;
            this.refresh(); // trigger check
          }
        });

        /**
         * Current page
         */
        MailView.prop('page', {
          internal: '_page',
          set: function(val) {
            this._page = val;
            this.refresh(); // trigger check
          }
        });

        return MailView;
      }
    };
  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
