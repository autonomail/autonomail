(function(app) {
  'use strict';

  app.provider('Message', function() {

    return {
      $get: function(Log, $q, $timeout, GPG, GPGUtils) {


        var Message = Events.extend({

          /**
           * Constructor
           *
           * @param {Mailbox} mailBox The owning mailbox.
           * @param {Object} rawMsg Message from server.
           * @param {String} rawMsg.id Unique id.
           * @param {String} rawMsg.date ISO date string.
           * @param {String} rawMsg.from Sender email address.
           * @param {Array} rawMsg.to Recipient email addresses.
           * @param {Array} rawMsg.cc CC recipient email addresses.
           * @param {Array} rawMsg.bcc BCC recipient email addresses.
           * @param {String} rawMsg.subject  Message subject.
           * @param {Stream} rawMsg.body Message body.
           * @param {String} [rawMsg.sig] PGP/MIME signature attachment.
           * @param {Object} rawMsg.flags Additional flags.
           * @param {Boolean} rawMsg.flags.read If it has been read.
           * @param {Boolean} rawMsg.flags.outbound If it's an outbound msg.
           */
          init: function(mailBox, rawMsg) {
            this._super();

            this._raw = rawMsg;
            this._processed = {};

            this._rawBody = null; // will hold the full raw body
            this._fullBodyLoaded = false;
            this._fullDecryptedBody = null; // will hold the full decrypted body

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
           * This function can be called multiple times.
           *
           * @return {Promise}
           */
          process: function() {
            var self = this;

            self._setState('processing');

            $q.when()
              .then(function basicFields() {
                if (self._processed['date']) return;

                _.each(['date', 'from', 'to', 'cc', 
                    'bcc', 'subject'], function(f) {
                    self._processed[f] = self._raw[f];
                  }
                );

                self._setState('loadedBasicInfo');
              })
              .then(function getFullBody() {
                if (self._fullBodyLoaded) return;

                self._processed.preview = '';

                var defer = $q.defer();

                self._setState('loadingBody');

                self._raw.body.on('data', function(d) {
                  d = d.toString();

                  // add to preview (upto 1KB)
                  if (!self._fullPreviewLoaded) {
                    self._processed.preview += d;

                    if (1024 <= self._processed.preview.length) {
                      self._fullPreviewLoaded = true;

                      self._setState('loadedPreview');
                    }
                  }

                  // add to raw body
                  self._rawBody += d.toString();

                  self._setState('loadingBody', self._rawBody.length);
                });

                self._raw.body.on('end', function() {
                  self._fullBodyLoaded = true;
                  
                  self._setState('loadedBody', self._rawBody.length);

                  defer.resolve();
                });

                self._raw.body.on('error', function(err) {
                  defer.reject(err);
                });

                return defer.promise;
              })
              .then(function checkIfCryptoNeeded() {
                return self._getIdentitiesWithPublicKeys()
                  .then(function(gpgIdentities) {
                    var fromEmail = 
                      _.str.extractEmailAddresses(self._processed.from).pop();

                    var haveKey = _.find(gpgIdentities, fromEmail);

                    self._canVerifyOrDecrypt = !self._raw.sig || haveKey;

                    self._needsVerification = !!self._raw.sig;

                    self._needsDecryption = 
                      GPGUtils.isEncrypted(self._processed.preview);
                  });
              })
              .then(function verify() {
                if (!self._needsVerification || !self._canVerifyOrDecrypt) return;

                self._setState('verifying');

                return GPG.verify(self._fullBody, self._raw.sig)
                  .then(function verifyResult(isGood) {
                    self._goodSignature = isGood;
                  });
              })
              .then(function decrypt() {
                if (!self._needsDecryption || !self._canVerifyOrDecrypt) return;

                self._setState('decrypting');

                return GPG.decrypt(self._fullBody)
                  .then(function decrypted(msg) {
                    self._fullDecryptedBody = msg;
                  })
                  .catch(function(err) {
                    self.log('Decryption failure', err);
                  });
              })
              .then(function finished() {
                self._setState('processed');
              })
              .catch(function(err) {
                self._setState('error', err.stack);
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
            var self = this;

            var args = arguments;

            self._state = state;

            if ('error' === state) {
              self.log.error(args);
            } else {
              self.log.info('State change: ' + state);
            }

            self.emit.apply(self, args);              
          }
        });


        
        /**
         * Raw message inputs.
         */
        Message.prop('id', { 
          get: function() {
            return this._raw.id;
          }
        });


        /**
         * Processed inputs, i.e. emails parsed, encrypted, signed, etc.
         */
        Message.prop('processed', { internal: '_processed' });

        /**
         * Get decrypted message body.
         *
         * @return {String} Returns null if not decrypted yet.
         */
        Message.prop('decryptedBody', {
          get: function() {
            return self._fullDecryptedBody;
          }
        });

        /**
         * Get raw message body.
         *
         * @return {Stream}
         */
        Message.prop('rawBody', {
          get: function() {
            return self._rawBody;
          }
        });

        /**
         * Get whether msg is an outbound one.
         */
        Message.prop('isOutbound', {
          get: function() {
            return !!this._raw.flags.outbound;
          }
        });

        /**
         * Get/set whether msg has been read.
         */
        Message.prop('hasBeenRead', {
          get: function() {
            return !!this._raw.flags.read;
          }
        });

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
