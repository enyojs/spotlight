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
				this._setFocus(oSender, false);
				this._setLastFocusedChild(oSender, enyo.Spotlight.getFirstChild(oSender));
				this._interceptEvents(oSender);
			}
		},
		
		_isInitialized: function(oSender) {
			return typeof oSender._spotlight.hasFocus != 'undefined';
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
			oSender._spotlight.lastFocusedChild = enyo.Spotlight.Util.getNearestSpottableChild(oSender, oChild);
		},
		
		// Handle events bubbling from within the container
		_handleEvent: function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightFocus':
					if (!oEvent._spotlight_handled) {
						if (oEvent.originator !== oSender) {
							this._setLastFocusedChild(oSender, oEvent.originator);
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
				console.log('CONTAINER FOCUSEDDDDDD: (from within) ' , oSender.name);
				var s5WayEventType	= enyo.Spotlight.getLast5WayEvent().type,
					sDirection		= s5WayEventType.replace('onSpotlight','').toUpperCase();
				
				this._setFocus(oSender, false);
				if (!(oSender.parent instanceof enyo.Panels)) {
					console.log('case1');
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				} else if (oSender.parent.spotlight !== true && oSender.parent.spotlight != 'true') {
					console.log('case2');
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				}
				enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerLeave', {direction: sDirection}, oSender);
			} else {																	// Focus came from without
				console.log('CONTAINER FOCUSEDDDDDD: (from without)' , oSender.name);
				var oLastFocusedChild = this._getLastFocusedChild(oSender);
				console.log('CONTAINER:', oSender.name, 'LAST CHILD:', oLastFocusedChild.name);
				if (oLastFocusedChild) {
					enyo.Spotlight.spot(oLastFocusedChild); // not here
				}
				this._setFocus(oSender, true);
				enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerEnter', {}, oSender);
			}
			
			return true;
		}
	}
});