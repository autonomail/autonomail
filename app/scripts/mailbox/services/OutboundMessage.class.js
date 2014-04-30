(function(app) {
  'use strict';


  app.factory('OutboundMessage', function(MailMessage, GPG, Log) {

    var OutboundMessage = MailMessage.extend({
      /**
       * Constructor
       *
       * @override
       */
      init: function(mailBox, msg) {
        this._super(mailBox, msg);

        this._sendState = 'created';
      },


      /**
       * Send this message.
       *
       * This will sign and encrypt the message and then send it to all 
       * recipients.
       * 
       * @override
       */
      send: function() {
        var self = this;

        // basic processing
        self.process()
          .then(function signAndEncrypt() {
            // for each recipient
            _.each(self.processed.to, function(nameEmail) {
              var emailAddress = nameEmail.email;


            });            
          })  


        if (!self._processed) {
          self.parsed.from = _.str.extractNamesAndEmailAddresses(
            self.raw.from
          ).pop();

          self.parsed.to = _.str.extractNamesAndEmailAddresses(
            self.raw.to
          );


        }
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



    OutboundMessage.prop('sendState', {
      set: false,
      get: function() {
        return this._sendState;
      }
    });



    return OutboundMessage;

  });

}(angular.module('App.mailbox', ['App.common', 'App.data'])));
