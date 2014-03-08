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
    _.merge(this, config);
}

exports.Rel = Rel;