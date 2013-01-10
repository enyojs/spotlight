/**
 * enyo.Spotlight.Decorator.Checkbox kind definition
 * @author: Lex Podgorny
 */

if (onyx && onyx.Checkbox) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.Checkbox',
	
		statics: {
			decorates: onyx.Checkbox,
	
			/******************************/
	
			onSpotlightSelect: function(oSender, oEvent) {
				console.log('select');
				oSender.setChecked(!oSender.getChecked());
				return true;
			}
		}
	});
	
}