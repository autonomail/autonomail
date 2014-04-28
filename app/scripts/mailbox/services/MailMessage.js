(function(app) {
  'use strict';

  app.provider('MailMessage', function() {

    return {
      $get: function(Log, $timeout, AuthCredentials) {

        var MailMessage = Class.extend({
          /**
           * Constructor
           *
           * @param {String} userId User this message belongs to.
           * @param {Object} msg raw message data from server.
           */
          init: function(userId, msg) {
            this.log = Log.create('Message(' + msg.id + ')');
            this.raw = msg;
            this.parsed = {};
            this.observers = {};
            this.log.debug('created!', this.raw);

            this.owner = AuthCredentials.get(userId);

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

              self.parsed.from = _.str.extractNamesAndEmailAddresses(
                self.raw.from
              ).pop();

              self.parsed.to = _.str.extractNamesAndEmailAddresses(
                self.raw.to
              );

              // type
              if (this.owner.email === this.parsed.from.email) {
                this.parsed.type = 'out';
              } else {
                this.parsed.type = 'in';
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


        MailMessage.prop('type', {
          set: false,
          get: function() {
            return this.parsed.type;
          }
        });



        MailMessage.prop('date', {
          set: false,
          get: function() {
            return this.parsed.date;
          }
        });

        MailMessage.prop('from', {
          set: false,
          get: function() {
            return this.parsed.from;
          }
        });

        MailMessage.prop('to', {
          set: false,
          get: function() {
            return this.parsed.to;
          }
        });

        MailMessage.prop('subject', {
          set: false,
          get: function() {
            return this.parsed.subject;
          }
        });

        MailMessage.prop('body', {
          set: false,
          get: function() {
            return this.parsed.body;
          }
        });

        return MailMessage;
      }
    };

  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
