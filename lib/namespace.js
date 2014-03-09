'use strict';

var Rel = require('./rel').Rel;

/**
 * A rel namespace for easy curie'ing
 * @param {string} name the namespace name. the name will be used in the rel path
 * @param {string} prefix the namespace prefix to be used for curies
 * @constructor
 *
 */
function Namespace(name, prefix) {
    this.name = name;
    this.prefix = prefix || name;
    this.rels = {};
}

/**
 * @public
 * @param config
 * @returns {Rel}
 */
Namespace.prototype.rel = function (config) {
    var rel = new Rel(this, config);
    this.rels[rel.name] = rel;
    return rel;
};

/**
 * @type {Namespace}
 */
exports.Namespace = Namespace;