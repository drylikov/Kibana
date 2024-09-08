define(function (require) {
  return function OptionedAggParamFactory(Private) {
    var _ = require('lodash');

    var Registry = require('utils/registry/registry');
    var editorHtml = require('text!components/agg_types/controls/field.html');
    var BaseAggParam = Private(require('components/agg_types/param_types/base'));

    _(OptionedAggParam).inherits(BaseAggParam);
    function OptionedAggParam(config) {
      OptionedAggParam.Super.call(this, config);

      this.options = new Registry({
        index: ['val'],
        immutable: true,
        initialSet: this.options
      });
    }

    /**
     * Serialize a selection to be stored in the database
     * @param  {object} selected - the option that was selected
     * @return {any}
     */
    OptionedAggParam.prototype.serialize = function (selected) {
      return selected.val;
    };

    /**
     * Take a value that was serialized to the database and
     * return the option that is represents
     *
     * @param  {any} val - the value that was saved
     * @return {object}
     */
    OptionedAggParam.prototype.deserialize = function (val) {
      return this.options.byVal[val];
    };

    /**
     * Write the aggregation parameter.
     *
     * @param  {AggConfig} aggConfig - the entire configuration for this agg
     * @param  {object} output - the result of calling write on all of the aggregations
     *                         parameters.
     * @param  {object} output.param - the final object that will be included as the params
     *                               for the agg
     * @return {undefined}
     */
    OptionedAggParam.prototype.write = function (aggConfig, output) {
      output.params[this.name] = aggConfig.params[this.name].val;
    };

    return OptionedAggParam;
  };
});