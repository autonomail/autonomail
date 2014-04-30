(function(app) {
  'use strict';


  app.factory('OutboundMessage', function($q, $timeout, GPG, Log) {

    var OutboundMessage = Class.extend({
      /**
       * Constructor
       *
       * @override
       */
      init: function() {
        this.log = Log.create('OutboundMessage');
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

        this._state = 'created';
      },




      /**
       * Get list of GPG identities for which we have public keys.
       *
       * We'll cache the results so we only want it to be called once. In case 
       * it gets called multiple times in quick succession let's use a timer 
       * to ensure GPG only actually gets called once.
       * 
       * @return {Promise}
       */
      _getIdentitiesWithPublicKeys: function() {
        var self = this;

        var defer = $q.defer();

        if (self._gpgIdentitiesTimer) {
          $timeout.cancel(self._gpgIdentitiesTimer);
        }

        self._gpgIdentitiesTimer = $timeout(function() {

          $q.when()
            .then(function() {
              if (!self._cachedGPGIdentities) {
                return GPG.getAllKeys()
                  .then(function extractIdentities(keys) {
                    self._cachedGPGIdentities = _.chain(keys)
                      .pluck('identities')  // [[{}]]
                      .flatten() // [{}]
                      .pluck('text') // []
                      .value();
                  });
              }
            })
            .then(function done() {
              defer.resolve(self._cachedGPGIdentities);
            })
            .catch(defer.reject);

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

        self._processed = {};

        return self._getIdentitiesWithPublicKeys()
          .then(function checkPublicKeys(gpgIdentities) {
            // for each list of addresses
            _.each(['to', 'cc', 'bcc'], function(field){
              self._missingKeys[field] = [];

              self._processed[field] = 
                _.str.extractNamesAndEmailAddresses(self._raw[field] || '');

              // check to see if we have a public key for each address
              _.each(self.processed[field], function(recipient) {
                var checkStr = '<' + recipient.email + '>';

                var found = _.find(gpgIdentities, function(identity) {
                  return 0 <= identity.indexOf(checkStr);
                });

                recipient.havePublicKey = (undefined === found);

                if (!recipient.havePublicKey) {
                  self._missingKeys[field].push(recipient.email);
                }
              });
            });
          });
      },


      /**
       * Get plain object version of this message and its internal state.
       * 
       * @return {Object}
       * @override
       */
      toPlainObject: function() {
        return {
          raw: this.raw,
          processed: this.processed,
          sendState: this.sendState
        }
      }

    });

    
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
     * Current message state.
     */
    OutboundMessage.prop('state', { internal: '_state' });


    return OutboundMessage;

  });

}(angular.module('App.mailbox', ['App.common', 'App.data'])));
