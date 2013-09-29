/**
 * enyo.Spotlight.Decorator.Checkbox kind definition
 * @author: Lex Podgorny
 */

if (window.onyx && onyx.MyCheckbox) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.MyCheckbox',

		statics: {
			decorates: "onyx.MyCheckbox",

			/******************************/

			onSpotlightSelect: function(oSender, oEvent) {
				oSender.setChecked(!!oSender.getChecked()); // Weird, when passing "false" it gets checked, "true" unchecked, (was the other way around)
			}
		}
	});

}