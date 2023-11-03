'use strict';

let token, tokenReal, tokenContent,
    intro, bgm, donk, checkbox, audioContext, gain,
    stat, ball, box, marker;

let looping = true,
    gravity = 0,
    paciGeno = 0,
    shake = false,
    shakeTime = 5,
    bottomCount = 0,
    finished = false;

let domain = 'https://api.bliv.red/api'; // Change this in the dev console
// const localDomain = 'http://localhost/api';

let pRNG = undefined;

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
        let message = document.createElement('p');
        message.textContent = 'The backend said:';
        document.body.append(message);
        message = document.createElement('code');
        message.textContent = output;
        document.body.append(message);
    } else {
        let message = document.createElement('p');
        message.textContent = 'The backend said nothing.';
        document.body.append(message);
    }

    let disclaimer = document.createElement('p');
    disclaimer.textContent = 'Psst, send this to Orangestar with the URL of this page!';
    disclaimer.className = 'small italic';
    document.body.append(disclaimer);

    return false;
}

function randInt(min, max) {
  return Math.floor(pRNG() * (max - min) + min);
}

const getRectByBoxStandards = element => { 
    const e = element.getBoundingClientRect()
    const b = box.getBoundingClientRect();
    const obj = {}
    for (let x of ['top', 'right', 'bottom', 'left']) {
        obj[x] = e[x] - b[x] - 1; //wtf?
    }
    
    return obj
  }

async function physics() {
    let rect = getRectByBoxStandards(ball);
    let origin = {x: rect.left + 8, y: rect.top + 8}

    rect.left += ball.x;

    rect.top += gravity;

    if (!shake) {
        for (let peg of document.querySelectorAll('.peg')) {
            let x = origin.x - peg.x;
            let y = origin.y - peg.y;
            let dist = Math.sqrt(x*x+y*y)
            if (dist <= 24) {
                donk.play();
                gravity = (y / 8);
                ball.x = (x / 16);

                if (!peg.classList.contains('hit')) {
                    if (peg.classList.contains('paci')) {
                        paciGeno += 1;
                    } else if (peg.classList.contains('geno')){
                        paciGeno -= 1;
                    }
                    peg.classList.add('hit');
                    marker.style.transform = `translateX(${paciGeno * 32}px)`;
                }

                break;
            }
        }
    }

    if (gravity < 9.2) {
        if (gravity < -9.2) {
            gravity = -9.3;
        }
        gravity += 0.1;
    } else {
        gravity = 9.2;
    }

    // clamp
    if (rect.left < 0) {
        rect.left = 0;
        ball.x *= -1;
    } else if (rect.left > 326) {
        rect.left = 326;
        ball.x *= -1;
    }
    if (rect.top > 334) {
        rect.top = 334;
        gravity *= -0.5;
    }

    if (rect.top >= 288) {
        let posts = [
            -2,
            48,
            98,
            148,
            198,
            248,
            298,
            348
        ]
        for (let post of posts) {
            if (
                (post > rect.left && post < rect.left+16) ||
                (post+3 > rect.left && post+3 < rect.left+16)
            ) {
                ball.x *= -1;
                if (ball.x == 0) {
                    ball.x = randInt(-1, 2) * pRNG();
                }
                if (rect.top < 290 && gravity > 0) {
                    // bounce off the top of posts
                    gravity *= -1;
                }
                break;
            }
        }
    }

    if (rect.top > 333) {
        if (ball.x > 0) { ball.x -= 0.01; } else { ball.x += 0.01 }
        if (ball.x >= 0.05 && ball.x <= 0.05) { ball.x = 0; }

        bottomCount++;

        if (bottomCount == 120) {
            // console.log('timeout');
            finished = true;
            let award = 'left';
            document.querySelector('button').remove();

            while(award !== true){
                for (let e of document.querySelectorAll('.endbox')) {
                    let c = getRectByBoxStandards(e);
                    if (rect.left > c.left + 2 && rect.left+16 < c.left + 46) {
                        award = true;
                        let tix = parseInt(e.textContent);

                        let result = await conclusion(tix);

                        stat.textContent = `You got ${result.tickets} tickets!`

                        if (paciGeno >= 3) {
                            stat.textContent += `\nYou also got a ${result.reward} for a PACIFIST run!`
                        }
                        if (paciGeno <= -3) {
                            stat.textContent += '\nYou also got a ${result.reward} for a GENOCIDE run!'
                        }
                        function fadeOut() {
                            gain.gain.value -= 0.1;
                            if (gain.gain.value > 0) {
                                setTimeout(fadeOut,100);
                            }
                        }
                        return fadeOut();
                    }
                }
                if (award === 'left') {
                    rect.left -= 1;
                } else {
                    rect.left += 1;
                }
                if (rect.left < 0) {
                    award = 'right';
                } else if (rect.left > 350) {
                    award = 'left';
                }
                ball.style.transform = `translate(${rect.left}px, ${rect.top}px)`
            }
        }
    } else {
        bottomCount = 0;
    }

    ball.style.transform = `translate(${rect.left}px, ${rect.top}px)`
    setTimeout(physics, 16); // ~60fps
}

