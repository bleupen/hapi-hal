'use strict';

var _ = require('lodash');
var template = require('url-template');
var async = require('async');

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

Collection.prototype.toHal = function(url, config, rb, done) {
    var urlTemplate = template.parse(config.url || './{_id}');

    function embed(entity, cb) {
        var embedUrl = urlTemplate.expand(entity);
        rb.toHal(entity, embedUrl, config.config || {}, rb, cb);
    }

    var rep = rb.create(this, url);

    // move items into embedded collection
    delete rep.items;

    async.map(this.items, embed, function (err, results) {
        if (err) {
            done('Error processing child: ', err);
        } else {
            rep.embed(rb.resolve(config.rel), results, false);
            done(null, rep);
        }
    });
};

module.exports.collection = function (rel, embeddedRep, urlTemplate) {
    urlTemplate = template.parse(urlTemplate);

    return function (entity, url, rb, done) {
        function embed(entity, cb) {
            var embedUrl = urlTemplate.expand(entity);
            embeddedRep(entity, path.resolve(url, embedUrl), rb, cb);
        }

        var rep = rb.create(entity, url);
        delete rep.items;

        async.map(entity.items, embed, function (err, results) {
            if (err) {
                done('Error processing child: ', err);
            } else {
                rep.embed(rb.resolve(rel), results, false);
                done(null, rep);
            }
        });
    };
}
/**
 * @type {Collection}
 */
module.exports.Collection = Collection;