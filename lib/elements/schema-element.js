/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
    Primitives = require('../utils').Primitives;

/**
 * Expose `SchemaElement` class
 */

module.exports = SchemaElement;

/**
 * `SchemaElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function SchemaElement(nsName, attrs){
	Element.call(this,nsName, attrs);
    this.complexTypes = {};
    this.types = {};
    this.elements = {};
    this.includes = [];
}

// Inherits of `Element`
util.inherits(SchemaElement,Element);

SchemaElement.prototype.addChild = function(child) {
    if (child.$name in Primitives) return;
    if (child.name === 'include' || child.name === 'import') {
        var location = child.$schemaLocation || child.$location;
        if (location) {
            this.includes.push({
                namespace: child.$namespace || child.$targetNamespace || this.$targetNamespace,
                location: location
            });
        }
    }
    else if (child.name === 'complexType') {
        this.complexTypes[child.$name] = child;
    }
    else if (child.name === 'element') {
        this.elements[child.$name] = child;
    }
    else if (child.$name) {
        this.types[child.$name] = child;
    }
    this.children.pop();
    // child.deleteFixedAttrs();
};
