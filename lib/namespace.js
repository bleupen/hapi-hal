'use strict';

var Rel = require('./rel').Rel;

/**
 * A rel namespace for easy curie'ing
 * @param name
 * @param prefix
 * @constructor
 */
function Namespace(name, prefix) {
    this.name = name;
    this.prefix = prefix || name;
    this.rels = {};
}

Namespace.prototype.rel = function (config) {
    var rel = new Rel(this, config);
    this.rels[rel.name] = rel;
    return rel;
};

/**
 * @type {Namespace}
 */
exports.Namespace = Namespace;