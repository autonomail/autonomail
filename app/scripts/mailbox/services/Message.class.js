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
            this._decryptedBody = null; // will hold the full decrypted body

            this.log = Log.create('Message[' + this.id + ']');
            this.log.debug('created');
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
           * Download full message body.
           *
           * The 'preview' variable will be set if not already done so.
           *
           * Note that calling this function more than once has no effect.
           *
           * This will emit a 'bodyReady' event once done.
           */
          _downloadRawBody: function() {
            var self = this;

            // this function only needs to be called once
            if (self._downloadRawBodyState) return;
            
            self._processed.preview = '';
            self._rawBody = '';

            self._downloadRawBodyState = 'processing';
            self._downloadPreviewState = 'processing';

            self._raw.body.on('data', function(d) {
              d = d.toString();

              if ('done' !== self._downloadPreviewState) {
                // add to preview (upto 1KB)
                self._processed.preview += d;

                if (1024 <= self._processed.preview.length) {
                  self._downloadPreviewState = 'done';

                  self._emitUpdate('loadedPreview');
                  self.emit('__loadedPreview');
                }
              }

              // add to raw body
              self._rawBody += d;

              self._emitUpdate('loadingBody', self._rawBody.length);
            });

            self._raw.body.on('end', function() {
              self._downloadRawBodyState = 'done';

              self._emitUpdate('loadedBody', self._rawBody.length);
              self.emit('__loadedBody');
            });

            self._raw.body.on('error', function(err) {
              self._emitUpdate('error', err);
            });
          },




          /**
           * Do any necessary crypto processing for this message.
           *
           * Note that calling this function more than once has no effect.
           */
          _doCrypto: function() {
            var self = this;

            // this function only needs to be called once
            if (self._doCryptoState) return;

            self._doCryptoState = 'processing';

            // once preview loaded (this should happen before body is loaded)
            self.on('__loadedPreview', function() {
              self._getIdentitiesWithPublicKeys()
                .then(function(gpgIdentities) {
                  var fromEmail = 
                    _.str.extractEmailAddresses(self._processed.from).pop();

                  var haveKey = _.find(gpgIdentities, fromEmail);

                  self._canVerifyOrDecrypt = !self._raw.sig || haveKey;

                  self._needsVerification = !!self._raw.sig;

                  self._needsDecryption = 
                    GPGUtils.isEncrypted(self._processed.preview);

                  // if we can't do crypto or if no crypto needed then we're done
                  if (!self._canVerifyOrDecrypt || 
                    (!self._needsVerification && !self._needsDecryption) )
                  {
                    self._doCryptoState = 'done';

                    self._emitUpdate('doneCrypto');
                  }

                })
                .catch(function(err) {
                  self._emitUpdate('error', err);
                });
            });

            // once body is fully loaded
            self.on('__loadedBody', function() {
              if ('done' === self._doCryptoState) return;

              $q.when()
                .then(function verifyOrDecrypt() {
                  // verification
                  if (self._needsVerification) {
                    self._emitUpdate('verifying');

                    return GPG.verify(self._rawBody, self._raw.sig)
                      .then(function verifyResult(isGood) {
                        self._goodSignature = isGood;
                      })
                      .catch(function(err) {
                        self.log('Verification failure', err);
                        throw err;
                      })
                  } 
                  // decryption
                  else if (self._needsDecryption) {
                    self._emitUpdate('decrypting');

                    return GPG.decrypt(self._rawBody)
                      .then(function decrypted(msg) {
                        self._decryptedBody = msg;
                      })
                      .catch(function(err) {
                        self.log('Decryption failure', err);
                        throw err;
                      });
                  }
                })
                .then(function() {
                  self._doCryptoState = 'done';

                  self._emitUpdate('doneCrypto');
                })
                .catch(function(err) {
                  self._emitUpdate('error', err);
                })
            });

            // kick-off
            self._downloadRawBody();
          },




          /**
           * Process the raw inputs.
           *
           * This function should expect to be called multiple times, so it 
           * should take care not to repeat previously completed work.
           *
           * Note that when processing for the "preview" view type the full 
           * message body does not get loaded unless it requires either 
           * verification or decryption.
           * 
           * @param {Object} options Additional options.
           * @param {String} [options.viewType] Process for the given view type. Can be either "preview" (default) or "full".
           */
          process: function(options) {
            var self = this;

            options = _.extend({
              viewType: 'preview'
            }, options);

            self._emitUpdate('processing');

            $q.when()
              .then(function loadMeta() {
                if (!self._processed['date']) {
                  _.each(['date', 'from', 'to', 'cc', 
                      'bcc', 'subject'], function(f) {
                      self._processed[f] = self._raw[f];
                    }
                  );
                };

                self._emitUpdate('loadedMeta');
              })
              .then(function doCrypto() {
                self._doCrypto();
              })
              .catch(function(err) {
                self._emitUpdate('error', err);
              });
          },


          /**
           * Emit a processing update to all listeners.
           * @param  {String} evt Event name.
           * @param {*} [arg] Addition argument.
           */
          _emitUpdate: function(evt, arg) {
            this.emit('processing', evt, arg);
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
            return self._decryptedBody;
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


        return Message;

      }
    };

  });


}(angular.module('App.mailbox', ['App.common', 'App.data'])));
