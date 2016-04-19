'use strict'

mod.service('Auth', function($q, $http, Contexts) {
  var self = this
  
  this.name = 'auth'
  this.rels = ['user']

  this.login = function(user, password) {
    return {user: user, password: password, uuid: 'ae72d5c8-60cd-4680-a327-54e5c2d1937a'}
  }

  this.token = function(user, password) {
    return self.login(user, password).then(function(user) {
      return {token: user.uuid, time: new Date()}
    })
  }

  this.current = function() {
    return self.token('fake@stub.io', 'pass123').then(function(auth) {
      return Contexts.currentOr('auth', auth)
    })
  }

  Contexts.register(this)
})
