angular.module('App').run(['$templateCache', function($templateCache) {

  $templateCache.put('template/alert/alert.html',
    "<div class=\"alert\" ng-class=\"type && \\\"alert-\\\" + type\">\n" +
    "    <button ng-show=\"closeable\" type=\"button\" class=\"close\" ng-click=\"close()\">&times;</button>\n" +
    "    <div ng-transclude=\"\"></div>\n" +
    "</div>"
  );


  $templateCache.put('template/modal/backdrop.html',
    "<div class=\"modal-backdrop fade\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1040 + index*10}\" ng-click=\"close($event)\"></div>"
  );


  $templateCache.put('template/modal/window.html',
    "<div class=\"modal fade {{ windowClass }}\" ng-class=\"{in: animate}\" ng-style=\"{'z-index': 1050 + index*10}\" ng-transclude=\"\"></div>"
  );


  $templateCache.put('template/progressbar/bar.html',
    "<div class=\"bar\" ng-class=\"type && \\\"bar-\\\" + type\"></div>"
  );


  $templateCache.put('template/progressbar/progress.html',
    "<div class=\"progress\"><progressbar ng-repeat=\"bar in bars\" width=\"bar.to\" old=\"bar.from\" animate=\"bar.animate\" type=\"bar.type\"></progressbar></div>"
  );

}]);
