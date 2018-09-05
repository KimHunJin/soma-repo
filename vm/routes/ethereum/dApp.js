'use strict'
var executionContext = require('./execution-context');
var async = require('async')
var ethJSUtil = require('ethereumjs-util');
var BN = ethJSUtil.BN;
var globalRegistry = require('./global/registry');
var txExecution = require('./txExecution');
var EventManasger = require('./eventManager');
var crypto = require('crypto');
var txHelper = require('./txHelper');
var TxRunner = require('./txRunner');

function UniversalDApp (opts, localRegistry) {
  var self = this
  this.event = new EventManasger();
  self.data = {}
  self._components = {}
  self._components.registry = localRegistry || globalRegistry;
  self.removable = opts.removable;
  self.removable_instances = opts.removable_instances;

  self.txRunner = new TxRunner({});
  self.data.contractsDetails = {};

  self.accounts = {}
  self.resetEnvironment()
}

UniversalDApp.prototype.resetEnvironment = function () {
  this.accounts = {}
  this._addAccount('3cd7232cd6f3fc66a57a6bedc1a8ed6c228fff0a327e169c2bcc5e869ed49511', '0x56BC75E2D63100000')
  this._addAccount('2ac6c190b09897cd8987869cc7b918cfea07ee82038d492abce033c75c1b1d0c', '0x56BC75E2D63100000')
  this._addAccount('dae9801649ba2d95a21e688b56f77905e5667c44ce868ec83f82e838712a2c7a', '0x56BC75E2D63100000')
  this._addAccount('d74aa6d18aa79a05f3473dd030a97d3305737cbc8337d940344345c1f6b72eea', '0x56BC75E2D63100000')
  this._addAccount('71975fbf7fe448e004ac7ae54cad0a383c3906055a65468714156a07385e96ce', '0x56BC75E2D63100000')
  executionContext.vm().stateManager.cache.flush(function () {})
  this.txRunner = new TxRunner(this.accounts);
}

UniversalDApp.prototype.resetAPI = function (transactionContextAPI) {
  this.transactionContextAPI = transactionContextAPI;
}

UniversalDApp.prototype.createVMAccount = function (privateKey, balance, cb) {
  this._addAccount(privateKey, balance);
  privateKey = new Buffer(privateKey, 'hex');
  cb(null, '0x' + ethJSUtil.privateToAddress(privateKey).toString('hex'));
}

UniversalDApp.prototype._addAccount = function (privateKey, balance) {
  var self = this;

  if (self.accounts) {
    privateKey = new Buffer(privateKey, 'hex');
    var address = ethJSUtil.privateToAddress(privateKey);

    // FIXME: we don't care about the callback, but we should still make this proper
    executionContext.vm().stateManager.putAccountBalance(address, balance || '0xf00000000000000001', function cb () {});
    self.accounts['0x' + address.toString('hex')] = { privateKey: privateKey, nonce: 0 };
  }
}

UniversalDApp.prototype.getAccounts = function (cb) {
  var self = this

  if (!self.accounts) {
    return cb('No accounts?')
  }

  cb(null, Object.keys(self.accounts))
}

UniversalDApp.prototype.pendingTransactions = function () {
  return this.txRunner.pendingTxs;
}

UniversalDApp.prototype.pendingTransactionsCount = function () {
  return Object.keys(this.txRunner.pendingTxs).length;
}

UniversalDApp.prototype.getABI = function (contract) {
  return txHelper.sortAbiFunction(contract.abi)
}

UniversalDApp.prototype.getBalance = function (address, cb) {
  var self = this

  address = ethJSUtil.stripHexPrefix(address)

  if (!self.accounts) {
    return cb('No accounts?')
  }

  executionContext.vm().stateManager.getAccountBalance(new Buffer(address, 'hex'), function (err, res) {
    if (err) {
      cb('Account not found')
    } else {
      cb(null, new BN(res).toString(10))
    }
  })
  
}

UniversalDApp.prototype.newAccount = function (password, cb) {

  var privateKey
  do {
    privateKey = crypto.randomBytes(32)
  } while (!ethJSUtil.isValidPrivate(privateKey))
  this._addAccount(privateKey, '0x56BC75E2D63100000')
  cb(null, '0x' + ethJSUtil.privateToAddress(privateKey).toString('hex'))
}

UniversalDApp.prototype.call = function (isUserAction, args, value, lookupOnly, outputCb) {
  const self = this;
  var logMsg;
  if (isUserAction) {
    if (!args.funABI.constant) {
      logMsg = `transact to ${args.contractName}.${(args.funABI.name) ? args.funABI.name : '(fallback)'}`;
    } else {
      logMsg = `call to ${args.contractName}.${(args.funABI.name) ? args.funABI.name : '(fallback)'}`;
    }
  }
  // contractsDetails is used to resolve libraries
  txFormat.buildData(args.contractName, args.contractAbi, self.data.contractsDetails, false, args.funABI, value, (error, data) => {
    if (!error) {
      if (isUserAction) {
        if (!args.funABI.constant) {
          self._deps.logCallback(`${logMsg} pending ... `);
        } else {
          self._deps.logCallback(`${logMsg}`);
        }
      }
      self.callFunction(args.address, data, args.funABI, (error, txResult) => {
        if (!error) {
          var isVM = executionContext.isVM();
          if (isVM) {
            var vmError = txExecution.checkVMError(txResult);
            if (vmError.error) {
              self._deps.logCallback(`${logMsg} errored: ${vmError.message} `);
              return;
            }
          }
          if (lookupOnly) {
            var decoded = txResult.result.vm.return;
            outputCb(decoded);
          }
        } else {
          self._deps.logCallback(`${logMsg} errored: ${error} `)
        }
      })
    } else {
      self._deps.logCallback(`${logMsg} errored: ${error} `)
    }
  }, (msg) => {
    self._deps.logCallback(msg);
  }, (data, runTxCallback) => {
    // called for libraries deployment
    self.runTx(data, runTxCallback);
  });
}

