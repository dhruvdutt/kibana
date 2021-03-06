import _ from 'lodash';
import moment from 'moment';
import { buildRangeFilter } from 'ui/filter_manager/lib/range';

export function UtilsBrushEventProvider(timefilter) {
  return $state => {
    return event => {
      if (!event.data.xAxisField) {
        return;
      }

      const isDate = event.data.xAxisField.type === 'date';
      const isNumber = event.data.xAxisField.type === 'number';

      if (isDate &&
        event.data.xAxisField.name === event.data.indexPattern.timeFieldName) {
        setTimefilter();
      } else if (isDate || isNumber) {
        setRange();
      }

      function setTimefilter() {
        const from = moment(event.range[0]);
        const to = moment(event.range[1]);

        if (to - from === 0) return;

        timefilter.time.from = from;
        timefilter.time.to = to;
        timefilter.time.mode = 'absolute';
      }

      function setRange() {
        if (event.range.length <= 1) return;

        const existingFilter = $state.filters.find(filter => (
          filter.meta && filter.meta.key === event.data.xAxisField.name
        ));

        const min = event.range[0];
        const max = event.range[event.range.length - 1];
        let range;
        if (isDate) {
          range = {
            gte: moment(min).valueOf(),
            lt: moment(max).valueOf(),
            format: 'epoch_millis'
          };
        } else {
          range = {
            gte: min,
            lt: max
          };
        }

        if (_.has(existingFilter, 'range')) {
          existingFilter.range[event.data.xAxisField.name] = range;
        } else if (_.has(existingFilter, 'script.script.params.gte')
          && _.has(existingFilter, 'script.script.params.lt')) {
          existingFilter.script.script.params.gte = min;
          existingFilter.script.script.params.lt = max;
        } else {
          const newFilter = buildRangeFilter(
            event.data.xAxisField,
            range,
            event.data.indexPattern,
            event.data.xAxisFormatter);
          $state.$newFilters = [newFilter];
        }
      }
    };
  };
}
