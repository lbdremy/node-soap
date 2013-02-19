/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
	utils = require('../utils'),
    splitNSName = utils.splitNSName;

/**
 * Expose `BindingElement` class
 */

module.exports = BindingElement;

/**
 * `BindingElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function BindingElement(nsName, attrs){
	Element.call(this,nsName, attrs);
	this.transport = '';
    this.style = '';
    this.methods = {};
}

// Inherits of `Element`
util.inherits(BindingElement,Element);

BindingElement.prototype.description = function(definitions) {
    var methods = {};
    for (var name in this.methods) {
        var method = this.methods[name];
        methods[name] = method.description(definitions);
    }
    return methods;
};

BindingElement.prototype.addChild = function(child) {
    if (child.name === 'binding') {
        this.transport = child.$transport;
        this.style = child.$style;
        this.children.pop();
    }
};

BindingElement.prototype.postProcess = function(definitions) {
    var type = splitNSName(this.$type).name,
        portType = definitions.portTypes[type],
        style = this.style,
        children = this.children;

    portType.postProcess(definitions);
    this.methods = portType.methods;
    // delete portType.methods; both binding and portType should keep the same set of operations

    for (var i=0, child; child=children[i]; i++) {
        if (child.name != 'operation') continue;
        child.postProcess(definitions, 'binding');
        children.splice(i--,1);
        child.style || (child.style = style);
        var method =  this.methods[child.$name];
        method.style = child.style;
        method.soapAction = child.soapAction;
        method.inputSoap = child.input || null;
        method.outputSoap = child.output || null;
        method.inputSoap && method.inputSoap.deleteFixedAttrs();
        method.outputSoap && method.outputSoap.deleteFixedAttrs();
        // delete method.$name; client will use it to make right request for top element name in body
        // method.deleteFixedAttrs(); why ???
    }

    delete this.$name;
    delete this.$type;
    this.deleteFixedAttrs();
};