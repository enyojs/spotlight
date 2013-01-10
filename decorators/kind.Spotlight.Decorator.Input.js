/**
 * enyo.Spotlight.Decorator.Input kind definition
 * @author: Lex Podgorny
 */

if (window.onyx && onyx.Slider) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.Input',
	
		statics: {
			decorates: onyx.InputDecorator,
		
			/******************************/
	
			onSpotlightFocus: function(oSender, oEvent) {
				console.log(oEvent.type.replace('onSpotlight', '').toUpperCase(), 'at', oSender.name);
				oSender.updateFocus(true);
				return true;
			},
	
			onSpotlightBlur: function(oSender, oEvent) {
				console.log(oEvent.type.replace('onSpotlight', '').toUpperCase(), 'at', oSender.name);
				oSender.updateFocus(false);
				return true;
			},
	
			onSpotlightSelect: function(oSender, oEvent) {
				console.log(oEvent.type.replace('onSpotlight', '').toUpperCase(), 'at', oSender.name);
				return true;
			},
	
			onSpotlightDown: function(oSender, oEvent) {
				console.log(oEvent.type.replace('onSpotlight', '').toUpperCase(), 'at', oSender.name);
				return true;
			},
	
			onSpotlightUp: function(oSender, oEvent) {
				console.log(oEvent.type.replace('onSpotlight', '').toUpperCase(), 'at', oSender.name);
				return true;
			},
	
			onSpotlightLeft: function(oSender, oEvent) {
				console.log(oEvent.type.replace('onSpotlight', '').toUpperCase(), 'at', oSender.name);
				return true;
			},
	
			onSpotlightRight: function(oSender, oEvent) {
				console.log(oEvent.type.replace('onSpotlight', '').toUpperCase(), 'at', oSender.name);
				return true;
			},
	
			onSpotlightPoint: function(oSender, oEvent) {
				console.log(oEvent.type.replace('onSpotlight', '').toUpperCase(), 'at', oSender.name);
				return true;
			},
		}
	});
}