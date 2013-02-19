/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
	SequenceElement = require('./sequence-element'),
	AllElement = require('./all-element');

/**
 * Expose `ComplexTypeElement` class
 */

module.exports = ComplexTypeElement;

/**
 * `ComplexTypeElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function ComplexTypeElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(ComplexTypeElement,Element);

ComplexTypeElement.prototype.description = function(definitions) {
    var children = this.children;
    for (var i=0, child; child=children[i]; i++) {
        if (child instanceof SequenceElement ||
            child instanceof AllElement) {
            return child.description(definitions);
        }
    }
    return {};
};