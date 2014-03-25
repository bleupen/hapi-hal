'use strict';


/**
 * A Hal rel
 * @param {{}} config a configuration object
 * @param {Namespace | {}} namespace the namespace the rel belongs to
 * @constructor
 */
var _ = require('lodash');
function Rel(config, namespace) {
    // new Resource(resource) === resource
    if (config instanceof Rel) {
        config.namespace = namespace;
        return config;
    }

    // Still work if "new" is omitted
    if (!(this instanceof Rel)) {
        return new Rel(config, namespace);
    }

    this.namespace = namespace;
    this.name = config.name;
    this.description = config.description;
    this.links = config.links || [];
    _.merge(this, config);
}

exports.Rel = Rel;