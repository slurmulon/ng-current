;(function(angular) {
  'use strict'

  var mod = angular.module('ng-current', [])

  /**
   * Establishes a relational context that delegates
   * updates (from top to bottom) according to PubSub
   */
  mod.service('Contexts', function($log, $rootScope, $q) {
    var self = this

    /**
     * Tracks all context relations
     */
    this.contexts = {}

    /**
     * Stores current active state for each registered context (by rel)
     */
    $rootScope.current = {}

    /**
     * Registers a service as a context and subscribes the provided
     * service's model to its own changes
     * 
     * @param {Object} service typically `this` of the service
     */
    this.register = function(service) {
      this.contexts[service.name] = service.rels || []
      
      service.refresh = self.refreshing(service)
      service.use     = self.using(service)

      service.constructor.prototype = this.constructor.prototype
      
      $rootScope.current[name] = {}
    }
    
    /**
     * Creates a generator that allows users to provide
     * a binding function that reacts to a single Service's
     * changes (in other words, lazy functionality or data 
     * that needs to re-process when data changes).
     *
     * @param {Service} angular service
     * @returns {Function} instance refresher accepting an own property to react to (method) and a callback (andThen)
     */
    this.refreshing = function(service) {
      return function(method, andThen) {
        var generator = service[method]
        var model     = service.model || function(data) { return data }

        if (generator instanceof Function) {
          generator().then(function(data) {
            andThen(
              data instanceof Array ? data.map(service.model) : service.model(data)
            )
          })
        } else {
          $log.error('[ng-current.refreshing] failed to find method on service', method)
        }
      }
    }

    /**
     * Creates an integration point where changes to the Service
     * are subscribed to and published hierarchically (single direction, down)
     * to any child Services. Nested publications occur transparently in their
     * own respective Services and are not invoked here.
     *
     * Generally used for subscribing and synchronizing your scope bindings to changes
     * that occur in the appropriate Service context tree/sub-tree (single direction, down).
     *
     * @param {Service} service angular service
     * @returns {Function} usage point accepting an own property to react to (method) and a callback (andThen)
     */
    this.using = function(service) {
      return function(method, andThen) {
        // invoke refresh immediately and then ensure that provided
        // method is subscribed and refreshed w/ future updates to the service
        if (service.constructor.prototype === this.constructor.prototype) {
          service.refresh(method, andThen)

          self.subscribe(service.name, function(data) {
            service.refresh(method, andThen)

            // delegate subscribed changes to immediate related contexts (shallow)
            if (service.rels && service.rels.length) {
              service.rels.forEach(function(rel) {
                self.publish(rel, data)
              })
            }
          })
        } else {
          $log.error('[ng-current.using] malformed Service context, please ensure you have added `Contexts.register(this)` at the end of this service', service)
        }
      }
    }

    /**
     * Clears out a context's current state and then traverses its
     * relationships recursively until all dependent states have
     * been cleared as well.
     * 
     * @param {String} name service name
     */
    this.clear = function(name) {
      (self.contexts[name] || []).forEach(function(rel) {
        delete $rootScope.current[rel]
        
        var next = self.contexts[rel]
        
        if (next instanceof Array && next.length) {
          next.forEach(self.clear)
        }
      })
    }
    
    /**
     * Establishes a new current context for
     * a service by name/rel and publishes event
     * 
     * @param {String} name service name
     * @param {Object} object to use as representation of current state
     */
    this.select = function(name, obj) {
      var old = $rootScope.current[name]
      
      // only publish update if the current value has changed
      if (!angular.equals(obj, old)) {
        $rootScope.current[name] = obj
        
        // ensure all related (and stale) rel contexts are
        // cleared when this a new context becomes current
        self.clear(name)
        
        // notify related contexts about your new state
        self.publish(name, obj)
      }
    }

    /**
     * Determines which object is currently used for the current Service context
     *
     * @param {String} name service name
     * @returns {Object} currently current state representation of the service
     */
    this.current = function(name) {
      return $rootScope.current[name]
    }
    
    /**
     * Utility function that provides either the current context (by name)
     * or, if the context has not been established yet, the `none` object.
     *
     * @param {String} name service name
     * @param {Object} none object to use as initial context when none exists yet
     * @returns {Object} current service context or `none` if it doesn't exist
     */
    this.currentOr = function(name, none) {
      var current = this.current(name)

      // provide "none" object when no current context exists yet
      if (!angular.isObject(current) && !angular.isUndefined(none)) {
        return none
      }

      return current
    }

    /**
     * Simple succinct aliases for getting current contexts
     */
    this.get   = self.current
    this.getOr = self.currentOr

    /**
     * Subscribes to a specific relation, performing
     * the user provided behavior whenever a related
     * publication occurs
     * 
     * @param {String} rel relation to subscribe to
     * @param {Function} on behavior to invoke on publication
     * @returns {Promise}
     */
    this.subscribe = function(rel, on) {
      return $q(function(resolve, reject) {
        $rootScope.$on(rel, function(event, data) {
          resolve(
            on(data || {}, event)
          )
        })
      })
    }
    
    /**
     * Publishes data to a service by its registered "rel".
     * If the service has any "rels", publish to those as well.
     * This process does not repeat (shallow)
     * 
     * @param {String} rel the relation
     * @param {Object} data
     */
    this.publish = function(rel, data) {
      var rels = self.contexts[rel]                // related services to publish to next
      var pubs = rels ? [rel].concat(rels) : [rel] // complete set of services to publish to

      // broadcast data by traversing (top to bottom) shallow heirarchy
      // of directly related contexts (only 1 level deep)
      pubs.forEach(function(pub) {
        if (pub.constructor === String) {
          $rootScope.$broadcast(pub, data)
        } else {
          throw 'rels must be Strings'
        }
      })
    }
  })
})(angular);
