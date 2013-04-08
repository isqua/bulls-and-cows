(function(window){

    "use strict";

    var Game = function(input,output) {
        var n = localStorage.getItem('number') || '',
            game = this;
        this.length = 4;
        this.base = '0123456789';
        this.input = input;
        this.output = output;
        if (n !== '') {
            this.number = n;
            this.output.innerHTML = localStorage.getItem('history') || '';
        } else {
            this.number = this.random();
            this.output.innerHTML = '';
            localStorage.setItem('number',this.number);
        }
        window.console.log(this.number);
        this.handler = function(event) {
            event.stopPropagation();
            event.preventDefault();
            if (parseInt(event.keyCode, 10) === 13) {
                game.write(game.check(this.value));
            }
        };
        input.addEventListener('keyup', this.handler, false);
    };
    
    Game.prototype.random = function() {
        var a,l,i,s='',str = this.base+'';
        l = str.length;
        do {
            a = Math.floor( Math.random() * (l--) );
        } while (a === 0);
        for (i = 0; i < this.length; i++) {
            s += str[a];
            str = str.replace(str[a],'');
            a = Math.floor(Math.random()*(l--));
        }
        return s;
    };

    Game.prototype.check = function(s) { 
        var bulls = 0, cows = 0,
            i, j,
            reg = new RegExp("[0-9]{"+this.length+"}");
        if (reg.test(s)) {
            for (i = 0; i < this.length; i++) {
                for (j = 0; j < this.length; j++) {
                    if ((i !== j) && (s[i] === s[j])) {
                        this.input.value = '';
                        this.input.focus();
                        window.alert('Repeating digits!');
                        return false;
                    }
                }
            }
        } else {
                if (s.length !== 0) {
                    window.alert('Invalid number.');
                }
            return false;
        }
        for (i = 0; i < this.length; i++) {
            for (j = 0; j < this.length; j++) {
                if (s[i] === this.number[j]) {
                    if (i === j) {
                        bulls++;
                    } else {
                        cows++;
                    }
                }
            }
        }
        return [s, bulls, cows];
    };

    Game.prototype.write = function (a) {
        if ((!a) || (a.length === 0)) { return; }
        window.console.log(a);
        var text = this.output.innerHTML,
            s = a[0]+': ';
        if (a[1] === 4) {
            s += 'bingo!';
            window.localStorage.clear();
            if (window.confirm('You are right! It is '+a[0]+'. Play more?')) {
                window.location.reload();
            }
        } else if ((a[1] === 0) && (a[2] === 0)) {
            s += 'empty';
        } else {
            s += a[1]+' b '+a[2]+' c';
        }
        this.output.innerHTML = s+'\n'+text;
        window.localStorage.setItem('history',this.output.innerHTML);
        this.input.value = '';
    };

    Game.prototype.clear = function () {
        window.localStorage.clear();
        this.input.removeEventListener('keyup', this.handler, false);
    };
    
    window.Game = Game;

})(window); 
