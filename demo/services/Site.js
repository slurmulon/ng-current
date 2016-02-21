'use strict'

mod.service('Site', function(Contexts, User) {
  var self = this
  
  this.name = 'site'
  this.rels = ['quote', 'system']
  
  this.model = function(site) {
    console.log('--- site model', site)
    // ...
    return site
  }
  
  this.all = function() {
    return User.current().then(function(user) {
      return user.sites
    })
  }
  
  this.byId = function(id) {
    return this.all().then(function(sites) {
      return sites.find(function(site) {
        return site.id === id
      })
    })
  }
  
  this.current = function() {
    return User.current().then(function(user) {
      return Contexts.currentOrFirstIn('site', user.sites)
    })
  }
  
  Contexts.register(this)
})
