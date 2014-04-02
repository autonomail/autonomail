/**
 * Pretty-print dates.
 */

(function(app) {

  app.filter('prettyDate', function() {
    return function(inputDate, formatString, emptyDateStr) {
      var m = moment(inputDate);

      if (!m.isValid()) {
        return emptyDateStr || '';
      }

      return m.format(formatString || 'D MMM YYYY');
    };
  });

}(angular.module('App.common', [])));

