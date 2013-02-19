/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
    TypesElement = require('./types-element'),
    MessageElement = require('./message-element'),
    PortTypeElement = require('./port-type-element'),
    BindingElement = require('./binding-element'),
    ServiceElement = require('./service-element');

/**
 * Expose `DefinitionsElement` class
 */

module.exports = DefinitionsElement;

/**
 * `DefinitionsElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function DefinitionsElement(nsName, attrs){
	Element.call(this,nsName, attrs);
    if (this.name !== 'definitions') this.unexpected(nsName);
    this.messages = {};
    this.portTypes = {};
    this.bindings = {};
    this.services = {};
    this.schemas = {};
}

// Inherits of `Element`
util.inherits(DefinitionsElement,Element);

DefinitionsElement.prototype.addChild = function(child) {
    var self = this;
    if (child instanceof TypesElement) {
        self.schemas = child.schemas;
    }
    else if (child instanceof MessageElement) {
        self.messages[child.$name] = child;
    }
    else if (child instanceof PortTypeElement) {
        self.portTypes[child.$name] = child;
    }
    else if (child instanceof BindingElement) {
        if (child.transport === 'http://schemas.xmlsoap.org/soap/http' ||
            child.transport === 'http://www.w3.org/2003/05/soap/bindings/HTTP/')
            self.bindings[child.$name] = child;
    }
    else if (child instanceof ServiceElement) {
        self.services[child.$name] = child;
    }
    else {
        assert(false, "Invalid child type");
    }
    this.children.pop();
};