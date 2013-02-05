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
			if (!this._isInitialized(oSender)) {
				this.setFocus(oSender, false);
				this.setLastFocusedChild(oSender, enyo.Spotlight.getFirstChild(oSender));
				this._interceptEvents(oSender);
			}
		},
		
		_isInitialized: function(oSender) {
			return typeof oSender._spotlight.hasFocus != 'undefined';
		},
		
		// Handle events bubbling from within the container
		_handleEvent: function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightFocus':
					if (!oEvent._spotlight_handled) {
						if (oEvent.originator !== oSender) {
							this.setLastFocusedChild(oSender, oEvent.originator);
						}
						oEvent._spotlight_handled = true;
					}
					break;
			}
		},
		
		// Attach event hook to capture events coming from within the container
		_interceptEvents: function(oSender) {
			var oThis = this;
			var f = oSender.dispatchEvent;

			oSender.dispatchEvent = function(sEventName, oEvent, oEventSender) {
				if (oThis.getFocus(oSender)) {
					oThis._handleEvent(oSender, oEvent);
				}
				f.apply(oSender, [sEventName, oEvent, oEventSender]);
			}
		},
		
		/******************************/
		
		onSpotlightFocused: function(oSender, oEvent) {
			if (enyo.Spotlight.getPointerMode()) { return; }
			this._initComponent(oSender);
			
			if (this.getFocus(oSender)) {												// Focus came from within
				//console.log('FOCUS FROM INSIDE', oSender.name);
				var s5WayEventType	= enyo.Spotlight.getLast5WayEvent() ? enyo.Spotlight.getLast5WayEvent().type : '',
					sDirection		= s5WayEventType.replace('onSpotlight','').toUpperCase();
				
				this.setFocus(oSender, false);
				if (!(oSender.parent instanceof enyo.Panels)) {
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				} else if (oSender.parent.spotlight !== true && oSender.parent.spotlight != 'true') {
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				}
				enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerLeave', {direction: sDirection}, oSender);
			} else {																	// Focus came from without
				//console.log('FOCUS FROM OUTSIDE', oSender.name);
				var oLastFocusedChild = this.getLastFocusedChild(oSender);
				if (oLastFocusedChild) {
					enyo.Spotlight.spot(oLastFocusedChild);
				}
				this.setFocus(oSender, true);
				enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerEnter', {}, oSender);
			}
			
			return true;
		},
		
		// What child of container was last focused?
		getLastFocusedChild: function(oSender) {
			oSender._spotlight = oSender._spotlight || {};
			return oSender._spotlight.lastFocusedChild;
		},
		
		// Set last focused child
		setLastFocusedChild: function(oSender, oChild) {
			oSender._spotlight = oSender._spotlight || {};
			oSender._spotlight.lastFocusedChild = enyo.Spotlight.Util.getNearestSpottableChild(oSender, oChild);
		},
		
		// Does container contain focused element?
		getFocus: function(oSender) {
			oSender._spotlight = oSender._spotlight || {};
			return oSender._spotlight.hasFocus;
		},
		
		// Specify that container contains focused element
		setFocus: function(oSender, bIsFocused) {
			oSender._spotlight = oSender._spotlight || {};
			oSender._spotlight.hasFocus = bIsFocused;
		},
	}
});