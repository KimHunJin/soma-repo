'use strict'
var executionContext = require('./execution-context');
var TxRunner = require('ethereumjs-tx');
var ethJSUtil = require('ethereumjs-util');
var globalRegistry = require('./global/registry');

function UniversalDApp (opts, localRegistry) {
  var self = this
  self.data = {}
  self._components = {}
  self._components.registry = localRegistry || globalRegistry
  self.removable = opts.removable
  self.removable_instances = opts.removable_instances
  // self._deps = {
  //   config: self._components.registry.get('config').api,
  //   compiler: self._components.registry.get('compiler').api,
  //   logCallback: self._components.registry.get('logCallback').api
  // }
  // self._txRunnerAPI = {
  //   config: self._deps.config,

  //   personalMode: () => {
  //     return self._deps.config.get('settings/personal-mode')
  //   }
  // }
  self.txRunner = new TxRunner({});
  self.data.contractsDetails = {};
  // self._deps.compiler.event.register('compilationFinished', (success, data, source) => {
  //   self.data.contractsDetails = success && data ? data.contracts : {}
  // })
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
  // this.txRunner.event.register('transactionBroadcasted', (txhash) => {
  //   executionContext.detectNetwork((error, network) => {
  //     if (!error && network) {
  //       var txLink = executionContext.txDetailsLink(network.name, txhash)
  //       if (txLink) this._deps.logCallback(yo`<a href="${txLink}" target="_blank">${txLink}</a>`)
  //     }
  //   })
  // })
}

UniversalDApp.prototype._addAccount = function (privateKey, balance) {
  var self = this

  if (self.accounts) {
    privateKey = new Buffer(privateKey, 'hex')
    var address = ethJSUtil.privateToAddress(privateKey)

    // FIXME: we don't care about the callback, but we should still make this proper
    executionContext.vm().stateManager.putAccountBalance(address, balance || '0xf00000000000000001', function cb () {})
    self.accounts['0x' + address.toString('hex')] = { privateKey: privateKey, nonce: 0 }
  }
}

module.exports = UniversalDApp;