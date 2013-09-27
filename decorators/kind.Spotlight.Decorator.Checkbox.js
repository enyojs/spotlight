/**
 * enyo.Spotlight.Decorator.Checkbox kind definition
 * @author: Lex Podgorny
 */

if (window.onyx && onyx.Checkbox) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.Checkbox',

		statics: {
			decorates: "onyx.Checkbox",

			/******************************/

			onSpotlightSelect: function(oSender, oEvent) {
				oSender.setChecked(!!oSender.getChecked()); // Weird, when passing "false" it gets checked, "true" unchecked, (was the other way around)
			}
		}
	});

}