(function(window) {
    /**
     * Generate a random number
     * @param {String} base All symbols that can be used
     * @param {Number} length
     */
    function getSecret(base, length) {
        var secret = '',
            _base = base,
            sign,
            i;

        for (i = 0; i < length; i++) {
            sign = _base[Math.floor(Math.random() * _base.length)];
            _base = _base.replace(sign, '');
            secret += sign;
        }

        if (secret.charAt(0) === base.charAt(0)) {
            secret = secret.slice(1) + base.charAt(0);
        }

        return secret;
    }

    /**
     * Check if string has unique characters
     * @param {String} str
     * @returns {Boolean}
     */
    function isUnique(str) {
        var hash = {};

        return str.split('').every(function(char) {
            if (hash[char]) {
                return false;
            }

            return (hash[char] = true);
        });
    }

    /**
     * Check if guess matches rules
     * @param {String} guess
     * @param {String} base
     * @param {String} length
     * @returns {Boolean}
     */
    function isGuessValid(guess, base, length) {
        return new RegExp("^["+base+"]{"+length+"}$").test(guess) && isUnique(guess);
    }

    /**
     * Get number of bulls and cows
     * @param {String} secret
     * @param {String} guess
     * @returns {{bulls: Number, cows: Number}}
     */
    function getAnimals(secret, guess) {
        var cows = 0,
            bulls = 0,
            length = secret.length,
            i, j;

        for (i = 0; i < length; i++) {
            for (j = 0; j < length; j++) {
                if (secret[i] === guess[j]) {
                    if (i === j) {
                        bulls++;
                    } else {
                        cows++;
                    }
                }
            }
        }

        return { bulls: bulls, cows: cows };
    }

    /**
     * @param {String} secret
     * @constructor
     */
    function Game(secret) {
        this._base = Game.BASE;
        this._length = Game.LENGTH;

        if (secret && this.isValid(secret)) {
            this._secret = secret;
        } else {
            this._secret = getSecret(this._base, this._length);
        }
    }

    Game.BASE = '0123456789';
    Game.LENGTH = 4;

    Game.prototype.getSecret = function() {
        return this._secret;
    };

    Game.prototype.isValid = function(guess) {
        return isGuessValid(guess, this._base, this._length);
    };

    /**
     * @param {String} guess
     * @returns {Object}
     */
    Game.prototype.check = function(guess) {
        var animals;

        if ( ! this.isValid(guess)) {
            return { invalid: guess };
        }

        animals = getAnimals(this._secret, guess);

        if (animals.bulls === guess.length) {
            animals.win = guess;
        }

        return animals;
    };

    /**
     * @constructor
     */
    function GameStorage() {
        if (window.localStorage) {
            this.set = function(key, value) {
                return window.localStorage.setItem(key, value);
            };
            this.get = function(key, value) {
                return window.localStorage.getItem(key, value);
            };
            this.clear = function() {
                return window.localStorage.clear();
            };
        } else {
            this.set = this.stub;
            this.get = this.stub;
            this.clear = this.stub;
        }
    }

    GameStorage.prototype.stub = function() {};

    /**
     * @constructor
     */
    function UI() {
        this.initComponents();
        this.initStorage();
        this.loadState();
        this.initGame();
    }

    UI.prototype.initStorage = function() {
        this._storage = new GameStorage();
    };

    UI.prototype.loadState = function() {
        this._used = {};

        this.getHistory().forEach(function(historyItem) {
            this.markUsed(historyItem[0]);
            this.output.appendChild(this.getItemElem.apply(this, historyItem));
            if (historyItem[1].bulls === this._length) {
                this.freezeUi();
            }
        }, this);

        this.guess.value = this._storage.get('guess') || '';
    };

    UI.prototype.initComponents = function() {
        this.form = document.forms.puzzle;
        this.guess = this.form.elements.guess;
        this.output = this.form.querySelector('.output');

        this.form.addEventListener('submit', this.onFormSubmit.bind(this), false);
        this.form.addEventListener('reset', this.reset.bind(this), false);
        this.guess.addEventListener('keyup', this.onChange.bind(this), false);
    };

    UI.prototype.initGame = function() {
        this._game = new Game(this._storage.get('secret'));
        this._storage.set('secret', this._game.getSecret());
    };

    UI.prototype.onFormSubmit = function(event) {
        var value = this.guess.value,
            answer = this._game.check(value);

        event.preventDefault();

        if (value.replace(/\s+/, '') === '') {
            return;
        }

        if (this.isUsed(value)) {
            return;
        }

        if (Object.prototype.hasOwnProperty.call(answer, 'invalid')) {
            this.onInvalidInput(answer.invalid);
            this.guess.focus();
            return;
        }

        this.guess.value = '';
        this.guess.focus();

        this.addItem(value, answer);

        if (answer.win) {
            this.onWin();
        }
    };

    UI.prototype.onInvalidInput = function(str) {
        this.showNotification('error', 'The guess ' + str.slice(0, this._length) + ' is invalid');
    };

    UI.prototype.onWin = function() {
        this.reachGoal('GAME_WIN', { attempts: this.getHistory().length });

        if (confirm('You win! Start a new game?')) {
            this.clear();
            this.initGame();
        } else {
            this.freezeUi();
        }
    };

    UI.prototype.onChange = function(event) {
        this.saveGuess();

        if (event.keyCode !== 13) {
            this.hideNotifications();
        }
    };

    UI.prototype.saveGuess = function() {
        this._storage.set('guess', this.guess.value.replace(/\s+/g, ''));
    };

    UI.prototype.reset = function() {
        this.clear();
        this.initGame();
        this.reachGoal('RESET');
    };

    UI.prototype.clear = function() {
        this.output.innerHTML = '';
        this.guess.value = '';
        this._storage.clear();
        this._history = [];
        this._used = {};
        this.unfreezeUi();
        this.guess.focus();
    };

    UI.prototype.addItem = function(guess, answer) {
        var history = this.getHistory();

        if (this.isUiFrozen()) {
            return;
        }

        history.unshift([ guess, answer ]);

        this.saveHistory(history);
        this.markUsed(guess);

        this.output.insertBefore(this.getItemElem(guess, answer), this.output.firstChild);
    };

    UI.prototype.getItemElem = function(guess, answer) {
        var item = document.createElement('li');

        item.innerHTML = guess + ': ' + answer.bulls + 'b ' + answer.cows + 'c';

        return item;
    };

    UI.prototype.freezeUi = function() {
        this._frozen = true;
    };

    UI.prototype.unfreezeUi = function() {
        this._frozen = false;
    };

    UI.prototype.isUiFrozen = function() {
        return Boolean(this._frozen);
    };

    UI.prototype.getHistory = function() {
        var history;

        if (this._history) {
            return this._history;
        }

        try {
            history = JSON.parse(this._storage.get('history'));
        } catch (e) {
            history = [];
        }

        this._history = [].concat(history).filter(Boolean);

        return this._history;
    };

    UI.prototype.isUsed = function(number) {
        return Boolean(this._used[String(number)]);
    };

    UI.prototype.markUsed = function(number) {
        this._used[String(number)] = true;
    };

    UI.prototype.saveHistory = function(history) {
        this._storage.set('history', JSON.stringify(history.filter(Boolean)));
    };

    UI.prototype.showNotification = function(type, message) {
        if (this.isUiFrozen()) {
            return;
        }

        this.hideNotifications();

        var notification = document.createElement('div');

        notification.classList.add('notification');
        notification.innerHTML = message;

        this.getNotificationContainer().appendChild(notification);

        window.requestAnimationFrame(function() {
            notification.classList.add('notification-' + type);
        });
    };

    UI.prototype.hideNotifications = function() {
        this.getNotificationContainer().innerHTML = '';
    };


    UI.prototype.getNotificationContainer = function() {
        return this._notificationContainer ||
            (this._notificationContainer = document.querySelector('.notification-container'));
    };

    UI.prototype.reachGoal = function() {
        var counter = window.yaCounter32909025;

        counter && counter.reachGoal.apply(counter, arguments);
    };

    window.UI = UI;

})(window);
