/**
 * enyo.Spotlight.Container definition
 * @author: Lex Podgorny
 */

enyo.Spotlight.Container = new function() {
	
	//* @protected
	/************************************************************/
	
	var _oThis = this;

		// Creates oSender._spotlight object
	var _initComponent = function(oSender) {
			var oLastFocusedChild;
			if (!_isInitialized(oSender)) {
				if (oSender.defaultSpotlightControl) {
					if (oSender.$[oSender.defaultSpotlightControl]) {
						oLastFocusedChild = oSender.$[oSender.defaultSpotlightControl];
					} else if (oSender.owner.$[oSender.defaultSpotlightControl]) {
						oLastFocusedChild = oSender.owner.$[oSender.defaultSpotlightControl];
					} else {
						throw 'Invalid default spotlight control specified in ' + oSender.name;
					}
				} else {
					oLastFocusedChild = enyo.Spotlight.getFirstChild(oSender);
				}

				if (oLastFocusedChild && oLastFocusedChild.isDescendantOf(oSender)) {
					_oThis.setLastFocusedChild(oSender, oLastFocusedChild);
				}
				enyo.Spotlight.Util.interceptEvents(oSender, _handleEvent);
			}
		},

		_isInitialized = function(oSender) {
			return typeof oSender._spotlight.lastFocusedChild != 'undefined';
		},

		// Handle events bubbling from within the container
		_handleEvent = function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightFocus':
					if (oEvent.originator !== oSender) {
						_oThis.setLastFocusedChild(oSender, oEvent.originator);
					}
					break;
				case 'onSpotlightKeyDown':
					// Inform other controls that spotlight 5-way event was generated within a container
					oEvent.spotSentFromContainer = true;
					break;
			}
		},
		
		// Was last spotted control the container's child?
		_hadFocus = function(oSender) {
			var oLastControl = enyo.Spotlight.getLastControl();
			if (oSender._spotlight.bEnorceOutsideIn)       { return false; } // Programmatically spotted containers are always treated as not having focus
			if (!enyo.Spotlight.isSpottable(oLastControl)) { return false; } // Because oLastControl might have been DHD'd
			return enyo.Spotlight.Util.isChild(oSender, oLastControl);
		},

		_focusLeave = function(oSender, s5WayEventType) {
			// console.log('FOCUS LEAVE', oSender.name);
			// Ensure we are actually leaving container (and not bouncing back to the originating control)
			if (oSender._spotlight.lastFocusedChild !== enyo.Spotlight.getLastControl()) {
				var sDirection = s5WayEventType.replace('onSpotlight','').toUpperCase();
				enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerLeave', {direction: sDirection}, oSender);
			}
		},

		_focusEnter = function(oSender, s5WayEventType) {
			// console.log('FOCUS ENTER', oSender.name);
			var sDirection = s5WayEventType.replace('onSpotlight','').toUpperCase();
			enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerEnter', {direction: sDirection}, oSender);
		};

	//* Public
	/************************************************************/
		
	this.onSpotlightFocus = function(oSender, oEvent) {
		oSender._spotlight = oSender._spotlight || {};
		oSender._spotlight.bEnorceOutsideIn = !oEvent.dir;
	};
	
	this.onSpotlightFocused = function(oSender, oEvent) {
		if (enyo.Spotlight.isInitialized() && enyo.Spotlight.getPointerMode()) { return true; }
		_initComponent(oSender);

		var s5WayEventType = enyo.Spotlight.getLast5WayEvent()
			? enyo.Spotlight.getLast5WayEvent().type
			: '';

		if (_hadFocus(oSender)) {                                            // Focus came from inside AND this was a 5-way move
			if (s5WayEventType) {
				enyo.Spotlight.Util.dispatchEvent(                           // Re-dispatch 5 way event
					s5WayEventType,
					{spotSentFromContainer:true},
					oSender
				);
			}
			_focusLeave(oSender, s5WayEventType);
		} else {                                                             // Focus came from outside or this was a programmic spot
			var oLastFocusedChild = this.getLastFocusedChild(oSender);
			if (oLastFocusedChild) {
				enyo.Spotlight.spot(oLastFocusedChild);
			} else {
				if (s5WayEventType) {
					enyo.Spotlight.Util.dispatchEvent(                       // Re-dispatch 5 way event
						s5WayEventType,
						{spotSentFromContainer:true},
						oSender
					);
					return true;
				}
			}
			_focusEnter(oSender, s5WayEventType);
		}

		return true;
	};

	// What child of container was last focused?
	this.getLastFocusedChild = function(oSender) {
		oSender._spotlight = oSender._spotlight || {};
		if (!oSender._spotlight.lastFocusedChild || !enyo.Spotlight.isSpottable(oSender._spotlight.lastFocusedChild)) {
			oSender._spotlight.lastFocusedChild = enyo.Spotlight.getChildren(oSender)[0];
		}
		return oSender._spotlight.lastFocusedChild;
	};

	// Set last focused child
	this.setLastFocusedChild = function(oSender, oChild) {
		if (!enyo.Spotlight.isSpottable(oChild)) {
			oChild = this.getFirstChild(oChild);
		}
		if (oChild) {
			oSender._spotlight = oSender._spotlight || {};
			oSender._spotlight.lastFocusedChild = oChild;
		} else {
			enyo.warn('Spotlight Container' + oSender.name + ' has not spottable lastFocusedChild ' + oChild.name);
		}
	};
	
};