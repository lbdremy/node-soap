/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util');

/**
 * Expose `SequenceElement` class
 */

module.exports = SequenceElement;

/**
 * `SequenceElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function SequenceElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(SequenceElement,Element);

SequenceElement.prototype.description = function(definitions) {
    var children = this.children;
    var sequence = {};
    for (var i=0, child; child=children[i]; i++) {
        var description = child.description(definitions);
        for (var key in description) {
            sequence[key] = description[key];
        }
    }
    return sequence;
};