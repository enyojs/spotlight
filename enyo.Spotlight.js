/**
 * Spotlight is an extensible utility that enables users to navigate
 * Enyo applications using a keyboard or television remote control.
 *
 * @namespace Spotlight
 */
enyo.Spotlight = new function() {

    /**
     * Reference to this to be inherited by private closures below
     * @type {Object}
     * @private
     */
    var _oThis = this,

        /**
         * Topmost component instance where spotlight events are caught
         * @type {Object}
         * @default null
         * @private
         */
        _oRoot = null,

        /**
         * Is set by spot() if it is called before initialize(), will be spotted in initialize()
         * @type {Object}
         * @default null
         * @private
         */
        _oDefaultControl = null,

        /**
         * Is spotlight in pointer mode or 5way mode?
         * @type {boolean}
         * @default true
         * @private
         */
        _bPointerMode = true,

        /**
         * Does spotlight have _oCurrent
         * @type {boolean}
         * @default false
         * @private
         */
        _bInitialized = false,

        /**
         * Currently spotlighted element
         * @type {Object}
         * @default null
         * @private
         */
        _oCurrent = null,

        /**
         * Last event received by Spotlight
         * @type {Object}
         * @default null
         * @private
         */
        _oLastEvent = null,

        /**
         * Last 5way event received by Spotlight
         * @type {Object}
         * @default null
         * @private
         */
        _oLast5WayEvent = null,

        /**
         * Last non-container (spotlight:true) control that was _oCurrent
         * @type {Object}
         * @default null
         * @private
         */
        _oLastControl = null,

        /**
         * For things like input boxes we need a way to disable pointer mode while cursor is in
         * @type {boolean}
         * @default true
         * @private
         */
        _bEnablePointerMode = true,

        /**
         * Keeping state consistency between onMouseDown() and onMouseUp(),
         * if focus has been moved in between
         * @type {Object}
         * @default null
         * @private
         */
        _oDepressedControl = null,

        /**
         * In verbose mode spotlight prints 1) Current 2) Pointer mode change to enyo.log
         * @type {boolean}
         * @default false
         * @private
         */
        _bVerbose = false,

        /**
         * While frozen, current cannot change and all events are directed to it.
         * @type {boolean}
         * @default false
         * @private
         */
        _bFrozen = false,

        /**
         * Contains control specified in defaultSpotlightDisappear property of _oCurrent
         * @type {Object}
         * @default null
         * @private
         */
        _oDefaultDisappear = null,

        /**
         * Whether focus is currently visible on screen or not (hasCurrent && !pointingAway) ??
         * @type {boolean}
         * @default false
         * @private
         */
        _bFocusOnScreen = false,

        /**
         * number of consecutive mousemoves; require >1 to switch to pointer mode
         * @type {number}
         * @default 0
         * @private
         */
        _nMouseMoveCount = 0,

        /**
         * @type {number}
         * @default null
         * @private
         */
        _nPrevClientX = null,

        /**
         * @type {number}
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
         * Timestamp at the last point the pointer was hidden
         * @type {number}
         * @default 0
         * @private
         */
        _nPointerHiddenTime = 0,

        /**
         * Amount of time in ms to require after hiding pointer before 5-way keys are processed
         * @type {number}
         * @default 300
         * @private
         */
        _nPointerHiddenToKeyTimeout = 300,

        /**
         * Is key in pressed status?
         * @type {boolean}
         * @default false
         * @private
         */
        _bHold = false,

        /**
         * Amount of time in ms of key hold
         * @type {number}
         * @default 0
         * @private
         */
        _holdStart = 0,

        /**
         * Function which is sending onholdulse
         * @type {Function}
         * @default null
         * @private
         */
        _holdJobFunction = null,

        /**
         * Job which is sending onholdulse
         * @type {Function}
         * @default null
         * @private
         */
        _holdJob = null,

        /**
         * Is onholdulse fired?
         * @type {boolean}
         * @default false
         * @private
         */
        _sentHold = false,

        /**
         * Is holdPulse canceled?
         * @type {boolean}
         * @default false
         * @private
         */
        _bCancelHold = false;


    /**
    @constant
    @type {number}
    @default 1536
    */
    var KEY_POINTER_SHOW = 1536,

        /**
    @constant
    @type {number}
    @default 1537
    */
        KEY_POINTER_HIDE = 1537;


    var
    /**
     * Event hook to the owner to catch Spotlight Events
     *
     * @name Spotlight#_interceptEvents
     * @type {function}
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
         * Create control-specific spotlight state storage
         *
         * @name Spotlight#_initializeControl
         * @param {object} oControl Somebody's name.
         * @type {function}
         * @private
         */
        _initializeControl = function(oControl) {
            if (typeof oControl._spotlight == 'undefined') {
                oControl._spotlight = {};
            }
        },

        /**
         * Get control specified in defaultSpotlightDisappear
         * of _oCurrent. Gotta get it before it disappears :)
         *
         * @name Spotlight#_setDefaultDisappearControl
         * @param {object} oControl Somebody's name.
         * @type {function}
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
         * @name Spotlight#_onDisappear
         * @param {object} oControl Somebody's name.
         * @type {function}
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
         * Add observers on control's parent chain
         *
         * @name Spotlight#_observeDisappearance
         * @param {object} oControl Somebody's name.
         * @type {function}
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
         * Set currently spotted control.
         *
         * @name Spotlight#_setCurrent
         * @param {object} oControl Somebody's name.
         * @type {function}
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
         * Artificially trigger events on current control, like click
         *
         * @name Spotlight#_setCurrent
         * @param {object} oControl Somebody's name.
         * @type {function}
         * @private
         */
        _dispatchEvent = function(sEvent, oData, oControl) {
            oControl = oControl || _oThis.getCurrent();
            return enyo.Spotlight.Util.dispatchEvent(sEvent, oData, oControl);
        },

        /**
         * Moves to a nearest neightbor based on 5Way Spotlight event
         *
         * @name Spotlight#_5WayMove
         * @param {object} oEvent Current 5way event
         * @type {function}
         * @private
         */
        _5WayMove = function(oEvent) {
            var sDirection = oEvent.type.replace('onSpotlight', '').toUpperCase(),
                oControl = enyo.Spotlight.NearestNeighbor.getNearestNeighbor(sDirection);


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
         * Is oEvent.keyCode an arrow or enter
         *
         * @name Spotlight#_is5WayKey
         * @param {object} oEvent Current 5way event
         * @type {function}
         * @returns {number}
         * @private
         */
        _is5WayKey = function(oEvent) {

            // 13==Enter, 16777221==KeypadEnter
            return (enyo.indexOf(oEvent.keyCode, [37, 38, 39, 40, 13, 16777221]) > -1);
        },

        /**
         * Is the key that was pressed, one that is supposed
         * to be ignored by the event's originator?
         * This checks for whether the originator of the event,
         * had any keyCodes specified, that it was supposed to ignore;
         * returning true if it was supposed to ignore the oEvent.keyCode, or false if not.
         *
         * @name Spotlight#_isIgnoredKey
         * @param {object} oEvent Current 5way event
         * @type {function}
         * @returns {boolean}
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
         * Prevent default on dom event associated with spotlight event
         * This is only for 5Way keydown events
         *
         * @name Spotlight#_isIgnoredKey
         * @param {object} oEvent Current 5way event
         * @type {function}
         * @returns {boolean}
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
         * If originator is container, delegate processing of event
         * to enyo.Spotlight.Container.onSpotlight* Return values: if found
         * method to delegate, return its return value otherwise return true
         *
         * @name Spotlight#_delegateContainerEvent
         * @param {object} oEvent Current 5way event
         * @type {function}
         * @returns {boolean}
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
         * Get spottable target by id for pointer events
         *
         * @name Spotlight#_getTarget
         * @param {string} sId String ID of target
         * @type {function}
         * @returns {object}
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
         * Get spottable target by id for pointer events
         *
         * @name Spotlight#_highlight
         * @param {object} oControl Control to Mute
         * @param {boolean} bIgnoreMute Should be muted?
         * @type {function}
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
         * Remove spotlight class from a control
         *
         * @name Spotlight#_unhighlight
         * @param {object} oControl Control to have spotlight class removed
         * @type {function}
         * @private
         */
        _unhighlight = function(oControl) {
            oControl.removeClass('spotlight');
            _bFocusOnScreen = false;
        },

        /**
         * Is pointer pointing away
         *
         * @name Spotlight#_isPointingAway
         * @type {function}
         * @returns {boolean}
         * @private
         */
        _isPointingAway = function() {
            return _oThis.getPointerMode() && !_oLastMouseMoveTarget;
        },

        /**
         * Checks to see if the timestamp is expired
         *
         * @name Spotlight#_isTimestampExpired
         * @type {function}
         * @private
         */
        _isTimestampExpired = function() {
            return enyo.perfNow() >= (_nPointerHiddenTime + _nPointerHiddenToKeyTimeout);
        },

        /**
         * Sets the timestamp
         *
         * @name Spotlight#_setTimestamp
         * @type {function}
         * @private
         */
        _setTimestamp = function() {
            _nPointerHiddenTime = enyo.perfNow();
        },

        /**
         * enyo.logs messages in verbose mode
         *
         * @name Spotlight#_log
         * @type {function}
         * @private
         */
        _log = function() {
            if (_bVerbose) {
                enyo.log('SPOTLIGHT: ' + Array.prototype.slice.call(arguments, 0).join(' '));
            }
        },

        /**
         * enyo.warns messages
         *
         * @name Spotlight#_warn
         * @type {function}
         * @private
         */
        _warn = function() {
            enyo.warn('SPOTLIGHT: ' + Array.prototype.slice.call(arguments, 0).join(' '));
        },

        /**
         * Spotlights the last control
         *
         * @name Spotlight#_spotLastControl
         * @type {function}
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
         * @name Spotlight#_spotNearestToPointer
         * @param {object} oControl Control to have spotlight class removed
         * @type {function}
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
         * @name Spotlight#_getSpotDirection
         * @param {object} oEvent Event to interpret
         * @type {function}
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
     * Receive accelerated keyup and keydown from accelerator
     *
     * @name Spotlight#onAcceleratedKey
     * @param {object} oEvent Event to interpret
     * @type {function}
     * @returns {boolean}
     * @public
     */
    this.onAcceleratedKey = function(oEvent) {
        oEvent.domEvent = oEvent;
        oEvent.allowDomDefault = function() {
            oEvent.preventDefault = function() {
                //enyo.log('Dummy funciton');
            };
        };
        this.initiateHoldPulse(oEvent);
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
                 * @param {object} oEvent
                 * @type {Object}
                 * @public
                 */
                case 'onSpotlightKeyUp':
                    return this.onSpotlightKeyUp(oEvent);

                    /**
                     * @event Spotlight#onSpotlightKeyDown
                     * @param {object} oEvent
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightKeyDown':
                    return this.onSpotlightKeyDown(oEvent);

                    /**
                     * @event Spotlight#onSpotlightFocus
                     * @param {object} oEvent
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightFocus':
                    return this.onSpotlightFocus(oEvent);

                    /**
                     * @event Spotlight#onSpotlightFocused
                     * @param {object} oEvent
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightFocused':
                    return this.onSpotlightFocused(oEvent);

                    /**
                     * @event Spotlight#onSpotlightFocused
                     * @param {object} oEvent
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightBlur':
                    return this.onSpotlightBlur(oEvent);

                    /**
                     * @event Spotlight#onSpotlightFocused
                     * @param {object} oEvent
                     * @memberof Spotlight
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightLeft':
                    return this.onSpotlightLeft(oEvent);

                    /**
                     * @event Spotlight#onSpotlightRight
                     * @param {object} oEvent
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightRight':
                    return this.onSpotlightRight(oEvent);

                    /**
                     * @event Spotlight#onSpotlightUp
                     * @param {object} oEvent
                     * @memberof Spotlight
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightUp':
                    return this.onSpotlightUp(oEvent);

                    /**
                     * @event Spotlight#onSpotlightDown
                     * @param {object} oEvent
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightDown':
                    return this.onSpotlightDown(oEvent);

                    /**
                     * @event Spotlight#onSpotlightSelect
                     * @param {object} oEvent
                     * @type {Object}
                     * @public
                     */
                case 'onSpotlightSelect':
                    return this.onSpotlightSelect(oEvent);
            }
        }
    };

    /**
     * Called by onEvent() (via spotlight scrolling) to process scroll events
     * @event Spotlight#onScroll
     * @param {object} oEvent
     * @param {boolean} bUp Bubble up? If false, bubble down.
     * @type {Object}
     * @public
     */
    this.onScroll = function(oEvent, bUp) {
        var sEventName = 'onSpotlightScroll' + (bUp ? 'Up' : 'Down');
        return _dispatchEvent(sEventName, {
            domEvent: oEvent
        });
    };

    // Called by onEvent() to process mousemove events
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

        // There is a edge case that onSpotlightKeyUp is not comming
        this.stopHold();
    };

    // Called by onEvent() to process mousedown events
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

    // Called by onEvent() to process mouseup events
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

    // Called by onEvent() to process tap and click events
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

    // Called by onEvent() to process keydown
    this.onKeyDown = function(oEvent) {

        if (_isIgnoredKey(oEvent)) {
            return false;
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

            if (!this.isSpottable(this.getCurrent())) {

                // Spot first available control on bootstrap
                _spotNearestToPointer(oEvent);
                return false;
            }

            // Does this immediately follow KEY_POINTER_HIDE
            if (!_isTimestampExpired() && !_oLastMouseMoveTarget) {
                _spotNearestToPointer(oEvent);
                return false;
            }

            // Spot last 5-way control, only if there's not already focus on screen
            if (bWasPointerMode && !_oLastMouseMoveTarget && !this.isFrozen()) {
                _spotNearestToPointer(oEvent);
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
        if (_isIgnoredKey(oEvent)) {
            return false;
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
                enyo.mixin(oEvent, {
                    sentHold: _sentHold
                });
                ret = _dispatchEvent('onSpotlightSelect', oEvent);
                this.stopHold(oEvent);
                this.resetHold();
        }

        // Should never get here
        return ret;
    };
    this.onSpotlightKeyDown = function(oEvent) {

        switch (oEvent.keyCode) {
            case 13:
                return this.beginHold(oEvent);
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
     * Called when spotlight is focusing on a control
     * @event Spotlight#onSpotlightFocus
     * @param {object} oEvent
     * @type {function}
     * @public
     */
    this.onSpotlightFocus = function(oEvent) {
        _setCurrent(oEvent.originator);
    };

    /**
     * Called after spotlight has focused on a control
     * @event Spotlight#onSpotlightFocused
     * @param {object} oEvent
     * @type {function}
     * @public
     */
    this.onSpotlightFocused = function(oEvent) {};

    /**
     * Called when control's focus is blured
     * @event Spotlight#onSpotlightBlur
     * @param {object} oEvent
     * @type {function}
     * @public
     */
    this.onSpotlightBlur = function(oEvent) {};

    /**
     * Initializes spotlight's flags and root
     *
     * @name Spotlight#initialize
     * @type {function}
     * @param {object} oRoot Root container.
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
     * Does spotlight have _oCurrent and last5waycontrol?
     *
     * @name Spotlight#isInitialized
     * @type {function}
     * @public
     */
    this.isInitialized = function() {
        return _bInitialized;
    };

    /**
     * Does spotlight have _oCurrent and last5waycontrol?
     *
     * @name Spotlight#isInitialized
     * @type {function}
     * @param {boolean} bPointerMode Is navigation using pointer mode?
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

    // Deprecated; provided for backward-compatibility
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
     * Returns spottable chldren along with position of self
     *
     * @name Spotlight#getSiblings
     * @param {object} oControl Control used to retrieve siblings
     * @type {function}
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
     * Dispatches focus event to the control or its first spottable child
     *
     * @name Spotlight#getChildren
     * @param {object} oControl Control used to retrieve children
     * @param {boolean} bSpotlightTrueOnly retrieve only spotable children
     * @type {function}
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
     * Returns closest spottable parent, or null if there is none
     *
     * @name Spotlight#spot
     * @type {function}
     * @param {object} oControl Somebody's name.
     * @returns {object}
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
     * Dispatches focus event to the control or its first spottable child
     *
     * @name Spotlight#spot
     * @type {function}
     * @param {object} oControl Somebody's name.
     * @return {boolean}
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
     * Dispatches spotlight blur event to current control
     *
     * @name Spotlight#unspot
     * @type {function}
     * @param {object} oControl Somebody's name.
     * @returns {boolean}
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
            _oCurrent = null;
            return true;
        }
        return false;
    };

    /**
     * Get first spottable child of a control
     *
     * @name Spotlight#getFirstChild
     * @type {function}
     * @param {object} oControl Somebody's name.
     * @returns {object}
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
     * Has XY value changed since last mousemove event?
     *
     * @name Spotlight#clientXYChanged
     * @type {function}
     * @param {object} oEvent Somebody's name.
     * @returns {boolean}
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
     * Enable pointer mode
     *
     * @name Spotlight#disablePointerMode
     * @type {function}
     * @private
     */
    this.disablePointerMode = function() {
        _bEnablePointerMode = false;
    };

    /**
     * Disable pointer mode
     *
     * @name Spotlight#disablePointerMode
     * @type {function}
     * @private
     */
    this.enablePointerMode = function() {
        _bEnablePointerMode = true;
    };

    /**
     * Switching to muted mode (no "spotlight" css class is being set in dom)
     *
     * @name Spotlight#disablePointerMode
     * @type {function}
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
     * Switching to verbose mode
     *
     * @name Spotlight#verbose
     * @type {function}
     * @param {boolean} bVerbose Somebody's name.
     * @return {string}
     * @private
     */
    this.verbose = function(bVerbose) {
        _bVerbose = (typeof bVerbose == 'undefined') ? !_bVerbose : bVerbose;
        return 'SPOTLIGHT: Verbose mode set to ' + _bVerbose;
    };

    /**
     * Switching to frozen mode (current cannot change while frozen)
     *
     * @name Spotlight#freeze
     * @type {function}
     * @return {string}
     * @private
     */
    this.freeze = function() {
        if (!this.hasCurrent()) {
            throw 'Can not enter frozen mode until something is spotted';
        }
        _bFrozen = true;
        return 'SPOTLIGHT: Frozen on ' + _oCurrent.toString();
    };

    /**
     * Switching to frozen mode (current cannot change while frozen)
     *
     * @name Spotlight#unfreeze
     * @type {function}
     * @return {string}
     * @private
     */
    this.unfreeze = function() {
        _bFrozen = false;
        return 'SPOTLIGHT: Exit frozen mode';
    };

    /**
     * Switching to frozen mode (current cannot change while frozen)
     *
     * @name Spotlight#isFrozen
     * @type {function}
     * @return {string}
     * @private
     */
    this.isFrozen = function() {
        return _bFrozen;
    };

    /**
     *
     * @name Spotlight#highlight
     * @type {function}
     * @private
     */
    this.highlight = function(oControl, bIgnoreMute) {
        _highlight(oControl, bIgnoreMute);
    };

    /**
     *
     * @name Spotlight#unhighlight
     * @type {function}
     * @private
     */
    this.unhighlight = function(oControl) {
        _unhighlight(oControl);
    };

    //* Emulate holdPulse for onSpotlightkeyDown event
    //* To-do: These are not public functions. Move to private.
    /************************************************************/

    /**
     * Decorate event to let user can call configureHoldPulse function
     *
     * @name Spotlight#initiateHoldPulse
     * @type {function}
     * @param {object} oEvent Somebody's name.
     * @private
     */
    this.initiateHoldPulse = function(oEvent) {

        // Set holdpulse defaults and expose method for configuring holdpulse options
        if (oEvent.keyCode === 13) {
            enyo.gesture.drag.holdPulseConfig = enyo.clone(enyo.gesture.drag.holdPulseDefaultConfig);
            oEvent.configureHoldPulse = enyo.gesture.configureHoldPulse;
            oEvent.cancelHoldPulse = enyo.bind(this, "cancelHold");
        }
    };

    /**
     * Get default holdPulseConfig if it if not initialized by down event
     *
     * @name Spotlight#getHoldPulseDelay
     * @type {function}
     * @param {object} oEvent Somebody's name.
     * @returns {object}
     * @private
     */
    this.getHoldPulseDelay = function(oEvent) {
        var drag = enyo.gesture.drag;
        return Object.keys(drag.holdPulseConfig).length > 0 ? drag.holdPulseConfig.delay : drag.holdPulseDefaultConfig.delay;
    };

    /**
     * Initiate relevant variables and start sending holdPulse job
     *
     * @name Spotlight#beginHold
     * @type {function}
     * @param {object} oEvent Somebody's name.
     * @returns {boolean}
     * @private
     */
    this.beginHold = function(oEvent) {

        // Prevent consecutive hold start
        if (_bHold) {
            return;
        }

        _bHold = true;
        _holdStart = enyo.perfNow();

        // clone the event to ensure it stays alive on IE upon returning to event loop
        var $ce = enyo.clone(oEvent);
        $ce.srcEvent = enyo.clone(oEvent.srcEvent);
        _holdJobFunction = enyo.bind(this, "sendHoldPulse", $ce);
        _holdJobFunction.ce = $ce;
        _holdJob = setInterval(_holdJobFunction, this.getHoldPulseDelay(oEvent));

        return true;
    };

    /**
     * Clear relevant variables and cancel holdPulse job
     *
     * @name Spotlight#stopHold
     * @type {function}
     * @param {object} oEvent Somebody's name.
     * @private
     */
    this.stopHold = function(oEvent) {

        // Do nothing if not in hold status
        if (!_bHold) {
            return;
        }

        clearInterval(_holdJob);
        _holdJob = null;
        _bHold = false;
        _holdStart = 0;
        if (_holdJobFunction) {
            _holdJobFunction.ce = null;
            _holdJobFunction = null;
        }
        if (_sentHold) {
            _sentHold = false;
        }
        this.resetHold();
    };

    /**
     * Clear relevant variables and cancel holdPulse job
     *
     * @name Spotlight#resetHold
     * @type {function}
     * @private
     */
    this.resetHold = function() {
        _bCancelHold = false;
    };

    /**
     * Clear relevant variables and cancel holdPulse job
     *
     * @name Spotlight#resetHold
     * @type {function}
     * @private
     */
    this.cancelHold = function(oEvent) {
        _bCancelHold = true;
    };

    /**
     * Send onHoldPulse event with holdTime parameter
     *
     * @name Spotlight#resetHold
     * @type {function}
     * @private
     */
    this.sendHoldPulse = function(oEvent) {
        if (_bCancelHold) {
            return;
        }
        if (!_sentHold) {
            _sentHold = true;
        }
        oEvent.holdTime = enyo.perfNow() - _holdStart;
        _dispatchEvent('onholdpulse', oEvent);
    };
};

// Event hook to all system events to catch KEYPRESS and Mouse Events
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
