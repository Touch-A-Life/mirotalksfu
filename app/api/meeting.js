'use strict';

const fetch = require('node-fetch');

const API_KEY = 'talgiving_default_key';
const AUDIO_ROOMS_URL = 'http://localhost:4000/api/v1/meeting';

function getResponse() {
    return fetch(AUDIO_ROOMS_URL, {
        method: 'POST',
        headers: {
            authorization: API_KEY,
            'Content-Type': 'application/json',
        },
    });
}

getResponse().then(async (res) => {
    console.log('Status code:', res.status);
    const data = await res.json();
    console.log('meeting:', data.meeting);
});
