(function(app) {
  'use strict';


  app.factory('OutboundMessage', function($q, $timeout, GPG, Log, 
    AuthCredentials, RuntimeError) {

    var OutboundMessage = Events.extend({
      /**
       * Constructor
       */
      init: function() {
        this._super();

        this._id = _.str.id();

        this.log = Log.create('OutboundMessage[' + this._id + ']');
        this.log.debug('created');
        
        this._raw = {
          to: '',
          cc: '',
          bcc: '',
          subject: '',
          body: ''
        };

        this._missingKeys = {
          to: [],
          cc: [],
          bcc: []
        };

        this._processed = {};

        this._setState('ready');
      },




      /**
       * Get list of GPG identities for which we have public keys.
       *
       * In case it gets called multiple times in quick succession let's use a 
       * timer to ensure GPG only actually gets called once.
       * 
       * @return {Promise}
       * @private
       */
      _getIdentitiesWithPublicKeys: function() {
        var self = this;

        var defer = $q.defer();

        if (self._gpgIdentitiesTimer) {
          $timeout.cancel(self._gpgIdentitiesTimer);
        }

        self._gpgIdentitiesTimer = $timeout(function() {

          return GPG.getAllKeys()
            .then(function extractIdentities(keys) {
              return _.chain(keys)
                .pluck('identities')  // [[{}]]
                .flatten() // [{}]
                .pluck('text') // []
                .value();
            })
            .then(defer.resolve)
            .catch(defer.reject)
          ;

        }, 100, false);


        return defer.promise;
      },



      /**
       * Process the raw inputs.
       *
       * For the to, cc and bcc fields this check to see if any public keys 
       * are missing (the `missingKey` field will get set accordingly).
       * 
       * @return {Promise}
       */
      process: function() {
        var self = this;

        self._processed = {
          body: self._raw.body,       // will eventually hold ciphertext
          bodyPlain: self._raw.body   // plaintext body
        };

        return self._getIdentitiesWithPublicKeys()
          .then(function checkPublicKeys(gpgIdentities) {
            // for each list of addresses
            _.each(['to', 'cc', 'bcc'], function(field){
              self._missingKeys[field] = [];

              self._processed[field] = 
                _.str.extractNamesAndEmailAddresses(self._raw[field] || '');

              // check to see if we have a public key for each address
              _.each(self._processed[field], function(recipient) {
                var checkStr = '<' + recipient.email + '>';

                var found = _.find(gpgIdentities, function(identity) {
                  return 0 <= identity.indexOf(checkStr);
                });

                recipient.havePublicKey = (undefined !== found);

                if (!recipient.havePublicKey) {
                  self._missingKeys[field].push(recipient.email);
                }
              });
            });
          })
          .catch(function(err) {
            self._setState('error', err);
          });
      },



      /**
       * Send this message.
       *
       * @param {Mailbox} mailbox The mailbox which owns this message.
       */
      send: function(mailbox) {
        var self = this;

        mailbox.enqueueOutbound(this);
      },




      /**
       * Send this message - should be called by the Mailbox only.
       *
       * Each step in the process results in a `state` update and a 
       * notification being sent to all registered observers.
       *
       * @param {Mailbox} mailbox The mailbox which owns this message.
       * 
       * @package
       */
      _send: function(mailbox) {
        var self = this;

        if (!self.canSend) {
          self.log.error('Cannot be sent in current state: ' + self._state);
          return;
        }

        self.process()
          .then(function signOrEncrypt() {
            var userMeta = AuthCredentials.get(mailbox.userId);

            if (!self.canEncrypt) {
              self._setState('signing');

              return GPG.sign(userMeta.email, userMeta.passphrase, 
                self.processed.body)
                  .then(function gotSig(sig) {
                    self._processed.sig = sig;
                  });

            } else {
              self._setState('encrypting');

              var recipients = 
                self.processed.to.concat(self.processed.cc, self.processed.bcc);

              // get unique recipient email addresses
              recipients = _.uniq( _.pluck(recipients, 'email') );

              var args = [userMeta.email, userMeta.passphrase, 
                  self.processed.body].concat(recipients);

              return GPG.encrypt.apply(GPG, args)
                .then(function gotCiphertext(cipherText) {
                  self._processed.body = cipherText;
                });
            }

          })
          .then(function sendIt() {
            self._setState('sending');

            var finalMsg = _.pick(
              self._processed, 'to', 'cc', 'bcc', 'subject', 'body', 'sig'
            );

            ['to', 'cc', 'bcc'].forEach(function(f) {
              finalMsg[f] = _.pluck(finalMsg[f], 'email');
            });

            return mailbox._sendMessage(finalMsg);
          })
          .then(function allDone() {
            self._setState('sent');
          })
          .catch(function(err) {
            self.log.error(err);
            self._setState('error', err);
          })
        ;
      },



      /**
       * Set message state and notify observers.
       *
       * Observers of the `stateChange` event will be notified.
       *
       * Additional arguments will get passed to state change observers.
       * 
       * @param {String} state The new state to set.
       * @private
       */
      _setState: function(state) {
        this.log.info('State change: ' + state);

        this._state = state;

        var args = ['stateChange', state].concat(_.rest(arguments, 1));
        this.emit.apply(this, args);
      }
    });


    
    /**
     * Raw message inputs.
     */
    OutboundMessage.prop('id', { internal: '_id' });

    /**
     * Raw message inputs.
     */
    OutboundMessage.prop('raw', { internal: '_raw' });

    /**
     * Recipients for whom we're missing public keys.
     */
    OutboundMessage.prop('missingKeys', { internal: '_missingKeys' });

    /**
     * Processed inputs, i.e. emails parsed, encrypted, signed, etc.
     */
    OutboundMessage.prop('processed', { internal: '_processed' });

    /**
     * Get whether message can be encrypted.
     */
    OutboundMessage.prop('canEncrypt', { 
      get: function() {
        return (0 < _.get(this._processed, 'to.length'))
          && (0 === (this._missingKeys.to.length +
            this._missingKeys.cc.length + 
            this._missingKeys.bcc.length));
      }
    });


    /**
     * Get whether message can be sent.
     */
    OutboundMessage.prop('canSend', { 
      get: function() {
        return (0 < _.get(this._processed, 'to.length'))
          && ('ready' === this._state || 'error' === this._state);
      }
    });



    /**
     * Current message state.
     */
    OutboundMessage.prop('state', { internal: '_state' });


    return OutboundMessage;

  });

}(angular.module('App.mailbox', ['App.common', 'App.data'])));
