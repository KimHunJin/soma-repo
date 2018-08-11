'use strict'

var solc = require('solc');
var fs = require('fs');
var compilerInput = require('./compiler-input');
var registry = require('../global/registry');

function Compile {
	var self = this;

	var compileJSON;

	this.lastCompilationResult = {
		data: null,
		source: null
	}

	var internalCompile = function (files, target, missingInputs) {
    	compileJSON(input, optimize ? 1 : 0);
  	}

  	var compile = function (files, target) {
    	internalCompile(files, target);
  	}

	function compileSource() {

		var input = compilerInput();

		compileJSON = function(source, optimize, cb) {
        	var missingInputs = [];
        	var missingInputsCallback = function (path) {
          		missingInputs.push(path);
          		return { error: 'Deferred import'; }
        	}			
			var result;
        	try {
        		var input = compilerInput(source.sources, {optimize: optimize, target: source.target});
        		result = compiler.compileStandardWrapper(input, missingInputsCallback);
        		result = JSON.parse(result);
        	} catch (exception) {
        		result = { error: 'Uncaught JavaScript exception:\n' + exception; }
        	}
        	compilationFinished(result, missingInputs, source);
		}
		fs.readFile('./contract/Casino.sol', 'utf8', function(err, data) {
			if(err) {
				throw err
			};
		// compiler version get from online
			solc.loadRemoteVersion('latest', function (err, solcSnapshot) {
				if (err) {
					console.log(err);
				}

				var p = new Promise(
					function(res, rej) {
						res(solcSnapshot.compile(data, 1));
					}
				);
				p.then(
					function(val) {
						var bytecode = val.contracts[':Casino'].bytecode; // bytecode
						console.log(bytecode);	

						var abi = JSON.parse(val.contracts[':Casino'].interface); // abi
						console.log(abi);
					}
				);
			});
		});	
	}
  
	function compilationFinished (data, missingInputs, source) {
    	var noFatalErrors = true // ie warnings are ok

    	if (!noFatalErrors) {
      		// There are fatal errors - abort here
    		self.lastCompilationResult = null
    		self.event.trigger('compilationFinished', [false, data, source])
    	} else if (missingInputs !== undefined && missingInputs.length > 0) {
      		// try compiling again with the new set of inputs
//      		internalCompile(source.sources, source.target, missingInputs)
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
      		data.contracts[contract.file][contract.name].abi = solcABI.update(truncateVersion(currentVersion), contract.object.abi);
    	});
    	return data;
  	}
}


module.exports = Compile;

