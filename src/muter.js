/**
* Methods for working with muted controls. By default, when a control is muted, it does not have the
* `'spotlight'` CSS class applied to its DOM node, and does not appear as highlighted when it has
* Spotlight focus.
*
* Returns a generator function that accepts the [Spotlight]{@link module:spotlight}
* instance as an argument.
*
* @module spotlight/muter
* @public
*/
module.exports = function (Spotlight) {
    var _oMutes = {},
        _nMutes = 0;

    /**
    * Mutes a control.
    *
    * @param  {Object} oSender - The control to be muted.
    * @public
    */
    this.addMuteReason = function(oSender) {
        var id = typeof oSender == 'string' ? oSender : oSender.id;
        if (_oMutes[id]) return;

        if (_nMutes === 0) {
            var oCurrent = Spotlight.getCurrent();
            if (oCurrent) {
                Spotlight.unhighlight(oCurrent);
            }
        }

        _oMutes[id] = true;
        _nMutes++;
    };

    /**
    * Un-mutes a muted control.
    *
    * @param  {Object} oSender - The control to be un-muted.
    * @public
    */
    this.removeMuteReason = function(oSender) {
        var id = typeof oSender == 'string' ? oSender : oSender.id;
        if (!_oMutes[id]) return;

        _oMutes[id] = null;
        _nMutes--;

        if (_nMutes === 0) {
            var oCurrent = Spotlight.getCurrent();
            if (oCurrent) {
                Spotlight.highlight(oCurrent, true);
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
