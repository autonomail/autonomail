angular.module('App').run(['$templateCache', function($templateCache) {

  $templateCache.put('template/progressbar/bar.html',
    "<div class=\"progress-bar\" ng-class=\"type && 'progress-bar-' + type\"></div>"
  );

}]);
