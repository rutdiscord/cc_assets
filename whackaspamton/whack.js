'use strict';

let boxes = [],
    token, tokenReal, tokenContent, timer, scorecard,
    time = 60,
    score = 0,
    spams = 0,
    rals = 0,
    minus = 0,
    plus = 0;

let domain = 'https://api.bliv.red/api';

function errorOut(reason, e) {
    let children = document.body.querySelectorAll(':not(script)');
    for (let el of children) {
        if (el.nodeType != 'script') {
            el.remove();
        }
    }
    let header = document.createElement('h1');
    header.className = 'gmod';
    header.textContent = 'An error occurred!';

    let err = document.createElement('p');
    err.className = 'error';
    err.textContent = `An error occurred while ${reason}.\n\nJS said:`;

    let code = document.createElement('code');
    code.textContent = `${e.message}\n\n${e.stack}`;

    let disclaimer = document.createElement('p');
    disclaimer.textContent = 'Psst, send this to Orangestar with the URL of this page!';
    disclaimer.className = 'small italic';

    document.body.append(header);
    document.body.append(err);
    document.body.append(code);
    document.body.append(disclaimer);
}

async function fail(reason, response) {
    timer.remove();

    let box = document.querySelector('#gamebox');
    box.classList.remove('over');

    try {
        document.querySelector('.rules').remove();
    } catch (e) {}
    document.querySelector('.pad').remove();

    let message = document.createElement('h4');
    message.textContent = reason;
    box.append(message);

    let output;

    if (response.fake) {
        output = response.reason;
    } else {
        output = await response.text();
    }

    if (output) {
        message = document.createElement('p');
        message.textContent = 'The backend said:';
        box.append(message);
        message = document.createElement('code');
        message.textContent = output;
        box.append(message);
    } else {
        message = document.createElement('p');
        message.textContent = 'The backend said nothing.';
        box.append(message);
    }

    message = document.createElement('p');
    message.textContent = 'Double check to make sure your URL is valid. If the problem persists, let us know.';
    box.append(message);

    return;
}
    
function getRandomBox() {
  return boxes[Math.floor(Math.random() * 9)];
}
function randInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function hit(e) {
    if (time == 0) { return; } // don't continue if game is over

    if (e.target.classList.contains('hit')) { return; } // don't double-count hits

    e.target.classList.add('hit');

    if (e.target.classList.contains('spam')) {
        score += 100;
        plus += 1;
    }
    if (e.target.classList.contains('ral')) {
        score -= 100;
        minus += 1;
    }

    clearTimeout(e.target.timer)

    e.target.timer = setTimeout(() => { down(e.target) }, 500);

    scorecard.textContent = score;
}

function touchEffect(e) {
    let target = e.target.count === undefined ? e.target : boxes[e.target.count];

    // console.log(target, e.target.count === undefined);

    if (e.pointerType === "touch") {
        target.green = 250;
    }
}

function processTouchEffect() {
    for (let box of boxes) {
        box.style.backgroundColor = `rgba(0, ${box.green}, 0)`;
        if (box.green != 0) { box.green -= 10; }
    }

    requestAnimationFrame(processTouchEffect);
}

async function conclusion() {
    for (let box of boxes) {
        clearTimeout(box.dude.timer);
    }

    let box = document.querySelector('#gamebox');
    // anti-cheat
    let flagged = false;

    // score is valid based on green and red targets
    if (plus * 100 + ((minus * 100) * -1) !== score) { flagged = true; };

    // hit targets do not exceed total targets
    if (plus > spams || minus > rals) { flagged = true; }


    if (flagged) {
        document.querySelector('.pad').remove();
        for (let line of [
            'The anti-cheat has detected tampering.',
            'Please do not use userscripts or the JavaScript console to modify the game while it is running.',
            'If you are sure you have not deliberately modified the software, please disable any extensions and try again, or contact the developers.'
        ]) {
            let message = document.createElement('p');
            message.textContent = line;
            box.append(message);
        }

        score = -5000000; // tee hee
        return;
    } else {
        box.classList.add('over');
        timer.textContent = 'Submitting your score...';

        let result;

        let tix = score/10;
        
        if (token !== 'abc.def' ) {
            let url = `${domain}/submit_session?session=${token}&game_name=${tokenContent.context.Game}&score=${tix}`;

            let response;

            try {
                let retrying = true;
                while (retrying){
                    retrying = false
                    try {
                        response = await fetch(url);
                    } catch (e) {
                        if(e instanceof TypeError) { // network error
                            alert('A network error occurred. Trying again after 5 seconds.');
                            retrying = true
                            await new Promise((resolve) => { setTimeout(resolve, 5000); });
                        } else {
                            throw e;
                        }
                    }
                }

                if (!response.ok) {
                    return await fail('Your token could not be validated.', response);
                }
                result = await response.json();

                if (!result.valid) {
                    return await fail('Your token was rejected by the server.', {fake:true, reason:result.reason});
                }

            } catch (e) {
                errorOut('submitting your score', e);
                return;
            }
        }

        timer.textContent = 'Your score has been submitted!';
        let msg = document.createElement('p');
        msg.className = 'italic';
        msg.textContent = `You scored ${tix} tickets. You now have ${result.tickets}!`;
        document.body.insertBefore(msg, document.getElementById('gamebox'));
    }
}

