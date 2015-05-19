var
    dispatcher = require('enyo/dispatcher'),
    dom = require('enyo/dom'),
    utils = require('enyo/utils'),
    Control = require('enyo/Control');

/**
* A collection of utility methods for use with Spotlight.
*
* Returns a generator function that accepts the [Spotlight]{@link module:spotlight}
* instance as an argument.
*
* @exports spotlight/util
* @public
*/
var Util = module.exports = function (Spotlight) {

    /**
    * Attempts to dispatch all Spotlight events through the low-level dispatcher
    * or directly through the originating control.
    *
    * @param  {String} sEvent - The current event to validate.
    * @param  {Object} oInData - The callback to be executed.
    * @param  {Object} oControl - The dispatch originator.
    * @public
    */
    this.dispatchEvent = function(sEvent, oInData, oControl) {
        var oData;

        if (!oControl || oControl.destroyed) {
            return;
        }

        if (Spotlight.isFrozen()) {
            if (sEvent == 'onSpotlightBlur') {
                return;
            }
            oControl = Spotlight.getCurrent();
        }

        if (oInData) {
            oData = utils.clone(oInData);
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
            return dispatcher.dispatch(oData);
        } else {
            // However, if a control has been teardownRendered (and has no node) we still
            // need to ensure it gets lifecycle events like onSpotlightBlur, so we dispatch
            // directly to the control
            return dispatcher.dispatchBubble(oData, oControl);
        }
    };

    /**
    * Attaches event hook to capture events coming from within the container.
    *
    * @param  {Object} oControl - The dispatch originator.
    * @param  {Function} fHandler - The event handler function.
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
    * Determines whether one control is a child of another control.
    *
    * @param  {Object} oParent - The parent control.
    * @param  {Object} oChild - The potential child control.
    * @return {Boolean} `true` if `oChild` is a child of `oParent`; otherwise,
    * `false`.
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
    * Preserved for backward compatibility; users should instead call
    * [getAbsoluteBounds()]{@link enyo.Control#getAbsoluteBounds} on the
    * {@link enyo.Control} instance (or
    * [enyo.dom.getAbsoluteBounds()]{@link enyo.dom#getAbsoluteBounds} for the
    * node).
    *
    * @param  {Object} oControl - The control to query for bounds.
    * @public
    */
    this.getAbsoluteBounds = function(oControl) {
        var node = oControl instanceof Control ? oControl.hasNode() : oControl;
        return dom.getAbsoluteBounds(node);
    };

    /**
    * Determines whether a control has a given CSS class applied.
    *
    * @param  {enyo.Control} o - The control to query.
    * @param  {String} s - The name of the CSS class.
    * @return {Boolean} `true` if the class is applied to the control; otherwise, `false`.
    * @public
    */
    this.hasClass = function(o, s) {
        if (!o || !o.className) {
            return;
        }
        return (' ' + o.className + ' ').indexOf(' ' + s + ' ') >= 0;
    };

    /**
    * Applies a CSS class to a control.
    *
    * @param  {enyo.Control} o - The control to be styled.
    * @param  {String} s - The name of the CSS class to apply.
    * @public
    */
    this.addClass = function(o, s) {
        if (o && !this.hasClass(o, s)) {
            var ss = o.className;
            o.className = (ss + (ss ? ' ' : '') + s);
        }
    };

    /**
    * Removes a CSS class from a control.
    *
    * @param  {Object} o - The control from which to remove the class.
    * @param  {String} s - The name of the CSS class name to remove.
    * @public
    */
    this.removeClass = function(o, s) {
        if (o && this.hasClass(o, s)) {
            var ss = o.className;
            o.className = (' ' + ss + ' ').replace(' ' + s + ' ', ' ').slice(1, -1);
        }
    };

    /**
    * Queries a string for the presence of a given suffix.
    *
    * @param  {String} s - The string to query.
    * @param  {String} sSuffix - The suffix to look for.
    * @return {Boolean} `true` if the string ends in the specified suffix;
    * otherwise, `false`.
    * @public
    */
    this.stringEndsWith = function(s, sSuffix) {
        return s.indexOf(sSuffix, s.length - sSuffix.length) !== -1;
    };

    /**
    * Translates a direction to an appropriate Spotlight event.
    *
    * @param  {String} sDirection - The direction of acceleration.
    * @return {String} The name of the corresponding Spotlight event.
    * @public
    */
    this.directionToEvent = function(sDirection) {
        return 'onSpotlight' + sDirection.charAt(0).toUpperCase() + sDirection.substr(1).toLowerCase();
    };

    /**
    * Gets the default control to move to in a particular direction.
    *
    * @param  {String} sDirection - The direction of movement.
    * @param  {Object} oControl - The control from which movement will occur.
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
    * Determines whether the given event is a simulated click.
    * We use the same check as in dispatcher to know when it's simulated: looking for x/y == 0.
    *
    * @param  {Object} oEvent - The current event.
    * @return {Boolean} `true` if event is a simulated click; otherwise, `false`.
    * @public
    */
    this.isSimulatedClick = function(oEvent) {
        return (
            oEvent.clientX === 0 && oEvent.clientY === 0 && !oEvent.detail &&
            (oEvent.type == 'click' || oEvent.type == 'tap')
        );
    };
};

// use faster classList interface if it exists
if (document.createElement('div').classList) {
    Util.hasClass = function(o, s) {
        if (o) {
            return o.classList.contains(s);
        }
    };
    Util.addClass = function(o, s) {
        if (o) {
            return o.classList.add(s);
        }
    };
    Util.removeClass = function(o, s) {
        if (o) {
            return o.classList.remove(s);
        }
    };
}
