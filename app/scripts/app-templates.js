angular.module('App').run(['$templateCache', function($templateCache) {

  $templateCache.put('app/modals/entropy.html',
    "<div class=\"prng\">\n" +
    "  This is a modal!\n" +
    "  <p>{{str}}</p>\n" +
    "</div>"
  );


  $templateCache.put('app/signup/form.html',
    "<form role=\"form\" name=\"signupForm\" ng-controller=\"SignupFormCtrl\">\n" +
    "  <div class=\"form-group\">\n" +
    "    <label class=\"sr-only\" for=\"signupForm_username\">Username</label>\n" +
    "    <input type=\"text\" class=\"form-control\" name=\"username\" id=\"signupForm_username\" placeholder=\"Username\" ng-model=\"user.name\" ng-minlength=\"4\" ng-maxlength=\"32\" required=\"\" ui-validate=\"{available: 'validateNameAvailable($value)'}\">\n" +
    "    <span ng-hide=\"signupForm.username.$dirty && signupForm.username.$invalid\" class=\"post-label\"><span>@</span><span>autonomail.com</span></span>\n" +
    "            <span ng-show=\"signupForm.username.$dirty && signupForm.username.$invalid\" class=\"validation_errors alert alert-danger\">\n" +
    "              <span ng-show=\"signupForm.username.$error.required\">Please fill this in</span>\n" +
    "              <span ng-show=\"signupForm.username.$error.minlength\">Atleast 4 characters required</span>\n" +
    "              <span ng-show=\"signupForm.username.$error.maxlength\">No more than 32 characters allowed</span>\n" +
    "              <span ng-show=\"signupForm.username.$error.available\">Sorry, this username is not available</span>\n" +
    "            </span>\n" +
    "  </div>\n" +
    "  <div class=\"form-group\">\n" +
    "    <label class=\"sr-only\" for=\"signupForm_password\">Password</label>\n" +
    "    <input type=\"password\" class=\"form-control\" name=\"password\" id=\"signupForm_password\" placeholder=\"Password\" ng-model=\"user.password\" ng-minlength=\"8\" ng-maxlength=\"64\" required=\"\" ui-validate=\"{contents: 'validatePasswordContents($value)'}\">\n" +
    "            <span ng-show=\"signupForm.password.$dirty && signupForm.password.$invalid\" class=\"validation_errors alert alert-danger\">\n" +
    "              <span ng-show=\"signupForm.password.$error.required\">Please fill this in</span>\n" +
    "              <span ng-show=\"signupForm.password.$error.minlength\">Atleast 8 characters required</span>\n" +
    "              <span ng-show=\"signupForm.password.$error.maxlength\">No more than 64 characters allowed</span>\n" +
    "              <span ng-show=\"signupForm.password.$error.contents\">Must include both numbers and letters</span>\n" +
    "            </span>\n" +
    "  </div>\n" +
    "  <div class=\"form-group\">\n" +
    "    <label class=\"sr-only\" for=\"signupForm_confirm\">Confirm password</label>\n" +
    "    <input type=\"password\" class=\"form-control\" name=\"confirm\" id=\"signupForm_confirm\" placeholder=\"Confirm password\" ng-model=\"user.confirm\" ui-validate=\"{match: 'validatePasswordConfirmation($value)'}\">\n" +
    "            <span ng-show=\"signupForm.confirm.$dirty && signupForm.confirm.$invalid\" class=\"validation_errors alert alert-danger\">\n" +
    "              <span ng-show=\"signupForm.confirm.$error.match\">Must match the password</span>\n" +
    "            </span>\n" +
    "  </div>\n" +
    "  <div class=\"terms checkbox\">\n" +
    "    <label>\n" +
    "      <input type=\"checkbox\" name=\"agree\" id=\"signupForm_agree\" ng-model=\"user.agree\" required=\"\"> I agree to the <a href=\"#\">Terms and Conditions</a> and <a href=\"#\">Privacy Policy</a>.\n" +
    "    </label>\n" +
    "  </div>\n" +
    "  <div class=\"submit\">\n" +
    "    <button type=\"submit\" class=\"btn btn-primary\" ng-disabled=\"!canSubmit()\" ng-click=\"submit()\">Submit</button>\n" +
    "  </div>\n" +
    "</form>"
  );


  $templateCache.put('app/signup/index.html',
    "<div id=\"page-signup\" class=\"container\">\n" +
    "  <div class=\"row\">\n" +
    "    <div class=\"col-md-6 col-md-offset-4\">\n" +
    "      <h2>Create new account</h2>\n" +
    "      <div ui-view=\"\"></div>\n" +
    "    </div>\n" +
    "  </div>\n" +
    "</div>"
  );


  $templateCache.put('app/signup/process.html',
    "<div id=\"signup_process\" class=\"well well-lg\" ng-controller=\"SignupProcessCtrl\">\n" +
    "  <progress percent=\"progressBar\" class=\"progress-striped active\"></progress>\n" +
    "  <p class=\"description\">{{ description }}</p>\n" +
    "  <div ng-show=\"error\" class=\"alert alert-danger\">{{ error }}</div>\n" +
    "</div>"
  );

}]);
