/**
 * enyo.Spotlight.Decorator.Container kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.Container',
	
	statics: {
		decorates: null,
		
		// Creates oSender._spotlight object
		_initComponent: function(oSender) {
			var oLastFocusedChild;
			if (!this._isInitialized(oSender)) {
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
					this.setLastFocusedChild(oSender, oLastFocusedChild);
				}
				enyo.Spotlight.Util.interceptEvents(oSender, this._handleEvent);
			}
		},
		
		_isInitialized: function(oSender) {
			return typeof oSender._spotlight.lastFocusedChild != 'undefined';
		},
		
		// Handle events bubbling from within the container
		_handleEvent: function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightFocus':
					if (oEvent.originator !== oSender) {
						enyo.Spotlight.Decorator.Container.setLastFocusedChild(oSender, oEvent.originator);
					}
				//	return true;	// prevent default ???????? Why whould we need to prevent default here? Why? Why? I think not! Lex.
			}
		},
		
		// Was last spotted control the container's child?
		_hadFocus: function(oSender) {
			var oLastControl = enyo.Spotlight.getLastControl();
			return enyo.Spotlight.Util.isChild(oSender, oLastControl);
		},
		
		_focusLeave: function(oSender, s5WayEventType) {
			// console.log('FOCUS LEAVE', oSender.name);
			var sDirection = s5WayEventType.replace('onSpotlight','').toUpperCase();
			enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerLeave', {direction: sDirection}, oSender);
		},
		
		_focusEnter: function(oSender, s5WayEventType) {
			// console.log('FOCUS ENTER', oSender.name);
			var sDirection = s5WayEventType.replace('onSpotlight','').toUpperCase();
			enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerEnter', {direction: sDirection}, oSender);
		},
				
		/******************************/
		
		onSpotlightFocused: function(oSender, oEvent) {
			// console.log('FOCUSED', oSender.name);
			if (enyo.Spotlight.getPointerMode()) { return true; }
			this._initComponent(oSender);

			var s5WayEventType = enyo.Spotlight.getLast5WayEvent() ? enyo.Spotlight.getLast5WayEvent().type : '';

			if (this._hadFocus(oSender)) {												// Focus came from within
				if (s5WayEventType) {
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				}
				this._focusLeave(oSender, s5WayEventType);
			} else {																	// Focus came from without
				var oLastFocusedChild = this.getLastFocusedChild(oSender);
				if (oLastFocusedChild) {
					enyo.Spotlight.spot(oLastFocusedChild);
				} else {
					if (s5WayEventType) {
						enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
						return true;
					}
				}
				this._focusEnter(oSender, s5WayEventType);
			}
			
			return true;
		},
		
		// What child of container was last focused?
		getLastFocusedChild: function(oSender) {
			oSender._spotlight = oSender._spotlight || {};
			if (!oSender._spotlight.lastFocusedChild || oSender._spotlight.lastFocusedChild.destroyed) {
				oSender._spotlight.lastFocusedChild = enyo.Spotlight.getChildren(oSender)[0];
			}
			return oSender._spotlight.lastFocusedChild;
		},
		
		// Set last focused child
		setLastFocusedChild: function(oSender, oChild) {
			if (!enyo.Spotlight.isSpottable(oChild)) {
				enyo.warn('Spotlight Container' + oSender.name + ' has not spottable lastFocusedChild ' + oChild.name);
			}
			oSender._spotlight = oSender._spotlight || {};
			oSender._spotlight.lastFocusedChild = oChild;
		},
	}
});