/**
 * enyo.Spotlight.Decorator.Slider kind definition
 * @author: Lex Podgorny
 */

if (window.onyx && onyx.Slider) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.Slider',
	
		statics: {
			decorates: onyx.Slider,
		
			_setSelected: function(oSender, bSelected) {
				oSender._bSpotlightSelected = bSelected;
			},
		
			_getSelected: function(oSender, bSelected) {
				return !!oSender._bSpotlightSelected;
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
}