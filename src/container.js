var
    dom = require('enyo/dom'),
    logger = require('enyo/logger');

/**
* Provides the Spotlight Container
*
* Returns a generator function that accepts the [Spotlight]{@link module:spotlight}
* instance as an argument.
*
* @module spotlight/container
* @public
*/
module.exports = function (Spotlight) {

    //* @protected
    /************************************************************/

    var _oThis = this;

    /**
    * Creates `oSender._spotlight` object.
    *
    * @param  {Object} oSender - The object that will be initalized for Spotlight.
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
                    oLastFocusedChild = Spotlight.getFirstChild(oSender);
                }

                if (oLastFocusedChild && oLastFocusedChild.isDescendantOf(oSender)) {
                    _oThis.setLastFocusedChild(oSender, oLastFocusedChild);
                }
            }
        },

        /**
        * Determines whether Spotlight has been initialized.
        *
        * @param  {Object} oSender - The object that will be checked for
        * Spotlight initalization.
        * @return {Boolean} `true` if Spotlight has been initialized; otherwise, `false`.
        * @private
        */
        _isInitialized = function(oSender) {
            return typeof oSender._spotlight.lastFocusedChild != 'undefined';
        },

        /**
        * Handles events bubbling from within the container.
        *
        * @param  {Object} oSender - The object that is sending the event.
        * @param  {Object} oEvent - The event to bubble.
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
                case 'onSpotlightContainerEnter':
                    if(oEvent.last && oEvent.last.isDescendantOf(oSender)) {
                        return true;
                    }
                    break;
                case 'onSpotlightContainerLeave':
                    if(oEvent.commonAncestor && oEvent.commonAncestor.isDescendantOf(oSender)) {
                        return true;
                    }
                    break;
            }
        },

        /**
        * Determines whether last spotted control was the container's child.
        *
        * @param  {Object} oSender
        * @returns {Object}
        * @private
        */
        _hadFocus = function(oSender) {
            var oLastControl = Spotlight.getLastControl();
            if (oSender._spotlight.bEnorceOutsideIn) {
                return false;
            } // Programmatically spotted containers are always treated as not having focus
            if (!Spotlight.isSpottable(oLastControl)) {
                return false;
            } // Because oLastControl might have been DHD'd
            return Spotlight.Util.isChild(oSender, oLastControl);
        };

    /**
    * Starts intercepting events to keep track of last focus for container.
    * Call this API after dynamically setting Spotlight as "container".
    *
    * @param  {Object} control
    * @public
    */
    this.initContainer = function(control) {
        if (!control._spotlight || (control._spotlight && !control._spotlight.interceptEvents)) {
            control._spotlight = control._spotlight || {};
            control._spotlight.interceptEvents = true;
            Spotlight.Util.interceptEvents(control, _handleEvent);
        }
    };

    /**
    * Handles Spotlight focus event.
    *
    * @param  {Object} oSender - The sender of the event.
    * @param  {Object} oEvent - The focus event.
    * @public
    */
    this.onSpotlightFocus = function(oSender, oEvent) {
        oSender._spotlight = oSender._spotlight || {};
        oSender._spotlight.bEnorceOutsideIn = !oEvent.dir;
    };

    /**
    * Handles Spotlight focused event.
    *
    * @param  {Object} oSender - The sender of the event.
    * @param  {Object} oEvent - The focused event.
    * @returns {Boolean}
    * @public
    */
    this.onSpotlightFocused = function(oSender, oEvent) {
        var o5WayEvent,
            s5WayEventType,
            s5WayEventDir,
            o5WayEventOriginator,
            oChildToFocus;

        if (Spotlight.isInitialized() && Spotlight.getPointerMode()) {
            return true;
        }
        _initComponent(oSender);

        // Extract info from the 5-way event that got us here. We
        // may need this info to focus the proper child, or to
        // redispatch the event for procssing by other containers
        o5WayEvent = Spotlight.getLast5WayEvent();
        if (o5WayEvent) {
            s5WayEventType = o5WayEvent.type;
            s5WayEventDir = s5WayEventType.replace('onSpotlight', '').toUpperCase();
            // Containers with `spotlightRememberFocus: false` need to know about
            // the 'original' (non-container) originator of the event, so we pass
            // it around using the `_originator` property
            o5WayEventOriginator = o5WayEvent._originator ?
                o5WayEvent._originator :
                o5WayEvent.originator;
        }

        // Focus came from inside AND this was a 5-way move
        if (_hadFocus(oSender)) {
            if (s5WayEventType) {

                // Re-dispatch 5 way event
                Spotlight.Util.dispatchEvent(
                    s5WayEventType, {
                        spotSentFromContainer: true,
                        _originator: o5WayEventOriginator
                    },
                    oSender
                );
            }

            // Focus came from outside or this was a programmatic spot
        } else {
            // Default container behavior is to refocus the last-focused child, but
            // some containers may prefer to focus the child nearest the originator
            // of the 5-way event
            if (o5WayEvent && oSender.spotlightRememberFocus === false) {
                oChildToFocus = Spotlight.NearestNeighbor.getNearestNeighbor(
                    // 5-way direction
                    s5WayEventDir,
                    // The true (non-container) originator of the 5-way event
                    o5WayEventOriginator,
                    // To scope our search to children of the container, we
                    // designate it as the root
                    {root: oSender}
                );
            }
            if (!oChildToFocus) {
                oChildToFocus = this.getLastFocusedChild(oSender);
            }
            if (oChildToFocus) {
                Spotlight.spot(oChildToFocus, {direction: s5WayEventDir});
            } else {
                if (s5WayEventType) {

                    // Re-dispatch 5 way event
                    Spotlight.Util.dispatchEvent(
                        s5WayEventType, {
                            spotSentFromContainer: true,
                            _originator: o5WayEventOriginator
                        },
                        oSender
                    );
                    return true;
                }
            }
        }

        return true;
    };

    /**
    * Returns last focused child of the container.
    *
    * @param  {Object} oSender
    * @returns {Object} - The last focused child of the container.
    * @public
    */
    this.getLastFocusedChild = function(oSender) {
        oSender._spotlight = oSender._spotlight || {};
        if (!oSender._spotlight.lastFocusedChild || !Spotlight.isSpottable(oSender._spotlight.lastFocusedChild)) {
            oSender._spotlight.lastFocusedChild = Spotlight.getChildren(oSender)[0];
        }
        return oSender._spotlight.lastFocusedChild;
    };

    /**
    * Sets last focused child for the container.
    *
    * @param  {Object} oSender
    * @param  {Object} oChild - The child to set as the last focused child.
    * @public
    */
    this.setLastFocusedChild = function(oSender, oChild) {
        if (!Spotlight.isSpottable(oChild)) {
            oChild = Spotlight.getFirstChild(oChild);
        }
        if (oChild) {
            oSender._spotlight = oSender._spotlight || {};
            oSender._spotlight.lastFocusedChild = oChild;
        } else {
            logger.warn('Spotlight Container attempting to set non-spottable lastFocusedChild');
        }
    };

    this.fireContainerEvents = function (blurredControl, focusedControl) {
        if(blurredControl && blurredControl.hasNode()) {
            var to = focusedControl.hasNode(),
                from = blurredControl,
                position = 0;

            // find common ancestor
            do {
                // skip over tagless Controls (e.g. enyo/ScrollStrategy)
                if (!from.hasNode()) {
                    from = from.parent;
                    continue;
                }
                position = dom.compareDocumentPosition(to, from.hasNode());
                if(position & 8) {  // 8 == 'contains'
                    Spotlight.Util.dispatchEvent('onSpotlightContainerLeave', {
                        commonAncestor: from
                    }, blurredControl);
                    break;
                } else {
                    from = from.parent;
                }
            } while (from);
        }

        if(focusedControl) {
            Spotlight.Util.dispatchEvent('onSpotlightContainerEnter', {
                last: blurredControl,
                current: focusedControl
            }, focusedControl);
        }
    };
};
