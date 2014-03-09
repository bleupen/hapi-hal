'use strict';

var _ = require('lodash');

/**
 * A Hal rel
 * @param {Namespace | {}} namespace the namespace the rel belongs to
 * @param {{}} config a configuration object
 * @constructor
 */
function Rel(namespace, config) {
    this.namespace = namespace;
    this.name = config.name;
    this.description = config.description;
    this.links = config.links || [];
    _.merge(this, config);
}

exports.Rel = Rel;