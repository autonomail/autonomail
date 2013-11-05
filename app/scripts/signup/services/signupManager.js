'use strict';

(function(app) {

  app.factory('SignupManager', function($log) {

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
        signupFormData = formData;
        $log.debug('Saved signup form data: ', formData);
      }
    }));

  });


}(angular.module('App.signup')));
