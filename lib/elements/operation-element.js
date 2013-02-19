/**
 * Module dependencies
 */

var Element = require('./element'),
	util = require('util'),
    utils = require('../utils'),
    splitNSName = utils.splitNSName;

/**
 * Expose `OperationElement` class
 */

module.exports = OperationElement;

/**
 * `OperationElement` class
 *
 * @contructor
 * @inherit {Element}
 * @api private
 */

function OperationElement(nsName, attrs){
	Element.call(this,nsName, attrs);
	this.input = null;
    this.output = null;
    this.inputSoap = null;
    this.outputSoap = null;
    this.style = '';
    this.soapAction = '';
}

// Inherits of `Element`
util.inherits(OperationElement,Element);

OperationElement.prototype.description = function(definitions) {
    var inputDesc = this.input.description(definitions);
    var outputDesc = this.output.description(definitions);
    var description = {
        input: inputDesc && inputDesc[Object.keys(inputDesc)[0]],
        output: outputDesc && outputDesc[Object.keys(outputDesc)[0]]
    };
    return description;
};

OperationElement.prototype.addChild = function(child) {
    if (child.name === 'operation') {
        this.soapAction = child.$soapAction || '';
        this.style = child.$style || '';
        this.children.pop();
    }
};

OperationElement.prototype.postProcess = function(definitions, tag) {
    var children = this.children;
    for (var i=0, child; child=children[i]; i++) {
        if (child.name !== 'input' && child.name !== 'output') continue;
        if(tag === 'binding') {
            this[child.name] = child;
            children.splice(i--,1);
            continue;
        }
        var messageName = splitNSName(child.$message).name;
        var message = definitions.messages[messageName]
        message.postProcess(definitions);
        if (message.element) {
            definitions.messages[message.element.$name] = message
            this[child.name] = message.element;
        }
        else {
            this[child.name] = message;
        }
        children.splice(i--,1);
    }
    this.deleteFixedAttrs();
};