/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
	RestrictionElement = require('./restriction-element');

/**
 * Expose `SimpleTypeElement` class
 */

module.exports = SimpleTypeElement;

/**
 * `SimpleTypeElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function SimpleTypeElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(SimpleTypeElement,Element);

SimpleTypeElement.prototype.description = function(definitions) {
    var children = this.children;
    for (var i=0, child; child=children[i]; i++) {
        if (child instanceof RestrictionElement)
           return this.$name+"|"+child.description();
    }
    return {};
};