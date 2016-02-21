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
      return Contexts.currentOrFirstIn('quote', sites.quotes)
    })
  }
  
  Contexts.register(this)
})
