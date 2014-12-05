/**
* Spotlight is an extensible utility that enables users to navigate
* Enyo applications using a keyboard or television remote control.
*
* @namespace enyo.Spotlight
*/
enyo.Spotlight = new function() {

    /**
    * Reference to this to be inherited by private closures below.
    * @type {Object}
    * @private
    */
    var _oThis = this,

        /**
        * Topmost component instance where Spotlight events are caught.
        * @type {Object}
        * @default null
        * @private
        */
        _oRoot = null,

        /**
        * Is set by `spot()` if it is called before `initialize()`, will be
        * spotted in `initialize()`.
        * @type {Object}
        * @default null
        * @private
        */
        _oDefaultControl = null,

        /**
        * Whether Spotlight is in pointer mode (as opposed to 5-way mode).
        * @type {Boolean}
        * @default true
        * @private
        */
        _bPointerMode = true,

        /**
        * Whether Spotlight has `_oCurrent`.
        * @type {Boolean}
        * @default false
        * @private
        */
        _bInitialized = false,

        /**
        * State variable allowing us to suppress Spotlight select on
        * keyup in the specific case where a press of the [Enter] key
        * has just triggered a switch from pointer mode to 5-way mode
        * (since we only want to switch modes in this case, not perform
        * a selection)
        * @type {Boolean}
        * @default false
        * @private
        */
        _bSuppressSelectOnNextKeyUp = false,

        /**
        * The currently spotted element.
        * @type {Object}
        * @default null
        * @private
        */
        _oCurrent = null,

        /**
        * The last event received by Spotlight.
        * @type {Object}
        * @default null
        * @private
        */
        _oLastEvent = null,

        /**
        * The last 5-way event received by Spotlight.
        * @type {Object}
        * @default null
        * @private
        */
        _oLast5WayEvent = null,

        /**
        * The last non-container `(spotlight: true)` control that was `_oCurrent`.
        * @type {Object}
        * @default null
        * @private
        */
        _oLastControl = null,

        /**
        * For things like input boxes, we need a way to disable pointer mode while
        * cursor is inside.
        * @type {Boolean}
        * @default true
        * @private
        */
        _bEnablePointerMode = true,

        /**
        * For keeping state consistency between `onMouseDown()` and `onMouseUp()`,
        * if focus has been moved in between.
        * @type {Object}
        * @default null
        * @private
        */
        _oDepressedControl = null,

        /**
        * In verbose mode, Spotlight prints 1) Current 2) Pointer mode change to `enyo.log`.
        * @type {Boolean}
        * @default false
        * @private
        */
        _bVerbose = false,

        /**
        * While frozen, current cannot change and all events are directed to it.
        * @type {Boolean}
        * @default false
        * @private
        */
        _bFrozen = false,

        /**
        * Contains the control specified in `defaultSpotlightDisappear` property of
        * `_oCurrent`.
        * @type {Object}
        * @default null
        * @private
        */
        _oDefaultDisappear = null,

        /**
        * Whether focus is currently visible onscreen `(hasCurrent && !pointingAway)`.
        * @type {Boolean}
        * @default false
        * @private
        */
        _bFocusOnScreen = false,

        /**
        * Number of consecutive mousemoves; `>1` is required to switch to pointer mode.
        * @type {Number}
        * @default 0
        * @private
        */
        _nMouseMoveCount = 0,

        /**
        * @type {Number}
        * @default null
        * @private
        */
        _nPrevClientX = null,

        /**
        * @type {Number}
        * @default null
        * @private
        */
        _nPrevClientY = null,

        /**
        * @type {Object}
        * @default null
        * @private
        */
        _oLastMouseMoveTarget = null,

        /**
        * Timestamp at the last point the pointer was hidden.
        * @type {Number}
        * @default 0
        * @private
        */
        _nPointerHiddenTime = 0,

        /**
        * Length of time in milliseconds required after hiding pointer before 5-way keys
        * are processed.
        * @type {Number}
        * @default 300
        * @private
        */
        _nPointerHiddenToKeyTimeout = 300,

        /**
        * If a key down was ignored, be sure to ignore the following key up. Specifically, this
        * works around the different target keyup for Enter for inputs (input on down, body on up).
        *
        * @type {Number}
        * @default 0
        * @private
        */
        _nIgnoredKeyDown = 0;

        /**
        * @constant
        * @type {Number}
        * @default 1536
        */
    var KEY_POINTER_SHOW = 1536,

        /**
        * @constant
        * @type {Number}
        * @default 1537
        */
        KEY_POINTER_HIDE = 1537;


    var
        /**
        * Event hook to the owner to catch Spotlight events.
        *
        * @private
        */
        _interceptEvents = function() {
            _oThis.rootDispatchFunction = enyo.master.dispatchEvent;
            enyo.master.dispatchEvent = function(sEventName, oEvent, oSender) {
                if (_oThis.rootDispatchFunction.apply(enyo.master, [sEventName, oEvent, oSender])) {
                    return true;
                }
                if (!oEvent.delegate) {
                    return _oThis.onSpotlightEvent(oEvent);
                }
            };
        },

        /**
        * Creates control-specific Spotlight state storage.
        *
        * @param {Object} oControl - The control to be initialized.
        * @private
        */
        _initializeControl = function(oControl) {
            if (typeof oControl._spotlight == 'undefined') {
                oControl._spotlight = {};
            }
        },

        /**
        * Gets control specified in `defaultSpotlightDisappear` property
        * of `_oCurrent`. Gotta get it before it disappears :)
        *
        * @param {Object} oControl
        * @private
        */
        _setDefaultDisappearControl = function() {
            _oDefaultDisappear = enyo.Spotlight.Util.getDefaultDirectionControl(
                'disappear',
                _oCurrent
            );
        },

        /**
        * Observer
        *
        * @param {Object} oControl
        * @private
        */
        _onDisappear = function() {

            // Only handle disappearance once
            if (_onDisappear.isOff) {
                return;
            }

            // Ignore if control is still spotable
            if (_oThis.isSpottable(_oCurrent)) {
                return;
            }
            _onDisappear.isOff = true;
            var oControl = _oDefaultDisappear;

            // Nothing is set in defaultSpotlightDisappear
            if (!oControl || !_oThis.isSpottable(oControl)) {

                // Find first spottable in the app
                oControl = _oThis.getFirstChild(_oRoot);
                if (!oControl) {
                    _unhighlight(_oLastControl);
                    _oLastControl = null;
                    
                    _observeDisappearance(false, _oCurrent);
                    // NULL CASE :(, just like when no spottable children found on init
                    _oCurrent = null;
                    return;
                }

                // Prevent unmanageable case when _oCurrent is undefined
                // if (!oControl) { throw 'SPOTLIGHT: No spottable controls found'; }
            }

            // Spot first child of the app
            _oThis.spot(oControl);
        },

        /**
        * Adds observers on control's parent chain.
        *
        * @param {Boolean} bObserve
        * @param {Object} oControl
        * @param {Boolean} bInAncestor
        * @private
        */
        _observeDisappearance = function(bObserve, oControl, bInAncestor) {

            // Terminal case
            if (!oControl) {
                return;
            }
            var sMethod = bObserve ? 'addObserver' : 'removeObserver';

            // When processing _oCurrent itself
            if (!bInAncestor) {

                // When adding observer to _oCurrent itself
                if (bObserve) {

                    // Set one-time-call flag of _onDisappear function
                    _onDisappear.isOff = false;

                    // Capture defaultSpotlightDisappear control
                    _setDefaultDisappearControl();
                }

                // Enough to check in _oCurrent only, no ancestors
                oControl[sMethod]('disabled', _onDisappear);

                // Enough to check in _oCurrent only, no ancestors
                oControl[sMethod]('destroyed', _onDisappear);

                // Enough to check in _oCurrent only, no ancestors
                oControl[sMethod]('spotlight', _onDisappear);

                // Enough to check in _oCurrent only, no ancestors
                oControl[sMethod]('generated', _onDisappear);
            }

            // Have to add-remove hadler to all ancestors for showing
            oControl[sMethod]('showing', _onDisappear);

            _observeDisappearance(bObserve, oControl.parent, true);
        },

        /**
        * Sets currently spotted control.
        *
        * @param {Object} oControl - The control to be spotted.
        * @private
        */
        _setCurrent = function(oControl) {
            _initializeControl(oControl);

            if (!_oThis.isSpottable(oControl)) {
                throw 'Attempting to spot not-spottable control: ' + oControl.toString();
            }

            var oExCurrent = _oCurrent;

            // Remove spotlight class and Blur
            _oThis.unspot();

            // Add spotlight class
            _highlight(oControl);

            _oCurrent = oControl;

            // Set observers asynchronously to allow painti to happen faster
            setTimeout(function() {
                _observeDisappearance(false, oExCurrent);
                _observeDisappearance(true, _oCurrent);
            }, 1);

            enyo.Spotlight.Container.fireContainerEvents(oExCurrent || _oLastControl, _oCurrent);

            _log('CURRENT =', _oCurrent.toString());
            enyo.Signals.send('onSpotlightCurrentChanged', {
                current: oControl
            });

            if (oControl.spotlight === true) {
                _oLastControl = oControl;
            }

            _dispatchEvent('onSpotlightFocused');

            enyo.Spotlight.TestMode.highlight();

            return true;
        },

        /**
        * Artificially triggers events (e.g., `click`) on current control.
        *
        * @private
        */
        _dispatchEvent = function(sEvent, oData, oControl) {
            oControl = oControl || _oThis.getCurrent();
            return enyo.Spotlight.Util.dispatchEvent(sEvent, oData, oControl);
        },

        /**
        * Moves to nearest neighbor based on 5-way Spotlight event.
        *
        * @param {Object} oEvent - The current 5-way event.
        * @private
        */
        _5WayMove = function(oEvent) {
            var sDirection = oEvent.type.replace('onSpotlight', '').toUpperCase(),
                leave = oEvent.requestLeaveContainer,
                oControl = !leave && enyo.Spotlight.NearestNeighbor.getNearestNeighbor(sDirection);


            // If oEvent.allowDomDefault() was not called
            // this will preventDefault on dom keydown event
            _preventDomDefault(oEvent);
            _oLast5WayEvent = oEvent;

            if (oControl) {
                _oThis.spot(oControl, sDirection);
            } else {
                if (enyo.Spotlight.Accelerator.isAccelerating()) {
                    enyo.Spotlight.Accelerator.cancel();
                } else {
                    var oParent = _oThis.getParent();

                    // Reached the end of spottable world
                    if (!oParent || oParent.spotlightModal) {
                        _oThis.spot(_oLastControl);
                    } else {
                        _oThis.spot(oParent, sDirection);
                    }
                }
            }
        },

        /**
        * Determines whether `oEvent.keyCode` represents a 5-way key.
        *
        * @param {Object} oEvent - The current 5-way event.
        * @return {Boolean} `true` if `keyCode` is a 5-way key (i.e., a directional arrow
        * or Enter); otherwise, `false`.
        * @private
        */
        _is5WayKey = function(oEvent) {

            // 13==Enter, 16777221==KeypadEnter
            return (enyo.indexOf(oEvent.keyCode, [37, 38, 39, 40, 13, 16777221]) > -1);
        },

        /**
        * Determines whether the key that was pressed is supposed to be ignored by the
        * event's originator.  Checks whether the originator of the event had any keyCodes
        * specified as ones to ignore, returning `true` if it was supposed to ignore the
        * `oEvent.keyCode`, or `false` if not.
        *
        * @param {Object} oEvent - The current 5-way event.
        * @return {Boolean} `true` if the keyCode should be ignored; otherwise, `false`.
        * @private
        */
        _isIgnoredKey = function(oEvent) {
            var oOriginator = enyo.$[oEvent.target.id];
            if (oOriginator && oOriginator.spotlightIgnoredKeys) {
                var aKeys = oOriginator.spotlightIgnoredKeys;
                if (!enyo.isArray(aKeys)) {
                    aKeys = [aKeys];
                }
                if (enyo.indexOf(oEvent.keyCode, aKeys) > -1) {
                    return true;
                }
            }
            return false;
        },

        /**
        * Prevents default on DOM event associated with Spotlight event.
        * This is only for 5-way keydown events.
        *
        * @param {Object} oEvent - The current 5-way event.
        * @private
        */
        _preventDomDefault = function(oSpotlightEvent) {

            // Prevent default to keep the browser from scrolling the page, etc.,
            if (_is5WayKey(oSpotlightEvent)) {

                // unless Event.allowDomDefault is explicitly called on the event
                oSpotlightEvent.domEvent.preventDefault();
            }
        },

        /**
        * If originator is container, delegates processing of event
        * to `enyo.Spotlight.Container.onSpotlight*`. If delegate method is
        * found, its return value is returned; otherwise, `true` is returned.
        *
        * @param {Object} oEvent - The current 5-way event.
        * @return {Boolean}
        * @private
        */
        _delegateContainerEvent = function(oEvent) {
            if (oEvent.type && oEvent.type.indexOf('onSpotlight') === 0) {
                if (_oThis.isContainer(oEvent.originator)) {
                    if (typeof enyo.Spotlight.Container[oEvent.type] == 'function') {
                        return enyo.Spotlight.Container[oEvent.type](oEvent.originator, oEvent);
                    }
                }
            }
            return false;
        },

        /**
        * Gets spottable target by id for pointer events.
        *
        * @param {String} sId - String ID of target.
        * @return {Object} - The spottable target.
        * @private
        */
        _getTarget = function(sId) {
            var oTarget = enyo.$[sId];
            if (typeof oTarget != 'undefined') {
                if (_oThis.isSpottable(oTarget)) {
                    return oTarget;
                } else {
                    return _oThis.getParent(oTarget);
                }
            }
        },

        /**
        * Highlights the specified control.
        *
        * @param {Object} oControl - The control to be highlighted.
        * @param {Boolean} bIgnoreMute - Whether muting should be ignored.
        * @private
        */
        _highlight = function(oControl, bIgnoreMute) {

            // Not highlighting when muted
            if (_oThis.isMuted() && !bIgnoreMute) {
                return;
            }

            // Not highlighting containers
            if (_oThis.isContainer(oControl)) {
                return;
            }

            // Not highlighting first non-container control - see this.initialize()
            if (!_oThis.isInitialized()) {
                return;
            }

            // enyo.Spotlight.bench.stop();
            oControl.addClass('spotlight');
            _bFocusOnScreen = true;
        },

        /**
        * Unhighlights a control.
        *
        * @param {Object} oControl - The control to be unhighlighted.
        * @private
        */
        _unhighlight = function(oControl) {
            oControl.removeClass('spotlight');
            _bFocusOnScreen = false;
        },

        /**
        * Determines whether pointer is pointing away.
        *
        * @return {Boolean} `true` if pointer is pointing away; otherwise, `false`.
        * @private
        */
        _isPointingAway = function() {
            return _oThis.getPointerMode() && !_oLastMouseMoveTarget;
        },

        /**
        * Determines whether timestamp is expired.
        *
        * @return {Boolean} `true` if timestamp is expired; otherwise, `false`.
        * @private
        */
        _isTimestampExpired = function() {
            return enyo.perfNow() >= (_nPointerHiddenTime + _nPointerHiddenToKeyTimeout);
        },

        /**
        * Sets the timestamp.
        *
        * @private
        */
        _setTimestamp = function() {
            _nPointerHiddenTime = enyo.perfNow();
        },

        /**
        * Logs messages if verbose mode is enabled.
        *
        * @private
        */
        _log = function() {
            if (_bVerbose) {
                enyo.log('SPOTLIGHT: ' + Array.prototype.slice.call(arguments, 0).join(' '));
            }
        },

        /**
        * Emits warning messages.
        *
        * @name Spotlight#_warn
        * @type {Function}
        * @private
        */
        _warn = function() {
            enyo.warn('SPOTLIGHT: ' + Array.prototype.slice.call(arguments, 0).join(' '));
        },

        /**
        * Spots the last control.
        *
        * @private
        */
        _spotLastControl = function() {
            if (_oThis.isSpottable(_oLastControl)) {
                _oThis.spot(_oLastControl);
            } else {
                _oThis.spot(_oThis.getFirstChild(_oRoot));
            }
        },

        /**
        * Attempts to spot the control nearest the current pointer position.
        * If no nearest control is found, the previous control is spotted.
        *
        * @param {Object} oEvent - The current event.
        * @private
        */
        _spotNearestToPointer = function(oEvent) {
            var oNearest = enyo.Spotlight.
            NearestNeighbor.
            getNearestPointerNeighbor(_oRoot,
                _getSpotDirection(oEvent),
                _nPrevClientX,
                _nPrevClientY);
            if (oNearest) {
                _oThis.spot(oNearest);
            } else {
                _spotLastControl();
            }
        },

        /**
        * Determines the intended direction of a keypress, given a keydown event.
        *
        * @param {Object} oEvent - The event whose direction is to be determined.
        * @private
        */
        _getSpotDirection = function(oEvent) {
            switch (oEvent.keyCode) {
                case 37:
                    return "LEFT";
                case 38:
                    return "UP";
                case 39:
                    return "RIGHT";
                case 40:
                    return "DOWN";
            }
        };

    //* Generic event handlers
    /***************************************************/

    // Events dispatched to the spotlighted controls
    this.onEvent = function(oEvent) {

        // Events only processed when Spotlight initialized with a root
        if (this.isInitialized()) {
            switch (oEvent.type) {
                case 'move':

                    // Only register mousemove if the x/y actually changed,
                    // avoid mousemove while scrolling, etc.
                    // We require two mousemove events to switch to pointer
                    // mode, since the device can send an errant mousemove
                    // when pressing a 5-way key for the first time
                    if (this.clientXYChanged(oEvent) && (_nMouseMoveCount++ > 1)) {
                        return this.onMouseMove(oEvent);
                    }
                    break;
                case 'mousedown':
                    return this.onMouseDown(oEvent);
                case 'mouseup':
                    return this.onMouseUp(oEvent);
                case 'click':
                case 'tap':
                case 'ontap':
                    return this.onClick(oEvent);
                case 'mousewheel':
                    // Don't dispatch spotlight mousewheel events if pointing away
                    if (_isPointingAway()) {
                        return false;
                    }
                    return enyo.Spotlight.Scrolling.processMouseWheel(oEvent, this.onScroll, this);
                case 'keydown':
                    return this.onKeyDown(oEvent);
                case 'keyup':
                    return this.onKeyUp(oEvent);
            }
        }
        return false; // Because we like to be explicit
    };

    /**
    * Receives accelerated keyup and keydown from accelerator.
    *
    * @method
    * @name Spotlight#onAcceleratedKey
    * @param {Object} oEvent - The event to interpret.
    * @public
    */
    this.onAcceleratedKey = function(oEvent) {
        oEvent.domEvent = oEvent;
        oEvent.allowDomDefault = function() {
            oEvent.preventDefault = function() {
                //enyo.log('Dummy function');
            };
        };
        enyo.gesture.drag.prepareHold(oEvent);
        switch (oEvent.type) {
            case 'keydown':
                return _dispatchEvent('onSpotlightKeyDown', oEvent);
            case 'keyup':
                return _dispatchEvent('onSpotlightKeyUp', oEvent);
        }

        return true; // Should never get here
    };

    // Spotlight events bubbled back up to the App
    this.onSpotlightEvent = function(oEvent) {
        _oLastEvent = oEvent;

        if (!_delegateContainerEvent(oEvent)) {
            switch (oEvent.type) {

                /**
                * @event Spotlight#onSpotlightKeyUp
                * @public
                */
                case 'onSpotlightKeyUp':
                    return this.onSpotlightKeyUp(oEvent);

                /**
                * @event Spotlight#onSpotlightKeyDown
                * @public
                */
                case 'onSpotlightKeyDown':
                    return this.onSpotlightKeyDown(oEvent);

                /**
                * @event Spotlight#onSpotlightFocus
                * @public
                */
                case 'onSpotlightFocus':
                    return this.onSpotlightFocus(oEvent);

                /**
                * @event Spotlight#onSpotlightFocused
                * @public
                */
                case 'onSpotlightFocused':
                    return this.onSpotlightFocused(oEvent);

                /**
                * @event Spotlight#onSpotlightBlur
                * @public
                */
                case 'onSpotlightBlur':
                    return this.onSpotlightBlur(oEvent);

                /**
                * @event Spotlight#onSpotlightLeft
                * @public
                */
                case 'onSpotlightLeft':
                    return this.onSpotlightLeft(oEvent);

                /**
                * @event Spotlight#onSpotlightRight
                * @public
                */
                case 'onSpotlightRight':
                    return this.onSpotlightRight(oEvent);

                /**
                * @event Spotlight#onSpotlightUp
                * @public
                */
                case 'onSpotlightUp':
                    return this.onSpotlightUp(oEvent);

                /**
                * @event Spotlight#onSpotlightDown
                * @public
                */
                case 'onSpotlightDown':
                    return this.onSpotlightDown(oEvent);

                /**
                * @event Spotlight#onSpotlightSelect
                * @public
                */
                case 'onSpotlightSelect':
                    return this.onSpotlightSelect(oEvent);
            }
        }
    };

    /**
    * Called by `onEvent()` (via Spotlight scrolling) to process scroll events.
    *
    * @method
    * @name Spotlight#onScroll
    * @param {Object} oEvent - The current event.
    * @param {Boolean} bUp - Whether scroll is in upward direction.
    * @public
    */
    this.onScroll = function(oEvent, bUp) {
        var sEventName = 'onSpotlightScroll' + (bUp ? 'Up' : 'Down');
        return _dispatchEvent(sEventName, {
            domEvent: oEvent
        });
    };

    // Called by `onEvent()` to process mousemove events.
    this.onMouseMove = function(oEvent) {
        if (!_bEnablePointerMode) {
            return;
        }

        // Preserving explicit setting of mode for future features
        this.setPointerMode(true);
        if (this.getPointerMode()) {
            var oTarget = _getTarget(oEvent.target.id);
            if (oTarget && !this.isContainer(oTarget)) {

                if (
                    oTarget === _oLastMouseMoveTarget && (
                        oEvent.index === undefined ||
                        oEvent.index === _oLastMouseMoveTarget._nCurrentSpotlightItem
                    )
                ) {
                    return;
                } // ignore consecutive mouse moves on same target
                this.spot(oTarget, null, true);
                _oLastMouseMoveTarget = oTarget;

            } else {
                _oLastMouseMoveTarget = null;
                this.unspot();
            }
        }
    };

    // Called by `onEvent()` to process mousedown events.
    this.onMouseDown = function(oEvent) {

        // Run mousemove logic first, in case content beneath cursor changed since
        // last mousemove, e.g. animating controls
        this.onMouseMove(oEvent);

        // Logic to exit frozen mode when depressing control other than current
        // And transfer spotlight directly to it
        if (this.isFrozen()) {
            var oTarget = _getTarget(oEvent.target.id);
            if (oTarget != _oCurrent && !oEvent.defaultPrevented) {
                this.unfreeze();
                this.unspot();
                if (oTarget) {
                    this.spot(oTarget, null, true);
                }
                return true;
            }
        }

        if (this.getPointerMode()) {
            return false;
        } // Allow mousedown to bubble

        // Simulate an Enter key from Magic Remote click in 5Way mode
        oEvent.preventDefault();

        var oEventClone = enyo.clone(oEvent);
        oEventClone.keyCode = 13;
        oEventClone.domEvent = oEvent;
        oEventClone.allowDomDefault = enyo.nop;

        _oDepressedControl = this.getCurrent();
        _dispatchEvent('onSpotlightKeyDown', oEventClone, _oDepressedControl);

        // Because we should never see mouse events in 5way mode
        return true;
    };

    // Called by `onEvent()` to process mouseup events.
    this.onMouseUp = function(oEvent) {
        if (this.getPointerMode()) {
            return false;
        } // Allow mouseup to bubble

        // Simulate an Enter key from Magic Remote click in 5Way mode
        oEvent.preventDefault();

        var oEventClone = enyo.clone(oEvent);
        oEventClone.keyCode = 13;
        oEventClone.domEvent = oEvent;

        _dispatchEvent('onSpotlightKeyUp', oEventClone, _oDepressedControl);
        return true; // Because we should never see mouse events in 5way mode
    };

    // Called by `onEvent()` to process tap and click events.
    this.onClick = function(oEvent) {
        // Prevent browser-simulated "click" events when pressing enter
        // on a focused form control from being processed;

        // Prevent browser-simulated "click" events when pressing enter
        // on a focused form control
        if (enyo.Spotlight.Util.isSimulatedClick(oEvent)) {
            return true;
        }

        // Allow click to bubble
        if (this.getPointerMode()) {
            return false;
        }

        // In 5Way mode we are simulating enter key down/up based
        // on mousedown/up, so suppress click
        oEvent.preventDefault();

        // Because we should never see mouse events in 5way mode unles we simulated them
        return !oEvent.fromSpotlight;
    };

    // Called by `onEvent()` to process keydown.
    this.onKeyDown = function(oEvent) {

        _bSuppressSelectOnNextKeyUp = false;

        if (_isIgnoredKey(oEvent)) {
            _nIgnoredKeyDown = oEvent.which;
            return false;
        } else {
            _nIgnoredKeyDown = 0;
        }

        // Update pointer mode based on special keycode from
        // Input Manager for magic remote show/hide
        switch (oEvent.keyCode) {

            // Pointer shown event; set pointer mode true
            case KEY_POINTER_SHOW:
                this.setPointerMode(true);
                return false;

                // Pointer hidden event; set pointer mode false
            case KEY_POINTER_HIDE:
                setTimeout(function() {
                    if (this.getPointerMode()) {
                        this.setPointerMode(false);

                        // Spot last 5-way control, only if there's not already focus on screen
                        if (!_oLastMouseMoveTarget) {
                            enyo.asyncMethod(this, function() {
                                _spotLastControl();
                            });
                        }
                        _setTimestamp();
                    }
                }.bind(this), 30);
                return false;
        }

        // Arrow keys immediately switch to 5-way mode, and
        // re-spot focus on screen if it wasn't already
        if (_is5WayKey(oEvent)) {
            var bWasPointerMode = this.getPointerMode();
            this.setPointerMode(false);

            // Spot first available control on bootstrap
            if (!this.isSpottable(this.getCurrent()) ||
                // Or does this immediately follow KEY_POINTER_HIDE
                (!_isTimestampExpired() && !_oLastMouseMoveTarget) || 
                // Or spot last 5-way control, only if there's not already focus on screen
                (bWasPointerMode && !_oLastMouseMoveTarget && !this.isFrozen())) {

                _spotNearestToPointer(oEvent);
                _bSuppressSelectOnNextKeyUp = oEvent.keyCode == 13;
                return false;
            }
        }

        // Don't dispatch spotlight key events if we're in pointer
        // mode and not currently spotting something
        if (_isPointingAway()) {
            return false;
        }
        enyo.Spotlight.Accelerator.processKey(oEvent, this.onAcceleratedKey, this);

        // Always allow key events to bubble regardless of what onSpotlight** handlers return
        return false;
    };

    this.onKeyUp = function(oEvent) {
        if (_nIgnoredKeyDown === oEvent.which || _isIgnoredKey(oEvent)) {
            return false;
        }

        if (_bSuppressSelectOnNextKeyUp) {
            _bSuppressSelectOnNextKeyUp = false;
            return true;
        }

        enyo.Spotlight.Accelerator.processKey(oEvent, this.onAcceleratedKey, this);

        // Always allow key events to bubble regardless of what onSpotlight** handlers return
        return false;
    };

    //* Spotlight event handlers
    /************************************************************/

    this.onSpotlightRight = function(oEvent) {
        _5WayMove(oEvent);
    };
    this.onSpotlightLeft = function(oEvent) {
        _5WayMove(oEvent);
    };
    this.onSpotlightDown = function(oEvent) {
        _5WayMove(oEvent);
    };
    this.onSpotlightUp = function(oEvent) {
        _5WayMove(oEvent);
    };

    this.onSpotlightKeyUp = function(oEvent) {
        var ret = true;
        switch (oEvent.keyCode) {
            case 13:
                ret = _dispatchEvent('onSpotlightSelect', oEvent);
                enyo.gesture.drag.endHold();
        }

        // Should never get here
        return ret;
    };
    this.onSpotlightKeyDown = function(oEvent) {

        switch (oEvent.keyCode) {
            case 13:
                if (!enyo.Spotlight.Accelerator.isAccelerating()) {
                    enyo.gesture.drag.beginHold(oEvent);
                }
                return true;
            case 37:
                return _dispatchEvent('onSpotlightLeft', oEvent);
            case 38:
                return _dispatchEvent('onSpotlightUp', oEvent);
            case 39:
                return _dispatchEvent('onSpotlightRight', oEvent);
            case 40:
                return _dispatchEvent('onSpotlightDown', oEvent);
        }

        // Should never get here
        return true;
    };

    this.onSpotlightSelect = function(oEvent) {

        // If oEvent.allowDomDefault() was not called
        // this will preventDefault on dom keydown event
        _preventDomDefault(oEvent);
        var aChildren,
            oNeighbor = enyo.Spotlight.Util.getDefaultDirectionControl('SELECT', this.getCurrent());

        // clear last 5way event
        _oLast5WayEvent = null;

        if (oNeighbor) {
            return this.spot(oNeighbor);
        }

        aChildren = this.getChildren(oEvent.originator);
        if (aChildren.length === 0) {
            return _dispatchEvent('tap', {
                    customEvent: false,
                    preventDefault: enyo.nop,
                    fromSpotlight: true
                },
                oEvent.originator);
        } else {
            return this.spot(aChildren[0]);
        }
    };

    /**
    * Called when Spotlight is focusing on a control.
    *
    * @method
    * @name Spotlight#onSpotlightFocus
    * @param {Object} oEvent - The current event.
    * @public
    */
    this.onSpotlightFocus = function(oEvent) {
        _setCurrent(oEvent.originator);
    };

    /**
    * Called after Spotlight has focused on a control.
    *
    * @method
    * @name Spotlight#onSpotlightFocused
    * @param {Object} oEvent - The current event.
    * @public
    */
    this.onSpotlightFocused = function(oEvent) {};

    /**
    * Called when control's focus is blurred.
    *
    * @method
    * @name Spotlight#onSpotlightBlur
    * @param {Object} oEvent - The current event.
    * @public
    */
    this.onSpotlightBlur = function(oEvent) {};

    /**
    * Initializes Spotlight's flags and root.
    *
    * @method
    * @name Spotlight#initialize
    * @param {Object} oRoot - The root container.
    * @public
    */
    this.initialize = function(oRoot) {

        // Prevent double init'ion, for example, it
        // may be init'd in app.rendered before enyo.rendered.
        if (this.isInitialized()) {
            return false;
        }

        // Set root
        _oRoot = oRoot;

        // Capture spotlight events at root level of the app
        _interceptEvents();

        // From this point on, isInitialized() returns true.
        // Need it to be true for spot() to spot
        _bInitialized = true;

        if (_oDefaultControl) {
            if (this.spot(_oDefaultControl)) {
                return true;
            }
        }

        if (this.spot(this.getFirstChild(_oRoot))) {
            return true;
        }
        //_warn('Spotlight initialization failed.
        // No spottable children found in ' + _oRoot.toString());
    };

    /**
    * Determines whether Spotlight has been initialized (i.e., it has `_oCurrent` and
    * `last5waycontrol`).
    *
    * @method
    * @name Spotlight#isInitialized
    * @return {Boolean} `true` if Spotlight has been initialized; otherwise, `false`.
    * @public
    */
    this.isInitialized = function() {
        return _bInitialized;
    };

    /**
    * Sets pointer mode.
    *
    * @method
    * @name Spotlight#setPointerMode
    * @param {Boolean} bPointerMode - Whether pointer mode should be enabled.
    * @public
    */
    this.setPointerMode = function(bPointerMode) {
        if ((_bPointerMode != bPointerMode) && (!enyo.platform.touch)) {
            _bPointerMode = bPointerMode;
            _log('Pointer mode', _bPointerMode);
            _nMouseMoveCount = 0;
            enyo.Signals.send('onSpotlightModeChanged', {
                pointerMode: bPointerMode
            });
        }
    };

    this.getPointerMode = function() {
        return _bPointerMode;
    };
    this.getCurrent = function() {
        return _oCurrent;
    };
    this.setCurrent = function(oControl) {
        return _setCurrent(oControl);
    };
    this.hasCurrent = function() {
        return _oCurrent !== null;
    };
    this.getLastEvent = function() {
        return _oLastEvent;
    };
    this.getLastControl = function() {
        return _oLastControl;
    };
    this.getLast5WayEvent = function() {
        return _oLast5WayEvent;
    };

    // Deprecated; provided for backward-compatibility.
    this.setLast5WayControl = function(oControl) {
        _oLastControl = oControl;
    };

    this.isSpottable = function(oControl, bSkipContainers) {
        oControl = oControl || this.getCurrent();
        if (!oControl) {
            return false;
        }
        var bSpottable = false;

        if (this.isContainer(oControl)) {
            if (!bSkipContainers) {

                // Are there spotlight=true descendants?
                bSpottable = this.hasChildren(oControl);
            }
        } else {
            bSpottable = (

                // Control has been destroyed, but not yet garbage collected
                !oControl.destroyed &&

                // Control has spotlight property set
                typeof oControl.spotlight != 'undefined' &&

                // Control has spotlight=true or 'container'
                oControl.spotlight &&

                // Control is visible
                oControl.getAbsoluteShowing(true) &&

                // Control is not disabled
                !oControl.disabled &&

                // Control is rendered
                oControl.generated &&

                // Control does not have spotlight disabled
                !oControl.spotlightDisabled
            );
        }
        return bSpottable;
    };

    // Is oControl.spotlight == "container"
    this.isContainer = function(oControl) {
        if (!oControl) {
            return false;
        }
        return oControl.spotlight == 'container';
    };

    // Is there at least one descendant of oControl
    // (or oControl itself) that has spotlight = "true"
    this.hasChildren = function(oControl) {
        if (!oControl || oControl.spotlightDisabled) {
            return false;
        }
        if (!this.isContainer(oControl) && this.isSpottable(oControl)) {
            return true;
        }
        var n, aChildren = oControl.children;
        for (n = 0; n < aChildren.length; n++) {
            if (this.hasChildren(aChildren[n])) {
                return true;
            }
        }
        return false;
    };

    /**
    * Returns spottable children along with position of self.
    *
    * @param {Object} oControl - The control whose siblings are to be retrieved.
    * @private
    */
    this.getSiblings = function(oControl) {
        oControl = oControl || this.getCurrent();
        if (!oControl) {
            return;
        }
        var n,
            o = {},
            oParent = this.getParent(oControl) || _oRoot;

        o.siblings = this.getChildren(oParent);

        for (n = 0; n < o.siblings.length; n++) {
            if (oControl === o.siblings[n]) {
                o.selfPosition = n;
            }
        }

        return o;
    };

    /**
    * Dispatches focus event to the control or its first spottable child.
    *
    * @param {Object} oControl - The control whose children are to be retrieved.
    * @param {Boolean} bSpotlightTrueOnly - Whether to retrieve only spottable children.
    * @private
    */
    this.getChildren = function(oControl, bSpotlightTrueOnly) {
        oControl = oControl || this.getCurrent();
        if (!oControl) {
            return;
        }
        var n,
            aChildren = [],
            oNext;

        if (!oControl.spotlightDisabled) {
            for (n = 0; n < oControl.children.length; n++) {
                oNext = oControl.children[n];
                if (this.isSpottable(oNext, bSpotlightTrueOnly)) {
                    aChildren.push(oNext);
                } else {
                    aChildren = aChildren.concat(this.getChildren(oNext, bSpotlightTrueOnly));
                }
            }
        }
        return aChildren;
    };

    /**
    * Returns closest spottable parent, or `null` if there is none.
    *
    * @param {Object} oControl - The control whose parent is to be retrieved.
    * @return {enyo.Control} - The control's closest spottable parent.
    * @private
    */
    this.getParent = function(oControl) {
        oControl = oControl || this.getCurrent();
        if (!oControl) {
            return;
        }
        var oSpottableParent = null;
        while (oControl.parent) {
            oControl = oControl.parent;
            if (this.isSpottable(oControl)) {
                oSpottableParent = oControl;
                break;
            }
        }
        return oSpottableParent;
    };

    /**
    * Dispatches focus event to the control or its first spottable child.
    *
    * @param {Object} oControl - The control to be focused.
    * @return {Boolean} - `true` if control was focused successfully; otherwise, `false`.
    * @private
    */
    this.spot = function(oControl, sDirection, bWasPoint) {

        // If spotlight is not yet initialized
        // Preserve control to be spotted on initialize
        if (!this.isInitialized()) {
            _oDefaultControl = oControl;
            return true;
        }

        // Cannot spot falsy values
        if (!oControl) {
            return false;
        }

        // Can only spot enyo.Controls
        if (!(oControl instanceof enyo.Control)) {
            _warn('argument is not enyo.Control');
            return false;
        }

        // Current cannot change while in frozen mode
        if (this.isFrozen()) {
            _warn('can\'t spot in frozen mode');
            return false;
        }

        // If control is not spottable, find its spottable child
        var oOriginal = oControl;
        if (!this.isSpottable(oControl)) {
            oControl = this.getFirstChild(oControl);
        }

        // If already spotted, nothing to do
        if (oControl) {
            if (_oCurrent === oControl) {
                return true;
            }

            // When the user calls spot programmatically in pointer mode, we don't actually
            if (this.getPointerMode() && !bWasPoint) {
                this.unspot();

                // spot; instead we just unspot and set up the _oLastControl
                _oLastControl = oControl;

                // used when resuming 5-way focus on an arrow key press
                _oLastMouseMoveTarget = null;
                _log("Spot called in pointer mode; 5-way will resume from: " + oControl.id);
            } else {

                // Dispatch focus to new control
                _dispatchEvent('onSpotlightFocus', {
                    dir: sDirection
                }, oControl);
            }
            return true;
        }
        _warn('can\'t spot: ' + oOriginal.toString() +
            ' is not spottable and has no spottable descendants');

        return false;
    };

    /**
    * Dispatches Spotlight blur event to current control.
    *
    * @param {Object} oControl - The control to be blurred.
    * @return {Boolean} - `true` if control was successfully blurred; otherwise, `false`.
    * @private
    */
    this.unspot = function() {

        // Current cannot change while in frozen mode
        if (this.isFrozen()) {
            return false;
        }

        if (this.hasCurrent() && _bFocusOnScreen) {
            _unhighlight(_oCurrent);
            _oLastMouseMoveTarget = null;
            _dispatchEvent('onSpotlightBlur', null, _oCurrent);
            _observeDisappearance(false, _oCurrent);
            _oCurrent = null;
            return true;
        }
        return false;
    };

    /**
    * Gets first spottable child of a control.
    *
    * @param {Object} oControl - The control whose child is to be retrieved.
    * @return {enyo.Control} - The first spottable child.
    * @private
    */
    this.getFirstChild = function(oControl) {
        oControl = oControl || this.getCurrent();
        if (!oControl) {
            return null;
        }
        return this.getChildren(oControl)[0];
    };

    /**
    * Determines whether X or Y value has changed since last mousemove event.
    *
    * @name Spotlight#clientXYChanged
    * @param {Object} oEvent - The current event.
    * @return {Boolean} - `true` if either X or Y has changed; otherwise, `false`.
    * @private
    */
    this.clientXYChanged = function(oEvent) {
        var bChanged = (
            _nPrevClientX !== oEvent.clientX ||
            _nPrevClientY !== oEvent.clientY
        );

        if (this.getPointerMode()) {
            _nPrevClientX = oEvent.clientX;
            _nPrevClientY = oEvent.clientY;
        }

        return bChanged;
    };

    /**
    * Disables pointer mode.
    *
    * @private
    */
    this.disablePointerMode = function() {
        _bEnablePointerMode = false;
    };

    /**
    * Enables pointer mode.
    *
    * @private
    */
    this.enablePointerMode = function() {
        _bEnablePointerMode = true;
    };

    /**
    * Switches to muted mode (no `'spotlight'` CSS class set in DOM).
    *
    * @private
    */
    this.mute = function(oSender) {
        enyo.Spotlight.Muter.addMuteReason(oSender);
    };
    this.unmute = function(oSender) {
        enyo.Spotlight.Muter.removeMuteReason(oSender);
    };
    this.isMuted = function() {
        return enyo.Spotlight.Muter.isMuted();
    };

    /**
    * Sets verbose mode.
    *
    * @name Spotlight#verbose
    * @param {Boolean} bVerbose - Whether verbose mode should be enabled.
    * @return {String} Feedback message for logging.
    * @private
    */
    this.verbose = function(bVerbose) {
        _bVerbose = (typeof bVerbose == 'undefined') ? !_bVerbose : bVerbose;
        return 'SPOTLIGHT: Verbose mode set to ' + _bVerbose;
    };

    /**
    * Switches to frozen mode (current cannot change while frozen).
    *
    * @private
    */
    this.freeze = function() {
		if (this.hasCurrent()) {
			_bFrozen = true;
		} else {
			_warn('Can not enter frozen mode until something is spotted');
		}
    };

    /**
    * Switches to unfrozen mode.
    *
    * @private
    */
    this.unfreeze = function() { 
		_bFrozen = false;
	};

    /**
    * Determines whether frozen mode is currently enabled.
    *
    * @return {Boolean} `true` if frozen mode is currently enabled; otherwise, `false`.
    * @private
    */
    this.isFrozen = function() {
        return _bFrozen;
    };

    /**
    * Highlights the specified control.
    *
    * @param {enyo.Control} oControl - The control to highlight.
    * @param {Boolean} bIgnoreMute - Whether to ignore muting.
    * @private
    */
    this.highlight = function(oControl, bIgnoreMute) {
        _highlight(oControl, bIgnoreMute);
    };

    /**
    * Unhighlights the specified control.
    *
    * @param {enyo.Control} oControl - The control to unhighlight.
    * @private
    */
    this.unhighlight = function(oControl) {
        _unhighlight(oControl);
    };
};

// Event hook to all system events to catch keypress and mouse events.
enyo.dispatcher.features.push(function(oEvent) {
    return enyo.Spotlight.onEvent(oEvent);
});

// Initialization
enyo.rendered(function(oRoot) {
    // enyo.Spotlight.verbose();
    enyo.Spotlight.initialize(oRoot);
});


// enyo.Spotlight.bench = new function() {
// 	var _oBench = null;
//
// 	this.start = function() {
// 		if (!_oBench) {
// 			_oBench = enyo.dev.bench({name: 'bench1', average: true});
// 		}
// 		_oBench.start();
// 	}
//
// 	this.stop = function() {
// 		_oBench.stop();
// 	}
// }
