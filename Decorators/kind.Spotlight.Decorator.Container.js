/**
 * enyo.Spotlight.Decorator.Container kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.Container',
	
	statics: {
		decorates: null,
		
		/******************************/
	
		onSpotlightFocus: function(oSender, oEvent) {
			console.log('Container', oEvent.type);
			var oChild = enyo.Spotlight.getFirstChild(oSender);
			enyo.Spotlight.spot(oChild);
			console.log(oSender.name, oChild.name);
			return true;
		},
	
		onSpotlightBlur: function(oSender, oEvent) {
			console.log('Container', oEvent.type);
			return true;
		},
	
		onSpotlightSelect: function(oSender, oEvent) {
			console.log('Container', oEvent.type);
			return true;
		},
	
		onSpotlightDown: function(oSender, oEvent) {
			console.log('Container', oEvent.type);
			return true;
		},
	
		onSpotlightUp: function(oSender, oEvent) {
			console.log('Container', oEvent.type);
			return true;
		},
	
		onSpotlightLeft: function(oSender, oEvent) {
			console.log('Container', oEvent.type);
			return true;
		},
	
		onSpotlightRight: function(oSender, oEvent) {
			console.log('Container', oEvent.type);
			return true;
		},
	
		onSpotlightPoint: function(oSender, oEvent) {
			console.log('Container', oEvent.type);
			return true;
		}
	}
});