(function(app) {
  'use strict';

  app.provider('MailMessage', function() {

    return {
      $get: function(Log, $timeout) {

        var MailMessage = Class.extend({
          /**
           * Constructor
           *
           * @param msg {Object} raw message data from server.
           */
          init: function(msg) {
            this.log = Log.create('Message(' + msg.id + ')');
            this.raw = msg;
            this.parsed = {};
            this.observers = {};
            this.log.debug('created!', this.raw);

            this.process();
          },

          /**
           * Register for event notifications.
           * @param obj {object} the object to be notified.
           */
          registerObserver: function(obj) {
            this.observers[obj] = obj;
          },


          /**
           * Process this message, notifying observers once done.
           */
          process: function() {
            var self = this;

            if (!self._processed) {
              self.parsed.body = self.raw.body;
              self.parsed.subject = self.raw.subject;
              self.parsed.date = self.raw.date;

              self.parsed.from = {};
              var po = self.raw.from.indexOf('<');
              if (0 < po) {
                self.parsed.from.name = _.str.trim(self.raw.from.substr(0, po));
                self.parsed.from.email = _.str.trim(self.raw.from.substr(po + 1), ' >');
              } else {
                self.parsed.from.name = null;
                self.parsed.from.email = _.str.trim(self.raw.from);
              }

              self._processed = true;
            }

            $timeout(function() {
              _.invoke(self.observers, 'notify', 'processed');
            });
          }
        });

        MailMessage.prop('id', {
          set: false,
          get: function() {
            return this.raw.id;
          }
        });


        MailMessage.prop('date', {
          set: false,
          get: function() {
            return this.parsed.date || this.raw.date;
          }
        });

        MailMessage.prop('from', {
          set: false,
          get: function() {
            return this.parsed.from || this.raw.from;
          }
        });

        MailMessage.prop('subject', {
          set: false,
          get: function() {
            return this.parsed.subject || this.raw.subject;
          }
        });

        MailMessage.prop('body', {
          set: false,
          get: function() {
            return this.parsed.body || this.raw.body;
          }
        });

        return MailMessage;
      }
    };

  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
