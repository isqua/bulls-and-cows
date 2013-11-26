(function(window){

  "use strict";

  var save, restore, resetStorage,

  on = function (target, event, listener) {
    target.addEventListener(event, listener, false);
  },

  isUnique = function (string) {
    var used = {}, i, sign;

    for (i = 0; i < string.length; i++) {
      var sign = string[i];
      if (used.hasOwnProperty(sign)) {
        return false;
      }
      used[sign] = true;
    }

    return true;
  },

  generateNumber = function (base, length) {
    var i, sign,
    number = '', 
    used = {};

    for (i = 0; i < length; i++) {

      do {
        sign = Math.floor(Math.random() * base.length);
      } while (used[sign]);

      used[sign] = true;
      number += base[sign];
    }

    return number;

  },

  getAnimals = function (value, reference) {
    var cows = 0,
    bulls = 0,
    length = value.length,
    i, j;
    for (i = 0; i < length; i++) {
      for (j = 0; j < length; j++) {
        if (value[i] === reference[j]) {
          if (i === j) {
            bulls++;
          } else {
            cows++;
          }
        }
      }
    }
    return [bulls, cows, bulls === length ? true : false];
  },

  checker = function (base, length, saved) {
    var number, reg, check;
    length = parseInt(length, 10);

    if (!isUnique(base)) {
      throw new Error ('Base is not unique');
    }

    if (base.length <= length) {
      throw new Error ('Length is more than number of symbols');
    }

    number = saved || generateNumber(base, length);
    save('number', number);
    reg = new RegExp("^["+base+"]{"+length+"}$");

    check = function (guess) {
      if (reg.test(guess) && isUnique(guess)) {
        return getAnimals(guess, number);
      } else {
        return false;
      }
    };

    return {
      'check': check
    };

  },

  write = function (output) {
    return function (number, result) {
      var li = document.createElement('li');
      li.innerHTML = number + ': ' + result[0] + 'b, '+ result[1] + 'c';
      output.insertBefore(li, output.firstChild);
      save('output', output.innerHTML);
    };
  },

  Game = function (settings, puzzle) {
    var game,
    elements = settings.elements,
    guess = puzzle.elements.guess,

    base = restore('base'),
    length = restore('length'),
    number = restore('number'),

    output = puzzle.querySelector('#output'), 
    put = write(output),
    restart = function() {
      output.innerHTML = '';
      resetStorage();
      game = start();
    },

    start = function (saved) {
      var result,
      base = elements.base.value,
      length = elements.number.value;
      result = checker(base, length, saved);
      guess.value = '';
      guess.focus();
      save('base', base);
      save('length', length);
      return result;
    };

    if (base) {
      elements.base.value = base;
    }
    if (length) {
      elements.number.value = length;
    }

    game = start(number);

    output.innerHTML = restore('output') || '';

    on(settings, 'submit', function (event) {
      event.preventDefault();
      restart();
    });

    on(settings, 'reset', function (event) {
      restart();
    });

    on(puzzle, 'submit', function (event) {
      event.preventDefault();
      var result = game.check(guess.value);
      if (result) {
        put(guess.value, result);
        if (result[2] === true) {
          if (confirm('You win! Start new game?')) {
            restart();
          }
        }
        guess.value = '';
      } else {
        alert('Invalid number');
      }
      guess.focus();
    });

  };

  if (window.localStorage) {
    save = function (key, value) {
      window.localStorage.setItem(key, value);
    };
    restore = function (key) {
      return window.localStorage.getItem(key);
    };
    resetStorage = function () {
      window.localStorage.clear();
    }
  } else {
    save = function () {};
    restore = function () {};
    resetStorage = function () {};
  }
  
  window.Game = Game;

})(window);
