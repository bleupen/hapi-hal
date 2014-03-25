'use strict';

var _ = require('lodash');

/**
 * Represents a subset of data from a larger collection. E.g. a page of data from a database
 * @param {[]} items an array of data
 * @param {Number} start the start index
 * @param {Number} limit the maximum number of items shown
 * @param {Number} total the total number of items in the collection
 * @constructor
 */
function Collection(items, start, limit, total) {
    this.items = items || [];
    this.start = _.isUndefined(start) ? 0 : start;
    this.limit = _.isUndefined(limit) ? items.length : limit;
    this.total = _.isUndefined(total) ? items.length : total;
}

/**
 * @type {Collection}
 */
module.exports.Collection = Collection;