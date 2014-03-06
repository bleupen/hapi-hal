'use strict';

var hoek = require('hoek');
var path = require('path');

// Declare internals

var internals = {};


// Defaults

internals.defaults = {

};

// Version
internals.version = hoek.loadPackage(path.join(__dirname, '..')).version;

exports.register = function (plugin, options, next) {

    var settings = hoek.applyToDefaults(internals.defaults, options);

    plugin.ext('onPreResponse', function (request, extNext) {
        console.log('Received request: ' + request.path);
        extNext();
    });

//    plugin.expose({ plugins: listPlugins });

    next();
};