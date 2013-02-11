/**
 * Spotlight kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight',
	published: {
		defaultControl	: null,
		useVisuals		: true
	},
	/************************************************************/
	
	rendered: function() {
		this.inherited(arguments);
		enyo.Spotlight.initialize(this.owner, this.defaultControl);
	},

	destroy: function() {
		enyo.Spotlight.deregister(this.owner);
		this.inherited(arguments);
	},
	
	/************************************************************/
	
	statics: {
		_bPointerMode				: false,
		_oCurrent					: null,		// Currently spotlighted element
		_oOwner						: null,		// Component owner, usually application
		_oDecorators				: {},		// For further optimization
		_oLastEvent					: null,
		_oLast5WayEvent				: null,
		_nLastKey					: null,
		_oLastSpotlightTrueControl 	: null,
		_oLastSpotlightTrueControl5Way : null,
		_bCanFocus					: true,
		
		_testMode: false,
		_testModeHighlightNodes: [],
		
		_nPrevClientX: null,
		_nPrevClientY: null,
		
		_error: function(s) {
			throw 'enyo.Spotlight: ' + s;
		},
		
		_setCurrent: function(oControl) {
			// Create control-specific spotlight state storage
			if (typeof oControl._spotlight == 'undefined') {
				oControl._spotlight = {};
			}
			if (this._oCurrent === oControl) {
				return true;
			}
			//console.log('CURRENT:', oControl.name);
			this._oCurrent = oControl;
			if (oControl.spotlight === true) {
				this._oLastSpotlightTrueControl = oControl;
				if (!this.getPointerMode() || !this._oLastSpotlightTrueControl5Way) {
					this.setLast5WayControl(oControl);
					//console.log('Setting LSTC5W:', oControl.name);
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
			enyo.Spotlight.Util.dispatchEvent(sEvent, oData, oControl);
		},
		
		_interceptEvents: function() {
			var oThis = this;

			// Event hook to the owner to catch Spotlight Events
			this.ownerDispatchFn = this._oOwner.dispatchEvent;
			this._oOwner.dispatchEvent = function(sEventName, oEvent, oSender) {
				oThis.ownerDispatchFn.apply(oThis._oOwner, [sEventName, oEvent, oSender]);
				oThis.onSpotlightEvent(oEvent);
			};			
		},
		
		_getDecorator: function(oSender) {
			if (oSender.spotlight == 'container') {							// Process containers
				return enyo.Spotlight.Decorator['Container'];
			}
			
			if (oSender.spotlightDecorate == false) {
				// console.log(oSender.name, 'skipping decoration');
				return null;
			}
			
			if (typeof this._oDecorators[oSender.kind] != 'undefined') {
				return this._oDecorators[oSender.kind];
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

			this._oDecorators[oSender.kind] = oDecorator;					// Hash decorator by sender kind
			return oDecorator;
		},
		
		// If decorator present, delegate event to it's corresponding method
		// Return values: if found method to delegate, return it's return value otherwise return true
		_delegateSpotlightEvent: function(oEvent) {
			if (!oEvent.type || oEvent.type.indexOf('onSpotlight') != 0) { return true; }
			
			var s,
				oSender 	= oEvent.originator
				oDecorator 	= this._getDecorator(oSender);
							
			if (oDecorator && typeof oDecorator[oEvent.type] == 'function') {
				return oDecorator[oEvent.type](oSender, oEvent);
			}
			
			return true;
		},

		_isInHalfPlane: function(sDirection, oBounds1, oBounds2) {
			switch (sDirection) {
				case 'UP':
					return oBounds1.top >= oBounds2.top + oBounds2.height;
				case 'DOWN':
					return oBounds1.top + oBounds1.height <= oBounds2.top;
				case 'LEFT':
					return oBounds1.left >= oBounds2.left + oBounds2.width;
				case 'RIGHT':
					return oBounds1.left + oBounds1.width <= oBounds2.left;
			}
		},
		
		_getAdjacentControlPrecedence: function(sDirection, oBounds1, oBounds2) {
			return this._getPrecedenceValue(this._getAdjacentControlPoints(sDirection, oBounds1, oBounds2), sDirection);
		},
		
		_isBeyondXBounds: function(oBounds1, oBounds2) {
			return oBounds1.left < oBounds2.left && oBounds1.right < oBounds2.right;
		},
		
		_isBeyondYBounds: function(oBounds1, oBounds2) {
			return oBounds1.top < oBounds2.top && oBounds1.bottom < oBounds2.bottom;
		},
		
		_getAdjacentControlPoints: function(sDirection, oBounds1, oBounds2) {
			switch (sDirection) {
				case 'UP'	:
				case 'DOWN'	:
					return this._getYAxisPoints(sDirection, oBounds1, oBounds2);
				case 'LEFT'	:
				case 'RIGHT':
					return this._getXAxisPoints(sDirection, oBounds1, oBounds2);
			}
		},
		
		_getYAxisPoints: function(sDirection, oBounds1, oBounds2) {
			var x1, x2, y1, y2;
			
			y1 = (sDirection === 'UP')
				?	oBounds1.top
				:	oBounds1.top + oBounds1.height;
			
			y2 = (sDirection === 'UP')
				?	oBounds2.top + oBounds2.height
				:	oBounds2.top;
				
			if (oBounds1.left < oBounds2.left) {
				if (oBounds1.left + oBounds1.width < oBounds2.left) {
					x1 = oBounds1.left + oBounds1.width;
					x2 = oBounds2.left;
				} else {
					x1 = oBounds2.left;
					x2 = oBounds2.left;
				}
			} else {
				if (oBounds1.left > oBounds2.left + oBounds2.width) {
					x1 = oBounds1.left;
					x2 = oBounds2.left + oBounds2.left;
				} else {
					x1 = oBounds1.left;
					x2 = oBounds1.left;
				}
			}
			
			return [{x: x1, y: y1}, {x: x2, y: y2}];
		},
		
		_getXAxisPoints: function(sDirection, oBounds1, oBounds2) {
			var x1, x2, y1, y2;
			
			x1 = (sDirection === 'LEFT')
				?	oBounds1.left
				:	oBounds1.left + oBounds1.width;
			
			x2 = (sDirection === 'LEFT')
				?	oBounds2.left + oBounds2.width
				:	oBounds2.left;
				
			if (oBounds1.top < oBounds2.top) {
				if (oBounds1.top + oBounds1.height < oBounds2.top) {
					y1 = oBounds1.top + oBounds1.height;
					y2 = oBounds2.top;
				} else {
					y1 = oBounds2.top;
					y2 = oBounds2.top;
				}
			} else {
				if (oBounds1.top > oBounds2.top + oBounds2.height) {
					y1 = oBounds1.top;
					y2 = oBounds2.top + oBounds2.height;
				} else {
					y1 = oBounds1.top;
					y2 = oBounds1.top;
				}
			}
			
			return [{x: x1, y: y1}, {x: x2, y: y2}];
		},
		
		_getPrecedenceValue: function(oPoints, sDirection) {
			var delta = this._getAdjacentControlDelta(oPoints[0], oPoints[1]),
				slope = this._getAdjacentControlSlope(delta, sDirection),
				angle = this._getAdjacentControlAngle(slope),
				distance = this._getAdjacentControlDistance(delta);
			
			return angle > 89 ? 0 : 1/(angle * Math.pow(distance, 4));
		},
		
		_getAdjacentControlDelta: function(point1, point2) {
			return {
				dx: Math.abs(point2.x - point1.x),
				dy: Math.abs(point2.y - point1.y)
			};
		},
		
		_getAdjacentControlSlope: function(delta, sDirection) {
			switch (sDirection) {
				case 'UP'	:
				case 'DOWN'	:
					return delta.dx/delta.dy;
					break;
				case 'LEFT'	:
				case 'RIGHT':
					return delta.dy/delta.dx;
					break;
			}
		},
		
		_getAdjacentControlDistance: function(delta) {
			return Math.pow(delta.dx*delta.dx + delta.dy*delta.dy, 0.5) || 0.1;
		},
		
		_getAdjacentControlAngle: function(nSlope) {
			return Math.atan(nSlope) * 180/Math.PI || 0.1;
		},
		
		_getAdjacentControl: function(sDirection, oControl) {
			sDirection = sDirection.toUpperCase();
			oControl = oControl || this.getCurrent();
			
			var n,
				oBestMatch	= null,
				nBestMatch	= 0,
				oBounds1 	= enyo.Spotlight.Util.getAbsoluteBounds(oControl),
				oBounds2	= null,
				o 			= this.getSiblings(oControl),
				nLen 		= o.siblings.length,
				nPrecedence;
			
			for (n=0; n<nLen; n++) {
				oBounds2 = enyo.Spotlight.Util.getAbsoluteBounds(o.siblings[n]);
				if (this._isInHalfPlane(sDirection, oBounds1, oBounds2) && o.siblings[n] !== oControl) {
					nPrecedence = this._getAdjacentControlPrecedence(sDirection, oBounds1, oBounds2);
					if (nPrecedence > nBestMatch) {
						nBestMatch = nPrecedence;
						oBestMatch = o.siblings[n];
					}
				}
			}
			
			return oBestMatch;
		},
		
		_getTarget: function(sId) {
			var oTarget = enyo.Spotlight.Util.getControlById(sId);
			if (typeof oTarget != 'undefined') {
				if (this.isSpottable(oTarget)) {
					return oTarget;
				} else {
					return this.getParent(oTarget);
				}
			}
		},
		
		/********************* PUBLIC *********************/
		
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
					case 'keydown':
					case 'keyup':
						enyo.Spotlight.Accelerator.processKey(oEvent);
						break;
				}
			}
		},
		
		// Called by onEvent() to process mousemove events
		onMouseMove: function(oEvent) {
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
		
		// Called from enyo.Spotlight.Accelerator which handles accelerated keyboard event
		onKeyEvent: function(oEvent) {
			var validKey = false;
			this.setPointerMode(false);										// Preserving explicit setting of mode for future features
			if (!this._bCanFocus) {											// Comming back from pointer mode, show control once before continue navigation
				this._bCanFocus = true;
				this.spot(this._oLastSpotlightTrueControl5Way);
				return;
			}
			if (!this.getPointerMode()) {
				switch (oEvent.keyCode) {
					case 13:
						validKey = true
						this._dispatchEvent('onSpotlightSelect', oEvent);
						break;
					case 37:
						validKey = true
						this._dispatchEvent('onSpotlightLeft', oEvent);
						break;
					case 38:
						validKey = true
						this._dispatchEvent('onSpotlightUp', oEvent);
						break;
					case 39:
						validKey = true
						this._dispatchEvent('onSpotlightRight', oEvent);
						break;
					case 40:
						validKey = true
						this._dispatchEvent('onSpotlightDown', oEvent);
						break;
					default:
						break;
				}
			}
			if (validKey) {
				// If the key pressed was used by Spotlight, prevent default to keep the
				// browser from scrolling the page, etc.
				oEvent.preventDefault();
			}
		},
		
		// Spotlight events bubbled back up to the App
		onSpotlightEvent: function(oEvent) {
			this._oLastEvent = oEvent;
			
			// If decorator onSpotlight<Event> function return false - preventDefault 
			if (!this._delegateSpotlightEvent(oEvent)) { return; }	

			switch (oEvent.type) {
				case 'onSpotlightFocus':
					this.onFocus(oEvent);
					break;
				case 'onSpotlightFocused':
					this.onFocused(oEvent);
					break;
				case 'onSpotlightBlur':
					this.onBlur(oEvent);
					break;
				case 'onSpotlightLeft':
					this._oLast5WayEvent = oEvent;
					this.onLeft(oEvent);
					break;
				case 'onSpotlightRight':
					this._oLast5WayEvent = oEvent;
					this.onRight(oEvent);
					break;
				case 'onSpotlightUp':
					this._oLast5WayEvent = oEvent;
					this.onUp(oEvent);
					break;
				case 'onSpotlightDown':
					this._oLast5WayEvent = oEvent;
					this.onDown(oEvent);
					break;
				case 'onSpotlightSelect':
					this.onSelect(oEvent);
					break;
				case 'onSpotlightPoint':
					this.onPoint(oEvent);
					break;
			}
		},
		
		/************************************************************/
		
		onMoveTo: function(sDirection) {
			var oControl = this._getAdjacentControl(sDirection);
			if (oControl) {
				this.spot(oControl, sDirection);
			} else {
				var oParent = this.getParent();
				if (typeof oParent.spotlight == 'undefined') { // App level
					//console.log('End of the world as we can spot it');
					this.spot(this._oLastSpotlightTrueControl);
				} else {
					this.spot(this.getParent(), sDirection);
				}
			}
		},
		
		onRight	: function() { this.onMoveTo('RIGHT');	},
		onLeft	: function() { this.onMoveTo('LEFT');	},
		onDown	: function() { this.onMoveTo('DOWN');	},
		onUp	: function() { this.onMoveTo('UP');		},
		
		onSelect: function(oEvent) {
			var aChildren = this.getChildren(oEvent.originator);
			if (aChildren.length == 0) {
				this._dispatchEvent('ontap', null, oEvent.originator);
			} else {
				this.spot(aChildren[0]);
			}
		},
		
		onFocus: function(oEvent) {
			this._setCurrent(oEvent.originator);
		},
		
		onFocused: function(oEvent) {
		},
		
		onBlur: function(oEvent) {
			if (this._oCurrent) {
				oEvent.originator.removeClass('spotlight');
			}
		},
		
		onPoint: function(oEvent) {
			if (oEvent.originator.spotlight != 'container') {
				this.spot(oEvent.originator);
			}
		},
		
		/************************************************************/
		
		setPointerMode		: function(bPointerMode)	{ 
			this._bPointerMode != bPointerMode
				? enyo.Signals.send('onSpotlightModeChanged', {pointerMode: bPointerMode}) 
				: enyo.noop;
			this._bPointerMode = bPointerMode; 	
		},
		
		getPointerMode		: function() 				{ return this._bPointerMode; 			},
		getCurrent			: function() 				{ return this._oCurrent; 				},
		setCurrent			: function(oControl)		{ return this._setCurrent(oControl); 	},
		getLastEvent	 	: function() 				{ return this._oLastEvent; 	 			},
		getLast5WayEvent 	: function() 				{ return this._oLast5WayEvent;  		},
		setLast5WayControl	: function(oControl)		{ this._oLastSpotlightTrueControl5Way = oControl; },
		
		isSpottable: function(oControl) {
			oControl = oControl || this.getCurrent();
			return (
				typeof oControl.spotlight != 'undefined' 	&& 
				oControl.spotlight 							&& 
				oControl.getAbsoluteShowing() 				&& 
				!(oControl.disabled)
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
				this._dispatchEvent('onSpotlightBlur', null, this._oCurrent);
			}
			oControl = oControl || this.getCurrent();
			if (!this.isSpottable(oControl)) {
				oControl = this.getFirstChild(oControl);
			}
			
			if (oControl) {
				oControl.addClass('spotlight');
				this._dispatchEvent('onSpotlightFocus', {dir: sDirection}, oControl, sDirection);
				return true;
			}
			
			return false;
		},
		
		unspot: function() {
			if (this._oCurrent) {
				this._dispatchEvent('onSpotlightBlur', null, this._oCurrent);
			}
		},
		
		getFirstChild: function(oControl) {
			oControl = oControl || this.getCurrent();
			return this.getChildren(oControl)[0];
		},
		
		clientXYChanged: function(oEvent) {
			var bChanged = (
				this._nPrevClientX !== oEvent.clientX || 
				this._nPrevClientY !== oEvent.clientY
			);
			
			this._nPrevClientX = oEvent.clientX;
			this._nPrevClientY = oEvent.clientY;
			
			return bChanged;
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
					control	: this._getAdjacentControl('UP', this.getCurrent()),
					str		: 'U'
				},{
					control	: this._getAdjacentControl('DOWN', this.getCurrent()),
					str		: 'D'
				},{
					control	: this._getAdjacentControl('LEFT', this.getCurrent()),
					str		: 'L'
				},{
					control	: this._getAdjacentControl('RIGHT', this.getCurrent()),
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

// Event hook to all system events to catch KEYPRESS
enyo.dispatcher.features.push(function(oEvent) {
	enyo.Spotlight.onEvent(oEvent);
});
