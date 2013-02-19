/*!
 * Copyright (c) 2011 Vinay Pulim <vinay@milewise.com>
 * MIT Licensed
 */

/**
 * Module dependencies
 */

var expat = require('node-expat'),
    http = require('./http'),
    fs = require('fs'),
    url = require('url'),
    path = require('path'),
    assert = require('assert').ok
    utils = require('./utils'),
    splitNSName = utils.splitNSName;

/**
 * Elements
 */

var Element = require('./elements/element'),
    AllElement = require('./elements/all-element'),
    BindingElement = require('./elements/binding-element'),
    ComplexTypeElement = require('./elements/complex-type-element'),
    DefinitionsElement = require('./elements/definitions-element'),
    ElementElement = require('./elements/element-element'),
    EnumerationElement = require('./elements/enumeration-element'),
    InputElement = require('./elements/input-element'),
    MessageElement = require('./elements/message-element'),
    OperationElement = require('./elements/operation-element'),
    OutputElement = require('./elements/output-element'),
    PortElement = require('./elements/port-element'),
    PortTypeElement = require('./elements/port-type-element'),
    RestrictionElement = require('./elements/restriction-element'),
    SchemaElement = require('./elements/schema-element'),
    SequenceElement = require('./elements/sequence-element'),
    ServiceElement = require('./elements/service-element'),
    SimpleTypeElement = require('./elements/simple-type-element'),
    TypesElement = require('./elements/types-element');

/**
 * Implement the property `allowedChildren` on every elements listed
 */

var ElementTypeMap = {
    types: [TypesElement, 'schema'],
    schema: [SchemaElement, 'element complexType simpleType include import'],
    element: [ElementElement, 'annotation complexType'],
    simpleType: [SimpleTypeElement, 'restriction'],
    restriction: [RestrictionElement, 'enumeration'],
    enumeration: [EnumerationElement, ''],
    complexType: [ComplexTypeElement,  'annotation sequence all'],
    sequence: [SequenceElement, 'element'],
    all: [AllElement, 'element'],

    service: [ServiceElement, 'port documentation'],
    port: [PortElement, 'address'],
    binding: [BindingElement, '_binding SecuritySpec operation'],
    portType: [PortTypeElement, 'operation'],
    message: [MessageElement, 'part documentation'],
    operation: [OperationElement, 'documentation input output fault _operation'],
    input : [InputElement, 'body SecuritySpecRef documentation header'],
    output : [OutputElement, 'body SecuritySpecRef documentation header'],
    fault : [Element, '_fault'],
    definitions: [DefinitionsElement, 'types message portType binding service']
};

function mapElementTypes(types) {
    var types = types.split(' ');
    var rtn = {}
    types.forEach(function(type){
        rtn[type.replace(/^_/,'')] = (ElementTypeMap[type] || [Element]) [0];
    });
    return rtn;
}

for(var n in ElementTypeMap) {
    var v = ElementTypeMap[n];
    v[0].prototype.allowedChildren = mapElementTypes(v[1]);
}

/**
 * Expose
 */

exports.WSDL = WSDL;
exports.open_wsdl = open_wsdl;

/**
 * Parse the wsdl file findable at the given `uri`
 *
 * @param {String} uri -
 * @param {Object} options -
 * @param {Function} callback -
 *
 * @api public
 */

function open_wsdl(uri, options, callback) {
    if (typeof options === 'function') {
        callback = options;
        options = {};
    }

    var wsdl;
    if (!/^http/.test(uri)) {
        fs.readFile(uri, 'utf8',  function (err, definition) {
            if (err) {
                callback(err)
            }
            else {
                wsdl = new WSDL(definition, uri, options);
                wsdl.onReady(callback);
            }
        })
    }
    else {
        http.request(uri, null /* options */, function (err, response, definition) {
            if (err) {
                callback(err);
            }
            else if (response && response.statusCode == 200) {
                wsdl = new WSDL(definition, uri, options);
                wsdl.onReady(callback);
            }
            else {
                callback(new Error('Invalid WSDL URL: '+uri))
            }
        });
    }

    return wsdl;
}

