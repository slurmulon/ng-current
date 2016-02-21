;(function() {
  var mod = angular.module('ng-current', [])

  /**
   * Establishes a relational context that delegates
   * updates (from top to bottom) according to PubSub
   */
  mod.service('Contexts', function($rootScope) {
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
      
      $rootScope.current[name] = null
    }
    
    /**
     * Creates a generator that allows users to provide
     * a scope binding function that reacts to service
     * changes (needs to re-bind when data changes).
     *
     * @param {Service} angular service
     * @returns {Function} instance refresher accepting an own property to react to (method) and a callback (andThen)
     */
    this.refreshing = function(service) {
      return function(method, andThen) {
        var generator = service[method]

        if (generator instanceof Function) {
          generator().then(function(data) {
            andThen(
              data instanceof Array ? data.map(service.model) : service.model(data)
            )

            $rootScope.$apply()
          })
        }
      }
    }

    /**
     * Creates a scope integration point where changes to the Service
     * are subscribed to and refreshed. The process is repeated
     * for any child related Services should they exist.
     *
     * Essentially subscribes your scope bindings (and those which are
     * related via the "rels" chain) to changes to the Service context.
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

            // delegate subscribed changes to immediate
            // related contexts (shallow)
            if (service.rels && service.rels.length) {
              service.rels.forEach(function(rel) {
                self.publish(rel, data)
              })
            }
          })
        } else {
          console.error('Cannot use invalid service context', service)
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
        this.publish(name, obj)
      }
    }

    /**
     * Determines which object is currently used for the current context
     *
     * @param {String} name service name
     * @returns {Object} currently current state representation of the service
     */
    this.current = function(name) {
      return $rootScope.current[name]
    }
    
    /**
     * Utility function that provides either the current context (by name)
     * or return the first object from the source data set if no current exists.
     *
     * @param {String} name service name
     * @returns {Array} datas data set representing context
     */
    this.currentOrFirstIn = function(name, datas) {
      var current = this.current(name)
      var first   = datas[0]
      
      if (!angular.isObject(current)) {
        return first
      }
      
      return datas.find(function(data) {
        return angular.equals(data, current)
      })
    }
    
    // TODO - currentOr - allows user to provide custom selection function

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
      return new Promise(function(resolve, reject) {
        $rootScope.$on(rel, function(event, data) {
          resolve(
            on(data || {})
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
})();
