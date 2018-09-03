'use strict'

var solc = require('solc');
var solcABI = require('solc/abi');
var fs = require('fs');
var compilerInput = require('./compiler-input');
var registry = require('../global/registry');
var txHelper = require('./txHelper');

function Compile() {
	var self = this;

	var compileJSON;
	var currentVersion;

	onInternalCompilerLoaded();

	this.lastCompilationResult = {
		data: null,
		source: null
	}

	this.getContracts = () => {
		if (this.lastCompilationResult.data && this.lastCompilationResult.data.contracts) {
			return this.lastCompilationResult.data.contracts
		}
		return null
	}	

	this.getContract = (name) => {
		if (this.lastCompilationResult.data && this.lastCompilationResult.data.contracts) {
			return txHelper.getContract(name, this.lastCompilationResult.data.contracts)
		}
		return null
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
		console.log('compile');
		internalCompile(files, target);    
	}

	this.compile = compile;

	function onInternalCompilerLoaded() {

		console.log('on Internal Compiler Loaded');
		var compiler = solc;

		currentVersion = compiler.version();

		compileJSON = function(source, optimize, cb) {
			console.log('compile json');

			var missingInputs = [];
			var missingInputsCallback = function (path) {
				missingInputs.push(path);
				return { error: 'Deferred import' }
			}			

			var result;
			var getSource = source.sources;

//			console.log(getSource);

try {
	var input = compilerInput(getSource, {optimize:1, target: getSource.target});				
	result = compiler.compileStandardWrapper(input, missingInputsCallback);
	result = JSON.parse(result);

//				console.log(result);
} catch(exception) {
	result = { error : 'Uncaught JavaScript exception:\n' + exception }
}

compilationFinished(result, missingInputs, getSource);

}
}
function findImports (path) {
	if (path === 'lib.sol')
		return { contents: 'library L { function f() returns (uint) { return 7; } }' }
	else
		return { error: 'File not found' }
}

function compilationFinished (data, missingInputs, source) {
    	var noFatalErrors = true // ie warnings are ok
 //   	console.log(data);
 if (!noFatalErrors) {
 	console.log('no fatal error');
      		// There are fatal errors - abort here
      		self.lastCompilationResult = null
      	} else if (missingInputs !== undefined && missingInputs.length > 0) {
      		console.log('compile error');
      		// try compiling again with the new set of inputs
      		internalCompile(source.sources, source.target, missingInputs)
      	} else {
      		console.log('success');
      		data = updateInterface(data)
      		self.lastCompilationResult = {
      			data: data,
      			source: source
      		}
//      		console.log(self.lastCompilationResult);
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
	console.log('updateInterface');
//		console.log(data);
//		console.log(data.contracts);
txHelper.visitContracts(data.contracts, (contract) => {
//			console.log(contract);
data.contracts[contract.file][contract.name].abi = solcABI.update(truncateVersion(currentVersion), contract.object.abi);
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

