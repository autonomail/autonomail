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

            $timeout(function() {
              _.invoke(self.observers, 'notify', 'processed');
            }, 3000);
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
            return this.raw.date;
          }
        });

        MailMessage.prop('from', {
          set: false,
          get: function() {
            if (!this.parsed.from) {
              this.parsed.from = {};
              var po = this.raw.from.indexOf('<');
              if (0 < po) {
                this.parsed.from.name = _.str.trim(this.raw.from.substr(0, po));
                this.parsed.from.email = _.str.trim(this.raw.from.substr(po + 1), ' >');
              } else {
                this.parsed.from.name = null;
                this.parsed.from.email = _.str.trim(this.raw.from);
              }
            }
            return this.parsed.from;
          }
        });

        MailMessage.prop('subject', {
          set: false,
          get: function() {
            return this.raw.subject;
          }
        });

        MailMessage.prop('body', {
          set: false,
          get: function() {
            return this.raw.body;
          }
        });

        return MailMessage;
      }
    };

  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
