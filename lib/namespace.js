'use strict';

var util = require('util');
var Rel = require('./rel').Rel;
var _ = require('lodash');

/**
 * A rel namespace for easy curie'ing
 * @param {string} name the namespace name. the name will be used in the rel path
 * @param {string} prefix the namespace prefix to be used for curies
 * @constructor
 *
 */
function Namespace(name, prefix, rels) {
    this.name = name;
    this.prefix = prefix || name;
    this.rels = {};
    _.forEach(rels, this.rel, this);
}

/**
 * @public
 * @param config
 * @returns {Rel}
 */
Namespace.prototype.rel = function (config) {
    var self = this;
    if (util.isArray(config)) {
        config.forEach(function (c) {
            self.rel(c);
        });
    } else {
        var rel = new Rel(config, this);
        this.rels[rel.name] = rel;
        return rel;
    }
};

/**
 * @type {Namespace}
 */
exports.Namespace = Namespace;