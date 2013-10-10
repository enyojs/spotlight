/**
 * enyo.Spotlight.Decorator.Slider kind definition
 * @author: Lex Podgorny
 */

if (window.onyx && onyx.Slider) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.Slider',

		statics: {
			decorates: "onyx.Slider",

			_setSelected: function(oSender, bSelected) {
				oSender._bSpotlightSelected = bSelected;
			},

			_getSelected: function(oSender, bSelected) {
				return !!oSender._bSpotlightSelected;
			},

			/******************************/

			onSpotlightFocus: function(oSender, oEvent) {
			},

			onSpotlightBlur: function(oSender, oEvent) {
				this._setSelected(oSender, false);
			},

			onSpotlightSelect: function(oSender, oEvent) {
				this._setSelected(oSender, true);
				return true;
			},

			onSpotlightDown: function(oSender, oEvent) {
			},

			onSpotlightUp: function(oSender, oEvent) {
			},

			onSpotlightLeft: function(oSender, oEvent) {
				if (oSender.value <= oSender.min) { return false; }
				if (!this._getSelected(oSender, true))  { return false; }
				oSender.animateTo(oSender.value - oSender.increment);
				return true;
			},

			onSpotlightRight: function(oSender, oEvent) {
				if (oSender.value >= oSender.max) { return false; }
				if (!this._getSelected(oSender, true))  { return false; }
				oSender.animateTo(oSender.value + oSender.increment);
				return true;
			},

			onSpotlightPoint: function(oSender, oEvent) {
			}
		}
	});
}