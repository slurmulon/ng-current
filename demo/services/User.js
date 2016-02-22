'use strict'

mod.service('User', function(Contexts) {
  var self = this
  
  this.name = 'user'   // rel name to use as primary lookup and to establish relations
  this.rels = ['site'] // services that are related to and dependent on this service

  this.model = function(user) {
    user.isLoggedIn = function() {
      return false
    }
    
    user.isBanned = function() {
      return user.banned
    }
    
    user.ban = function() {
      user.banned = true // no need to broadcast this change, but we could with Contexts.publish('user') (an alias would be nice here)
    }
    
    return user
  }

  this.resource = {
    get: function() {
      return new Promise(function(resolve) {
        // TODO - replace stub with fancier data allocation logic (from api, cache, etc)
        resolve([
          {
            id: 123,
            email: 'bob@saget.io',
            banned: true,
            sites: [
              {
                id: 1,
                quotes: [
                  {id: 10, product: 'loan'}
                ]
              },
              {
                id: 2,
                quotes: [
                  {id: 20, product: 'cash'},
                  {id: 21, product: 'loan'}
                ]
              },
            ]
          },
          {
            id: 456,
            email: 'donna@bagel.io',
            banned: false,
            sites: [
              {
                id: 3,
                quotes: [
                  {id: 30, product: 'loan'},
                  {id: 31, product: 'cash'}
                ]
              },
              {
                id: 4,
                quotes: [
                  {id: 40, product: 'shark'},
                  {id: 41, product: 'gold'}
                ]
              }
            ]
          }
        ])
      })
    }
  }
  
  this.current = function() {
    return this.all().then(function(users) {
      return Contexts.currentOr('user', {
        use  : users,
        none : users[0]
      })
    })
  }
  
  this.byId = function(id) {
    return this.all().then(function(users) {
      return _.find(users, { id: id })
    })
  }
  
  this.all = function() {
    return self.resource.get().then(function(users) {
      return users
    })
  }
  
  Contexts.register(this)
})
