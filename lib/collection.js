'use strict';

var _ = require('lodash');
var template = require('url-template');
var async = require('async');
var path = require('path');

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

Collection.prototype.toHal = function(rb, context, done) {
    var url = context.self;
    var config = context.config;

    var urlTemplate = template.parse(config.url || './{_id}');

    function embed(entity, cb) {
        var embedUrl = urlTemplate.expand(entity);
        rb.toHal(entity, path.resolve(url, embedUrl), config.config || {}, cb);
    }

    var rep = rb.create(this, url);

    // move items into embedded collection
    delete rep.items;

    async.map(this.items, embed, function (err, results) {
        if (err) {
            done('Error processing child: ', err);
        } else {
            rep.embed('item', results, false);
            done(null, rep);
        }
    });
};

/**
 * @type {Collection}
 */
module.exports.Collection = Collection;