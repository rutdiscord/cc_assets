'use strict';

let token, tokenReal, tokenContent,
    intro, bgm, sfx, stat, checkbox;

let prize = false;

let domain = 'https://api.bliv.red/api'; // Change this in the dev console
const localDomain = 'http://localhost/api';

function errorOut(reason, e) {
    let children = document.body.querySelectorAll(':not(script)');
    for (let el of children) {
        el.remove();
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

    return false;
}

async function fail(reason, response) {
    let children = document.body.querySelectorAll(':not(script)');
    for (let el of children) {
        el.remove();
    }
    let header = document.createElement('h1');
    header.className = 'gmod';
    header.textContent = 'An error occurred!';
    document.body.append(header);

    let err = document.createElement('p');
    err.className = 'error';
    err.textContent = `${reason}`;
    document.body.append(err);

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

    let disclaimer = document.createElement('p');
    disclaimer.textContent = 'Psst, send this to Orangestar with the URL of this page!';
    disclaimer.className = 'small italic';
    document.body.append(disclaimer);

    return false;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

async function conclusion(tix) {
    if (token === 'abc.def') { return true; }
    let url = `${domain}/submit_session?session=${token}&game_name=${tokenContent.context.Game}&score=${tix}`;

    let response;

    try {
        response = await fetch(url);

        if (!response.ok) {
            return await fail('Your token could not be validated.', response);
        }

        let result = await response.json();

        if (!result.valid) {
            return await fail('Your token was rejected by the server.', {fake:true, reason:result.reason});
        }

    } catch (e) {
        return errorOut('submitting your score', e);
    }
    return true;
}

let prizes = [
    10,
    100,
    200,
    500,
    700,
    800,
    1000,
    1500,
    2000
];

let ducks = [];

function moveDucks() {
    for (let duck of ducks) {
        if (duck.facing === 'left') {
            duck.x--;
            if (duck.x < 0) {
                duck.x = 0;
                duck.facing = 'right';
                duck.style.transform = 'scaleX(-1)';
            }
        } else {
            duck.x++;
            if (duck.x > 282) {
                duck.x = 282;
                duck.facing = 'left';
                duck.style.transform = 'scaleX(1)';
            }
        }
        duck.style.left = duck.x + 'px';

        if (duck.going === 'up') {
            duck.y--;
            if (duck.y < 0) {
                duck.y = 0;
                duck.going = 'down';
            }
        } else {
            duck.y++;
            if (duck.y > 286) {
                duck.y = 286;
                duck.going = 'up';
            }
        }
        duck.style.top = duck.y + 'px';
    }

    requestAnimationFrame(moveDucks);
}

function addDucks() {
    let box = document.querySelector('#gamebox');

    for (let i of prizes) {
        let duck = document.createElement('div');
        duck.classList.add('duck');

        let head = document.createElement('div');
        head.classList.add('head');
        
        duck.append(head);
        
        duck.prize = prizes.indexOf(i);
        
        box.append(duck);

        duck.facing = 'left';
        if (randInt(0,2)) {
            duck.facing = 'right';
            duck.style.transform = 'scaleX(-1)';
        }

        duck.going = 'up';
        if (randInt(0,2)) {
            duck.going = 'down';
        }

        duck.style.filter = `sepia(1) saturate(400%) hue-rotate(${randInt(0, 360)}deg)`;

        duck.x = randInt(0, 282);
        duck.y = randInt(0, 286);

        duck.style.top = duck.y + 'px';
        duck.style.left = duck.x + 'px';

        ducks.push(duck);
    }
}

async function burn_token() {    
    if (token === 'abc.def') { return true; }

    let url = `${domain}/consume_session?session=${token}`;

    let response;

    try {
        response = await fetch(url);

        if (!response.ok) {
            return await fail('Your token could not be validated.', response)
        }
    } catch (e) {
        return errorOut('consuming your token', e);
    }

    return true;
}

async function go(e) {
    e.target.remove();
    
    stat.textContent = 'You put a token into the machine..';
    
    document.querySelector('.rules').classList.add('hidden');
    setTimeout(()=>{document.querySelector('.rules').remove();}, 500);

    let valid = await burn_token();
    
    if (valid) {
        stat.textContent = 'Pick a duck!'

        if (!checkbox.checked) {
            intro.play();
            intro.addEventListener('ended', () => {
                if (!checkbox.checked && !document.querySelector('#gamebox').classList.contains('over')) {
                    bgm.play();
                }
            })
        }

        for (let duck of ducks) {
            duck.addEventListener('pointerdown', () => {
                // console.log('click');
                let box = document.querySelector('#gamebox');
                if (box.classList.contains('active')) {
                    let valid = conclusion(prizes[duck.prize]);
                    if (valid) {
                        let bigDuck = document.createElement('div');
                        bigDuck.textContent = prizes[duck.prize];
                        bigDuck.className = 'bigduck';
                        bigDuck.style.filter = duck.style.filter;
                        box.append(bigDuck);

                        box.classList.remove('active');
                        box.classList.add('over');

                        duck.style.visibility = 'hidden';

                        stat.textContent = 'GAME WIN!!!';
                        stat.style.color = 'yellow';
                        stat.style.fontSize = '1.5em';

                        bgm.pause();
                        if (!checkbox.checked) {
                            sfx.play();
                        }
                    }
                }
            });
        }

        document.querySelector('#gamebox').classList.add('active');
    }
}

function mute() {
    if (checkbox.checked) {
        bgm.pause();
    } else {
        bgm.play();
    }
}

function loadToken() {
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

    if (token === 'abc.def' ) { // dev token
        card.querySelector('.name').textContent = 'CHEATER!';
        card.querySelector('.pic').src = './res/duckhead.png';
    } else {
        card.querySelector('.name').textContent = tokenContent.user.name;
        card.querySelector('.pic').src = tokenContent.user.avatar;
    }
}

function prep() {
    stat = document.querySelector('#status');
    intro = document.querySelector('#intro');
    bgm = document.querySelector('#bgm');
    sfx = document.querySelector('#sfx');
    checkbox = document.querySelector('input');

    loadToken();

    checkbox.addEventListener('change', mute);

    addDucks();

    requestAnimationFrame(moveDucks);

    let button = document.createElement('button');
    button.textContent = 'Go!';
    button.id = 'raedy';
    document.body.insertBefore(button, stat);
    button.addEventListener('pointerdown', go);
}

if (document.readyState !== 'loading') { // skip listener if dom already loaded
  prep();
} else {
    document.addEventListener('DOMContentLoaded', prep);
}