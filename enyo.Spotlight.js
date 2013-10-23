/**
 * Spotlight definition
 * @author: Lex Podgorny
 */

enyo.Spotlight = new function() {

	//* @protected
	/************************************************************/

	var _oThis                          = this,
		_oRoot                          = null,     // Component owner, usually application
		_bPointerMode                   = false,
		_oCurrent                       = null,     // Currently spotlighted element
		_oDecorators                    = {},       // For further optimization
		_oLastEvent                     = null,
		_oLast5WayEvent                 = null,
		_oLastSpotlightTrueControl      = null,
		_oLastSpotlightTrueControl5Way  = null,
		_bCanFocus                      = true,     // Flag reserved for hiding focus when entering pointer mode
		_bEnablePointerMode             = true,     // For things like input boxes we need a way to disable pointer mode while cursor is in
		_oDepressedControl              = null,     // Keeping state consistency between onMouseDown() and onMouseUp(), for cases when focus has been moved in between
		_bVerbose                       = false,    // In verbose mode spotlight prints 1) Current 2) Pointer mode change to enyo.log

		_nPrevClientX                   = null,
		_nPrevClientY                   = null,
		_oLastMouseMoveTarget           = null;


	var _initialize = function() {
			_oRoot = enyo.master;
			_interceptEvents();
		},

		// Event hook to the owner to catch Spotlight Events
		_interceptEvents = function() {
			_oThis.rootDispatchFunction = _oRoot.dispatchEvent;
			_oRoot.dispatchEvent = function(sEventName, oEvent, oSender) {
				if (_oThis.rootDispatchFunction.apply(_oRoot, [sEventName, oEvent, oSender])) {
					return true;
				}
				if (!oEvent.delegate) {
					return _oThis.onSpotlightEvent(oEvent);
				}
			};
		},

		_initializeControl = function(oControl) {
			// Create control-specific spotlight state storage
			if (typeof oControl._spotlight == 'undefined') {
				oControl._spotlight = {};
			}
		},

		// Set currently spotted control
		_setCurrent = function(oControl) {
			if (_oCurrent === oControl) { return true; }

			_initializeControl(oControl);

			if (!_oThis.isSpottable(oControl)) {
				throw 'Attempting to spot not-spottable control ' + oControl.name;
			}

			_oCurrent = oControl;

			if (_bVerbose) { enyo.log('SPOTLIGHT CURRENT: ', oControl.name, '[' + oControl.kindName + ']'); }

			enyo.Signals.send('onSpotlightCurrentChanged', {current: oControl});

			if (oControl.spotlight === true) {
				_oLastSpotlightTrueControl = oControl;
				if (!_oThis.getPointerMode() || !_oLastSpotlightTrueControl5Way) {
					_oThis.setLast5WayControl(oControl);
				}
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
				var oParent = _oThis.getParent();
				if (typeof oParent.spotlight == 'undefined' || oParent.spotlightModal) {  // Reached the end of spottable world
					_oThis.spot(_oLastSpotlightTrueControl);
				} else {
					_oThis.spot(_oThis.getParent(), sDirection);
				}
			}
		},

		// Is n a key code of an arrow button?
		_isArrowKey = function(n) {
			return enyo.indexOf(n, [37, 38, 39, 40]) > -1;
		},

		// Prevent default on dom event associated with spotlight event
		// This is only for 5Way keydown events
		_preventDomDefault = function(oSpotlightEvent) {
			if (_isArrowKey(oSpotlightEvent.keyCode)) {      // Prevent default to keep the browser from scrolling the page, etc.,
				oSpotlightEvent.domEvent.preventDefault();   // unless Event.allowDomDefault is explicitly called on the event
			}
		},

		// Get decorator for a control
		_getDecorator = function(oSender) {
			if (oSender.spotlight == 'container') {   // Process containers
				return enyo.Spotlight.Decorator['Container'];
			}

			if (oSender.spotlightDecorate === false) {
				return null;
			}

			if (typeof _oDecorators[oSender.kindName] != 'undefined') {
				return _oDecorators[oSender.kindName];
			}

			var oDecorator = null,
				oDecorates,
				oDecoratesOld,
				o;

			// Process non-containers
			for (var s in enyo.Spotlight.Decorator) {                                  // Loop through decorators namespace
				o = enyo.Spotlight.Decorator[s];
				oDecorates = enyo.getPath(o.decorates);
				if (oDecorates && oSender instanceof oDecorates) {                     // If decorator applies to oSender
					if (!oDecorator) {                                                 // If decorator was NOT set in previous iteration
						oDecorator = o;                                                // Set it to the first value
					} else {                                                           // If decorator WAS set in previous iteration
						oDecoratesOld = enyo.getPath(oDecorator.decorates);
						if (oDecorates.prototype instanceof oDecoratesOld) {           // IF oDecorates is closer to oSender in lineage
							oDecorator = o;                                            // Set it as optimal decorator
						}
					}
				}
			}

			_oDecorators[oSender.kindName] = oDecorator;       // Hash decorator by sender kind
			return oDecorator;
		},

		// If decorator present, delegate event to it's corresponding method
		// Return values: if found method to delegate, return it's return value otherwise return true
		_delegateSpotlightEvent = function(oEvent) {
			if (!oEvent.type || oEvent.type.indexOf('onSpotlight') !== 0) { return false; }

			var oSender    = oEvent.originator,
				oDecorator = _getDecorator(oSender);

			if (oDecorator && typeof oDecorator[oEvent.type] == 'function') {
				return oDecorator[oEvent.type](oSender, oEvent);
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

		// Return true if was in pointer mode
		_comeBackFromPointerMode = function() {
			if (!_bCanFocus) {  // Comming back from pointer mode, show control once before continuing navigation
				_bCanFocus = true;
				_oThis.spot(_oLastSpotlightTrueControl5Way);
				return true;
			}
			return false;
		};

	//* Generic event handlers
	/***************************************************/

	// Events dispatched to the spotlighted controls
	this.onEvent = function(oEvent) {
		if (_oRoot) {                              // Events only processed when Spotlight initialized with a root
			switch (oEvent.type) {
				case 'mousemove':
					if (this.clientXYChanged(oEvent)) {  // Only register mousemove if the x/y actually changed, avoid mousemove while scrolling, etc.
						this.onMouseMove(oEvent);
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
					return enyo.Spotlight.Scrolling.processMouseWheel(oEvent, this.onScroll, this);
				case 'keydown':
				case 'keyup':
					// Filter out special keycode from Input Manager for magic remote show/hide
					if (oEvent.keyCode === 0 && (oEvent.keyIdentifier === "U+1200202" || oEvent.keyIdentifier === "U+1200201")) {return true;}
					return enyo.Spotlight.Accelerator.processKey(oEvent, this.onAcceleratedKey, this);
			}
		}
	};

	// Receive accelerated keyup and keydown from accelerator
	this.onAcceleratedKey = function(oEvent) {
		oEvent.domEvent = oEvent;
		oEvent.allowDomDefault = function() {
			oEvent.preventDefault = function() {
				//enyo.log('Dummy funciton');
			};
		};

		// Special case code for bootstrapping 5-way navigation - can't dispatch Spotlight
		// key events until we have a spotted a child at least once, so we do it here
		if (!this.getCurrent() && _isArrowKey(oEvent.keyCode) && enyo.roots && enyo.roots[0]) {
			this.setPointerMode(false);
			_bCanFocus = true;
			enyo.Spotlight.spot(enyo.roots[0]);
			return;
		}

		switch (oEvent.type) {
			case 'keydown'  : return _dispatchEvent('onSpotlightKeyDown', oEvent);
			case 'keyup'    : return _dispatchEvent('onSpotlightKeyUp'  , oEvent);
		}

		return true; // Should never get here
	};

	// Spotlight events bubbled back up to the App
	this.onSpotlightEvent = function(oEvent) {
		_oLastEvent = oEvent;

		if (_delegateSpotlightEvent(oEvent)) { return false; } // If decorator's onSpotlight<Event> method returns true - kill Spotlight event

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
			case 'onSpotlightPoint'     : return this.onSpotlightPoint(oEvent);
		}
	};

	this.onScroll = function(oEvent, bUp) {
		this.setPointerMode(false);  // Preserving explicit setting of mode for future features
		if (_comeBackFromPointerMode()) {
			return true;
		}

		var sEventName = 'onSpotlightScroll' + (bUp ? 'Up' : 'Down');
		_dispatchEvent(sEventName, {domEvent: oEvent});
	};

	// Called by onEvent() to process mousemove events
	this.onMouseMove = function(oEvent) {
		if (!_bEnablePointerMode) { return; }
		this.setPointerMode(true);  // Preserving explicit setting of mode for future features
		if (this.getPointerMode()) {
			var oTarget = _getTarget(oEvent.target.id);
			if (oTarget) {
				if (oTarget === _oLastMouseMoveTarget &&
					(oEvent.index === undefined ||
					oEvent.index === _oLastMouseMoveTarget._nCurrentSpotlightItem)) {
					// ignore consecutive mouse moves on same target
					return;
				}
				_oLastMouseMoveTarget = oTarget;
				_bCanFocus = true;
				_dispatchEvent('onSpotlightPoint', oEvent, oTarget);
				if (oTarget.spotlight !== true) {
					_bCanFocus = false;
					this.unspot();
				}
			} else {
				_oLastMouseMoveTarget = null;
				_bCanFocus = false;
				this.unspot();
			}
		}
	};

	this.onMouseDown = function(oEvent) {
		if (this.getPointerMode()) { return; }
		oEvent.preventDefault();

		var oEventClone      = enyo.clone(oEvent);
		oEventClone.keyCode  = 13;
		oEventClone.domEvent = oEvent;
		oEventClone.allowDomDefault = enyo.nop;

		_oDepressedControl = this.getCurrent();
		return _dispatchEvent('onSpotlightKeyDown', oEventClone, _oDepressedControl);
	};

	this.onMouseUp = function(oEvent) {
		if (this.getPointerMode()) { return; }
		oEvent.preventDefault();

		var oEventClone      = enyo.clone(oEvent);
		oEventClone.keyCode  = 13;
		oEventClone.domEvent = oEvent;

		return _dispatchEvent('onSpotlightKeyUp', oEventClone, _oDepressedControl);
	};

	this.onClick = function(oEvent) {
		_oLastSpotlightTrueControl5Way = this.getCurrent(); // Will come back form pointer mode to last 5way'd or clicked control
		if (this.getPointerMode()) { return; }
		oEvent.preventDefault();
		return true;
	};

	//* Spotlight event handlers
	/************************************************************/

	this.onSpotlightRight  = function(oEvent) { _5WayMove(oEvent); };
	this.onSpotlightLeft   = function(oEvent) { _5WayMove(oEvent); };
	this.onSpotlightDown   = function(oEvent) { _5WayMove(oEvent); };
	this.onSpotlightUp     = function(oEvent) { _5WayMove(oEvent); };

	this.onSpotlightKeyUp    = function(oEvent) {};
	this.onSpotlightKeyDown  = function(oEvent) {
		if (_isArrowKey(oEvent.keyCode)) {
			this.setPointerMode(false);  // Preserving explicit setting of mode for future features
			if (_comeBackFromPointerMode()) {
				return true;
			}
		}

		switch (oEvent.keyCode) {
			case 13: return _dispatchEvent('onSpotlightSelect', oEvent);
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
			return _dispatchEvent('ontap', null, oEvent.originator);
		} else {
			return this.spot(aChildren[0]);
		}
	};

	this.onSpotlightFocus = function(oEvent) {
		_setCurrent(oEvent.originator);
	};

	this.onSpotlightFocused = function(oEvent) {};

	this.onSpotlightBlur = function(oEvent) {
		if (_oCurrent) {
			oEvent.originator.removeClass('spotlight');
		}
	};

	this.onSpotlightPoint = function(oEvent) {
		if (oEvent.originator.spotlight != 'container') {
			this.spot(oEvent.originator);
		}
	};

	//* Public
	/******************* PUBLIC METHODS *********************/

	this.setPointerMode  = function(bPointerMode) {
		if (_bPointerMode != bPointerMode) {
			_bPointerMode = bPointerMode;
			if (_bVerbose) { enyo.log('SPOTLIGHT: Pointer mode', _bPointerMode); }
			enyo.Signals.send('onSpotlightModeChanged', {pointerMode: bPointerMode});
		}
	};

	this.getPointerMode       = function()                { return _bPointerMode;                        };
	this.getCurrent           = function()                { return _oCurrent;                            };
	this.setCurrent           = function(oControl)        { return _setCurrent(oControl);                };
	this.getLastEvent         = function()                { return _oLastEvent;                          };
	this.getLastControl       = function()                { return _oLastSpotlightTrueControl;           };
	this.getLast5WayEvent     = function()                { return _oLast5WayEvent;                      };
	this.setLast5WayControl   = function(oControl)        { _oLastSpotlightTrueControl5Way = oControl;   };

	this.isSpottable = function(oControl) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return; }
		var bSpottable = (
			!oControl._destroyed                        && // Control has been destroyed, but not yet garbage collected
			typeof oControl.spotlight != 'undefined'    && // Control has spotlight property set
			oControl.spotlight                          && // Control has spotlight=true or 'container'
			oControl.getAbsoluteShowing()               && // Control is visible
			!(oControl.disabled)                           // Control is not disabled
		);
		return bSpottable;
	};

	// Returns spottable chldren along with position of self
	this.getSiblings = function(oControl) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return; }
		var n,
			o = {},
			oParent = this.getParent(oControl) || oControl.parent;
		o.siblings = this.getChildren(oParent);

		for (n=0; n<o.siblings.length; n++) {
			if (oControl === o.siblings[n]) {
				o.selfPosition = n;
			}
		}

		return o;
	};

	// Returns all spottable children
	this.getChildren = function(oControl) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return; }
		var n,
			aChildren = [],
			oNext;

		for (n=0; n<oControl.children.length; n++) {
			oNext = oControl.children[n];
			if (this.isSpottable(oNext)) {
				aChildren.push(oNext);
			} else {
				aChildren = aChildren.concat(this.getChildren(oNext));
			}
		}
		return aChildren;
	};

	// Returns closest spottable parent
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
		oSpottableParent = oSpottableParent || oControl;
		return oSpottableParent;
	};

	// Dispatches focus event to the control or it's first spottable child
	this.spot = function(oControl, sDirection) {
		if (!_bCanFocus) { return false; }               // Focusing is disabled when entering pointer mode

		if (_oCurrent && !this.isSpottable(oControl)) {  // Control is not spottable and something is already
			return false;
		}
		if (_oCurrent && oControl !== _oCurrent) {       // Blur last control before spotting new one
			_dispatchEvent('onSpotlightBlur', null);
		}

		oControl = oControl || this.getCurrent();
		if (!this.isSpottable(oControl)) {
			oControl = this.getFirstChild(oControl);
		}
		if (oControl) {
			if (!oControl.hasClass('spotlight') && !this.isMuted() && (oControl.spotlight !== 'container')) {
				oControl.addClass('spotlight');
			}
			_dispatchEvent('onSpotlightFocus', {dir: sDirection}, oControl);
			return true;
		}
		return false;
	};

	// Dispatches spotlight blur event to current control
	this.unspot = function() {
		if (_oCurrent) {
			_dispatchEvent('onSpotlightBlur', null, _oCurrent);
			return true;
		}

		return false;
	};

	// Get first spottable child of a control
	this.getFirstChild = function(oControl) {
		oControl = oControl || this.getCurrent();
		if (!oControl) { return; }
		return this.getChildren(oControl)[0];
	};

	// Has XY value changed since last mousemove event?
	this.clientXYChanged = function(oEvent) {
		var bChanged = (
			_nPrevClientX !== oEvent.clientX ||
			_nPrevClientY !== oEvent.clientY
		);

		_nPrevClientX = oEvent.clientX;
		_nPrevClientY = oEvent.clientY;

		return bChanged;
	};

	// Disables switching to pointer mode
	this.disablePointerMode = function() { _bEnablePointerMode = false; };

	// Enables switching to pointer mode
	this.enablePointerMode = function() { _bEnablePointerMode = true; };

	this.mute    = function(oSender) { enyo.Spotlight.Muter.addMuteReason(oSender);    };
	this.unmute  = function(oSender) { enyo.Spotlight.Muter.removeMuteReason(oSender); };
	this.isMuted = function()        { return enyo.Spotlight.Muter.isMuted(); };

	this.verbose = function(bVerbose) {
		_bVerbose = (typeof bVerbose == 'undefined') ? !_bVerbose : bVerbose;
		return 'SPOTLIGHT: Verbose mode set to ' + _bVerbose;
	};

	_initialize();
}();

// Event hook to all system events to catch KEYPRESS and Mouse Events
enyo.dispatcher.features.push(function(oEvent) {
	return enyo.Spotlight.onEvent(oEvent);
});