function countdown() {
    time--;
    timer.textContent = time;

    if (time != 0) {
        setTimeout(countdown, 1000);
    } else {
        conclusion();
    }
}

function down(dude) {
    dude.classList.add('down');
}

function pop() {
    if (time == 0) { return }

    let box = getRandomBox();
    let breakout = 5;

    while (!box.dude.classList.contains('down') && breakout > 0) {
        box = getRandomBox();
        breakout--;
    }

    if (breakout == 0) { // couldn't get a valid box, give up for now
        setTimeout(pop, 50);
        return;
    }

    let chance = Math.random();
    if (chance < 0.2) {
        box.dude.className = 'ral';
        rals += 1;
    } else {
        box.dude.className = 'spam';
        spams += 1;
    }
    box.dude.timer = setTimeout(() => { down(box.dude) }, 1000);

    if (timer != 0) {
        let speed = Math.max(50, time * 7.5); // "speed" actually goes down because it's the min time

        let split = randInt(speed, 450); // how soon should another mole appear

        // console.log(split, speed);

        setTimeout(pop, split);
    }
}

function _go() {
    setTimeout(countdown, 1000);
    setTimeout(pop, 300);
    requestAnimationFrame(processTouchEffect);
}

function preCount() {
    document.querySelector('.rules').classList.add('hidden');

    timer.textContent = '3';
    setTimeout(() => {
        timer.textContent = '2';
        document.querySelector('.rules').remove();
    }, 1000);
    setTimeout(() => {timer.textContent = '1'; }, 2000);
    setTimeout(() => {
        timer.textContent = 'GO!';
        _go();
    }, 3000);
}

async function go(e) {
    e.target.remove();

    timer.textContent = 'You put a token into the machine...';
    
    let url = `${domain}/consume_session?session=${token}`;

    let response;
    if (token !== 'abc.def') {
      try {
          response = await fetch(url);
  
          if (!response.ok) {
              return await fail('Your token could not be validated.', response)
          }
      } catch (e) {
          errorOut('consuming your token', e);
          return;
      }
    }

    time = 60;
    score = 0;
    preCount();
}

function prep() {
    try {
        token = new URLSearchParams(window.location.search).get('token');
        if (token === null || token === undefined || token === '') {
            errorOut('reading token', {message:'No token found.', stack:'No stack trace.'});
            return;
        }
        if (token !== 'abc.def' ) { // dev token
            tokenReal = token.split(".")[1].replace('-', '+').replace('_', '/');
            tokenContent = JSON.parse(atob(tokenReal));
        }
    } catch(e) {
        errorOut('decoding token', e);
        return;
    }

    let card = document.querySelector("#playercard");

    if (token == 'abc.def' ) { // dev token
        card.querySelector('.name').textContent = 'CHEATER!';
        card.querySelector('.pic').src = './res/spam.png';
    } else {
        card.querySelector('.name').textContent = tokenContent.user.name;
        card.querySelector('.pic').src = tokenContent.user.avatar;
    }

    timer = document.querySelector('#timer');
    scorecard = document.querySelector('#score');

    boxes = document.querySelectorAll('.box');

    let count = 0; // hack?

    for (let box of boxes) {
        box.dude = box.children[0];
        box.dude.classList.remove('spam', 'ral', 'hit');
        box.dude.classList.add('down');
        box.dude.addEventListener('pointerdown', hit);

        box.dude.count = count; count++;

        box.green = 0;
        box.addEventListener('pointerdown', touchEffect);
    }
    let button = document.createElement('button');
    button.textContent = 'Go!';
    button.id = 'raedy';
    document.body.appendChild(button);
    button.addEventListener('pointerdown', go);
}

if (document.readyState !== 'loading') { // skip listener if dom already loaded
  prep();
} else {
    document.addEventListener('DOMContentLoaded', prep);
}