/**
 * `WSDL` class
 *
 * @param {String} definition -
 * @param {String} uri -
 * @param {Object} options -
 *
 * @api public
 */

function WSDL(definition, uri, options) {
    var self = this,
        fromFunc;

    this.uri = uri;
    this.callback = function() {};
    this.options = options || {};

    if (typeof definition === 'string') {
        fromFunc = this._fromXML;
    }
    else if (typeof definition === 'object') {
        fromFunc = this._fromServices;
    }
    else {
        throw new Error('WSDL constructor takes either an XML string or service definition');
    }

    process.nextTick(function() {
        fromFunc.call(self, definition);

        self.processIncludes(function(err) {
            self.definitions.deleteFixedAttrs();
            var services = self.services = self.definitions.services ;
            if (services) {
                for (var name in services) {
                    services[name].postProcess(self.definitions);
                }
            }
            var complexTypes = self.definitions.complexTypes;
            if (complexTypes) {
                for (var name in complexTypes) {
                    complexTypes[name].deleteFixedAttrs();
                }
            }

            // for document style, for every binding, prepare input message element name to (methodName, output message element name) mapping
            var bindings = self.definitions.bindings;
            for(var bindingName in bindings) {
                var binding = bindings[bindingName];
                if(binding.style !== 'document') continue;
                var methods = binding.methods;
                var topEls = binding.topElements = {};
                for(var methodName in methods) {
                    var inputName = methods[methodName].input.$name;
                    var outputName = methods[methodName].output.$name;
                    topEls[inputName] = {"methodName": methodName, "outputName": outputName};
                }
            }

            // prepare soap envelope xmlns definition string
            self.xmlnsInEnvelope = self._xmlnsMap();

            self.callback(err, self);
        });

    })
}

WSDL.prototype._fromServices = function(services) {
    //TODO
}

WSDL.prototype._fromXML = function(xml) {
    this.definitions = this._parse(xml);
    this.xml = xml;
}

WSDL.prototype._parse = function(xml)
{
    var self = this,
        parser = new expat.Parser('UTF-8'),
        stack = [],
        root = null;

    parser.on('startElement', function(nsName, attrs) {
        var top = stack[stack.length - 1];

        if (top) {
            try {
                top.startElement(stack, nsName, attrs);
            }
            catch(e) {
                if (self.options.strict) {
                    throw e;
                }
                else {
                    stack.push(new Element(nsName, attrs));
                }
            }
        }
        else {
            var name = splitNSName(nsName).name;

            if (name === 'definitions') {
                root = new DefinitionsElement(nsName, attrs);
            }
            else if (name === 'schema') {
                root = new SchemaElement(nsName, attrs);
            }
            else {
                throw new Error('Unexpected root element of WSDL or include: "' + name + '"');
            }
            stack.push(root);
        }
    });

    parser.on('endElement', function(name) {
        var top = stack[stack.length - 1];
        assert(top, 'Unmatched close tag: ' + name);

        top.endElement(stack, name);
    });

    if (!parser.parse(xml, false)) {
        throw new Error(parser.getError());
    }

    return root;
}

WSDL.prototype.onReady = function(callback) {
    if (callback) this.callback = callback;
}

WSDL.prototype._processNextInclude = function(includes, callback) {
    var self = this,
        include = includes.shift();

    if (!include) return callback()

    var includePath;
    if (!/^http/.test(self.uri) && !/^http/.test(include.location)) {
        includePath = path.resolve(path.dirname(self.uri), include.location);
    } else {
        includePath = url.resolve(self.uri, include.location);
    }

    open_wsdl(includePath, function(err, wsdl) {
        if (err) {
            return callback(err);
        }

        self.definitions.schemas[include.namespace || wsdl.definitions.$targetNamespace] = wsdl.definitions;
        self._processNextInclude(includes, function(err) {
            callback(err);
        })
    });
}

