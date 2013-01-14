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
				oSender.children[0].focus();
				return true;
			},
	
			onSpotlightBlur: function(oSender, oEvent) {
				oSender.updateFocus(false);
				return true;
			}
		}
	});
}