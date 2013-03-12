/**
 * enyo.Spotlight.Util kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Util',
	statics: {

		/************ PUBLIC *************/

		dispatchEvent: function(sEvent, oData, oControl) {
			oData		 	 = oData ? enyo.clone(oData) : {};
			oData.type 		 = sEvent;
			oData.originator = oControl;
			//console.log('Dispatching:', oData.type, oControl.name);

			return oControl.dispatchBubble(sEvent, oData, oControl);
		},

		// Attach event hook to capture events coming from within the container
		interceptEvents: function(oControl, fHandler) {
			var oThis = this;
			var f = oControl.dispatchEvent;

			oControl.dispatchEvent = function(sEventName, oEvent, oEventSender) {
				if (fHandler(oControl, oEvent)) {										// If handler returns true - prevent default
					enyo.log('Setting type to NULL', oEvent);
					oEvent.type = null;
				} else {
					f.apply(oControl, [sEventName, oEvent, oEventSender]);				// If handler returns false - call original dispatcher and allow bubbling
				}
			}
		},

		isChild: function(oParent, oChild) {
			if (!oParent) { return false; }
			if (!oChild)  { return false; }
			
			while (oChild.parent) {
				oChild = oChild.parent;
				if (oChild === oParent) {
					return true;
				}
			}
			return false;
		},

		getAbsoluteBounds: function(oControl) {
			var oLeft 			= 0,
				oTop 			= 0,
				oMatch			= null,
				oNode 			= oControl instanceof enyo.Control ? oControl.hasNode() : oControl,
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
							oTop += parseInt(oMatch[1], 10);
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

		hasClass: function(o, s) {
			if (!o || !o.className) { return; }
			return (' ' + o.className + ' ').indexOf(' ' + s + ' ') >= 0;
		},

		addClass: function(o, s) {
			if (o && !this.hasClass(o, s)) {
				var ss = o.className;
				o.className = (ss + (ss ? ' ' : '') + s);
			}
		},

		removeClass: function(o, s) {
			if (o && this.hasClass(o, s)) {
				var ss = o.className;
				o.className = (' ' + ss + ' ').replace(' ' + s + ' ', ' ').slice(1, -1);
			}
		},

		stringEndsWith: function(s, sSuffix) {
		    return s.indexOf(sSuffix, s.length - sSuffix.length) !== -1;
		}
	}
});