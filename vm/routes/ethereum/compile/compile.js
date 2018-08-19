'use strict'

var solc = require('solc');
var fs = require('fs');
var compilerInput = require('./compiler-input');
var registry = require('../global/registry');
var txHelper = require('./txHelper');

function Compile() {
	var self = this;

	var compileJSON;

	onInternalCompilerLoaded();

	this.lastCompilationResult = {
		data: null,
		source: null
	}

	var internalCompile = function (files, target, missingInputs) {
		// input 
		// {
		//		'sources' : files
		//		'target' : target
		// }

		var input = {
			'sources' : files,
			'target' : target
		};
    	compileJSON(input, 1);
  	}

  	var compile = function (files, target) {
    	internalCompile(files, target);
  	}

  	this.compile = compile;

	function onInternalCompilerLoaded() {

//		var input = compilerInput();
		var compiler = solc;
		compileJSON = function(source, optimize, cb) {

        	var missingInputs = [];
        	var missingInputsCallback = function (path) {
          		missingInputs.push(path);
          		return { error: 'Deferred import' }
        	}			


        	console.log(source);
        	console.log(source.sources);
			var result;
        	try {
        		var input = compilerInput(source.sources, {optimize: 1, target: source.target});
        		result = compiler.compileStandardWrapper(input, missingInputsCallback);
        		result = JSON.parse(result);
        		console.log(result);
        	} catch (exception) {
        		result = { 
        			error: 'Uncaught JavaScript exception:\n' + exception
        		}
        	}
        	compilationFinished(result, missingInputs, source);
		}
	}

  
	function compilationFinished (data, missingInputs, source) {
    	var noFatalErrors = true // ie warnings are ok

    	if (!noFatalErrors) {
      		// There are fatal errors - abort here
    		self.lastCompilationResult = null
    	} else if (missingInputs !== undefined && missingInputs.length > 0) {
      		// try compiling again with the new set of inputs
      		internalCompile(source.sources, source.target, missingInputs)
    	} else {
    		data = updateInterface(data)
    		self.lastCompilationResult = {
        		data: data,
        		source: source
      		}
    	}
  	}

  	function truncateVersion (version) {
   		var tmp = /^(\d+.\d+.\d+)/.exec(version);
    	if (tmp) {
      		return tmp[1];
    	}
    	return version;
  	}

	function updateInterface (data) {
		txHelper.visitContracts(data.contracts, (contract) => {
      		contracts[contract.file][contract.name].abi = solcABI.update(truncateVersion(currentVersion), contract.object.abi);
    	});
    	return data;
  	}
  	function loadInternal (url) {
    	delete window.Module
    	// NOTE: workaround some browsers?
    	window.Module = undefined

    // Set a safe fallback until the new one is loaded
    	setCompileJSON(function (source, optimize) {
    	  compilationFinished({ error: { formattedMessage: 'Compiler not yet loaded.' } })
    	})

	    var newScript = document.createElement('script')
   		newScript.type = 'text/javascript'
    	newScript.src = url
    	document.getElementsByTagName('head')[0].appendChild(newScript)
    	var check = window.setInterval(function () {
    		if (!window.Module) {
        		return
      		}
     		window.clearInterval(check)
     		onInternalCompilerLoaded()
    		}, 200)
  	}

}


module.exports = Compile;

