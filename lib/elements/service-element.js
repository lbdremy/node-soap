/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
	utils = require('../utils'),
    splitNSName = utils.splitNSName;

/**
 * Expose `ServiceElement` class
 */

module.exports = ServiceElement;

/**
 * `ServiceElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function ServiceElement(nsName, attrs){
	Element.call(this,nsName, attrs);
	this.ports = {};
}

// Inherits of `Element`
util.inherits(ServiceElement,Element);

ServiceElement.prototype.description = function(definitions) {
    var ports = {};
    for (var name in this.ports) {
        var port = this.ports[name];
        ports[name] = port.binding.description(definitions);
    }
    return ports;
}

ServiceElement.prototype.postProcess = function(definitions) {
    var children = this.children,
        bindings = definitions.bindings;
    for (var i=0, child; child=children[i]; i++) {
        if (child.name != 'port') continue;
        var bindingName = splitNSName(child.$binding).name;
        var binding = bindings[bindingName];
        if (binding) {
            binding.postProcess(definitions);
            this.ports[child.$name] = {
                location: child.location,
                binding: binding
            }
            children.splice(i--,1);
        }
    }
    delete this.$name;
    this.deleteFixedAttrs();
};