/**
 * enyo.Spotlight.Decorator.Picker kind definition
 * @author: Lex Podgorny
 */

if (window.onyx && onyx.TimePicker) {

	enyo.kind({
		name: 'enyo.Spotlight.Decorator.TimePicker',

		statics: {
			decorates: "onyx.TimePicker",

			onSpotlightFocus: function(oSender, oEvent) {
				if (oSender.spotlight != 'container') {
					oSender.spotlight = 'container';
					for (var n=0; n<oSender.children.length; n++) {
						if (oSender.children[n] instanceof onyx.PickerDecorator) {
							oSender.children[n].spotlight = true;
						}
					}
					enyo.Spotlight.Util.dispatchEvent(oEvent.type, oEvent, oSender);
				}
				return true;
			}
		}
	});
}