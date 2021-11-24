#!/bin/bash

API_KEY="talgiving_default_key"
AUDIO_ROOMS_URL="http://localhost:4000/api/v1/meeting"

curl $AUDIO_ROOMS_URL \
    --header "authorization: $API_KEY" \
    --header "Content-Type: application/json" \
    --request POST