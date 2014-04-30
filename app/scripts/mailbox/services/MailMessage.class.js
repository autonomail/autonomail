(function(app) {
  'use strict';

  app.provider('MailMessage', function() {

    return {
      $get: function(Log, $q, $timeout, AuthCredentials) {

        var MailMessage = Class.extend({
          /**
           * Constructor
           *
           * @param {MailBox} mailBox The parent mailbox.
           * @param {Object} msg raw message data from server.
           */
          init: function(mailBox, msg) {
            this.log = Log.create('Message(' + msg.id + ')');
            this.raw = msg;
            this._processed = false;
            this.observers = {};

            this.log.debug('created!', this.raw);

            this.mailBox = mailBox;
            this.owner = AuthCredentials.get(mailBox.userId);
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
           *
           * Processing involves any required crypto operations, signature 
           * verification, etc.
           *
           * Subclasses must not override this.
           */
          process: function() {
            var self = this;

            $q.when()
              .then(function processIt() {
                if (self._processed) return;

                return self._process()
              })
              .then(function notifyObservers() {
                _.invoke(self.observers, 'notify', 'processed', self);                
              })
              .catch(function(err) {
                log.error('Processing error', err);

                _.invoke(self.observers, 'notify', 
                    'processingError', self, err);
              })
            ;
          },




          /** 
           * Process the message.
           *
           * Called by `process()` to actually do the processing. Subclasses 
           * should override this instead of `process()`.
           *
           * @return {Promise}
           */
          _process: function() {
            self.processed.body = self.raw.body;
            self.processed.subject = self.raw.subject;
            self.processed.date = self.raw.date;

            self.processed.from = _.str.extractNamesAndEmailAddresses(
              self.raw.from
            ).pop();

            self.processed.to = _.str.extractNamesAndEmailAddresses(
              self.raw.to
            );

            return $q.when();
          },



          /**
           * Get plain object version of this message and its internal state.
           * 
           * @return {Object}
           */
          toPlainObject: function() {
            return {
              raw: this.raw,
              processed: this.processed
            }
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
            throw new Error('Not yet implemented');
          }
        });



        MailMessage.prop('date', {
          set: false,
          get: function() {
            return this.processed.date;
          }
        });

        MailMessage.prop('from', {
          set: false,
          get: function() {
            return this.processed.from;
          }
        });

        MailMessage.prop('to', {
          set: false,
          get: function() {
            return this.processed.to;
          }
        });

        MailMessage.prop('toStr', {
          set: false,
          get: function() {
            return _.map(this.processed.to || [], function(_to) {
              return _to.name || _to.email;
            });
          }
        });

        MailMessage.prop('subject', {
          set: false,
          get: function() {
            return this.processed.subject;
          }
        });

        MailMessage.prop('body', {
          set: false,
          get: function() {
            return this.processed.body;
          }
        });

        MailMessage.prop('processed', {
          set: false,
          get: function() {
            return !!this._processed;
          }
        });

        return MailMessage;
      }
    };

  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
