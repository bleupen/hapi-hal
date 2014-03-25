'use strict';

var _ = require('lodash');
var hal = require('hal');
var util = require('util');
var path = require('path');

/**
 * The representation builder is passed into hal representation functions to assist constructing representations
 * and resolving rel links
 *
 * @param {string} relsUrl the base url to rel documentation (e.g. '/rels')
 * @constructor
 */
function RepresentationBuilder(relsUrl, request) {
    this.relsUrl = relsUrl;
    this.curies = {};
    this.request = request;
    this.embedded = false;
}

/**
 * Creates a new HAL representation
 * @param {{}} entity the entity to wrap. all properties are copied into the hal representation
 * @param {string} selfUrl the resource's url
 * @returns {exports.Resource}
 */
RepresentationBuilder.prototype.create = function(entity, selfUrl) {
    // unwrap mongoose object
    if (_.isFunction(entity.toObject)) {
        entity = entity.toObject();
    }

    return new hal.Resource(entity, selfUrl);
};

/**
 * Resolves a rel to its fully-qualified name in either expanded or curied format.
 * @param {Rel} rel the rel to resolve
 * @param {boolean} expanded whether to return the url in expanded (e.g. '/rels/app/rel'), or curied ('app:rel')
 * format
 */
RepresentationBuilder.prototype.resolve = function (rel, expanded) {
    if (!rel.namespace) {
        // sometimes the rel is just a string (e.g. 'next')
        return _.isObject(rel) ? rel.name : rel.toString();
    }
    if (expanded) {
        return path.resolve(this.relsUrl, rel.namespace.name, rel.name);
    } else {
        // hang on the the curied rel for later
        this.curies[rel.namespace.prefix] = rel.namespace;
        return util.format('%s:%s', rel.namespace.prefix, rel.name);
    }
};

/**
 * Adds collected curies to the representation
 * @param {hal.Resource} rep the rep to process
 */
RepresentationBuilder.prototype.addCuries = function(rep) {
    var self = this;
    _.forEach(this.curies, function (namespace, prefix) {
        var link = new hal.Link('curies', path.resolve(self.relsUrl, namespace.name, '{rel}'));
        link.name = prefix;
        link.templated = true;
        rep.link(link);
    });
};

RepresentationBuilder.prototype.toHal = function(entity, url, config, done) {
    if (_.isFunction(entity.toHal)) {
        var context = {
            request: this.request,
            self: url,
            embedded: this.embedded,
            config: config
        };
        this.embedded = true;
        entity.toHal(this, context, done);
    } else {
        done(null, this.create(entity, url));
    }
};

exports.RepresentationBuilder = RepresentationBuilder;