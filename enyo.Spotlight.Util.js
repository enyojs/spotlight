/**
* Spotlight utilities
*
* @typedef {Object} enyo.Spotlight.Scrolling definition
*
* @ui
* @class enyo.Spotlight.Util
* @public
*/
enyo.Spotlight.Util = new function() {

    /**
    * Attempts to dispatch all spotlight events through the low-level dispatcher
    * or directly through the origination control.
    *
    * @param  {String} sEvent - Current event to validate
    * @param  {Object} oInData - Callback that is executed
    * @param  {Object} oControl - Dispatch originator
    * @type {Function}
    * @public
    */
    this.dispatchEvent = function(sEvent, oInData, oControl) {
        var oData;

        if (!oControl || oControl.destroyed) {
            return;
        }

        if (enyo.Spotlight.isFrozen()) {
            if (sEvent == 'onSpotlightBlur') {
                return;
            }
            oControl = enyo.Spotlight.getCurrent();
        }

        if (oInData) {
            oData = enyo.clone(oInData);
        } else {
            oData = {};
        }

        oData.type = sEvent;
        oData.originator = oControl;
        oData.originator.timestamp = oData.timeStamp;
        oData.target = oControl.hasNode();
        oData.customEvent = (oData.customEvent === undefined) ? true : oData.customEvent;

        if (oData.target) {
            // We attempt to dispatch all spotlight events through the low-level dispatcher,
            // so that they can be filtered through features like the modal/capture feature
            return enyo.dispatcher.dispatch(oData);
        } else {
            // However, if a control has been teardownRendered (and has no node) we still
            // need to ensure it gets lifecycle events like onSpotlightBlur, so we dispatch
            // directly to the control
            return enyo.dispatcher.dispatchBubble(oData, oControl);
        }
    };

    /**
    * Attach event hook to capture events coming from within the container
    *
    * @param  {Object} oControl - Dispatch originator
    * @param  {Function} fHandler - Event handler function
    * @type {Function}
    * @public
    */
    this.interceptEvents = function(oControl, fHandler) {
        var f = oControl.dispatchEvent;

        oControl.dispatchEvent = function(sEventName, oEvent, oEventSender) {
            // If handler returns true - prevent default
            if (!oEvent.delegate && fHandler(oControl, oEvent)) {
                oEvent.type = null;
                return true;
            } else {
                // If handler returns false - call original dispatcher and allow bubbling
                return f.apply(oControl, [sEventName, oEvent, oEventSender]);
            }
        };
    };

    /**
    * Returns a boolean, detecting if a control is a child of another control
    *
    * @param  {Object} oParent - Dispatch originator
    * @param  {Function} oChild - Event handler function
    * @type {Function}
    * @public
    */
    this.isChild = function(oParent, oChild) {
        if (!oParent) {
            return false;
        }
        if (!oChild) {
            return false;
        }

        while (oChild.parent) {
            oChild = oChild.parent;
            if (oChild === oParent) {
                return true;
            }
        }
        return false;
    };

    /**
    * Left for backward compatibility; users should call the getAbsoluteBounds instance
    * function of enyo.Control (or enyo.dom.getAbsoluteBounds for nodes) instead.
    *
    * @param  {Object} oControl - Control in which to query for bounds
    * @type {Function}
    * @public
    */
    this.getAbsoluteBounds = function(oControl) {
        var node = oControl instanceof enyo.Control ? oControl.hasNode() : oControl;
        return enyo.dom.getAbsoluteBounds(node);
    };

    /**
    * Check if a control has a class applied.
    *
    * @param  {Object} o - Control in which to apply the query
    * @param  {String} s - Class name to query
    * @type {Function}
    * @public
    */
    this.hasClass = function(o, s) {
        if (!o || !o.className) {
            return;
        }
        return (' ' + o.className + ' ').indexOf(' ' + s + ' ') >= 0;
    };

    /**
    * Add a class to a control
    *
    * @param  {Object} o - Control in which to apply the query
    * @param  {String} s - Class name to query
    * @type {Function}
    * @public
    */
    this.addClass = function(o, s) {
        if (o && !this.hasClass(o, s)) {
            var ss = o.className;
            o.className = (ss + (ss ? ' ' : '') + s);
        }
    };

    /**
    * Remove a class from a control
    *
    * @param  {Object} o - Control in which to apply the query
    * @param  {String} s - Class name to query
    * @type {Function}
    * @public
    */
    this.removeClass = function(o, s) {
        if (o && this.hasClass(o, s)) {
            var ss = o.className;
            o.className = (' ' + ss + ' ').replace(' ' + s + ' ', ' ').slice(1, -1);
        }
    };

    /**
    * Querys a string for a suffix
    *
    * @param  {String} s - String to query
    * @param  {String} sSuffix - Suffix to apply to query
    * @type {Function}
    * @public
    */
    this.stringEndsWith = function(s, sSuffix) {
        return s.indexOf(sSuffix, s.length - sSuffix.length) !== -1;
    };

    /**
    * Translates a direction, to an appropriate Spotlight event
    *
    * @param  {String} sDirection - Direction of acceleration
    * @type {Function}
    * @public
    */
    this.directionToEvent = function(sDirection) {
        return 'onSpotlight' + sDirection.charAt(0).toUpperCase() + sDirection.substr(1).toLowerCase();
    };

    /**
    * Gets the default direction that a control will accelerate
    *
    * @param  {String} sDirection - String to query
    * @param  {Object} oControl - String to query
    * @type {Function}
    * @public
    */
    this.getDefaultDirectionControl = function(sDirection, oControl) {
        var sProperty = 'defaultSpotlight' + sDirection.charAt(0).toUpperCase() + sDirection.substr(1).toLowerCase(),
            oNeighbor;
        if (typeof oControl[sProperty] == 'string') {
            oNeighbor = oControl.owner.$[oControl[sProperty]];
            if (typeof oNeighbor != 'undefined') {
                return oNeighbor;
            }
        }
        return null;
    };

    /**
    * We use the same check as in dispatcher to know when it's simulated: by looking for x/y == 0
    *
    * @param  {String} sDirection - String to query
    * @param  {Object} oControl - String to query
    * @type {Function}
    * @public
    */
    this.isSimulatedClick = function(oEvent) {
        return (
            oEvent.clientX === 0 && oEvent.clientY === 0 &&
            (oEvent.type == 'click' || oEvent.type == 'tap')
        );
    };
};

// use faster classList interface if it exists
if (document.createElement('div').classList) {
    enyo.Spotlight.Util.hasClass = function(o, s) {
        if (o) {
            return o.classList.contains(s);
        }
    };
    enyo.Spotlight.Util.addClass = function(o, s) {
        if (o) {
            return o.classList.add(s);
        }
    };
    enyo.Spotlight.Util.removeClass = function(o, s) {
        if (o) {
            return o.classList.remove(s);
        }
    };
}
