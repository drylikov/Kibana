define(function (require) {
  require('modules')
  .get('kibana/directive')
  .directive('visualize', function (Notifier, SavedVis, indexPatterns, Private, visLib) {

    require('components/visualize/spy/spy');
    require('css!components/visualize/visualize.css');
    var $ = require('jquery');
    var _ = require('lodash');
    var visTypes = Private(require('components/vis_types/index'));
    var buildChartData = Private(require('components/visualize/_build_chart_data'));

    var notify = new Notifier({
      location: 'Visualize'
    });

    return {
      restrict: 'E',
      scope : {
        vis: '=',
        esResp: '=?',
        searchSource: '=?'
      },
      template: require('text!components/visualize/visualize.html'),
      link: function ($scope, $el, attr) {
        var chart; // set in "vis" watcher
        var $visChart = $el.find('.visualize-chart');
        var $spy = $el.find('visualize-spy');
        var minVisChartHeight = 180;

        $scope.spyMode = false;
        $scope.fullScreenSpy = false;

        var applyClassNames = function () {
          var fullSpy = ($scope.spyMode && ($scope.spyMode.fill || $scope.fullScreenSpy));

          // external
          $el.toggleClass('only-visualization', !$scope.spyMode);
          $el.toggleClass('visualization-and-spy', $scope.spyMode && !fullSpy);
          $el.toggleClass('only-spy', Boolean(fullSpy));
          $spy.toggleClass('only', Boolean(fullSpy));

          // internal
          $visChart.toggleClass('spy-visible', Boolean($scope.spyMode));
          $visChart.toggleClass('spy-only', Boolean(fullSpy));
        };

        // we need to wait for come watchers to fire at least once
        // before we are "ready", this manages that
        var prereq = (function () {
          var fns = [];

          return function register(fn) {
            fns.push(fn);

            return function () {
              fn.apply(this, arguments);

              if (fns.length) {
                _.pull(fns, fn);
                if (!fns.length) {
                  $scope.$root.$broadcast('ready:vis');
                }
              }
            };
          };
        }());

        $scope.$watchCollection('spyMode', function (spyMode, oldSpyMode) {
          $scope.spyMode = spyMode;
          // if the spy has been opened, check chart height
          if (spyMode && !oldSpyMode) {
            $scope.fullScreenSpy = $visChart.height() < minVisChartHeight;
          }
          applyClassNames();
        });

        $scope.$watch('vis', prereq(function (vis, prevVis) {
          if (prevVis && vis !== prevVis && prevVis.destroy) prevVis.destroy();
          if (chart) {
            _.forOwn(prevVis.listeners, function (listener, event) {
              chart.off(event, listener);
            });
            chart.destroy();
          }

          if (!vis) return;

          var vislibParams = _.assign(
            {},
            vis.type.vislibParams,
            { type: vis.type.name },
            vis.vislibParams
          );

          chart = new visLib.Vis($visChart[0], vislibParams);

          _.each(vis.listeners, function (listener, event) {
            chart.on(event, listener);
          });
        }));

        $scope.$watch('searchSource', prereq(function (searchSource) {
          if (!searchSource || attr.esResp) return;

          // TODO: we need to have some way to clean up result requests
          searchSource.onResults().then(function onResults(resp) {
            if ($scope.searchSource !== searchSource) return;

            $scope.esResp = resp;

            return searchSource.onResults().then(onResults);
          }).catch(notify.fatal);

          searchSource.onError(notify.error).catch(notify.fatal);
        }));

        $scope.$watch('esResp', prereq(function (resp, prevResp) {
          if (!resp) return;
          $scope.chartData = buildChartData($scope.vis, resp);
        }));

        $scope.$watch('chartData', function (chartData) {
          applyClassNames();

          if (chart && chartData && !$scope.onlyShowSpy) {
            notify.event('call chart render', function () {
              chart.render(chartData);
            });
          }
        });

        $scope.$on('$destroy', function () {
          if (chart) {
            _.forOwn($scope.vis.listeners, function (listener, event) {
              chart.off(event, listener);
            });
            chart.destroy();
          }
        });
      }
    };
  });
});