/**
 * enyo.Spotlight.Decorator.Container kind definition
 * @author: Lex Podgorny
 */

enyo.kind({
	name: 'enyo.Spotlight.Decorator.Container',
	
	statics: {
		decorates: null,
		
		// Creates oSender._spotlight object
		_initComponent: function(oSender) {
			if (!this._isInitialized(oSender)) {
				this.setLastFocusedChild(oSender, enyo.Spotlight.getFirstChild(oSender));
				enyo.Spotlight.Util.interceptEvents(oSender, this._handleEvent);
			}
		},
		
		_isInitialized: function(oSender) {
			return typeof oSender._spotlight.lastFocusedChild != 'undefined';
		},
		
		// Handle events bubbling from within the container
		_handleEvent: function(oSender, oEvent) {
			switch (oEvent.type) {
				case 'onSpotlightFocus':
					if (oEvent.originator !== oSender) {
						enyo.Spotlight.Decorator.Container.setLastFocusedChild(oSender, oEvent.originator);
					}
				//	return true;	// prevent default ???????? Why whould we need to prevent default here? Why? Why? I think not! Lex.
			}
		},
		
		// Was last spotted control the container's child?
		_hadFocus: function(oSender) {
			var oLastControl = enyo.Spotlight.getLastControl();
			return enyo.Spotlight.Util.isChild(oSender, oLastControl);
		},
		
		_focusLeave: function(oSender, s5WayEventType) {
			// console.log('FOCUS LEAVE', oSender.name);
			var sDirection = s5WayEventType.replace('onSpotlight','').toUpperCase();
			enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerLeave', {direction: sDirection}, oSender);
		},
		
		_focusEnter: function(oSender) {
			// console.log('FOCUS ENTER', oSender.name);
			var oLastFocusedChild = this.getLastFocusedChild(oSender);
			if (oLastFocusedChild) {
				enyo.Spotlight.spot(oLastFocusedChild);
			}
			enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerEnter', {}, oSender);
		},
				
		/******************************/
		
		onSpotlightFocused: function(oSender, oEvent) {
			// console.log('FOCUSED', oSender.name);
			if (enyo.Spotlight.getPointerMode()) { return true; }
			this._initComponent(oSender);
			
			if (this._hadFocus(oSender)) {												// Focus came from within
				var s5WayEventType = enyo.Spotlight.getLast5WayEvent() ? enyo.Spotlight.getLast5WayEvent().type : '';
				if (!(oSender.parent instanceof enyo.Panels)) {
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				} else 
				if (oSender.parent.spotlight !== true && oSender.parent.spotlight != 'true') {
					enyo.Spotlight.Util.dispatchEvent(s5WayEventType, null, oSender);
				}
				this._focusLeave(oSender, s5WayEventType);
			} else {																	// Focus came from without
				this._focusEnter(oSender);
			}
			
			return true;
		},
		
		onSpotlightLeft: function(oSender, oEvent) {
			// console.log('CONTAINER', oSender.name, '| event:', oEvent.type, '|', oEvent.originator.name);
			this._focusLeave(oSender, oEvent.type);
		},
		
		onSpotlightRight: function(oSender, oEvent) {
			// console.log('CONTAINER', oSender.name, '| event:', oEvent.type, '|', oEvent.originator.name);
			this._focusLeave(oSender, oEvent.type);
		},
		
		onSpotlightUp: function(oSender, oEvent) {
			// console.log('CONTAINER', oSender.name, '| event:', oEvent.type, '|', oEvent.originator.name);
			this._focusLeave(oSender, oEvent.type);
		},
		
		onSpotlightDown: function(oSender, oEvent) {
			// console.log('CONTAINER', oSender.name, '| event:', oEvent.type, '|', oEvent.originator.name);
			this._focusLeave(oSender, oEvent.type);
		},
		
		// What child of container was last focused?
		getLastFocusedChild: function(oSender) {
			oSender._spotlight = oSender._spotlight || {};
			if (!oSender._spotlight.lastFocusedChild || oSender._spotlight.lastFocusedChild.destroyed) {
				oSender._spotlight.lastFocusedChild = enyo.Spotlight.getChildren(oSender)[0];
			}
			return oSender._spotlight.lastFocusedChild;
		},
		
		// Set last focused child
		setLastFocusedChild: function(oSender, oChild) {
			if (!enyo.Spotlight.isSpottable(oChild)) {
				enyo.warn('Spotlight Container' + oSender.name + ' has not spottable lastFocusedChild ' + oChild.name);
			}
			oSender._spotlight = oSender._spotlight || {};
			oSender._spotlight.lastFocusedChild = oChild;
		},
	}
});