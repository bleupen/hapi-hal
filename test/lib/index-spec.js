'use strict';

var expect = require('chai').expect;
var hh = require('../../lib/index');
var nodemock = require('nodemock');

describe('Hapi Hal plugin', function () {
    var plugin;

    beforeEach(function () {
        plugin = nodemock.mock('route')
            .takesAll()
            .calls(4);
        plugin.mock('views')
            .takesAll();
        plugin.mock('ext')
            .takesAll();
    });

    it('should export a register function', function () {
        expect(hh.register).to.exist;
    });
});