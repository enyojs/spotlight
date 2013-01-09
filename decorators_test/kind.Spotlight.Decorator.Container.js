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
			console.log('Initializing container', oSender.name);
			if (typeof oSender._spotlight == 'undefined') {
				oSender._spotlight = {
					hasFocus	 	 : false,
					lastFocusedChild : enyo.Spotlight.getFirstChild(oSender)
				}
			}
		},
		
		_getFocus: function(oSender) {
			return oSender._spotlight.hasFocus;
		},
		
		_setFocus: function(oSender, bIsFocused) {
			oSender._spotlight.hasFocus = bIsFocused;
		},
		
		_getLastFocusedChild: function(oSender) {
			return oSender._spotlight.lastFocusedChild;
		},
		
		/******************************/
	
		onSpotlightFocused: function(oSender, oEvent) {
			this._initComponent(oSender);
			if (this._getFocus(oSender)) {					// Focus came from within
				enyo.Spotlight.Util.dispatchEvent(
					enyo.Spotlight.getLast5WayEvent().type,
					null,
					oSender
				);
				this._setFocus(oSender, false);
			} else {										// Focus came from without
				enyo.Spotlight.Util.dispatchEvent('onSpotlightSelect', null, oSender);
				this._setFocus(oSender, true);
			}
			
			return true;
		}
	}
});