WSDL.prototype.processIncludes = function(callback) {
    var schemas = this.definitions.schemas,
        includes = [];

    for (var ns in schemas) {
        var schema = schemas[ns];
        includes = includes.concat(schema.includes || [])
    }

    this._processNextInclude(includes, callback);
}

WSDL.prototype.describeServices = function() {
    var services = {};
    for (var name in this.services) {
        var service = this.services[name];
        services[name] = service.description(this.definitions);
    }
    return services;
}

WSDL.prototype.toXML = function() {
    return this.xml || '';
}

WSDL.prototype.xmlToObject = function(xml) {
    var self = this,
        parser = new expat.Parser('UTF-8'),
        objectName = null,
        root = {},
        schema = {
            Envelope: {
                Header: {
                        Security: {
                            UsernameToken: {
                                Username: 'string',
                                Password: 'string' }}},
                Body: {
                    Fault: { faultcode: 'string', faultstring: 'string', detail: 'string' }}}},
        stack = [{name: null, object: root, schema: schema}];

    var refs = {}, id; // {id:{hrefs:[],obj:}, ...}

    parser.on('startElement', function(nsName, attrs) {
        var name = splitNSName(nsName).name,
            top = stack[stack.length-1],
            topSchema = top.schema,
            obj = {};
        var originalName = name;

        if (!objectName && top.name === 'Body' && name !== 'Fault') {
            var message = self.definitions.messages[name];
            // Support RPC/literal messages where response body contains one element named
            // after the operation + 'Response'. See http://www.w3.org/TR/wsdl#_names
            if (!message) {
               // Determine if this is request or response
               var isInput = false;
               var isOutput = false;
               if ((/Response$/).test(name)) {
                 isOutput = true;
                 name = name.replace(/Response$/, '');
               } else if ((/Request$/).test(name)) {
                 isInput = true;
                 name = name.replace(/Request$/, '');
               } else if ((/Solicit$/).test(name)) {
                 isInput = true;
                 name = name.replace(/Solicit$/, '');
               }
               // Look up the appropriate message as given in the portType's operations
               var portTypes = self.definitions.portTypes;
               var portTypeNames = Object.keys(portTypes);
               // Currently this supports only one portType definition.
               var portType = portTypes[portTypeNames[0]];
               if (isInput) name = portType.methods[name].input.$name;
               else name = portType.methods[name].output.$name;
               message = self.definitions.messages[name];
               // 'cache' this alias to speed future lookups
               self.definitions.messages[originalName] = self.definitions.messages[name];
            }

            topSchema = message.description(self.definitions);
            objectName = originalName;
        }

				if(attrs.href) {
					id = attrs.href.substr(1);
					if(!refs[id]) refs[id] = {hrefs:[],obj:null};
					refs[id].hrefs.push({par:top.object,key:name});
				}
				if(id=attrs.id) {
					if(!refs[id]) refs[id] = {hrefs:[],obj:null};
				}

        if (topSchema && topSchema[name+'[]']) name = name + '[]';
        stack.push({name: originalName, object: obj, schema: topSchema && topSchema[name], id:attrs.id});
    })

    parser.on('endElement', function(nsName) {
        var cur = stack.pop(),
						obj = cur.object,
            top = stack[stack.length-1],
            topObject = top.object,
            topSchema = top.schema,
            name = splitNSName(nsName).name;

        if (topSchema && topSchema[name+'[]']) {
            if (!topObject[name]) topObject[name] = [];
            topObject[name].push(obj);
        }
        else if (name in topObject) {
            if (!Array.isArray(topObject[name])) {
                topObject[name] = [topObject[name]];
            }
            topObject[name].push(obj);
        }
        else {
            topObject[name] = obj;
        }

				if(cur.id) {
					refs[cur.id].obj = obj;
				}
    })

    parser.on('text', function(text) {
        text = utils.trim(text);
        if (!text.length) return;

        var top = stack[stack.length-1];
        var name = splitNSName(top.schema).name,
            value;
        if (name === 'int' || name === 'integer') {
            value = parseInt(text, 10);
        } else if (name === 'bool' || name === 'boolean') {
            value = text.toLowerCase() === 'true' || text === '1';
        } else if (name === 'dateTime') {
            value = new Date(text);
        } else {
            // handle string or other types
            if (typeof top.object !== 'string') {
                value = text;
            } else {
                value = top.object + text;
            }
        }
        top.object = value;
    });

    if (!parser.parse(xml, false)) {
        throw new Error(parser.getError());
    }

		for(var n in refs) {
			var ref = refs[n];
			var obj = ref.obj;
			ref.hrefs.forEach(function(href) {
				href.par[href.key] = obj;
			});
		}

    var body = root.Envelope.Body;
    if (body.Fault) {
        throw new Error(body.Fault.faultcode+': '+body.Fault.faultstring+(body.Fault.detail ? ': ' + body.Fault.detail : ''));
    }
    return root.Envelope;
}