UniversalDApp.prototype.createContract = function (data, callback) {
  console.log(data);
  this.runTx({data: data, useCall: false}, (error, txResult) => {
    // see universaldapp.js line 660 => 700 to check possible values of txResult (error case)
    callback(error, txResult)
  });
}

UniversalDApp.prototype.runTx = function (args, cb) {
  const self = this
  async.waterfall([
    function getGasLimit (next) {
      if (self.transactionContextAPI.getGasLimit) {
        return self.transactionContextAPI.getGasLimit(next);
      }
      next(null, 3000000)
    },
    function queryValue (gasLimit, next) {
      if (args.value) {
        return next(null, args.value, gasLimit)
      }
      if (args.useCall || !self.transactionContextAPI.getValue) {
        return next(null, 0, gasLimit)
      }
      self.transactionContextAPI.getValue(function (err, value) {
        next(err, value, gasLimit);
      })
    },
    function getAccount (value, gasLimit, next) {
      if (args.from) {
        return next(null, args.from, value, gasLimit);
      }
      if (self.transactionContextAPI.getAddress) {
        return self.transactionContextAPI.getAddress(function (err, address) {
          next(err, address, value, gasLimit);
        })
      }
      self.getAccounts(function (err, accounts) {
        let address = accounts[0];

        if (err) return next(err);
        if (!address) return next('No accounts available');
        if (executionContext.isVM() && !self.accounts[address]) {
          return next('Invalid account selected');
        }
        next(null, address, value, gasLimit);
      })
    },
    function runTransaction (fromAddress, value, gasLimit, next) {
      console.log(args);
      var tx = { to: args.to, data: args.data.dataHex, useCall: args.useCall, from: fromAddress, value: value, gasLimit: gasLimit }
      var payLoad = { funAbi: args.data.funAbi, funArgs: args.data.funArgs, contractBytecode: args.data.contractBytecode, contractName: args.data.contractName }
      var timestamp = Date.now();

      // self.event.trigger('initiatingTransaction', [timestamp, tx, payLoad])
      self.txRunner.rawRun(tx,
        (network, tx, gasEstimation, continueTxExecution, cancelCb) => {
          if (network.name !== 'Main') {
            return continueTxExecution(null);
          }
          var amount = executionContext.web3().fromWei(typeConversion.toInt(tx.value), 'ether');
          var content = confirmDialog(tx, amount, gasEstimation, self,
            (gasPrice, cb) => {
              let txFeeText, priceStatus;
              // TODO: this try catch feels like an anti pattern, can/should be
              // removed, but for now keeping the original logic
              try {
                var fee = executionContext.web3().toBigNumber(tx.gas).mul(executionContext.web3().toBigNumber(executionContext.web3().toWei(gasPrice.toString(10), 'gwei')));
                txFeeText = ' ' + executionContext.web3().fromWei(fee.toString(10), 'ether') + ' Ether';
                priceStatus = true;
              } catch (e) {
                txFeeText = ' Please fix this issue before sending any transaction. ' + e.message;
                priceStatus = false;
              }
              cb(txFeeText, priceStatus);
            },
            (cb) => {
              executionContext.web3().eth.getGasPrice((error, gasPrice) => {
                var warnMessage = ' Please fix this issue before sending any transaction. ';
                if (error) {
                  return cb('Unable to retrieve the current network gas price.' + warnMessage + error);
                }
                try {
                  var gasPriceValue = executionContext.web3().fromWei(gasPrice.toString(10), 'gwei');
                  cb(null, gasPriceValue);
                } catch (e) {
                  cb(warnMessage + e.message, null, false);
                }
              })
            }
            )
        },
        (error, continueTxExecution, cancelCb) => {
          if (error) {
            // var msg = typeof error !== 'string' ? error.message : error
            // modalDialog('Gas estimation failed', yo`<div>Gas estimation errored with the following message (see below).
            // The transaction execution will likely fail. Do you want to force sending? <br>
            // ${msg}
            // </div>`,
              // {
                // label: 'Send Transaction',
                // fn: () => {
                  // continueTxExecution()
                // }}, {
                  // label: 'Cancel Transaction',
                  // fn: () => {
                    // cancelCb()
                  // }
                // })
              } else {
                continueTxExecution();
              }
            },
            function (okCb, cancelCb) {
          // modalCustom.promptPassphrase(null, 'Personal mode is enabled. Please provide passphrase of account ' + tx.from, '', okCb, cancelCb)
          console.log('account : ' + tx.from);
        },
        function (error, result) {
          let eventName = (tx.useCall ? 'callExecuted' : 'transactionExecuted')
          self.event.trigger(eventName, [error, tx.from, tx.to, tx.data, tx.useCall, result, timestamp, payLoad])

          if (error && (typeof (error) !== 'string')) {
            if (error.message) error = error.message
              else {
                try { error = 'error: ' + JSON.stringify(error) } catch (e) {}
              }
            }
            next(error, result)
          }
          )
    }
    ], cb)
}



module.exports = UniversalDApp;