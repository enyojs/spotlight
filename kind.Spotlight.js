/**
 * Spotlight kind definition
 * @author: Lex Podgorny
 * 
 */

enyo.kind({
	name: 'enyo.Spotlight',
	published: {
		defaultControl	: null,
		useVisuals		: true
	},
	
	//* @public
	/************************************************************/

	rendered: function() {
		this.inherited(arguments);
		enyo.Spotlight.initialize(this.owner, this.defaultControl);
	},

	destroy: function() {
		enyo.Spotlight.deregister(this.owner);
		this.inherited(arguments);
	},

	statics: {
		
		//* @protected
		/************************************************************/
		
		_bPointerMode					: false,
		_oCurrent						: null,		// Currently spotlighted element
		_oOwner							: null,		// Component owner, usually application
		_oDecorators					: {},		// For further optimization
		_oLastEvent						: null,
		_oLast5WayEvent					: null,
		_nLastKey						: null,
		_oLastSpotlightTrueControl 		: null,
		_oLastSpotlightTrueControl5Way 	: null,
		_bCanFocus						: true,		// Flag reserved for hiding focus when entering pointer mode
		_bEnablePointerMode             : true,     // For things like input boxes we need a way to disable pointer mode while cursor is in
		
		_testMode						: false,
		_testModeHighlightNodes			: [],

		_nPrevClientX					: null,
		_nPrevClientY					: null,
		
		// Set currently spotted control
		_setCurrent: function(oControl) {
			// Create control-specific spotlight state storage
			if (typeof oControl._spotlight == 'undefined') {
				oControl._spotlight = {};
			}
			if (!this.isSpottable(oControl)) {
				throw 'Attempting to spot not-spottable control [' + oControl.kindName + ':' + oControl.name + ']';
			}
			if (this._oCurrent === oControl) {
				return true;
			}
			this._oCurrent = oControl;
			// console.log('CURRENT: ', oControl.name, oControl.kindName);
			enyo.Signals.send('onSpotlightCurrentChanged', {current: oControl});
			if (oControl.spotlight === true) {
				this._oLastSpotlightTrueControl = oControl;
				if (!this.getPointerMode() || !this._oLastSpotlightTrueControl5Way) {
					this.setLast5WayControl(oControl);
				}
			}
			this._dispatchEvent('onSpotlightFocused');

			if (this.getTestMode()) {
				this._doTestModeHighlighting();
			}

			return true;
		},

		// Artificially trigger events on current control, like click
		_dispatchEvent: function(sEvent, oData, oControl) {
			oControl = oControl || this.getCurrent();
			return enyo.Spotlight.Util.dispatchEvent(sEvent, oData, oControl);
		},

		// Event hook to the owner to catch Spotlight Events
		_interceptEvents: function() {
			var oThis = this;

			this.ownerDispatchFn = this._oOwner.dispatchEvent;
			this._oOwner.dispatchEvent = function(sEventName, oEvent, oSender) {
				var bOwnerDispatchResult = oThis.ownerDispatchFn.apply(oThis._oOwner, [sEventName, oEvent, oSender]);
				var bSpotlightResult = oThis.onSpotlightEvent(oEvent);
				return bOwnerDispatchResult || bSpotlightResult;
			};
		},
		
		// Moves to a nearest neightbor based on 5Way Spotlight event
		_5WayMove: function(oEvent) {
			var sDirection	= oEvent.type.replace('onSpotlight', '').toUpperCase(),
				oControl	= enyo.Spotlight.NearestNeighbor.getNearestNeighbor(sDirection);
				
			this._preventDomDefault(oEvent);						// If oEvent.allowDomDefault() was not called this will preventDefault on dom keydown event
			this._oLast5WayEvent = oEvent;
			
			if (oControl) {
				this.spot(oControl, sDirection);
			} else {
				var oParent = this.getParent();
				if (typeof oParent.spotlight == 'undefined') { 		// Reached the end of spottable world
					this.spot(this._oLastSpotlightTrueControl);
				} else {
					this.spot(this.getParent(), sDirection);
				}
			}
		},
		
		// Is n a key code of one of the 5Way buttons?
		_is5WayKeyCode: function(n) {
			return [13, 37, 38, 39, 40].join(',').indexOf(n + '') > -1
		},
		
		// Prevent default on dom event associated with spotlight event
		// This is only for 5Way keydown events
		_preventDomDefault: function(oSpotlightEvent) {
			if (this._is5WayKeyCode(oSpotlightEvent.keyCode)) {		// Prevent default to keep the browser from scrolling the page, etc., 
				//enyo.log('Preventing', oSpotlightEvent.domEvent, 'spotlight event:', oSpotlightEvent.type);
				oSpotlightEvent.domEvent.preventDefault();			// unless Event.allowDomDefault is explicitly called on the event
			}
		},

		// Get decorator for a control
		_getDecorator: function(oSender) {
			if (oSender.spotlight == 'container') {							// Process containers
				return enyo.Spotlight.Decorator['Container'];
			}

			if (oSender.spotlightDecorate == false) {
				return null;
			}

			if (typeof this._oDecorators[oSender.kindName] != 'undefined') {
				return this._oDecorators[oSender.kindName];
			}

			var oDecorator = null,
				o;

			// Process non-containers
			for (var s in enyo.Spotlight.Decorator) {						// Loop through decorators namespace
				o = enyo.Spotlight.Decorator[s];
				if (o.decorates && oSender instanceof o.decorates) {			// If decorator applies to oSender
					if (!oDecorator) {												// If decorator was NOT set in previous iteration
						oDecorator = o;													// Set it to the first value
					} else {														// If decorator WAS set in previous iteration
						if (o.decorates.prototype instanceof oDecorator.decorates) {	// IF o.decorates is closer to oSender in lineage
							oDecorator = o;													// Set it as optimal decorator
						}
					}
				}
			}

			this._oDecorators[oSender.kindName] = oDecorator;					// Hash decorator by sender kind
			return oDecorator;
		},

		// If decorator present, delegate event to it's corresponding method
		// Return values: if found method to delegate, return it's return value otherwise return true
		_delegateSpotlightEvent: function(oEvent) {
			if (!oEvent.type || oEvent.type.indexOf('onSpotlight') != 0) { return false; }

			var s,
				oSender 	= oEvent.originator
				oDecorator 	= this._getDecorator(oSender);

			if (oDecorator && typeof oDecorator[oEvent.type] == 'function') {
				return oDecorator[oEvent.type](oSender, oEvent);
			}

			return false;
		},

		// Get spottable target by id for pointer events
		_getTarget: function(sId) {
			var oTarget = enyo.$[sId];
			if (typeof oTarget != 'undefined') {
				if (this.isSpottable(oTarget)) {
					return oTarget;
				} else {
					return this.getParent(oTarget);
				}
			}
		},
		
		// Return true if was in pointer mode
		_comeBackFromPointerMode: function() {
			if (!this._bCanFocus) {											// Comming back from pointer mode, show control once before continuing navigation
				this._bCanFocus = true;
				this.spot(this._oLastSpotlightTrueControl5Way);
				return true;
			}
			return false;
		},
		
		//* @public
		/************************************************************/

		initialize: function(oOwner, sDefaultControl) {
			if (this._oOwner) {
				enyo.warn('enyo.Spotlight initialized before previous owner deregistered');
				this.deregister(this._oOwner);
			}
			this._oCurrent = null;
			this._oOwner   = oOwner;

			this._interceptEvents();

			if (sDefaultControl && typeof this._oOwner.$[sDefaultControl] != 'undefined') {
				this.spot(this._oOwner.$[sDefaultControl]);
			} else {
				this.spot(this._oOwner);
			}
		},

		deregister: function(oOwner) {
			oOwner.dispatchEvent = this.ownerDispatchFn;
			this._oOwner = null;
		},
		
		// Events dispatched to the spotlighted controls
		onEvent: function(oEvent) {
			var oTarget = null;
			if (this._oOwner) {												// Events only processed when Spotlight initialized with an owner
				switch (oEvent.type) {
					case 'mousemove':
						if (this.clientXYChanged(oEvent)) {					// Only register mousemove if the x/y actually changed, avoid mousemove while scrolling, etc.
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
						return enyo.Spotlight.Accelerator.processKey(oEvent, this.onAcceleratedKey, this);
				}
			}
		},
		
		// Receive accelerated keyup and keydown from accelerator
		onAcceleratedKey: function(oEvent) {
			oEvent.domEvent = oEvent;
			oEvent.allowDomDefault = function() {
				//enyo.log('Setting preventDefault to dummy on', oEvent);
				oEvent.preventDefault = function() { 
					//enyo.log('Dummy funciton');
				};
			};
			
			switch (oEvent.type) {
				case 'keydown'	: return enyo.Spotlight._dispatchEvent('onSpotlightKeyDown', oEvent);
				case 'keyup'	: return enyo.Spotlight._dispatchEvent('onSpotlightKeyUp'  , oEvent);
			}
			
			return true; // Should never get here
		},

		// Spotlight events bubbled back up to the App
		onSpotlightEvent: function(oEvent) {
			this._oLastEvent = oEvent;

			if (this._delegateSpotlightEvent(oEvent)) { return false; }	// If decorator's onSpotlight<Event> method returns true - kill Spotlight event

			switch (oEvent.type) {
				case 'onSpotlightKeyUp'		: return this.onSpotlightKeyUp(oEvent);
				case 'onSpotlightKeyDown'	: return this.onSpotlightKeyDown(oEvent);
				case 'onSpotlightFocus'		: return this.onSpotlightFocus(oEvent);
				case 'onSpotlightFocused'	: return this.onSpotlightFocused(oEvent);
				case 'onSpotlightBlur'		: return this.onSpotlightBlur(oEvent);
				case 'onSpotlightLeft'		: return this.onSpotlightLeft(oEvent);
				case 'onSpotlightRight'		: return this.onSpotlightRight(oEvent);
				case 'onSpotlightUp'		: return this.onSpotlightUp(oEvent);
				case 'onSpotlightDown'		: return this.onSpotlightDown(oEvent);
				case 'onSpotlightSelect'	: return this.onSpotlightSelect(oEvent);
				case 'onSpotlightPoint'		: return this.onSpotlightPoint(oEvent);
			}
		},
		
		onScroll: function(oEvent, bUp) {
			this.setPointerMode(false);									// Preserving explicit setting of mode for future features
			if (this._comeBackFromPointerMode()) {
				return true;
			}
			
			var sEventName = 'onSpotlightScroll' + (bUp ? 'Up' : 'Down');
			this._dispatchEvent(sEventName, {domEvent: oEvent});
		},
		
		// Called by onEvent() to process mousemove events
		onMouseMove: function(oEvent) {
			if (!this._bEnablePointerMode) { return; }
			// console.log('Mousemove');
			this.setPointerMode(true);  								// Preserving explicit setting of mode for future features
			if (this.getPointerMode()) {
				oTarget = this._getTarget(oEvent.target.id);
				if (oTarget) {
					this._dispatchEvent('onSpotlightPoint', oEvent, oTarget);
					if (oTarget.spotlight !== true) {
						this._bCanFocus = false;
						this.unspot();
					} else {
						this._bCanFocus = true;
					}
				} else {
					this._bCanFocus = false;
					this.unspot();
				}
			}
		},
		
		onMouseDown: function(oEvent) {
			if (this.getPointerMode()) { return; }
			oEvent.keyCode  = 13;
			oEvent.domEvent = oEvent;
			oEvent.preventDefault();
			return this._dispatchEvent('onSpotlightKeyDown', oEvent);
		},
		
		onMouseUp: function(oEvent) {
			if (this.getPointerMode()) { return; }
			oEvent.keyCode  = 13;
			oEvent.domEvent = oEvent;
			oEvent.preventDefault();
			return this._dispatchEvent('onSpotlightKeyUp', oEvent);
		},
		
		onClick: function(oEvent) {
			if (this.getPointerMode()) { return; }
			oEvent.preventDefault();
			return true;
		},

		//* Spotlight event handlers
		/************************************************************/

		onSpotlightRight : function(oEvent) { this._5WayMove(oEvent); },
		onSpotlightLeft	 : function(oEvent) { this._5WayMove(oEvent); },
		onSpotlightDown	 : function(oEvent) { this._5WayMove(oEvent); },
		onSpotlightUp	 : function(oEvent) { this._5WayMove(oEvent); },
		
		onSpotlightKeyUp   : function(oEvent) {},
		onSpotlightKeyDown : function(oEvent) {
			this.setPointerMode(false);										// Preserving explicit setting of mode for future features
			if (this._comeBackFromPointerMode()) {
				return true;
			}
			
			if (!this.getPointerMode()) {
				switch (oEvent.keyCode) {
					case 13: return this._dispatchEvent('onSpotlightSelect', oEvent);
					case 37: return this._dispatchEvent('onSpotlightLeft', 	 oEvent);
					case 38: return this._dispatchEvent('onSpotlightUp', 	 oEvent);
					case 39: return this._dispatchEvent('onSpotlightRight',  oEvent);
					case 40: return this._dispatchEvent('onSpotlightDown', 	 oEvent);
				}
			}
			
			return true; // Should never get here
		},

		onSpotlightSelect: function(oEvent) {
			this._preventDomDefault(oEvent);								// If oEvent.allowDomDefault() was not called this will preventDefault on dom keydown event
			var aChildren,
				oNeighbor = enyo.Spotlight.Util.getDefaultDirectionControl('SELECT', this.getCurrent());
				
			if (oNeighbor) {
				return this.spot(oNeighbor);
			}
			
			aChildren = this.getChildren(oEvent.originator);
			if (aChildren.length == 0) {
				return this._dispatchEvent('ontap', null, oEvent.originator);
			} else {
				return this.spot(aChildren[0]);
			}
		},

		onSpotlightFocus: function(oEvent) {
			this._setCurrent(oEvent.originator);
		},

		onSpotlightFocused: function(oEvent) {},

		onSpotlightBlur: function(oEvent) {
			if (this._oCurrent) {
				oEvent.originator.removeClass('spotlight');
			}
		},

		onSpotlightPoint: function(oEvent) {
			if (oEvent.originator.spotlight != 'container') {
				this.spot(oEvent.originator);
			}
		},

		//* @public
		/************************************************************/

		setPointerMode : function(bPointerMode)	{
			if (this._bPointerMode != bPointerMode) {
				enyo.Signals.send('onSpotlightModeChanged', {pointerMode: bPointerMode});
			}
			this._bPointerMode = bPointerMode;
		},

		getPointerMode		: function() 				{ return this._bPointerMode; 						},
		getCurrent			: function() 				{ return this._oCurrent; 							},
		setCurrent			: function(oControl)		{ return this._setCurrent(oControl); 				},
		getLastEvent	 	: function() 				{ return this._oLastEvent; 	 						},
		getLastControl		: function()				{ return this._oLastSpotlightTrueControl			},
		getLast5WayEvent 	: function() 				{ return this._oLast5WayEvent;  					},
		setLast5WayControl	: function(oControl)		{ this._oLastSpotlightTrueControl5Way = oControl; 	},

		isSpottable: function(oControl) {
			oControl = oControl || this.getCurrent();
			return (
				typeof oControl.spotlight != 'undefined' 	&&	// Control has spotlight property set
				oControl.spotlight 							&&	// Control has spotlight=true or 'container'
				oControl.getAbsoluteShowing() 				&&	// Control is visible
				!(oControl.disabled)							// Control is not disabled
			);
		},

		// Returns spottable chldren along with position of self
		getSiblings: function(oControl) {
			oControl = oControl || this.getCurrent();

			var n,
				o = {};
				oParent = this.getParent(oControl) || oControl.parent;
				o.siblings = this.getChildren(oParent);

			for (n=0; n<o.siblings.length; n++) {
				if (oControl === o.siblings[n]) {
					o.selfPosition = n;
				}
			}

			return o;
		},

		// Returns all spottable children
		getChildren: function(oControl) {
			oControl = oControl || this.getCurrent();
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
		},

		// Returns closest spottable parent
		getParent: function(oControl) {
			oControl = oControl || this.getCurrent();
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
		},

		// Dispatches focus event to the control or it's first spottable child
		spot: function(oControl, sDirection) {
			if (!this._bCanFocus) {
				return false;
			}
			if (this._oCurrent && !this.isSpottable(oControl)) {
				return false;
			}
			if (this._oCurrent && oControl !== this._oCurrent) {
				this._dispatchEvent('onSpotlightBlur', null);
			}
			oControl = oControl || this.getCurrent();
			if (!this.isSpottable(oControl)) {
				oControl = this.getFirstChild(oControl);
			}
			if (oControl) {
				oControl.addClass('spotlight');
				this._dispatchEvent('onSpotlightFocus', {dir: sDirection}, oControl);
				return true;
			}

			return false;
		},

		// Dispatches spotlight blur event to current control
		unspot: function() {
			if (this._oCurrent) {
				this._dispatchEvent('onSpotlightBlur', null, this._oCurrent);
				return true;
			}

			return false;
		},

		// Get first spottable child of a control
		getFirstChild: function(oControl) {
			oControl = oControl || this.getCurrent();
			return this.getChildren(oControl)[0];
		},

		// Has XY value changed since last mousemove event?
		clientXYChanged: function(oEvent) {
			var bChanged = (
				this._nPrevClientX !== oEvent.clientX ||
				this._nPrevClientY !== oEvent.clientY
			);

			this._nPrevClientX = oEvent.clientX;
			this._nPrevClientY = oEvent.clientY;

			return bChanged;
		},
		
		// Disables switching to pointer mode
		disablePointerMode: function() {
			this._bEnablePointerMode = false;
		},
		
		// Enables switching to pointer mode
		enablePointerMode: function() {
			this._bEnablePointerMode = true;
		},




























		/************************* TEST MODE *************************/

		/********************* PUBLIC *********************/

		//* Enable/disable test mode
		setTestMode: function(bEnabled) {
			this._testMode = (bEnabled === true);
			this.testModeChanged();
		},

		//* When _this._testMode_ changes, either do highlighting or destroy highlight nodes
		testModeChanged: function() {
			if (this._testMode === true) {
				this._doTestModeHighlighting();
			} else {
				this._destroyExistingHighlightNodes();
			}
		},

		//* Return true if test mode is enabled
		getTestMode: function() {
			return this._testMode === true;
		},

		/********************* PRIVATE ********************/

		//* Destroy existing highlight nodes, and highlight current and adjacent spotlight controls
		_doTestModeHighlighting: function() {
			this._destroyExistingHighlightNodes();
			this._highlightCurrentControl();
			this._highlightAdjacentControls();
		},

		//* Destroy all highlight elements
		_destroyExistingHighlightNodes: function() {
			for (var i=0;i<this._testModeHighlightNodes.length;i++) {
				if (this._testModeHighlightNodes[i]) {
					this._testModeHighlightNodes[i].destroy();
				}
			}
			this._testModeHighlightNodes = [];
		},

		//* Highlight the current spotlighted control and add it to _this._testModeHighlightNodes_
		_highlightCurrentControl: function() {
			this._testModeHighlightNodes.push(this._addConrolHighlightNode({control: this.getCurrent(), str: 'C'}));
		},

		//* Highlight controls adjacent to the current spotlighted controls and add them to _this._testModeHighlightNodes_
		_highlightAdjacentControls: function() {
			var controls = this._removeDuplicateHighlightNodes([{
					control	: enyo.Spotlight.NearestNeighbor.getNearestNeighbor('UP'),
					str		: 'U'
				},{
					control	: enyo.Spotlight.NearestNeighbor.getNearestNeighbor('DOWN'),
					str		: 'D'
				},{
					control	: enyo.Spotlight.NearestNeighbor.getNearestNeighbor('LEFT'),
					str		: 'L'
				},{
					control	: enyo.Spotlight.NearestNeighbor.getNearestNeighbor('RIGHT'),
					str		: 'R'
				}
			]);

			for (var i=0; i<controls.length; i++) {
				if (!controls[i]) {
					continue;
				}
				this._testModeHighlightNodes.push(this._addConrolHighlightNode(controls[i]));
			}
		},

		/**
			Combine duplicated highlight nodes (created for the same control). This happens when a given
			control can be reached via more than one five-way direction (e.g. up and left).
		**/
		_removeDuplicateHighlightNodes: function(inControls) {
			var returnControls = [],
				dupeOf = -1;

			for (var i=0; i<inControls.length; i++) {
				dupeOf = -1;

				for (var j=0; j<inControls.length; j++) {
					if (inControls[i].control === inControls[j].control && inControls[i].str !== inControls[j].str) {
						dupeOf = j;
						break;
					}
				}

				if (dupeOf > -1) {
					inControls[i].str += ',' + inControls[dupeOf].str
					inControls.splice(dupeOf,1);
				}

				returnControls.push(inControls[i]);
			}

			return returnControls;
		},

		//* Create a new control with styling to highlight current or adjacent spotlight nodes.
		_addConrolHighlightNode: function(inObj) {
			if (!inObj || !inObj.control || !inObj.control.hasNode()) {
				return null;
			}

			var bounds = enyo.Spotlight.Util.getAbsoluteBounds(inObj.control),
				className = (inObj.str === 'C') ? 'spotlight-current-item' : 'spotlight-adjacent-item',
				highlightNode = this._oOwner.createComponent({
					classes: 'spotlight-highlight '+className,
					style: 'height:'+bounds.height+'px;width:'+bounds.width+'px;top:'+bounds.top+'px;left:'+bounds.left+'px;line-height:'+bounds.height+'px;',
					content: inObj.str
				});

			highlightNode.render();

			return highlightNode;
		},

		/************************* END TEST MODE *************************/
	}
});

// Event hook to all system events to catch KEYPRESS and Mouse Events
enyo.dispatcher.features.push(function(oEvent) {
	return enyo.Spotlight.onEvent(oEvent);
});
