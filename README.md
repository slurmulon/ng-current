# :radio_button: ng-current

> Relational context manager for Angular

## The "Current" Problem

Have you ever encountered challenges or annoyances with managing
your Angular 1.X application's context of related **currently selected `Service` entities**?

 * Dangling references to stale data in directives and views
    - Example: The quote of another user still displaying after you logged out
 * Needing to use `$watch` to ensure new defaults are selected properly
    - Example: A user has quotes, and if you switch users but are still viewing quotes, you may need to select a new "current" quote
 * Functions getting called excessively on the `$digest` cycle in order to help guarantee the "latest and greatest"
 * Tracking current entities in vanilla `Services`, which by design, doesn't integrate with the `$digest` cycle, often resulting in one or more of the aforementioned issues

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
to generate multiple `Sites`, each  which may have multiple `Quotes`. It is often
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

### Multiple "Current"s

In order to track the other selected entities (such as `Site` and `Quote`),
you have a couple of idiomatic options:

 * `Provider`, `Service`, or `Factory` (which by design do NOT
integrate with the `$digest` cycle)
 * Use session storage (same problem as `Provider`)
 * Use `$rootScope` which sacrifices readibility and, justifiably, makes most developers cringe

These can be tolerated for a while, but pretty much all of these will require the
use of `$watch` throughout the app in order to guarantee that your data shows
only the data that is relevant to the user's current selections (at least without forcing a page refresh,
which in my opinion damages the user experience and the quality of your application).

---

More examples on the challenges involved with SPA applications can be
found in [Gooey's README](https://github.com/slurmulon/gooey). Gooey is a small JS library
that takes a hierarchical, bi-directional PubSub approach for generic data synchronization
and involves no polling mechanisms whatsoever.

## Usage

ng-current allows you to define a hierarchy of related contexts that that synchronize
with your already-existant `Service`s non-invasively.

By establishing the following properties:
 * `this.name` (required) a unique name to identify the service (often lowercase version of service)
 * `this.model` (required) pseudo-constructor function that's is refreshed on updates to your Service
 * `this.rels` (optional) set of related child entities

and then registering the service at the end of your definition:

```javascript
'use strict'

mod.service('User', function(Contexts) {
  var self = this
  
  this.name = 'user'            // rel name to use as primary lookup and to establish relations
  this.rels = ['site', 'quote'] // services that have an immediate relationship / dependency to this service

  this.model = function(user) {
    // ... logic for a Service entity
    return user
  }

  // arbitrary user defined generator method -
  // typically something using `$http` or `$resource` with cache
  this.all = function() {
    return [
      {id: 1, name: 'bob'},
      {id: 2, name: 'donna'}
    ]
  }

  // defines how to determine the "current" user -
  // can be from url, a token, anything!
  // because I'm lazy, this example simply
  // returns the first in the array (`none` property)
  this.current = function() {
    return this.all().then(function(users) {
      return Contexts.currentOr('user', { none : users[0] })
    })
  }

  // required as the final definition of your Service.
  // registers your Service with the global pool
  Contexts.register(this)
})
```

This `Service` can now automatically delegate any relevant updates to it's related Service contexts,
and those `Service`s will then do the same with their own related `Service`s (in this case, the `Service`s
with the context names `site` and `quote`)

To see a working example, check out this [Plunker](http://plnkr.co/edit/MsyTZ4?p=info)