async function conclusion(tix) {
    let reward = false;
    if (paciGeno > 3 || paciGeno < 3) { reward = true; }

    if (token === 'abc.def') { return { valid: true, tickets: '???', reward: 'A little crown <3' }; }

    let url = `${domain}/submit_session?session=${token}&game_name=${tokenContent.context.Game}&score=${tix}&reward=${reward}`;

    let response, result;

    try {
        let retrying = true
        while (retrying){
            retrying = false
            try {
                response = await fetch(url);
            } catch (e) {
                if(e instanceof TypeError) { // network error
                    console.error(e);
                    await alert('A network error occurred. Trying again after 5 seconds.');
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
        return errorOut('submitting your score', e);
    }
    
    return result;
}

function addPegs() {
    let paciPegs = [
        'aaron',
        'froggit',
        'hotsguy',
        'napstablook',
        'pyrope',
        'snowdrake',
        'vulkin'
    ]
    let genoPegs = [
        'alphys',
        'mettaton',
        'muffet',
        'papyrus',
        'sans',
        'toriel',
        'undyne'
    ]

    for (let p of paciPegs) {
        let x = randInt(0, 318);
        let y = randInt(30, 250);
        let peg = document.createElement('div');
        peg.className = 'peg paci';
        peg.style.backgroundImage = `url('./res/paci/${p}.png')`;
        peg.style.left = x + 'px';
        peg.style.top = y + 'px';
        box.append(peg);
    }

    for (let p of genoPegs) {
        let x = randInt(0, 318);
        let y = randInt(30, 250);
        let peg = document.createElement('div');
        peg.className = 'peg geno';
        peg.style.backgroundImage = `url('./res/geno/${p}.png')`;
        peg.style.left = x + 'px';
        peg.style.top = y + 'px';
        box.append(peg);
    }
    
    for (let peg of document.querySelectorAll('.peg')) {
        peg.rect = getRectByBoxStandards(peg);
        peg.x = peg.rect.left + 16;
        peg.y = peg.rect.top + 16;
    }

    let count = 0;
    for (let prize of [50, 250, 750, 2000, 750, 250, 50]) {
        let b = document.createElement('div');
        b.style.left = count + 'px';
        b.textContent = prize;
        b.classList.add('endbox');
        box.append(b);
        count += 50;
    }
}

async function shaker() {
    if (finished) {return}
    let button = document.querySelector('button');
    if (button.disabled) { return; }
    gravity = -5;
    let dir = randInt(-1, 2);
    if (dir == 0) { dir = 1; }
    ball.x = pRNG() * dir;
    shake = true;
    setTimeout(()=>{shake = false;}, 1000);
    shakeTime = 5;
    button.disabled = true;
    shakeTimer();
}

async function shakeTimer() {
    if (finished) {return}
    stat.textContent = `Shake power charging... ${shakeTime}`
    if (shakeTime == 0) {
        document.querySelector('button').disabled = false;
        stat.textContent = `Press SHAKE button to shake!`;
    }
    shakeTime--;

    if (shakeTime != -1) {
        setTimeout(shakeTimer, 1000)
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

async function start_audio_backend() {
    audioContext = new AudioContext();

    gain = audioContext.createGain();

    for (let a of [bgm, intro, donk]) {
        let z = audioContext.createMediaElementSource(a);
        z.connect(gain).connect(audioContext.destination);
    }

    intro.addEventListener('ended', () => {
        if (!looping){
            bgm.play();
        } else {
            intro.play();
        }
    });

    mute(); // check if we should turn the vol off now that we have an audio context
}

async function go(e) {
    e.target.remove();
    
    stat.textContent = 'You put a token into the machine..';

    start_audio_backend(); // no need to call back this promise...
    
    let valid = await burn_token();
    
    if (valid) {
        stat.textContent = 'Tap anywhere in the square to position the ball! Release to drop!'

        ball = document.createElement('div');
        ball.id = 'ball';
        ball.style.transform = `translate(-50%, -50%) translate(160px, -8px)`;
        box.append(ball);

        ball.x = 0;
        ball.active = false;

        setTimeout(()=>{
            if (audioContext.state == 'suspended') {
                audioContext.resume();
            }
            intro.play();
        },50);

        box.addEventListener('pointermove', (e) => {
            if (!ball.active) {
                var rect = box.getBoundingClientRect();
                var x = e.clientX - rect.left;
                if (x > 342) { // i dont know how clamp works
                    x = 342;
                } else if (x < 8) {
                    x = 8;
                }
                ball.style.transform = `translate(-50%, -50%) translate(${x}px, -8px)`;
            }
        })

        box.addEventListener('pointerup', (e) => {
            if (!ball.active) {
                ball.active = true;
                looping = false;
                
                // flatten ball position
                let rect = getRectByBoxStandards(ball);
                ball.style.transform = `translate(${rect.left}px, ${rect.top}px)`;

                stat.textContent = 'Shake power charging...';
                
                let button = document.createElement('button');
                button.textContent = 'SHAKE!';
                button.disabled = true;
                document.body.insertBefore(button, stat);

                button.addEventListener('pointerdown', shaker);

                shakeTimer();
                physics();
            }
        })

        document.querySelector('#gamebox').classList.add('active');
    }
}

function mute() {
    if (audioContext) {
        if (checkbox.checked) {
            gain.gain.value = 0;
        } else {
            gain.gain.value = 1;
        }
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
        card.querySelector('.pic').src = './res/geno/sans.png';
        pRNG = Math.random;
    } else {
        card.querySelector('.name').textContent = tokenContent.user.name;
        card.querySelector('.pic').src = tokenContent.user.avatar;
        pRNG = new Math.seedrandom(token);
    }
}

function prep() {
    stat = document.querySelector('#status');
    bgm = document.querySelector(`#bgm`);
    intro = document.querySelector(`#intro`);
    donk = document.querySelector(`#donk`);
    checkbox = document.querySelector('input');
    box = document.querySelector('#gamebox');
    marker = document.querySelector('#marker');

    loadToken();

    checkbox.addEventListener('change', mute);

    addPegs();

    let button = document.createElement('button');
    button.textContent = 'Go!';
    button.id = 'raedy';
    document.body.insertBefore(button, stat);
    button.addEventListener('click', go);
}

if (document.readyState !== 'loading') { // skip listener if dom already loaded
  prep();
} else {
    document.addEventListener('DOMContentLoaded', prep);
}