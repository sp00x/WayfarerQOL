# Wayfarer Quality of Life Improvements 

TamperMonkey approach at re-implementing some of the features that were in Wayfarer+:

* Keyboard shortcuts for rating
* External maps

## To-do

### Features

* Configurable external maps
* Rejection reason shortcuts

### Implementation

* Rewrite using [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) instead of polling the DOM
