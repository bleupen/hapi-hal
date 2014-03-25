var should = require('chai').should();
var Namespace = require('../../lib/namespace').Namespace;
var Rel = require('../../lib/rel').Rel;

describe('Namespace', function () {
    it('should create and add a rel from configuration', function () {
        var ns = new Namespace('myapp', 'app');
        var rel = ns.rel({ name: 'my-rel', description: 'test-rel'});
        rel.should.have.property('name');
        rel.name.should.equal('my-rel');
    });

    it('should update an existing rel', function () {
        var ns = new Namespace('myapp', 'app');
        var rel = new Rel({name: 'my-rel'});
        var rel2 = ns.rel(rel);
        rel2.should.equal(rel);
        rel.namespace.should.equal(ns);
    });

    it('should update an array of rels', function () {
        var rels = [
            new Rel({name: 'rel 1'}),
            new Rel({name: 'rel 2'})
        ];
        var ns = new Namespace('myapp', 'app');
        ns.rel(rels);
        rels[0].namespace.should.equal(ns);
        rels[1].namespace.should.equal(ns);
    });
});