# Wayfarer Quality of Life Improvements 

TamperMonkey approach at re-implementing some of the features that were in Wayfarer+:

* Remaining time countdown
* Keyboard shortcuts for rating
* External maps

## To-do

### Features

* Configurable external maps
* Rejection reason shortcuts
* Image review QOL improvements (?)
* Edit review QOL improvements (?)
  * original location
  * external maps

### Implementation

* Rewrite using [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) instead of polling the DOM

### Known issues

* Countdown keeps running after finishing reviewing
