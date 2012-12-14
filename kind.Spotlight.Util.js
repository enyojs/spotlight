/**
 * enyo.Spotlight.Util kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Util',
	statics: {
		
		/************ PUBLIC *************/
		
		getAbsoluteBounds: function(oControl) {
			var oLeft 			= 0,
				oTop 			= 0,
				oMatch			= null,
				oNode 			= oControl.hasNode(),
				nWidth 			= oNode.offsetWidth,	
				nHeight 		= oNode.offsetHeight,
				sTransformProp 	= enyo.dom.getStyleTransformProp(),
				oXRegEx 		= /translateX\((-?\d+)px\)/i,
				oYRegEx 		= /translateY\((-?\d+)px\)/i;

			if (oNode.offsetParent) {
				do {
					oLeft += oNode.offsetLeft - (oNode.offsetParent ? oNode.offsetParent.scrollLeft : 0);
					oTop  += oNode.offsetTop  - (oNode.offsetParent ? oNode.offsetParent.scrollTop  : 0);
					if (sTransformProp) {
						oMatch = oNode.style[sTransformProp].match(oXRegEx);
						if (oMatch && typeof oMatch[1] != 'undefined' && oMatch[1]) {
							oLeft += parseInt(oMatch[1], 10);
						}
						oMatch = oNode.style[sTransformProp].match(oYRegEx);
						if (oMatch && typeof oMatch[1] != 'undefined' && oMatch[1]) {
							oLeft += parseInt(oMatch[1], 10);
						}
					}
				} while (oNode = oNode.offsetParent);
			}
			return {
				top		: oTop,
				left	: oLeft,
				bottom	: document.body.offsetHeight - oTop  - nHeight,
				right	: document.body.offsetWidth  - oLeft - nWidth,
				height	: nHeight,
				width	: nWidth
			};
		},
	
		getControlById: function(sId) {
			return eval(sId.replace('_', '.$.'));
		},
		
		hasClass: function(o, s) {
			if (!o || !o.className) { return; }
			return (' ' + o.className + ' ')
			.indexOf(' ' + s + ' ') >= 0;
		},
		
		addClass: function(o, s) {
			if (!this.hasClass(o, s)) {
				var ss = o.className;
				o.className = (ss + (ss ? ' ' : '') + s);
			}
		},
		
		removeClass: function(o, s) {
			if (this.hasClass(o, s)) {
				var ss = o.className;
				o.className = (' ' + ss + ' ').replace(' ' + s + ' ', ' ').slice(1, -1);
			}
		},
	}
});