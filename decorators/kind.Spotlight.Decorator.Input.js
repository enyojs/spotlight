/**
 * enyo.Spotlight.Decorator.Input kind definition
 * @author: Lex Podgorny
 */

if(window.moon && moon.InputDecorator) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.Input',

		statics: {
			decorates: "moon.InputDecorator",

			/******************************/

			onSpotlightSelect: function(oSender, oEvent) {
				oSender.children[0].focus();
			},

			onSpotlightBlur: function(oSender, oEvent) {
				oSender.children[0].blur();
			}
		}
	});

}