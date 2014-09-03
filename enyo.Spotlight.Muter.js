/**
* @typedef {Object} enyo.Spotlight.Container definition
*
* @ui
* @class enyo.Spotlight.Muter
* @public
*/
enyo.Spotlight.Muter = new function() {
    var _oMutes = {},
        _nMutes = 0;

    /**
    * Add a muted control
    *
    * @param  {Object} oSender - Control to be muted
    * @type {Function}
    * @returns {Boolean}
    * @public
    */
    this.addMuteReason = function(oSender) {
        if (typeof _oMutes[oSender.id] != 'undefined') {
            return;
        }

        if (_nMutes === 0) {
            var oCurrent = enyo.Spotlight.getCurrent();
            if (oCurrent) {
                enyo.Spotlight.unhighlight(oCurrent);
            }
        }

        _oMutes[oSender.id] = 1;
        _nMutes++;
    };

    /**
    * Remove a muted control
    *
    * @param  {Object} oSender - Control to be un-muted
    * @type {Function}
    * @returns {Boolean}
    * @public
    */
    this.removeMuteReason = function(oSender) {
        if (typeof _oMutes[oSender.id] == 'undefined') {
            return;
        }

        delete _oMutes[oSender.id];
        _nMutes--;

        if (_nMutes === 0) {
            var oCurrent = enyo.Spotlight.getCurrent();
            if (oCurrent) {
                enyo.Spotlight.highlight(oCurrent, true);
            }
        }
    };

    /**
    * Checks if spotlight muter is muting
    *
    * @type {Function}
    * @returns {Boolean}
    * @public
    */
    this.isMuted = function() {
        return _nMutes > 0;
    };
};
