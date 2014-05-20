/**
 * Pretty-print dates.
 */

(function(app) {

  app.filter('shortDate', function() {
    return function(inputDate) {
      var m = moment(inputDate);

      if (!m.isValid()) {
        return '';
      }

      return m.format('D MMM');
    };
  });

  app.filter('longDate', function() {
    return function(inputDate) {
      var m = moment(inputDate);

      if (!m.isValid()) {
        return '';
      }

      return m.format('D MMMM YYYY');
    };
  });

  app.filter('longDateTime', function() {
    return function(inputDate) {
      var m = moment(inputDate);

      if (!m.isValid()) {
        return '';
      }

      return m.format('HH:mm:ss, D MMMM YYYY');
    };
  });

}(angular.module('App.common', [])));

