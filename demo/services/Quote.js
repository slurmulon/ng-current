'use strict'

mod.service('Quote', function(Contexts, Site) {
  var self = this
  
  this.name = 'quote'
  
  this.model = function(quote) {
    console.log('--- quote model', quote)
    // ...
    return quote
  }
  
  this.all = function() {
    return Site.current().then(function(site) {
      return site.quotes
    })
  }
  
  this.current = function() {
    return Site.current().then(function(site) {
      return Contexts.currentOr('quote', { none: site.quotes[0] }) // provide first by default (TODO - something fancier)
    })
  }
  
  Contexts.register(this)
})
