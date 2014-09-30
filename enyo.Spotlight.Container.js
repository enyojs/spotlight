(function (enyo, scope) {
    /**
    * {@link enyo.Spotlight.Container}
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
                        oLastFocusedChild = enyo.Spotlight.getFirstChild(oSender);
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
            * Handles a control's losing focus from Spotlight.
            *
            * @param  {Object} oSender - The object that is sending the event.
            * @param  {String} s5WayEventType - The event causing focus to move.
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
            * Handles a control's gaining focus from Spotlight.
            *
            * @param  {Object} oSender - The object that is sending the event.
            * @param  {String} s5WayEventType - The event causing focus to move.
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
                enyo.Spotlight.Util.interceptEvents(control, _handleEvent);
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

                // Focus came from outside or this was a programmatic spot
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
        * Returns last focused child of the container.
        *
        * @param  {Object} oSender
        * @returns {Object} - The last focused child of the container.
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
        * Sets last focused child for the container.
        *
        * @param  {Object} oSender
        * @param  {Object} oChild - The child to set as the last focused child.
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
                enyo.warn('Spotlight Container attempting to set non-spottable lastFocusedChild');
            }
        };

    };

    // Mixin to initialize spotlight containers on create
    var initContainerMixin = {
        create: enyo.inherit(function(sup) {
            return function() {
                sup.apply(this, arguments);
                // If spotlight "container" is set statically then automatically starts to intercept events.
                if (this.spotlight && this.spotlight === 'container') {
                    enyo.Spotlight.Container.initContainer(this);
                }
            };
        })
    };

    // extend Control so any deferred kinds will be initialized
    enyo.Control.extend(initContainerMixin);

    // iterate over non-deferred kinds and extend them as well
    enyo.forEach(enyo._finishedKinds, function (ctor) {
        ctor.extend(initContainerMixin);
    });
})(enyo, window);