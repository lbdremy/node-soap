/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util');

/**
 * Expose `PortTypeElement` class
 */

module.exports = PortTypeElement;

/**
 * `PortTypeElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function PortTypeElement(nsName, attrs){
	Element.call(this,nsName, attrs);
	this.methods = {};
}

// Inherits of `Element`
util.inherits(PortTypeElement,Element);

PortTypeElement.prototype.postProcess = function(definitions) {
    var children = this.children;
    if (typeof children === 'undefined') return;
    for (var i=0, child; child=children[i]; i++) {
        if (child.name != 'operation') continue;
        child.postProcess(definitions, 'portType');
        this.methods[child.$name] = child;
        children.splice(i--,1);
    }
    delete this.$name;
    this.deleteFixedAttrs();
};

PortTypeElement.prototype.description = function(definitions) {
    var methods = {};
    for (var name in this.methods) {
        var method = this.methods[name];
        methods[name] = method.description(definitions);
    }
    return methods;
};