'use strict';

/**
 * Represents a subset of data from a larger collection. E.g. a page of data from a database
 * @param {Number} start the start index
 * @param {Number} limit the maximum number of items shown
 * @param {Number} total the total number of items in the collection
 * @param {[]} items an array of data
 * @constructor
 */
function Collection(start, limit, total, items) {
    this.start = start;
    this.limit = limit;
    this.total = total;
    this.items = items || [];
    this.count = items.length;
}

/**
 * @type {Collection}
 */
module.exports.Collection = Collection;

/**
 * Returns a full collection with start, limit and total filled out
 *
 * @param items
 * @returns {Collection}
 */
module.exports.of = function (items) {
    return new Collection(0, items.length, items.length, items);
};

/**
 * Returns an empty collection
 *
 * @param items
 * @returns {Collection}
 */
module.exports.empty = function () {
    return new Collection(0, 0, 0, []);
};