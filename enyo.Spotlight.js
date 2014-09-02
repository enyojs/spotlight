/**
 * Spotlight definition
 * @author: Lex Podgorny
 */

enyo.Spotlight = new function() {

	//* @protected
	/************************************************************/

	var _oThis                          = this,     // Reference to this to be inherited by private closures below
		_oRoot                          = null,     // Topmost component instance where spotlight events are caught
		_oDefaultControl                = null,     // Is set by spot() if it is called before initialize(), will be spotted in initialize()
		_bPointerMode                   = true,     // Is spotlight in pointer mode or 5way mode?
		_bInitialized                   = false,    // Does spotlight have _oCurrent
		_oCurrent                       = null,     // Currently spotlighted element
		_oPrevious                      = null,     // Previously spotlighted element
		_oLastEvent                     = null,     // Last event received by Spotlight
		_oLast5WayEvent                 = null,     // Last 5way event received by Spotlight
		_oLastControl                   = null,     // Last non-container (spotlight:true) control that was _oCurrent
		_bEnablePointerMode             = true,     // For things like input boxes we need a way to disable pointer mode while cursor is in
		_oDepressedControl              = null,     // Keeping state consistency between onMouseDown() and onMouseUp(), if focus has been moved in between
		_bVerbose                       = false,    // In verbose mode spotlight prints 1) Current 2) Pointer mode change to enyo.log
		_bFrozen                        = false,    // While frozen, current cannot change and all events are directed to it.
		_oDefaultDisappear              = null,     // Contains control specified in defaultSpotlightDisappear property of _oCurrent
		_bFocusOnScreen                 = false,    // Whether focus is currently visible on screen or not (hasCurrent && !pointingAway) ??

		_nMouseMoveCount                = 0,        // Number of consecutive mousemoves; require >1 to switch to pointer mode
		_nPrevClientX                   = null,
		_nPrevClientY                   = null,
		_oLastMouseMoveTarget           = null,

		_nPointerHiddenTime             = 0,        // Timestamp at the last point the pointer was hidden
		_nPointerHiddenToKeyTimeout     = 300,      // Amount of time in ms to require after hiding pointer before 5-way keys are processed
		_bHold                          = false,	// Is key in pressed status?
		_holdStart                      = 0,        // Amount of time in ms of key hold
		_holdJobFunction                = null,     // Function which is sending onholdulse
		_holdJob                        = null,     // Job which is sending onholdulse
		_sentHold                       = false,	// Is onholdulse fired?
		_bCancelHold                    = false;    // Is holdPulse canceled?
		
	// Constants:
	var KEY_POINTER_SHOW = 1536,
	    KEY_POINTER_HIDE = 1537;


	var // Event hook to the owner to catch Spotlight Events
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
		
		// Create control-specific spotlight state storage
		_initializeControl = function(oControl) {
			if (typeof oControl._spotlight == 'undefined') {
				oControl._spotlight = {};
			}
		},
		
		_setDefaultDisappearControl = function() {
			_oDefaultDisappear = enyo.Spotlight.Util.getDefaultDirectionControl(                   // Get control specified in defaultSpotlightDisappear
				'disappear',                                                                       // of _oCurrent. Gotta get it before it disappears :)
				_oCurrent                                                                          //
			);
		},
		
		// Observer
		_onDisappear = function() {
			if (_onDisappear.isOff) { return; }                                                     // Only handle disappearance once
			if (_oThis.isSpottable(_oCurrent)) { return; }                                          // Ignore if control is still spotable
			_onDisappear.isOff = true;                                                              
			var oControl = _oDefaultDisappear;
			if (!oControl || !_oThis.isSpottable(oControl)) {                                       // Nothing is set in defaultSpotlightDisappear
				oControl = _oThis.getFirstChild(_oRoot);                                            // Find first spottable in the app 
				if (!oControl) { 
					_unhighlight(_oLastControl);
					_oLastControl = null;
					_oCurrent = null;                                                       // NULL CASE :(, just like when no spottable children found on init
					return;
				}
				// if (!oControl) { throw 'SPOTLIGHT: No spottable controls found'; }                  // Prevent unmanageable case when _oCurrent is undefined
			}
			
			_oThis.spot(oControl);                                                                  // Spot first child of the app
		},
		
		// Add observers on control's parent chain
		_observeDisappearance = function(bObserve, oControl, bInAncestor) {
			if (!oControl) { return; }                                                               // Terminal case
			var sMethod = bObserve ? 'addObserver' : 'removeObserver';
			if (!bInAncestor) {                                                                      // When processing _oCurrent itself
				if (bObserve) {                                                                      // When adding observer to _oCurrent itself
					_onDisappear.isOff = false;                                                      // Set one-time-call flag of _onDisappear function
					_setDefaultDisappearControl();                                                   // Capture defaultSpotlightDisappear control
				}
				oControl[sMethod]('disabled',  _onDisappear);                                        // Enough to check in _oCurrent only, no ancestors
				oControl[sMethod]('destroyed', _onDisappear);                                        // Enough to check in _oCurrent only, no ancestors
				oControl[sMethod]('spotlight', _onDisappear);                                        // Enough to check in _oCurrent only, no ancestors
				oControl[sMethod]('generated', _onDisappear);                                        // Enough to check in _oCurrent only, no ancestors
			}
			oControl[sMethod]('showing', _onDisappear);                                              // Have to add-remove hadler to all ancestors for showing
		
			_observeDisappearance(bObserve, oControl.parent, true);
		},
		
		// Set currently spotted control. 
		_setCurrent = function(oControl) {
			_initializeControl(oControl);

			if (!_oThis.isSpottable(oControl)) {
				throw 'Attempting to spot not-spottable control: ' + oControl.toString();
			}
			
			_oPrevious = _oCurrent;

			_oThis.unspot();                                                      // Remove spotlight class and Blur 
			_highlight(oControl);                                                 // Add spotlight class 
			
			_oCurrent = oControl;
			setTimeout(function() {                                               // Set observers asynchronously to allow painti to happen faster
				_observeDisappearance(false, _oPrevious);
				_observeDisappearance(true, _oCurrent);
			}, 1);
				
			_log('CURRENT =', _oCurrent.toString());
			enyo.Signals.send('onSpotlightCurrentChanged', {current: oControl});

			if (oControl.spotlight === true) {
				_oLastControl = oControl;
			}

			_dispatchEvent('onSpotlightFocused');

			enyo.Spotlight.TestMode.highlight();

			return true;
		},

		// Artificially trigger events on current control, like click
		_dispatchEvent = function(sEvent, oData, oControl) {
			oControl = oControl || _oThis.getCurrent();
			return enyo.Spotlight.Util.dispatchEvent(sEvent, oData, oControl);
		},

		// Moves to a nearest neightbor based on 5Way Spotlight event
		_5WayMove = function(oEvent) {
			var sDirection = oEvent.type.replace('onSpotlight', '').toUpperCase(),
				oControl   = enyo.Spotlight.NearestNeighbor.getNearestNeighbor(sDirection);

			_preventDomDefault(oEvent);   // If oEvent.allowDomDefault() was not called this will preventDefault on dom keydown event
			_oLast5WayEvent = oEvent;

			if (oControl) {
				_oThis.spot(oControl, sDirection);
			} else {
				if (enyo.Spotlight.Accelerator.isAccelerating()) {
					enyo.Spotlight.Accelerator.cancel();
				} else {
					var oParent = _oThis.getParent();
					if (!oParent || oParent.spotlightModal) {  // Reached the end of spottable world
						_oThis.spot(_oLastControl);
					} else {
						_oThis.spot(oParent, sDirection);
					}
				}
			}
		},
		
		// Is oEvent.keyCode an arrow or enter
		_is5WayKey = function(oEvent) {
			// 13==Enter, 16777221==KeypadEnter
			return (enyo.indexOf(oEvent.keyCode, [37, 38, 39, 40, 13, 16777221]) > -1);
		},

		// Is the key that was pressed, one that is supposed to be ignored by the event's originator?
		// This checks for whether the originator of the event, had any keyCodes specified, that it was supposed to ignore;
		// returning true if it was supposed to ignore the oEvent.keyCode, or false if not.
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

		// Prevent default on dom event associated with spotlight event
		// This is only for 5Way keydown events
		_preventDomDefault = function(oSpotlightEvent) {
			if (_is5WayKey(oSpotlightEvent)) {      // Prevent default to keep the browser from scrolling the page, etc.,
				oSpotlightEvent.domEvent.preventDefault();   // unless Event.allowDomDefault is explicitly called on the event
			}
		},

		// If originator is container, delegate processing of event to enyo.Spotlight.Container.onSpotlight*
		// Return values: if found method to delegate, return its return value otherwise return true
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

		// Get spottable target by id for pointer events
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
		
		_highlight = function(oControl, bIgnoreMute) {
			if (_oThis.isMuted() && !bIgnoreMute) { return; }  // Not highlighting when muted
			if (_oThis.isContainer(oControl))     { return; }  // Not highlighting containers
			if (!_oThis.isInitialized())          { return; }  // Not highlighting first non-container control - see this.initialize()

			// enyo.Spotlight.bench.stop();
			oControl.addClass('spotlight');
			_bFocusOnScreen = true;
		},
		
		_unhighlight = function(oControl) {
			oControl.removeClass('spotlight');
			_bFocusOnScreen = false;
		},
		
		_isPointingAway     = function() { return _oThis.getPointerMode() && !_oLastMouseMoveTarget; },
		_isTimestampExpired = function() { return enyo.perfNow() >= (_nPointerHiddenTime + _nPointerHiddenToKeyTimeout); },
		_setTimestamp       = function() { _nPointerHiddenTime = enyo.perfNow(); },
		// enyo.logs messages in verbose mode
		_log = function() {
			if (_bVerbose) {
				enyo.log('SPOTLIGHT: ' + Array.prototype.slice.call(arguments, 0).join(' '));
			}
		},
		
		// enyo.warns messages
		_warn = function() {
			enyo.warn('SPOTLIGHT: ' + Array.prototype.slice.call(arguments, 0).join(' '));
		},

		_spotLastControl = function() {
			if (_oThis.isSpottable(_oLastControl)) {
				_oThis.spot(_oLastControl);	
			} else {
				_oThis.spot(_oThis.getFirstChild(_oRoot));
			}
		},

		// Attempts to spot the control nearest the current pointer position.
		// If no nearest control is found, the previous control is spotted.
		_spotNearestToPointer = function(oEvent) {
			var oNearest = enyo.Spotlight.NearestNeighbor.getNearestPointerNeighbor(_oRoot, _getSpotDirection(oEvent), _nPrevClientX, _nPrevClientY);
			if (oNearest) {
				_oThis.spot(oNearest);
			} else {
				_spotLastControl();
			}
		},

		// Determines the intended direction of a keypress, given a keydown event.
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
		if (this.isInitialized()) {                      // Events only processed when Spotlight initialized with a root
			switch (oEvent.type) {
				case 'move':
					// Only register mousemove if the x/y actually changed, avoid mousemove while scrolling, etc.
					// We require two mousemove events to switch to pointer mode, since the device can send an errant mousemove
					// when pressing a 5-way key for the first time
					if (this.clientXYChanged(oEvent) && (_nMouseMoveCount++ > 1)) {  
						return this.onMouseMove(oEvent);
					}
					break;
				case 'mousedown':
					return this.onMouseDown(oEvent);
				case 'mouseup':
					return this.onMouseUp(oEvent);
				case 'click' :
				case 'tap'   :
				case 'ontap' :
					return this.onClick(oEvent);
				case 'mousewheel':
					if (_isPointingAway()) { return false; }                 // Don't dispatch spotlight mousewheel events if pointing away
					return enyo.Spotlight.Scrolling.processMouseWheel(oEvent, this.onScroll, this);
				case 'keydown':
					return this.onKeyDown(oEvent);
				case 'keyup':
					return this.onKeyUp(oEvent);
			}
		}
		return false; // Because we like to be explicit
	};

	// Receive accelerated keyup and keydown from accelerator
	this.onAcceleratedKey = function(oEvent) {
		oEvent.domEvent = oEvent;
		oEvent.allowDomDefault = function() {
			oEvent.preventDefault = function() {
				//enyo.log('Dummy funciton');
			};
		};
		this.initiateHoldPulse(oEvent);
		switch (oEvent.type) {
			case 'keydown'  : return _dispatchEvent('onSpotlightKeyDown', oEvent);
			case 'keyup'    : return _dispatchEvent('onSpotlightKeyUp'  , oEvent);
		}
		
		return true; // Should never get here
	};

	// Spotlight events bubbled back up to the App
	this.onSpotlightEvent = function(oEvent) {
		_oLastEvent = oEvent;
		
		if (!_delegateContainerEvent(oEvent)) {
			switch (oEvent.type) {
				case 'onSpotlightKeyUp'     : return this.onSpotlightKeyUp(oEvent);
				case 'onSpotlightKeyDown'   : return this.onSpotlightKeyDown(oEvent);
				case 'onSpotlightFocus'     : return this.onSpotlightFocus(oEvent);
				case 'onSpotlightFocused'   : return this.onSpotlightFocused(oEvent);
				case 'onSpotlightBlur'      : return this.onSpotlightBlur(oEvent);
				case 'onSpotlightLeft'      : return this.onSpotlightLeft(oEvent);
				case 'onSpotlightRight'     : return this.onSpotlightRight(oEvent);
				case 'onSpotlightUp'        : return this.onSpotlightUp(oEvent);
				case 'onSpotlightDown'      : return this.onSpotlightDown(oEvent);
				case 'onSpotlightSelect'    : return this.onSpotlightSelect(oEvent);
			}
		}
	};

	// Called by onEvent() (via spotlight scrolling) to process scroll events
	this.onScroll = function(oEvent, bUp) {
		var sEventName = 'onSpotlightScroll' + (bUp ? 'Up' : 'Down');
		return _dispatchEvent(sEventName, {domEvent: oEvent});
	};

	// Called by onEvent() to process mousemove events
	this.onMouseMove = function(oEvent) {
		if (!_bEnablePointerMode) { return; }
		this.setPointerMode(true);  // Preserving explicit setting of mode for future features
		if (this.getPointerMode()) {
			var oTarget = _getTarget(oEvent.target.id);
			if (oTarget && !this.isContainer(oTarget)) {
				
				if (
					oTarget === _oLastMouseMoveTarget && (
						oEvent.index === undefined || 
						oEvent.index === _oLastMouseMoveTarget._nCurrentSpotlightItem
					)
				) { return; } // ignore consecutive mouse moves on same target
				this.spot(oTarget, null, true);
				_oLastMouseMoveTarget = oTarget;

			} else {
				_oLastMouseMoveTarget = null;
				this.unspot();
			}
		}
		
		this.stopHold();  // There is a edge case that onSpotlightKeyUp is not comming
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
		
		if (this.getPointerMode()) { return false; } // Allow mousedown to bubble

		// Simulate an Enter key from Magic Remote click in 5Way mode
		oEvent.preventDefault();

		var oEventClone             = enyo.clone(oEvent);
		oEventClone.keyCode         = 13;
		oEventClone.domEvent        = oEvent;
		oEventClone.allowDomDefault = enyo.nop;
		
		_oDepressedControl = this.getCurrent();
		_dispatchEvent('onSpotlightKeyDown', oEventClone, _oDepressedControl);
		return true; // Because we should never see mouse events in 5way mode
	};

	// Called by onEvent() to process mouseup events
	this.onMouseUp = function(oEvent) {
		if (this.getPointerMode()) { return false; } // Allow mouseup to bubble

		// Simulate an Enter key from Magic Remote click in 5Way mode
		oEvent.preventDefault();

		var oEventClone      = enyo.clone(oEvent);
		oEventClone.keyCode  = 13;
		oEventClone.domEvent = oEvent;

		_dispatchEvent('onSpotlightKeyUp', oEventClone, _oDepressedControl);
		return true; // Because we should never see mouse events in 5way mode
	};

	// Called by onEvent() to process tap and click events
	this.onClick = function(oEvent) {
		// Prevent browser-simulated "click" events when pressing enter on a focused form control from being processed;
		if (enyo.Spotlight.Util.isSimulatedClick(oEvent)) { return true;  } // Prevent browser-simulated "click" events when pressing enter on a focused form control
		if (this.getPointerMode())                        { return false; } // Allow click to bubble

		// In 5Way mode we are simulating enter key down/up based on mousedown/up, so suppress click
		oEvent.preventDefault();
		return !oEvent.fromSpotlight; // Because we should never see mouse events in 5way mode unles we simulated them
	};
	
	// Called by onEvent() to process keydown
	this.onKeyDown = function(oEvent) {

		if (_isIgnoredKey(oEvent)) {
			return false;
		}

		//Update pointer mode based on special keycode from Input Manager for magic remote show/hide
		switch (oEvent.keyCode) {
			case KEY_POINTER_SHOW:                               // Pointer shown event; set pointer mode true
				this.setPointerMode(true);
				return false; 
			case KEY_POINTER_HIDE:                               // Pointer hidden event; set pointer mode false
				setTimeout(function () {
					if (this.getPointerMode()) {
						this.setPointerMode(false);
						if (!_oLastMouseMoveTarget) {                    // Spot last 5-way control, only if there's not already focus on screen
							enyo.asyncMethod(this, function() { _spotLastControl(); });
						}
						_setTimestamp();
					}
				}.bind(this), 30);
				return false;
		}

		// Arrow keys immediately switch to 5-way mode, and re-spot focus on screen if it wasn't already
		if (_is5WayKey(oEvent)) {
			var bWasPointerMode = this.getPointerMode();
			this.setPointerMode(false);

			if (!this.isSpottable(this.getCurrent())) {                              // Spot first available control on bootstrap
				_spotNearestToPointer(oEvent);
				return false;
			}
			
			if (!_isTimestampExpired() && !_oLastMouseMoveTarget) {                  // Does this immediately follow KEY_POINTER_HIDE
				_spotNearestToPointer(oEvent);
				return false;
			}
			
			if (bWasPointerMode && !_oLastMouseMoveTarget && !this.isFrozen()) {     // Spot last 5-way control, only if there's not already focus on screen
				_spotNearestToPointer(oEvent);
				return false;
			}
		}
		// Don't dispatch spotlight key events if we're in pointer mode and not currently spotting something
		if (_isPointingAway()) { return false; }
		enyo.Spotlight.Accelerator.processKey(oEvent, this.onAcceleratedKey, this);
		return false; // Always allow key events to bubble regardless of what onSpotlight** handlers return
	};
	
	this.onKeyUp = function(oEvent) {
		if (_isIgnoredKey(oEvent)) {
			return false;
		}
		enyo.Spotlight.Accelerator.processKey(oEvent, this.onAcceleratedKey, this);
		return false; // Always allow key events to bubble regardless of what onSpotlight** handlers return
	};

	//* Spotlight event handlers
	/************************************************************/

	this.onSpotlightRight  = function(oEvent) { _5WayMove(oEvent); };
	this.onSpotlightLeft   = function(oEvent) { _5WayMove(oEvent); };
	this.onSpotlightDown   = function(oEvent) { _5WayMove(oEvent); };
	this.onSpotlightUp     = function(oEvent) { _5WayMove(oEvent); };

	this.onSpotlightKeyUp    = function(oEvent) {
		var ret = true;
		switch (oEvent.keyCode) {
			case 13:
				enyo.mixin(oEvent, {sentHold: _sentHold});
				ret = _dispatchEvent('onSpotlightSelect', oEvent);
				this.stopHold(oEvent); 
				this.resetHold();
		}
		return ret; // Should never get here
	};
	this.onSpotlightKeyDown  = function(oEvent) {

		switch (oEvent.keyCode) {
			case 13: return this.beginHold(oEvent);
			case 37: return _dispatchEvent('onSpotlightLeft',   oEvent);
			case 38: return _dispatchEvent('onSpotlightUp',     oEvent);
			case 39: return _dispatchEvent('onSpotlightRight',  oEvent);
			case 40: return _dispatchEvent('onSpotlightDown',   oEvent);
		}

		return true; // Should never get here
	};

	this.onSpotlightSelect = function(oEvent) {
		_preventDomDefault(oEvent); // If oEvent.allowDomDefault() was not called this will preventDefault on dom keydown event
		var aChildren,
			oNeighbor = enyo.Spotlight.Util.getDefaultDirectionControl('SELECT', this.getCurrent());

		_oLast5WayEvent = null;	// clear last 5way event

		if (oNeighbor) {
			return this.spot(oNeighbor);
		}

		aChildren = this.getChildren(oEvent.originator);
		if (aChildren.length === 0) {
			return _dispatchEvent('tap', {customEvent: false, preventDefault: enyo.nop, fromSpotlight:true}, oEvent.originator);
		} else {
			return this.spot(aChildren[0]);
		}
	};

	this.onSpotlightFocus = function(oEvent) {
		_setCurrent(oEvent.originator);
	};

	this.onSpotlightFocused = function(oEvent) {};
	this.onSpotlightBlur    = function(oEvent) {};

	//* Public
	/******************* PUBLIC METHODS *********************/
	
	// Initializes spotlight's flags and root
	this.initialize = function(oRoot) {
		if (this.isInitialized()) { return false; }             // Prevent double init'ion, for example, it may be init'd in app.rendered before enyo.rendered.
		
		_oRoot = oRoot;                                         // Set root
		_interceptEvents();                                     // Capture spotlight events at root level of the app
		_bInitialized = true;                                   // From this point on, isInitialized() returns true. Need it to be true for spot() to spot
		
		if (_oDefaultControl) {
			if (this.spot(_oDefaultControl)) { return true; }
		}
		
		if (this.spot(this.getFirstChild(_oRoot))) { return true; }
		//_warn('Spotlight initialization failed. No spottable children found in ' + _oRoot.toString());
	};
	
	// Does spotlight have _oCurrent and last5waycontrol?
	this.isInitialized = function() { return _bInitialized; };

	this.setPointerMode  = function(bPointerMode) {
		if ((_bPointerMode != bPointerMode) && (!enyo.platform.touch)) {
			_bPointerMode = bPointerMode;
			_log('Pointer mode', _bPointerMode);
			_nMouseMoveCount = 0;
			enyo.Signals.send('onSpotlightModeChanged', {pointerMode: bPointerMode});
		}
	};

	this.getPointerMode       = function()                { return _bPointerMode;           };
	this.getCurrent           = function()                { return _oCurrent;               };
	this.setCurrent           = function(oControl)        { return _setCurrent(oControl);   };
	this.hasCurrent           = function()                { return _oCurrent !== null;      };
	this.getPrevious          = function()                { return _oPrevious;              };
	this.getLastEvent         = function()                { return _oLastEvent;             };
	this.getLastControl       = function()                { return _oLastControl;           };
	this.getLast5WayEvent     = function()                { return _oLast5WayEvent;         };

	// Deprecated; provided for backward-compatibility
	this.setLast5WayControl   = function(oControl)        { _oLastControl = oControl;       };

	this.isSpottable = function(oControl, bSkipContainers) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return false; }
		var bSpottable = false;
		
		if (this.isContainer(oControl)) {
			if (!bSkipContainers) {
				bSpottable = this.hasChildren(oControl);           // Are there spotlight=true descendants?
			}
		} else {
			bSpottable = (
				!oControl.destroyed                         && // Control has been destroyed, but not yet garbage collected
				typeof oControl.spotlight != 'undefined'    && // Control has spotlight property set
				oControl.spotlight                          && // Control has spotlight=true or 'container'
				oControl.getAbsoluteShowing(true)           && // Control is visible
				!oControl.disabled                          && // Control is not disabled
				oControl.generated                          && // Control is rendered
				!oControl.spotlightDisabled                    // Control does not have spotlight disabled
			);
		}
		return bSpottable;
	};
	
	// Is oControl.spotlight == "container"
	this.isContainer = function(oControl) {
		if (!oControl) { return false; }
		return oControl.spotlight == 'container';
	};
	
	// Is there at least one descendant of oControl (or oControl itself) that has spotlight = "true"
	this.hasChildren = function(oControl) {
		if (!oControl || oControl.spotlightDisabled) { return false; }
		if (!this.isContainer(oControl) && this.isSpottable(oControl)) { return true; }
		var n, aChildren = oControl.children;
		for (n=0; n<aChildren.length; n++) {
			if (this.hasChildren(aChildren[n])) { return true; }
		}
		return false;
	};

	// Returns spottable chldren along with position of self
	this.getSiblings = function(oControl) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return; }
		var n,
			o = {},
			oParent = this.getParent(oControl) || _oRoot;
			
		o.siblings = this.getChildren(oParent);

		for (n=0; n<o.siblings.length; n++) {
			if (oControl === o.siblings[n]) {
				o.selfPosition = n;
			}
		}

		return o;
	};
	
	// Returns all spottable children. 
	// If bSpotlightTrueOnly is "true", only spotlight = "true" controls will
	// be returned in the array of children. As a result, spotlight = "container"
	// controls will not be included, but rather their descendants will be examined.
	this.getChildren = function(oControl, bSpotlightTrueOnly) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return; }
		var n,
			aChildren = [],
			oNext;

		if (!oControl.spotlightDisabled) {
			for (n=0; n<oControl.children.length; n++) {
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

	// Returns closest spottable parent, or null if there is none
	this.getParent = function(oControl) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return; }
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

	// Dispatches focus event to the control or its first spottable child
	this.spot = function(oControl, sDirection, bWasPoint) {
		if (!this.isInitialized()) {                                                  // If spotlight is not yet initialized
			_oDefaultControl = oControl;                                              // Preserve control to be spotted on initialize
			return true;
		}
		
		if (!oControl) {                                                              // Cannot spot falsy values
			return false;                                                             //
		}
		
		if (!(oControl instanceof enyo.Control)) {                                    // Can only spot enyo.Controls
			_warn('argument is not enyo.Control');                                    //
			return false;
		}
		
		if (this.isFrozen()) {                                                        // Current cannot change while in frozen mode
			_warn('can\'t spot in frozen mode');                                      //
			return false;                                                             //
		}
		
		var oOriginal = oControl;
		if (!this.isSpottable(oControl)) {                                            // If control is not spottable, find its spottable child
			oControl = this.getFirstChild(oControl);
		}
		
		if (oControl) {
			if (_oCurrent === oControl) {                                             // If already spotted, nothing to do
				return true;
			}
			if (this.getPointerMode() && !bWasPoint) {	                              // When the user calls spot programmatically in pointer mode, we don't actually
				this.unspot();
				_oLastControl = oControl;                                             // spot; instead we just unspot and set up the _oLastControl 
				_oLastMouseMoveTarget = null;                                         // used when resuming 5-way focus on an arrow key press
				_log("Spot called in pointer mode; 5-way will resume from: " + oControl.id);
			} else {
				_dispatchEvent('onSpotlightFocus', {dir: sDirection}, oControl);      // Dispatch focus to new control
			}
			return true;
		}
		_warn('can\'t spot: ' + oOriginal.toString() + ' is not spottable and has no spottable descendants');
		
		return false;
	};

	// Dispatches spotlight blur event to current control
	this.unspot = function() {
		if (this.isFrozen()) { return false; }                                        // Current cannot change while in frozen mode
		if (this.hasCurrent() && _bFocusOnScreen) {
			_unhighlight(_oCurrent);
			_oLastMouseMoveTarget = null;
			_dispatchEvent('onSpotlightBlur', null, _oCurrent);
			_oCurrent = null;
			return true;
		}
		return false;
	};

	// Get first spottable child of a control
	this.getFirstChild = function(oControl) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return null; }
		return this.getChildren(oControl)[0];
	};

	// Has XY value changed since last mousemove event?
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

	// Switching to pointer mode
	this.disablePointerMode = function() { _bEnablePointerMode = false; };
	this.enablePointerMode  = function() { _bEnablePointerMode = true;  };

	// Switching to muted mode (no "spotlight" css class is being set in dom)
	this.mute    = function(oSender) { enyo.Spotlight.Muter.addMuteReason(oSender);    };
	this.unmute  = function(oSender) { enyo.Spotlight.Muter.removeMuteReason(oSender); };
	this.isMuted = function()        { return enyo.Spotlight.Muter.isMuted();          };
	
	// Switching to verbose mode
	this.verbose = function(bVerbose) {
		_bVerbose = (typeof bVerbose == 'undefined') ? !_bVerbose : bVerbose;
		return 'SPOTLIGHT: Verbose mode set to ' + _bVerbose;
	};
	
	// Switching to frozen mode (current cannot change while frozen)
	this.freeze = function() {
		if (this.hasCurrent()) {
			_bFrozen = true;
		} else {
			_warn('Can not enter frozen mode until something is spotted');
		}
	};
	this.unfreeze = function() { _bFrozen = false; };
	this.isFrozen = function() { return _bFrozen;  };

	// Highlighting
	this.highlight   = function(oControl, bIgnoreMute) { _highlight(oControl, bIgnoreMute); };
	this.unhighlight = function(oControl)              { _unhighlight(oControl);            };


	//* Emulate holdPulse for onSpotlightkeyDown event
	//* To-do: These are not public functions. Move to private.
	/************************************************************/
	
	// Decorate event to let user can call configureHoldPulse function
	this.initiateHoldPulse = function(oEvent) {
		// Set holdpulse defaults and expose method for configuring holdpulse options
		if (oEvent.keyCode === 13) {
			enyo.gesture.drag.holdPulseConfig = enyo.clone(enyo.gesture.drag.holdPulseDefaultConfig);
			oEvent.configureHoldPulse = enyo.gesture.configureHoldPulse;
			oEvent.cancelHoldPulse = enyo.bind(this, "cancelHold");
		}
	};
	// Get default holdPulseConfig if it if not initialized by down event
	this.getHoldPulseDelay = function(oEvent) {
		var drag = enyo.gesture.drag;
		return Object.keys(drag.holdPulseConfig).length > 0 ? drag.holdPulseConfig.delay : drag.holdPulseDefaultConfig.delay;
	};
	// Initiate relevant variables and start sending holdPulse job 
	this.beginHold = function(oEvent) {
		if (_bHold) { return; } // Prevent consecutive hold start

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
	// Clear relevant variables and cancel holdPulse job 
	this.stopHold = function(oEvent) {
		if (!_bHold) { return; } // Do nothing if not in hold status
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
	this.resetHold = function() {
		_bCancelHold = false;
	};
	// Clear relevant variables and cancel holdPulse job 
	this.cancelHold = function(oEvent) {
		_bCancelHold = true;
	};
	// Send onHoldPulse event with holdTime parameter
	this.sendHoldPulse = function(oEvent) {
		if (_bCancelHold) { return; }
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
