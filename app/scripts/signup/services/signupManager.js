'use strict';

(function(app) {

  app.factory('SignupManager', function($log, AuthCredentials) {

    var signupFormData = {};

    /**
     * See the ServerInterface class specification for documentation regarding the functions here.
     */
    return new (Class.extend({
      /**
       * Save submitted signup form data.
       * @param formData {Object}
       */
      saveSignupFormData: function(formData) {
        $log.debug('Saving signup form data: ', formData);
        signupFormData = formData;

        signupFormData.email = signupFormData.name + '@' + signupFormData.domain;

        AuthCredentials.set(formData.email, {
          username: formData.name,
          passphrase: formData.passphrase
        });
      },


      /**
       * Get submitted signup form data.
       * @return {Object}
       */
      getSavedSignupFormData: function(formData) {
        return signupFormData;
      }
    }));

  });


}(angular.module('App.signup', ['App.data'])));
