'use strict'

mod.directive('siteList', function(Contexts, Site) {
  return {
    restrict: 'EA',
    template: '<h1>Sites</h1><li ng-repeat="site in sites">{{site.id}}</li>',
    link: function(scope) {
      Site.use('all', function(sites) {
        scope.sites = sites
      })
    }
  }
})

mod.directive('quoteList', function($rootScope, Quote, Contexts) {
  return {
    restrict: 'EA',
    template: '<h1>Quotes</h1><li ng-repeat="quote in quotes">{{quote.id}}</li>',
    link: function(scope) {
      Quote.use('all', function(quotes) {
        scope.quotes = quotes
      })
    }
  }
})

mod.directive('btnRandSite', function(Site, Contexts) {
  return {
    template: '<button ng-click="select()">Select Random Site</button>',
    replace: true,
    scope: true,
    controller: function($scope) {
      $scope.select = function() {
        Site.all().then(function(sites) {
          var siteIds = sites.map(function(site) {
            return site.id
          })
          
          var randId = siteIds[Math.floor(Math.random() * siteIds.length)]
          
          console.log('selected random site', randId)
          
          return Site.byId(randId).then(function(site) {
            Contexts.select('site', site)
          })
        })
      }
    }
  }
})

mod.directive('btnSwitchUser', function(User, Contexts) {
  return {
    template: '<button ng-click="select()">Switch Users</button>',
    replace: true,
    scope: true,
    controller: function($scope) {
      $scope.select = function() { 
        User.all().then(function(users) {
          var current = Contexts.currentOr('user', users[0])
          var next = users.filter(function(user) {
            return user.id !== current.id
          })[0]
        
          if (next) {
            console.log('next user found', next)

            User.byId(next.id).then(function(user) {
              Contexts.select('user', user)
            })
          }
        })
      }
    }
  }
})