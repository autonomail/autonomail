(function(app) {
  'use strict';

  app.provider('Message', function() {

    return {
      $get: function(Log, $q, $timeout, GPG, GPGUtils) {

        var Message = Events.extend({

          /**
           * Constructor
           */
          init: function(mailBox, rawMsg) {
            this._super();

            this._raw = rawMsg;
            this._processed = {};

            this.log = Log.create('Message[' + this.id + ']');
            this.log.debug('created');

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

            self._setState('processing');

            self._processed = {
              id: self._raw.id,
              from: self._raw.from,
              to: self._raw.to,
              cc: self._raw.cc,
              bcc: self._raw.bcc,
              body: '',
            };

            return self._getIdentitiesWithPublicKeys()
              .then(function checkIfCryptoPossible(gpgIdentities) {
                var fromEmail = 
                  _.str.extractEmailAddresses(self._processed.from).pop();

                var haveKey = _.find(gpgIdentities, fromEmail);

                self._canVerifyOrDecrypt = !self._raw.sig || haveKey;

                self._needsVerification = !!self._raw.sig;

                self._needsDecryption = GPGUtils_.str.startsWith(
                  self._raw.body, '----- BEGIN PGP MESSAGE -----');
              })
              .then(function verify() {
                if (!self._needsVerification || !self._canVerifyOrDecrypt) return;

                self._setState('verifySig');

                return GPG.verify(self._raw.body, self._raw.sig)
                  .then(function verifyResult(isGood) {
                    self._goodSignature = isGood;
                  });
              })
              .then(function decrypt() {
                if (!self._needsDecryption || !self._canVerifyOrDecrypt) return;

                self._setState('decrypting');

                return GPG.decrypt(self._raw.body)
                  .then(function decrypted(msg) {
                    self._goodDecryption = true;
                    self._processed.body = msg;
                  })
                  .catch(function(err) {
                    self.log('Decryption failure', err);
                    self._goodDecryption = false;
                  });
              })
              .then(function finished() {
                self._setState('processed');
              })
              .catch(function(err) {
                self._setState('error', err);
              });
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
        Message.prop('id', { internal: '_id' });

        /**
         * Raw message inputs.
         */
        Message.prop('raw', { internal: '_raw' });

        /**
         * Processed inputs, i.e. emails parsed, encrypted, signed, etc.
         */
        Message.prop('processed', { internal: '_processed' });

        /**
         * Get whether message can be PGP verified/decrypted.
         */
        Message.prop('canDecryptVerify', { internal: '_canVerify' }); 

        /**
         * Current message state.
         */
        Message.prop('state', { internal: '_state' });


        return Message;

      }
    };

  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
