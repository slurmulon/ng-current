# :radio_button: ng-current

> Relational context manager for Angular

## The "Current" Problem

Have you ever encountered the challenge of managing
a context of related **currently selected entities** in
a pure Single Page Application (specifically Angular)?

For instance:

 - When a user logs out, ensure that any entities they selected (and their relevant states) are cleared away
 - Ensuring that only the "relevant" entity is displayed without using the URL or some other canonical source
 - Dangling references to stale and/or cached entities (i.e., a previous user's data shows in one or two places)

Managing the current context is trivial when you're only working
with a single a disjoint entity (say for instance, a basic User),
especially when you can determine the correct state from
a canonical source such as a URL:

```
http://example.io/user/3449538
```

However, modern web applications are generally more complicated
and almost always involve multiple relationships and/or hierarchies
between resource entities.

For example, a `User` of say a construction portal may be able to generate
multiple `Sites`, each  which may have multiple `Quotes`. It is often
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
 * Use `$rootScope` which sacrifices readibility and makes most developers cringe

These can be tolerable for a while, but pretty much all of these will require the
use of `$watch` throughout the app in order to guarantee that your data shows
only the data that is relevant to the user's current selections.

---

A more detailed description on the challenges involved with SPA applications can be
found in [Gooey's README](https://github.com/slurmulon/gooey). Gooey is a small JS library
that takes a hierarchical PubSub approach for generic data synchronization and involves
no polling mechanisms whatsoever unlike Angular's `$digest` cycle.

## Usage

ng-current allows you to define a hierarchy of related contexts that that synchronize
with your already-existant `Service`s non-invasively.

By establishing the following properties:
 * `this.name` (required) a unique name to identify the service (often lowercase version of service)
 * `this.model` (required) pseudo-constructor function that's is refreshed on updates to your Service
 * `this.rels` (optional) set of related child entities

and then registering the service at the end of your definition:

```
// ... name, model, rels
// ... normal service stuff

Contexts.register(this)
```

your Service can now automatically delegate any relevant updates to it's related Service contexts,
and those Services will then do the same with their own related Services.

To see a working example, check out this [Plunker](http://TODO)

