/**
* provides acceleration and throttle of cursor movement.
*
* @typedef {Object} enyo.Spotlight.Container definition
*
* @ui
* @class enyo.Spotlight.Container
* @public
*/
enyo.Spotlight.Container = new function() {

    //* @protected
    /************************************************************/

    var _oThis = this;

    /**
    * Creates oSender._spotlight object
    *
    * @param  {Object} oSender - Object that will be initalized for spotlight
    * @type {Function}
    * @private
    */
    var _initComponent = function(oSender) {
            var oLastFocusedChild;
            if (!_isInitialized(oSender)) {
                if (oSender.defaultSpotlightControl) {
                    if (oSender.$[oSender.defaultSpotlightControl]) {
                        oLastFocusedChild = oSender.$[oSender.defaultSpotlightControl];
                    } else if (oSender.owner.$[oSender.defaultSpotlightControl]) {
                        oLastFocusedChild = oSender.owner.$[oSender.defaultSpotlightControl];
                    } else {
                        throw 'Invalid default spotlight control specified in ' + oSender.name;
                    }
                } else {
                    oLastFocusedChild = enyo.Spotlight.getFirstChild(oSender);
                }

                if (oLastFocusedChild && oLastFocusedChild.isDescendantOf(oSender)) {
                    _oThis.setLastFocusedChild(oSender, oLastFocusedChild);
                }
            }
        },

        /**
        * Verifies if spotlight has been initialized
        *
        * @param  {Object} oSender - Object that will be initalized for spotlight
        * @type {Function}
        * @private
        */
        _isInitialized = function(oSender) {
            return typeof oSender._spotlight.lastFocusedChild != 'undefined';
        },

        /**
        * Handle events bubbling from within the container
        *
        * @param  {Object} oSender - Object that is sending the event
        * @param  {Object} oEvent - Event to bubble
        * @type {Function}
        * @private
        */
        _handleEvent = function(oSender, oEvent) {
            oSender.cachePoint = true;
            switch (oEvent.type) {
                case 'onSpotlightFocus':
                    if (oEvent.originator !== oSender) {
                        _oThis.setLastFocusedChild(oSender, oEvent.originator);
                    }
                    break;
                case 'onSpotlightKeyDown':
                    // Inform other controls that spotlight 5-way event was generated within a container
                    oEvent.spotSentFromContainer = true;
                    break;
            }
        },

        /**
        * Was last spotted control the container's child?
        *
        * @param  {Object} oSender - Object that will be initalized for spotlight
        * @type {Function}
        * @returns {Object}
        * @private
        */
        _hadFocus = function(oSender) {
            var oLastControl = enyo.Spotlight.getLastControl();
            if (oSender._spotlight.bEnorceOutsideIn) {
                return false;
            } // Programmatically spotted containers are always treated as not having focus
            if (!enyo.Spotlight.isSpottable(oLastControl)) {
                return false;
            } // Because oLastControl might have been DHD'd
            return enyo.Spotlight.Util.isChild(oSender, oLastControl);
        },

        /**
        * Handle a control losing focus from spotlight
        *
        * @param  {Object} oSender - Object that is sending the event
        * @param  {String} s5WayEventType - Event to move focus.
        * @type {Function}
        * @private
        */
        _focusLeave = function(oSender, s5WayEventType) {
            // console.log('FOCUS LEAVE', oSender.name);
            // Ensure we are actually leaving container (and not bouncing back to the originating control)
            if (oSender._spotlight.lastFocusedChild !== enyo.Spotlight.getLastControl()) {
                var sDirection = s5WayEventType.replace('onSpotlight', '').toUpperCase();
                enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerLeave', {
                    direction: sDirection
                }, oSender);
            }
        },

        /**
        * Handle a control gaining focus from spotlight
        *
        * @param  {Object} oSender - Object that is sending the event
        * @param  {String} s5WayEventType - Event to move focus.
        * @type {Function}
        * @private
        */
        _focusEnter = function(oSender, s5WayEventType) {
            // console.log('FOCUS ENTER', oSender.name);
            var sDirection = s5WayEventType.replace('onSpotlight', '').toUpperCase();
            enyo.Spotlight.Util.dispatchEvent('onSpotlightContainerEnter', {
                direction: sDirection
            }, oSender);
        };

    /**
    * Start intercept event to remember last focus on container.
    * Call this api after dynamically set spotlight as "container".
    *
    * @param  {Object} control
    * @public
    */
    this.initContainer = function(control) {
        if (!control._spotlight || (control._spotlight && !control._spotlight.interceptEvents)) {
            control._spotlight = control._spotlight || {};
            control._spotlight.interceptEvents = true;
            enyo.Spotlight.Util.interceptEvents(control, _handleEvent);
        }
    };

    /**
    * Spotlight focus event
    *
    * @param  {Object} oChild
    * @param  {Object} oEvent
    * @public
    */
    this.onSpotlightFocus = function(oSender, oEvent) {
        oSender._spotlight = oSender._spotlight || {};
        oSender._spotlight.bEnorceOutsideIn = !oEvent.dir;
    };

    /**
    * Spotlight focused event
    *
    * @param  {Object} oChild
    * @param  {Object} oEvent
    * @returns {Boolean}
    * @public
    */
    this.onSpotlightFocused = function(oSender, oEvent) {
        if (enyo.Spotlight.isInitialized() && enyo.Spotlight.getPointerMode()) {
            return true;
        }
        _initComponent(oSender);

        var s5WayEventType = enyo.Spotlight.getLast5WayEvent() ? enyo.Spotlight.getLast5WayEvent().type : '';

        // Focus came from inside AND this was a 5-way move
        if (_hadFocus(oSender)) {
            if (s5WayEventType) {

                // Re-dispatch 5 way event
                enyo.Spotlight.Util.dispatchEvent(
                    s5WayEventType, {
                        spotSentFromContainer: true
                    },
                    oSender
                );
            }
            _focusLeave(oSender, s5WayEventType);

            // Focus came from outside or this was a programmic spot
        } else {
            var oLastFocusedChild = this.getLastFocusedChild(oSender);
            if (oLastFocusedChild) {
                enyo.Spotlight.spot(oLastFocusedChild);
            } else {
                if (s5WayEventType) {

                    // Re-dispatch 5 way event
                    enyo.Spotlight.Util.dispatchEvent(
                        s5WayEventType, {
                            spotSentFromContainer: true
                        },
                        oSender
                    );
                    return true;
                }
            }
            _focusEnter(oSender, s5WayEventType);
        }

        return true;
    };

    /**
    * What child of container was last focused?
    *
    * @param  {Object} oSender
    * @returns {Object}
    * @public
    */
    this.getLastFocusedChild = function(oSender) {
        oSender._spotlight = oSender._spotlight || {};
        if (!oSender._spotlight.lastFocusedChild || !enyo.Spotlight.isSpottable(oSender._spotlight.lastFocusedChild)) {
            oSender._spotlight.lastFocusedChild = enyo.Spotlight.getChildren(oSender)[0];
        }
        return oSender._spotlight.lastFocusedChild;
    };

    /**
    * Set last focused child
    *
    * @param  {Object} oSender
    * @param  {Object} oChild
    * @public
    */
    this.setLastFocusedChild = function(oSender, oChild) {
        if (!enyo.Spotlight.isSpottable(oChild)) {
            oChild = enyo.Spotlight.getFirstChild(oChild);
        }
        if (oChild) {
            oSender._spotlight = oSender._spotlight || {};
            oSender._spotlight.lastFocusedChild = oChild;
        } else {
            enyo.warn('Spotlight Container attempts to set not spottable lastFocusedChild');
        }
    };

};

enyo.Control.extend({
    create: enyo.inherit(function(sup) {
        return function() {
            sup.apply(this, arguments);
            // If spotlight "container" is set statically then automatically starts intercept events.
            if (this.spotlight && this.spotlight === 'container') {
                enyo.Spotlight.Container.initContainer(this);
            }
        };
    })
});
