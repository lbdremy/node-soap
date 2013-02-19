/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util');

/**
 * Expose `AllElement` class
 */

module.exports = AllElement;

/**
 * `AllElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function AllElement(nsName, attrs){
	Element.call(this,nsName, attrs);
}

// Inherits of `Element`
util.inherits(AllElement,Element);

AllElement.prototype.description = function(definitions) {
    var children = this.children;
    var sequence = {};
    for (var i=0, child; child=children[i]; i++) {
        var description = child.description(definitions);
        for (var key in description) {
            sequence[key] = description[key];
        }
    }
    return sequence;
}