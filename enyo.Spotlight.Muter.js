/**
* {@link enyo.Spotlight.Muter} provides methods for working with muted controls.
* By default, when a control is muted, it does not have the `'spotlight'` CSS class
* applied to its DOM node, and does not appear as highlighted when it has Spotlight
* focus.
*
* @typedef {Object} enyo.Spotlight.Muter definition
*
* @class enyo.Spotlight.Muter
* @public
*/
enyo.Spotlight.Muter = new function() {
    var _oMutes = {},
        _nMutes = 0;

    /**
    * Mutes a control.
    *
    * @param  {Object} oSender - The control to be muted.
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
    * Un-mutes a muted control.
    *
    * @param  {Object} oSender - The control to be un-muted.
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
    * Determines whether Spotlight muter is currently in use.
    *
    * @type {Function}
    * @returns {Boolean} `true` if there is at least one currently muted control;
    * otherwise, `false`.
    * @public
    */
    this.isMuted = function() {
        return _nMutes > 0;
    };
};
