/**
 * enyo.Spotlight.Decorator.Panels kind definition
 * @author: Lex Podgorny
 * Dispatches following events:
 * 	onSpotlightNext 	 {index: attemptedIndex} - fired when keyboard attempts to navigate to the next panel
 * 	onSpotlightPrevious  {index: attemptedIndex} - fired when keyboard attempts to navigate to the previous panel
 *	onSpotlightItemFocus {index: currentIndex}   - fired when panel is focused in either 5way or pointer modes
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.Panels',
	
	statics: {
		decorates: enyo.Panels,
		
		// Creates oSender._spotlight object
		_initComponent: function(oSender) {
			if (!this._isInitialized(oSender)) {
				this._setFocus(oSender, false);
				this._initChildren(oSender);
				enyo.Spotlight.Util.interceptEvents(oSender, this._handleChildEvents);
			}
		},
		
		// Is Panels object initialized?
		_isInitialized: function(oSender) {
			return typeof oSender._spotlight.hasFocus != 'undefined';
		},
		
		_initChildren: function(oSender) {
			var nLength = oSender.getPanels().length,
				n 		= 0;
				
			for (;n<nLength; n++) {
				oSender.getPanels()[n].spotlight = 'container';
			}
		},
		
		_handleChildEvents: function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightContainerEnter':
					enyo.Spotlight.Decorator.Panels.onSpotlightPanelEnter(oSender, oEvent);
					break;
				case 'onSpotlightContainerLeave':
					enyo.Spotlight.Decorator.Panels.onSpotlightPanelLeave(oSender, oEvent);
					break;
				case 'onSpotlightFocus':
					break;
				case 'onSpotlightLeft':
					break;
				case 'tap':
					enyo.Spotlight.Decorator.Panels._setCurrentByReference(oSender, oEvent.originator);
					break;
			}
			return true;
		},
		
		// Does container contain focused element?
		_getFocus: function(oSender) {
			return oSender._spotlight.hasFocus;
		},
		
		// Specify that container contains focused element
		_setFocus: function(oSender, bIsFocused) {
			oSender._spotlight.hasFocus = bIsFocused;
		},
		
		// What child of container was last focused?
		_getLastFocusedChild: function(oSender) {
			return oSender.getPanels()[this._getCurrent(oSender)];
		},
		
		_setCurrentByReference: function(oSender, oCurrent) {
			var oParent = oCurrent,
				n		= 0;
				
			while (oParent.parent && oParent.parent !== oSender) {
				oParent = oParent.parent;
			}
			
			for (;n<oSender.getPanels().length; n++) {
				if (oSender.getPanels()[n] == oParent) {
					break;
				}
			}
			
			this._setCurrent(oSender, n);
			enyo.Spotlight.spot(oCurrent);
		},
		
		_setCurrent: function(oSender, n) {
			oSender.setIndex(n);
			oSender.getPanels()[n].spotlight = 'container';
			enyo.Spotlight.spot(oSender.getPanels()[n]);
			enyo.Spotlight.Util.dispatchEvent('onSpotlightItemFocus', {index: n}, oSender);
		},
		
		_getCurrent: function(oSender) {
			var n = 0;
			for (; n<oSender.getPanels().length; n++) {
				if (oSender.getPanels()[n] == enyo.Spotlight.getCurrent()) {
					return n;
				}
			}
			return 0;
		},
		
		_handleRight: function(oSender) {
			var nCurrent = this._getCurrent(oSender);
			enyo.Spotlight.Util.dispatchEvent('onSpotlightNext', {index: nCurrent + 1}, oSender);
			if (nCurrent < oSender.getPanels().length - 1) {
				this._setCurrent(oSender, nCurrent + 1);
				return true;
			}
			return false;
		},
		
		_handleLeft: function(oSender) {
			var nCurrent = this._getCurrent(oSender);
			enyo.Spotlight.Util.dispatchEvent('onSpotlightPrevious', {index: nCurrent - 1}, oSender);
			if (nCurrent > 0) {
				this._setCurrent(oSender, nCurrent - 1);
				return true;
			}
			return false;
		},
		
		/******************************/
		
		onSpotlightPanelEnter: function(oSender, oEvent) {
		},
		
		onSpotlightPanelLeave: function(oSender, oEvent) {
			var sEvent;
			switch (oEvent.direction) {
				case 'LEFT':
					if (this._handleLeft(oSender)) {
						this._setFocus(oSender, false);
						return false;
					}
					sEvent = 'onSpotlightLeft';
					break;
				case 'RIGHT':
					if (this._handleRight(oSender)) {
						this._setFocus(oSender, false);
						return false;
					}
					sEvent = 'onSpotlightRight';
					break;
				case 'UP':
					sEvent = 'onSpotlightUp';
					break;
				case 'DOWN':
					sEvent = 'onSpotlightDown';
					break;
				
			}
			if (typeof oEvent.direction != 'undefined') {
				this._setFocus(oSender, false);
				enyo.Spotlight.Util.dispatchEvent('onSpotlightBlur', null, enyo.Spotlight.getCurrent());
				enyo.Spotlight.setCurrent(oSender.parent)
				enyo.Spotlight.Util.dispatchEvent(sEvent, null, oSender.parent);
			}
			return true;
		},
	
		onSpotlightFocused: function(oSender, oEvent) {
			if (enyo.Spotlight.getPointerMode()) { return false; }
			this._initComponent(oSender);
			
			if (this._getFocus(oSender)) {												// Focus came from within
				this._setFocus(oSender, false);
			} else {																	// Focus came from without
				var oLastFocusedChild = this._getLastFocusedChild(oSender);
				if (oLastFocusedChild) {
					enyo.Spotlight.spot(oLastFocusedChild);
				}
				this._setFocus(oSender, true);
			}
			
			return true;
		},
	}
});