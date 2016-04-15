'use strict'

mod.config(function($httpBackend) {
  $httpBackend
    .when('GET', '/api/user')
    .respond([
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
    ], {Token: 'abc-123'})
})

mod.service('User', function($q, $http, $routeParams, $location, Contexts, Auth) {
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
    cache: {},
    get: function() {
      return $q(function(resolve) {
        if (angular.equals({}, self.resource.cache)) {
          return $http.get('/api/user').then(function(user) {
            self.resource.cache = [user]

            resolve([user]) // so we don't have to differentiate between one and many (for example purposes only, User.all() isn't very practical in a real app)
          })
        }
        
        resolve(self.resource.cache)
      })
    }
  }
  
  this.current = function() {
    return Auth
      .current()
      .then(function() {
        return Contexts.currentOr('user', users[0])
      })
      .catch(function() {
        $location.path('/login')
      })
  }
  
  this.byId = function(id) {
    return this.all().then(function(users) {
      return _.find(users, { id: id })
    })
  }
  
  Contexts.register(this)
})
