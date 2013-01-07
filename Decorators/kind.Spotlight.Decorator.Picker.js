/**
 * enyo.Spotlight.Decorator.Picker kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.Picker',
	
	statics: {
		decorates: onyx.Picker,
		
		_setSelected: function(oSender, bSelected) {
			oSender._bSpotlightSelected = bSelected;
		},
		
		_getSelected: function(oSender, bSelected) {
			return !!oSender._bSpotlightSelected;
		},
		
		_toggle: function(oSender) {
			for (var s in oSender.children) {
				if (oSender.children[s] instanceof onyx.PickerButton) {
					console.log('Tap', oSender.children[s], s);
					oSender.children[s].tap();
				}
			}
		},
	
		/******************************/
	
		onSpotlightFocus: function(oSender, oEvent) {
			return true;
		},
	
		onSpotlightBlur: function(oSender, oEvent) {
			this._setSelected(oSender, false);
			return true;
		},
	
		onSpotlightSelect: function(oSender, oEvent) {
			this._setSelected(oSender, true);
			this._toggle(oSender);
			return false;
		},
	
		onSpotlightDown: function(oSender, oEvent) {
			return true;
		},
	
		onSpotlightUp: function(oSender, oEvent) {
			return true;
		},
	
		onSpotlightLeft: function(oSender, oEvent) {
			if (oSender.value <= oSender.min) { return true; }
			if (!this._getSelected(oSender, true))  { return true; }
			oSender.animateTo(oSender.value - oSender.increment);
			return false;
		},
	
		onSpotlightRight: function(oSender, oEvent) {
			if (oSender.value >= oSender.max) { return true; }
			if (!this._getSelected(oSender, true))  { return true; }
			oSender.animateTo(oSender.value + oSender.increment);
			return false;
		},
	
		onSpotlightPoint: function(oSender, oEvent) {
			return true;
		},
	}
});