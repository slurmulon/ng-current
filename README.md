# :radio_button: ng-current

> Relational context manager for Angular 1.x

## tl;dr

 * :sparkles: Transparently manage the context-based states of your interdependent `Services` and their related components
 * :art: Non-invasive (convention over configuration) - choose how to integrate and when to use
 * :rocket: Fast, efficient and lazy - based on native PubSub, minimizing the complexity and size of the `$digest` cycle (check out [this post on `$broadcast`](http://www.bennadel.com/blog/2724-scope-broadcast-is-surprisingly-efficient-in-angularjs.htm) for details)
 * :cloud: Light-weight and simple - just over 200 lines of code and only 1.9KB uglified!

## Problem

Have you ever encountered challenges or annoyances with managing
your Angular 1.X application's context of related **currently selected `Service` entities**?:

 * Dangling references to stale data in directives and views
    - Example: The data of the last user still displaying after you re-authenticated as a new user
 * Needing to use `$watch` to ensure new defaults are selected properly
    - Example: A user has quotes, and if you switch users but are still viewing quotes (or even a component distantly related to quotes), you will need to select a new "current" quote and ensure that these components are synchronized properly
 * Functions getting called excessively on the `$digest` cycle in order to help guarantee the "latest and greatest"
 * Needing to "drag along" related user selections across `Services` and other components in order to support state-dependent features that become relevant at a later point
 * Tracking current entities in vanilla `Services`, which by design, do not integrate with the `$digest` cycle and often result in one or more of the aforementioned issues


Managing this current context is trivial when you're only working
with a single disjoint entity (say for instance, an extremely basic `User`),
especially when you can determine the state from a canonical source like a URL:

```
http://example.io/user/3449538
```

However, modern web applications are typically more complicated
and almost always involve multiple relationships and/or hierarchies
between resource and/or `Service` entities.

For example, a `User` of say a construction management portal may be able
to generate multiple construction `Sites`, each  which may have multiple `Quotes`. It is often
the case that one entity of each type may be currently selected in the
application at a time (like when viewing a specific `Quote`, the others
are arguably irrelevant).

As an application grows, it typically becomes unorthodox to
place every relevant entity's identification info in the URL:

```
http://example.io/user/3449538/quote/34324234/site/9883748
```

One can argue that since the IDs should be unique across the API,
the above URL should be reducible to:

```
http://exaple.io/site/9883748
```
In other words, you should only need to know the last entity
in the chain since all of the others can be inferred from it.

Deriving the other entities in this way can become difficult. For instance, a user can technically visit the page from any other page, and thus the proper state of the new page must be accessible and/or determinable from the state of any page preceding it (assuming all data is loaded asynchronously, satisfying SPA)

Tools such as `angular-ui-router` have some success with alleviating this, but in my experience force the user to be overly verbose with redundant generator methods, and worse of all needing to jump through several hoops in order to make the correct data/state accessible to deeply nested components. This stems from the fact that state (and thus isolated scope-bound instances of Services) is exclusively controlled by the current `URL`, and this often makes supporting contextual features that don't quite fit into the URL scheme difficult and complex.

### Multiple "Current"s

In order to track the other selected entities (such as `Site` and `Quote`),
you have a couple of idiomatic options:

 * `Provider`, `Service`, or `Factory` (which by design do NOT
integrate with the `$digest` cycle)
 * Use session storage (same problem as `Provider`)
 * Use `$rootScope` which sacrifices readibility and, justifiably, makes most developers cringe

These can be tolerated for a while, but pretty much all of these will require either the
use of `$watch` or monolthic controllers throughout the app in order to guarantee that your components show only the data that is relevant to the user's current selections (at least without forcing a page refresh,
which breaks SPA and in my opinion damages the user experience and quality of your application).

---

More examples on the challenges involved with SPAs can be
found in [Gooey's README](https://github.com/slurmulon/gooey). Gooey is a small JS library
that takes a hierarchical, bi-directional PubSub approach for generic data synchronization
and involves no polling mechanisms whatsoever.

## Usage

`ng-current` allows you to define a hierarchy of related contexts that that synchronize
with your already-existant `Service`s and components non-invasively.

By establishing the following properties:
 * `this.name` (**required**) a unique name to identify the service (often lowercase version of service)
 * `this.model` (optional) pseudo-constructor function that's refreshed on updates to your Service entities
 * `this.rels` (optional) collection of immediate child entities, order independent

and then registering the service at the end of your definition:

```javascript
// inject `Contexts` service which serves as a transparent state orchestrator for our `Service`(s)
module.service('User', function(Contexts) {
  var self = this

  this.name = 'user'            // rel name to use as primary lookup and to establish relations
  this.rels = ['site', 'quote'] // services that have an immediate relationship / dependency to this service

  this.model = function(user) {
    // model logic for a single `User` entity

    user.firstName = function() {
      return user.givenName + ' ' + user.familyName
    }

    return user
  }

  // arbitrary user defined generator method -
  // typically something using `$http` or `$resource` with cache.
  // multiple users are considered here because
  // more than one user may use the application
  // in a single window session (asynchronous re-authentication)
  this.all = function() {
    return [
      {id: 1, name: 'bob'},
      {id: 2, name: 'donna'}
    ]
  }

  // defines how to determine the "current" user -
  // can be from url, a token, anything!
  // because I'm lazy, this example simply
  // returns the first in the array
  this.current = function() {
    return self.all().then(function(users) {
      return Contexts.getOr('user', users[0])
    })
  }

  // required as the final statement of your `Service`.
  // registers your Service with the global pool
  Contexts.register(this)
})
```

This `Service` can now automatically delegate any relevant updates to it's related Service contexts,
and those `Service`s will then do the same with their own related `Service`s.

In our example any updates to `User` will delegate to `Site` and `Contact`, but they will also reach `Quote` beause `Quote` is related to `Site` which is related to `User`:

                                       User
                                        |
                         +-----------------------------+
                         |                             |
                         v                             v
                       Site                         Contact
                         |
                         |
                         v
                       Quote

We must also define `Site`, `Contact` and `Quote` services that resemble `User`, but are of course free to have their own implementations and functionality:

```javascript
module.service('Site', function(Contexts) {
  var self = this

  this.name = 'site'

  this.model = function(site) {
    site.label = function() {
      return site.street_number + ' ' + site.street_name + ', ' + site.city + ', ' + site.state
    }

    return site
  }

  this.all = function() {
    return [
      {id: 1, street_number: '123', street_name: 'Magic Way', city: 'San Francisco', state: 'CA' },
      {id: 2, street_number: '456', street_name: 'JavaS Way', city: 'San Francisco', state: 'CA' }
    ]
  }

  this.current = function() {
    return self.all().then(function(sites) {
      return Contexts.getOr('site', sites[0])
    })
  }

  Contexts.register(this)
})
```

Once our `Services` are defined and wired together, any components or directives that inherit their contexts will be synchronized accordingly whenever anything related to the context is published or updated:

```javascript
module.directive('currentQuote', function(Contexts, Quote, $log) {
  return {
    restrict: 'EA',
    template: '<h1>Selected Quote</h1><p>{{ quote | json }}</p>',
    controller: function(scope) {
      // this callback will trigger whenever a new `User`, `Site`, or `Quote` is selected :D
      Quote.use('current', function(quote) {
        $log.info('New quote selected', quote)

        scope.quote = quote
      })
    }
  }
})
```

To see a working example, check out this [Plunker](http://plnkr.co/edit/XlQ9ho?p=preview).

## Installation

`npm install ng-current`

Note that this package is not completely suited yet for NPM. I am still working out packaging issues so that this can work transparently on both client / server as an `angular` module, and without loading `angular` twice.

Until I address this problem, you can still use `require` and `import`:

**ES5**
```javascript
var Current = require('ng-current')
```

**ES6**:
```javascript
import Current from 'ng-current'
```

but **be sure to require `angular` first** so that it's accessible to `ng-current`:

```javascript
import angular
import Current from 'ng-current'
```

Then add it to your own module:

```javascript
angular.module('myModule', ['ng-current'])
```

---

If you aren't using a package tool like `webpack` or `browserify`, then you can of course fall back to the traditional method:

**Full**
```html
<script type="text/javascript" src="/node_modules/ng-current/ng-current.js"></script>
```

**Minified**
```html
<script type="text/javascript" src="/node_modules/ng-current/ng-current.min.js"></script>
```