WSDL.prototype.objectToDocumentXML = function(name, params, ns, xmlns) {
    var args = {};
    args[name] = params;
    return this.objectToXML(args, null, ns, xmlns);
}

WSDL.prototype.objectToRpcXML = function(name, params, namespace, xmlns) {
    var self = this,
        parts = [],
        defs = this.definitions,
        namespace = namespace || utils.findKey(defs.xmlns, xmlns),
        xmlns = xmlns || defs.xmlns[namespace],
        nsAttrName = '_xmlns';
    parts.push(['<',namespace,':',name,'>'].join(''));
    for (var key in params) {
        if (key != nsAttrName) {
            var value = params[key];
            parts.push(['<',key,'>'].join(''));
            parts.push((typeof value==='object')?this.objectToXML(value):utils.xmlEscape(value));
            parts.push(['</',key,'>'].join(''));
        }
    }
    parts.push(['</',namespace,':',name,'>'].join(''));

    return parts.join('');
}

WSDL.prototype.objectToXML = function(obj, name, namespace, xmlns) {
    var self = this,
        parts = [],
        xmlnsAttrib = false ? ' xmlns:'+namespace+'="'+xmlns+'"'+' xmlns="'+xmlns+'"' : '',
        ns = namespace ? namespace + ':' : '';

    if (Array.isArray(obj)) {
        for (var i=0, item; item=obj[i]; i++) {
            if (i > 0) {
                parts.push(['</',ns,name,'>'].join(''));
                parts.push(['<',ns,name,xmlnsAttrib,'>'].join(''));
            }
            parts.push(self.objectToXML(item, name));
        }
    }
    else if (typeof obj === 'object') {
        for (var name in obj) {
            var child = obj[name];
            parts.push(['<',ns,name,xmlnsAttrib,'>'].join(''));
            parts.push(self.objectToXML(child, name));
            parts.push(['</',ns,name,'>'].join(''));
        }
    }
    else if (obj) {
        parts.push(utils.xmlEscape(obj));
    }
    return parts.join('');
}

WSDL.prototype._xmlnsMap = function() {
    var xmlns = this.definitions.xmlns;
    var str = '';
    for (var alias in xmlns) {
        if (alias === '') continue;
        var ns = xmlns[alias];
        switch(ns) {
            case "http://xml.apache.org/xml-soap" : // apachesoap
            case "http://schemas.xmlsoap.org/wsdl/" : // wsdl
            case "http://schemas.xmlsoap.org/wsdl/soap/" : // wsdlsoap
            case "http://schemas.xmlsoap.org/soap/encoding/" : // soapenc
            case "http://www.w3.org/2001/XMLSchema" : // xsd
                continue;
        }
        if (~ns.indexOf('http://schemas.xmlsoap.org/')) continue;
        if (~ns.indexOf('http://www.w3.org/')) continue;
        if (~ns.indexOf('http://xml.apache.org/')) continue;
        str += ' xmlns:' + alias + '="' + ns + '"';
    }
    return str;
}