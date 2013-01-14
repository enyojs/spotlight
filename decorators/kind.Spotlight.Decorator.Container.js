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
			if (typeof oSender._spotlight.hasFocus == 'undefined') {
				oSender._spotlight.hasFocus 		= false
				oSender._spotlight.lastFocusedChild = enyo.Spotlight.getFirstChild(oSender);
				this._interceptEvents(oSender);
			}
		},
		
		// Does container contain focused element?
		_getFocus: function(oSender) {
			return oSender._spotlight.hasFocus;
		},
		
		// Specify that container contains focused element
		_setFocus: function(oSender, bIsFocused) {
			oSender._spotlight.hasFocus = bIsFocused;
		},
		
		// What child of container was last focused?
		_getLastFocusedChild: function(oSender) {
			return oSender._spotlight.lastFocusedChild;
		},
		
		// Set last focused child
		_setLastFocusedChild: function(oSender, oChild) {
		//	console.log('LFC', oSender.name, '->', oChild.name);
			oSender._spotlight.lastFocusedChild = oChild;
		},
		
		// Handle events bubbling from within the container
		_handleEvent: function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightFocus':
					if (oEvent.originator !== oSender && !oEvent._spotlight_container_handled) {
						this._setLastFocusedChild(oSender, oEvent.originator);
						oEvent._spotlight_container_handled = true;
					}
					break;
			}
		},
		
		// Attach event hook to capture events coming from within the container
		_interceptEvents: function(oSender) {
			var oThis = this;
			var f = oSender.dispatchEvent;

			oSender.dispatchEvent = function(sEventName, oEvent, oEventSender) {
				if (oThis._getFocus(oSender)) {
					oThis._handleEvent(oSender, oEvent);
				}
				f.apply(oSender, [sEventName, oEvent, oEventSender]);
			}
		},
		
		/******************************/
	
		onSpotlightFocused: function(oSender, oEvent) {
			if (enyo.Spotlight.getPointerMode()) { return; }
			this._initComponent(oSender);
			if (this._getFocus(oSender)) {												// Focus came from within
				var s5WayEventType = enyo.Spotlight.getLast5WayEvent().type;
				enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				this._setFocus(oSender, false);
			} else {																	// Focus came from without
				enyo.Spotlight.spot(this._getLastFocusedChild(oSender));
				this._setFocus(oSender, true);
			}
			
			return true;
		}
	}
});