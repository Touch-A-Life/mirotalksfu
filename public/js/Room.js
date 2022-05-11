'use strict';

let meterRefresh = null;

//end of sound meter

if (location.href.substr(0, 5) !== 'https') location.href = 'https' + location.href.substr(4, location.href.length - 4);

const RoomURL = window.location.href.split('?')[0];

const swalBackground = 'linear-gradient(to left, #1f1e1e, #000000)';
const swalImageUrl = '../images/pricing-illustration.svg';
const webBaseUrl = 'https://touch-a-life-dev.web.app';
const webApiBaseUrl = webBaseUrl + '/api/v1';
const webBaseUrlAudioPath = '/chatTabs';

const url = {
    ipLookup: 'https://extreme-ip-lookup.com/json/',
};

const _PEER = {
    audioOn: '<i class="fas fa-microphone"></i>',
    audioOff: '<i style="color: red;" class="fas fa-microphone-slash"></i>',
    videoOn: '<i class="fas fa-video"></i>',
    videoOff: '<i style="color: red;" class="fas fa-video-slash"></i>',
    raiseHand: '<i style="color: rgb(0, 255, 71);" class="fas fa-hand-paper pulsate"></i>',
    lowerHand: '',
    ejectPeer: '<i class="fas fa-times"></i>',
    sendFile: '<i class="fas fa-upload"></i>',
};

let participantsCount = 0;

let rc = null;
let producer = null;

let peer_name = '';
let peer_geo = null;
let peer_info = null;
var currentUserName = '';
var currentUserProfileImageUrl = '';

var roomTitle = '';
var roomDescription = '';
var roomStartTime = '';
var roomEndTime = '';

let room_id = location.pathname.substring(6);
let isEnumerateDevices = false;

let isAudioAllowed = false;
let isVideoAllowed = false;
let isAudioOn = false;
let isVideoOn = false;
let initAudioButton = null;
let initVideoButton = null;

let recTimer = null;
let recElapsedTime = null;

const wbImageInput = 'image/*';
const wbWidth = 800;
const wbHeight = 600;
let wbCanvas = null;
let wbIsDrawing = false;
let wbIsOpen = false;
let wbIsRedoing = false;
let wbIsEraser = false;
let wbPop = [];

let isButtonsVisible = false;

//Current user info
let getUserDetails,
    getRoomDetails = {};
let isModerator = false;

const socket = io();

function getQueryString(url = '', keyToReturn = '') {
    const urlParams = new URLSearchParams(url);
    const myParam = urlParams.get(keyToReturn);
    return myParam;
}

function getRandomNumber(length) {
    let result = '';
    let characters = '0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const currentUserId = getQueryString(window.location.search, 'userId');
async function getCurrentUserInfo() {
    try {
        const fetchUserDetails = await axios.get(webApiBaseUrl + '/user/' + currentUserId);
        getUserDetails = fetchUserDetails && fetchUserDetails.data && fetchUserDetails.data.data;

        if (!getUserDetails || !getUserDetails.unique_id) {
            window.location.href = `${webBaseUrl}`;
            return;
        }

        currentUserName = `${getUserDetails && getUserDetails.name && getUserDetails.name.first_name} ${
            getUserDetails && getUserDetails.name && getUserDetails.name.last_name
        }`;
        currentUserProfileImageUrl = `${getUserDetails && getUserDetails.profile_image_url}`;
    } catch (e) {
        console.log('Failed to fetch the user details', currentUserId, e);
    }
}

async function getRoomInfo() {
    try {
        const fetchRoomDetails = await axios.get(webApiBaseUrl + '/chatrooms/' + room_id);
        getRoomDetails = fetchRoomDetails && fetchRoomDetails.data && fetchRoomDetails.data.data;

        if (!getRoomDetails || !getRoomDetails._id) {
            window.location.href = `${webBaseUrl}`;
            return;
        }

        if (getRoomDetails && getRoomDetails.ownerId == currentUserId) {
            isModerator = true;
        }

        //set page title
        document.title = getRoomDetails && getRoomDetails.title;

        roomTitle = getRoomDetails && getRoomDetails.title;
        roomDescription = getRoomDetails && getRoomDetails.description;
        roomEndTime = getRoomDetails && getRoomDetails.endTime && new Date(getRoomDetails.endTime).toDateString() + " " + new Date(getRoomDetails.endTime).toLocaleTimeString();
        roomStartTime = getRoomDetails && getRoomDetails.startTime && new Date(getRoomDetails.startTime).toDateString() + " " + new Date(getRoomDetails.startTime).toLocaleTimeString();

    } catch (e) {
        console.log('Failed to fetch the room details', room_id, e);
    }
}

function initClient() {
    if (!DetectRTC.isMobileDevice) {
        setTippy('tabDevicesBtn', 'Devices', 'top');
        setTippy('tabWhiteboardBtn', 'Whiteboard', 'top');
        setTippy('tabRecordingBtn', 'Recording', 'top');
        setTippy('tabRoomBtn', 'Room', 'top');
        setTippy('tabYoutubeBtn', 'YouTube', 'top');
        //setTippy("tabStylingBtn", "Styling", "top");
        setTippy('whiteboardPencilBtn', 'Drawing mode', 'top');
        setTippy('whiteboardObjectBtn', 'Object mode', 'top');
        setTippy('whiteboardUndoBtn', 'Undo', 'top');
        setTippy('whiteboardRedoBtn', 'Redo', 'top');
        setTippy('whiteboardImgFileBtn', 'Add image file', 'top');
        setTippy('whiteboardImgUrlBtn', 'Add image url', 'top');
        setTippy('whiteboardTextBtn', 'Add text', 'top');
        setTippy('whiteboardLineBtn', 'Add line', 'top');
        setTippy('whiteboardRectBtn', 'Add rectangle', 'top');
        setTippy('whiteboardCircleBtn', 'Add circle', 'top');
        setTippy('whiteboardSaveBtn', 'Save', 'top');
        setTippy('whiteboardEraserBtn', 'Eraser', 'top');
        setTippy('whiteboardCleanBtn', 'Clear', 'top');
        setTippy('participantsRefreshBtn', 'Refresh', 'top');
        setTippy('chatMessage', 'Press enter to send', 'top-start');
        setTippy('chatSendButton', 'Send', 'top');
        setTippy('chatEmojiButton', 'Emoji', 'top');
        setTippy('chatCleanButton', 'Clean', 'bottom');
        setTippy('chatSaveButton', 'Save', 'bottom');
        setTippy('sessionTime', 'Session time', 'right');
        setTippy('sessionTimeHome', 'Session time', 'right');
    }
    //setupWhiteboard();
    initEnumerateDevices();
}

function setTippy(elem, content, placement) {
    tippy(document.getElementById(elem), {
        content: content,
        placement: placement,
    });
}

// ####################################################
// ENUMERATE DEVICES
// ####################################################

async function initEnumerateDevices() {
    if (isEnumerateDevices) return;
    console.log('01 ----> init Enumerate Devices');

    // allow the audio
    await navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
            enumerateAudioDevices(stream);
            isAudioAllowed = true;
        })
        .catch(() => {
            isAudioAllowed = false;
        });

    // allow the video
    // await navigator.mediaDevices
    //   .getUserMedia({ video: false })
    //   .then((stream) => {
    //     enumerateVideoDevices(stream);
    //     isVideoAllowed = false;
    //   })
    //   .catch(() => {
    //     isVideoAllowed = false;
    //   });

    // if (!isAudioAllowed && !isVideoAllowed) {
    if (!isAudioAllowed) {
        window.location.href = `/permission?room_id=${room_id}&message=Not allowed Audio`;
    } else {
        try {
            await getCurrentUserInfo();
            await getRoomInfo();
        } catch (e) {
            console.log('Fetching Error: User Info / Room Info', e);
        }
        hide(loadingDiv);
        getPeerGeoLocation();
        whoAreYou();
    }
}

function enumerateAudioDevices(stream) {
    console.log('02 ----> Get Audio Devices');
    navigator.mediaDevices
        .enumerateDevices()
        .then((devices) =>
            devices.forEach((device) => {
                let el = null;
                if ('audioinput' === device.kind) {
                    el = microphoneSelect;
                } else if ('audiooutput' === device.kind) {
                    el = speakerSelect;
                }
                if (!el) return;
                appenChild(device, el);
            }),
        )
        .then(() => {
            stopTracks(stream);
            isEnumerateDevices = true;
            speakerSelect.disabled = !('sinkId' in HTMLMediaElement.prototype);
        });
}

function enumerateVideoDevices(stream) {
    console.log('03 ----> Get Video Devices');
    navigator.mediaDevices
        .enumerateDevices()
        .then((devices) =>
            devices.forEach((device) => {
                let el = null;
                if ('videoinput' === device.kind) {
                    el = videoSelect;
                }
                if (!el) return;
                appenChild(device, el);
            }),
        )
        .then(() => {
            stopTracks(stream);
            isEnumerateDevices = true;
        });
}

function stopTracks(stream) {
    stream.getTracks().forEach((track) => {
        track.stop();
    });
}

function appenChild(device, el) {
    let option = document.createElement('option');
    option.value = device.deviceId;
    option.innerText = device.label;
    el.appendChild(option);
}

// ####################################################
// SOME PEER INFO
// ####################################################

function getPeerInfo() {
    peer_info = {
        detect_rtc_version: DetectRTC.version,
        is_webrtc_supported: DetectRTC.isWebRTCSupported,
        is_mobile_device: DetectRTC.isMobileDevice,
        os_name: DetectRTC.osName,
        os_version: DetectRTC.osVersion,
        browser_name: DetectRTC.browser.name,
        browser_version: DetectRTC.browser.version,
        peer_id: socket.id,
        peer_name: peer_name,
        peer_audio: isAudioOn,
        peer_video: isVideoOn,
        peer_hand: false,
        peer_img: currentUserProfileImageUrl,
        peer_isModerator: isModerator,
    };
}

function getPeerGeoLocation() {
    fetch(url.ipLookup)
        .then((res) => res.json())
        .then((outJson) => {
            peer_geo = outJson;
        })
        .catch((ex) => console.warn('IP Lookup', ex));
}

// ####################################################
// ENTER YOUR NAME | Enable/Disable AUDIO/VIDEO
// ####################################################

function whoAreYou() {
    console.log('04 ----> Who are you');

    if (!currentUserName || currentUserName.trim().length === 0) {
        window.location.href = `${webBaseUrl}/login?audioRoomId=${room_id}`;
        return;
    }

    Swal.fire({
        inputValue: `${getUserDetails && getUserDetails.name && getUserDetails.name.first_name} ${
            getUserDetails && getUserDetails.name && getUserDetails.name.last_name
        }`,
        allowOutsideClick: false,
        allowEscapeKey: false,
        background: swalBackground,
        input: 'text',
        inputPlaceholder: 'Enter your name',
        // inputAttributes: {
        //     readonly: true,
        // },
        html: `<br />
        <div class='color-white'><b>Title:</b> ${roomTitle}</div><br/>
        <div class='color-white'><b>Description:</b> ${roomDescription}</div><br/>
        <div class='color-white'><b>Time:</b> ${roomStartTime} - ${roomEndTime}</div><br/>
        <div style="overflow: hidden;display:none;">
            <button id="initAudioButton" class="fas fa-microphone" onclick="handleAudio(event)"></button>
            <button id="initVideoButton" class="fas fa-video" onclick="handleVideo(event)"></button>
        </div>`,
        confirmButtonText: `Join audio room`,
        showClass: {
            popup: 'animate__animated animate__fadeInDown',
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp',
        },
        inputValidator: (name) => {
            if (!name) return 'Please enter your name';
            peer_name = name;
        },
    }).then(() => {
        getPeerInfo();
        shareRoom();
        joinRoom(peer_name, room_id);
    });

    initAudioButton = document.getElementById('initAudioButton');
    initVideoButton = document.getElementById('initVideoButton');
    if (!isAudioAllowed) initAudioButton.className = 'hidden';
    if (!isVideoAllowed) initVideoButton.className = 'hidden';
}

function handleAudio(e) {
    isAudioOn = isAudioOn ? false : true;
    e.target.className = 'fas fa-microphone' + (isAudioOn ? '' : '-slash');
    setColor(e.target, isAudioOn ? 'white' : 'red');
    setColor(startAudioButton, isAudioOn ? 'white' : 'red');
}

function handleVideo(e) {
    isVideoOn = isVideoOn ? false : true;
    e.target.className = 'fas fa-video' + (isVideoOn ? '' : '-slash');
    setColor(e.target, isVideoOn ? 'white' : 'red');
    setColor(startVideoButton, isVideoOn ? 'white' : 'red');
}

// ####################################################
// SHARE ROOM
// ####################################################

async function shareRoom(useNavigator = false) {
    if (navigator.share && useNavigator) {
        try {
            await navigator.share({ url: RoomURL });
            userLog('info', 'Room Shared successfully', 'top-end');
        } catch (err) {
            share();
        }
    } else {
        share();
    }
    function share() {
        sound('open');

        Swal.fire({
            background: swalBackground,
            position: 'center',
            title: '<strong>Hello ' + peer_name + '</strong>',
            html:
                `
                <p>By default, you are a listener. Raise hand to send a request to the moderator to become a speaker.</p>
            <br/>
            <br/>
            <div id="qrRoomContainer">
                <canvas id="qrRoom"></canvas>
            </div>
            <br/><br/>
            <p style="background:transparent; color:white;">Share this url to invite others to join.</p>
            <p style="background:transparent; color:rgb(8, 189, 89);">` +
                RoomURL +
                `</p>`,
            showDenyButton: true,
            showCancelButton: true,
            confirmButtonText: `Copy meeting URL`,
            denyButtonText: `Email invite`,
            cancelButtonText: `Close`,
            showClass: {
                popup: 'animate__animated animate__fadeInUp',
            },
            hideClass: {
                popup: 'animate__animated animate__fadeOutUp',
            },
            didClose: () => {
                getRoomParticipants(true);
            },
        }).then((result) => {
            if (result.isConfirmed) {
                copyRoomURL();
            } else if (result.isDenied) {
                let message = {
                    email: '',
                    subject: 'Please join our talgiving Video Chat Meeting',
                    body: 'Click to join: ' + RoomURL,
                };
                shareRoomByEmail(message);
            }
        });
        makeRoomQR();
    }
}

// ####################################################
// ROOM UTILITY
// ####################################################

function makeRoomQR() {
    let qrSize = DetectRTC.isMobileDevice ? 96 : 200;
    let qr = new QRious({
        element: document.getElementById('qrRoom'),
        value: RoomURL,
    });
    qr.set({
        size: qrSize,
    });
}

function copyRoomURL() {
    let tmpInput = document.createElement('input');
    document.body.appendChild(tmpInput);
    tmpInput.value = RoomURL;
    tmpInput.select();
    tmpInput.setSelectionRange(0, 99999); // For mobile devices
    navigator.clipboard.writeText(tmpInput.value);
    document.body.removeChild(tmpInput);
    userLog('info', 'Room URL copied to clipboard', 'top-end');
}

function shareRoomByEmail(message) {
    let email = message.email;
    let subject = message.subject;
    let emailBody = message.body;
    document.location = 'mailto:' + email + '?subject=' + subject + '&body=' + emailBody;
}

// ####################################################
// JOIN TO ROOM
// ####################################################

function joinRoom(peer_name, room_id) {
    if (rc && rc.isConnected()) {
        console.log('Already connected to a room');
    } else {
        console.log('05 ----> join to Room ' + room_id);
        rc = new RoomClient(
            remoteAudios,
            videoMediaContainer,
            window.mediasoupClient,
            socket,
            room_id,
            peer_name,
            peer_geo,
            peer_info,
            isAudioAllowed,
            isVideoAllowed,
            roomIsReady,
            currentUserProfileImageUrl,
            isModerator,
        );

        if (!rc.peer_isModerator) {
            //hide mute/unmute button for all except moderator/owner
            document.getElementById('startAudioButton').style.display = 'none';

            //hide lock/unlock button
            document.getElementById('lockRoomButton').style.display = 'none';
            document.getElementById('unlockRoomButton').style.display = 'none';
            document.getElementById('brAfterLockButtons').style.display = 'none';
        }

        document.getElementById('roomTitle').innerHTML = getRoomDetails && getRoomDetails.title;
        handleRoomClientEvents();
    }
}

function roomIsReady() {
    show(exitButton);
    show(shareButton);
    show(startRecButton);
    show(chatButton);
    show(chatSendButton);
    show(chatEmojiButton);
    if (DetectRTC.isMobileDevice) {
        //show(swapCameraButton);
        setChatSize();
    } else {
        rc.makeDraggable(chatRoom, chatHeader);
        rc.makeDraggable(mySettings, mySettingsHeader);
        rc.makeDraggable(participants, participantsHeader);
        rc.makeDraggable(whiteboard, whiteboardHeader);
        //if (navigator.getDisplayMedia || navigator.mediaDevices.getDisplayMedia) {
        //show(startScreenButton);
        //}
    }
    if (DetectRTC.browser.name != 'Safari') {
        document.onfullscreenchange = () => {
            if (!document.fullscreenElement) rc.isDocumentOnFullScreen = false;
        };
        show(fullScreenButton);
    }
    show(settingsButton);
    // show(raiseHandButton);
    if (isAudioAllowed) show(startAudioButton);
    // if (isVideoAllowed) show(startVideoButton);
    // show(fileShareButton);
    show(participantsButton);
    show(showParticipants);
    show(lockRoomButton);
    show(aboutButton);
    show(raiseHandIcon);
    handleButtons();
    handleSelects();
    handleInputs();
    startSessionTimer();
    document.body.addEventListener('mousemove', (e) => {
        showButtons();
    });

    hide(tabWhiteboardBtn);

    //add a unique class to an control div
    var controlElement = document.getElementById('control');
    if (controlElement) controlElement.classList.add(`control-${rc.peer_id}`);

    if (rc.peer_isModerator) {
        rc.updatePeerInfo(peer_name, rc.peer_id, 'audio', true);
        document.getElementById('startAudioButton').style.display = 'none';
        document.getElementById('stopAudioButton').style.display = 'block';
    }
}

function hide(elem) {
    elem.className = 'hidden';
}

function show(elem) {
    elem.className = '';
}

function setColor(elem, color) {
    elem.style.color = color;
}

// ####################################################
// SET CHAT MOBILE
// ####################################################

function setChatSize() {
    document.documentElement.style.setProperty('--msger-width', '99%');
    document.documentElement.style.setProperty('--msger-height', '99%');
}

// ####################################################
// SESSION TIMER
// ####################################################

function startSessionTimer() {
    sessionTime.style.display = 'inline';
    sessionTimeHome.style.display = 'inline';
    let callStartTime = Date.now();
    setInterval(function printTime() {
        let callElapsedTime = Date.now() - callStartTime;
        sessionTime.innerHTML = ' ' + getTimeToString(callElapsedTime);
        sessionTimeHome.innerHTML = ' ' + getTimeToString(callElapsedTime);
    }, 1000);
}

function getTimeToString(time) {
    let diffInHrs = time / 3600000;
    let hh = Math.floor(diffInHrs);
    let diffInMin = (diffInHrs - hh) * 60;
    let mm = Math.floor(diffInMin);
    let diffInSec = (diffInMin - mm) * 60;
    let ss = Math.floor(diffInSec);
    let formattedHH = hh.toString().padStart(2, '0');
    let formattedMM = mm.toString().padStart(2, '0');
    let formattedSS = ss.toString().padStart(2, '0');
    return `${formattedHH}:${formattedMM}:${formattedSS}`;
}

// ####################################################
// RECORDING TIMER
// ####################################################

function secondsToHms(d) {
    d = Number(d);
    let h = Math.floor(d / 3600);
    let m = Math.floor((d % 3600) / 60);
    let s = Math.floor((d % 3600) % 60);
    let hDisplay = h > 0 ? h + 'h' : '';
    let mDisplay = m > 0 ? m + 'm' : '';
    let sDisplay = s > 0 ? s + 's' : '';
    return hDisplay + ' ' + mDisplay + ' ' + sDisplay;
}

function startRecordingTimer() {
    recElapsedTime = 0;
    recTimer = setInterval(function printTime() {
        if (rc.isRecording()) {
            recElapsedTime++;
            recordingStatus.innerHTML = '🔴 REC ' + secondsToHms(recElapsedTime);
        }
    }, 1000);
}
function stopRecordingTimer() {
    clearInterval(recTimer);
}

// ####################################################
// HTML BUTTONS
// ####################################################

function handleButtons() {
    exitButton.onclick = () => {
        rc.exitRoom();
    };
    shareButton.onclick = () => {
        shareRoom(true);
    };
    settingsButton.onclick = () => {
        rc.toggleMySettings();
    };
    mySettingsCloseBtn.onclick = () => {
        rc.toggleMySettings();
    };
    tabDevicesBtn.onclick = (e) => {
        rc.openTab(e, 'tabDevices');
    };
    tabWhiteboardBtn.onclick = (e) => {
        rc.openTab(e, 'tabWhiteboard');
    };
    // tabRecordingBtn.onclick = (e) => {
    //     //rc.openTab(e, 'tabRecording');
    // };
    tabRoomBtn.onclick = (e) => {
        rc.openTab(e, 'tabRoom');
    };
    // tabYoutubeBtn.onclick = (e) => {
    //     rc.openTab(e, 'tabYoutube');
    // };
    // tabStylingBtn.onclick = (e) => {
    //   rc.openTab(e, "tabStyling");
    // };
    chatButton.onclick = () => {
        rc.toggleChat();
    };
    chatCleanButton.onclick = () => {
        rc.chatClean();
    };
    chatSaveButton.onclick = () => {
        rc.chatSave();
    };
    chatCloseButton.onclick = () => {
        rc.toggleChat();
    };
    chatSendButton.onclick = () => {
        rc.sendMessage();
    };
    chatEmojiButton.onclick = () => {
        rc.toggleChatEmoji();
    };
    fullScreenButton.onclick = () => {
        rc.toggleFullScreen();
    };
    // startRecButton.onclick = () => {
    //     //rc.startRecording();
    // };
    // stopRecButton.onclick = () => {
    //     //rc.stopRecording();
    // };
    // pauseRecButton.onclick = () => {
    //     // rc.pauseRecording();
    // };
    // resumeRecButton.onclick = () => {
    //     //rc.resumeRecording();
    // };
    // swapCameraButton.onclick = () => {
    //     //rc.closeThenProduce(RoomClient.mediaType.video, null, true);
    // };
    raiseHandIcon.onclick = () => {
        rc.updatePeerInfo(peer_name, rc.peer_id, 'hand', true);
    };
    lowerHandIcon.onclick = () => {
        rc.updatePeerInfo(peer_name, rc.peer_id, 'hand', false);
    };
    // raiseHandButton.onclick = () => {
    //     rc.updatePeerInfo(peer_name, rc.peer_id, 'hand', true);
    // };
    // lowerHandButton.onclick = () => {
    //     rc.updatePeerInfo(peer_name, rc.peer_id, 'hand', false);
    // };
    startAudioButton.onclick = () => {
        rc.produce(RoomClient.mediaType.audio, microphoneSelect.value);
        rc.updatePeerInfo(peer_name, rc.peer_id, 'audio', true);
        document.getElementById('startAudioButton').style.display = 'none';
        document.getElementById('stopAudioButton').style.display = 'block';
        // rc.resumeProducer(RoomClient.mediaType.audio);
    };
    stopAudioButton.onclick = () => {
        rc.closeProducer(RoomClient.mediaType.audio);
        rc.updatePeerInfo(peer_name, rc.peer_id, 'audio', false);
        document.getElementById('startAudioButton').style.display = 'block';
        document.getElementById('stopAudioButton').style.display = 'none';
        // rc.pauseProducer(RoomClient.mediaType.audio);
    };
    // startVideoButton.onclick = () => {
    //     //rc.produce(RoomClient.mediaType.video, videoSelect.value);
    //     // rc.resumeProducer(RoomClient.mediaType.video);
    // };
    // stopVideoButton.onclick = () => {
    //     //rc.closeProducer(RoomClient.mediaType.video);
    //     // rc.pauseProducer(RoomClient.mediaType.video);
    // };
    // startScreenButton.onclick = () => {
    //     //rc.produce(RoomClient.mediaType.screen);
    // };
    // stopScreenButton.onclick = () => {
    //     //rc.closeProducer(RoomClient.mediaType.screen);
    // };
    // fileShareButton.onclick = () => {
    //     rc.selectFileToShare(rc.peer_id);
    // };
    // youTubeShareButton.onclick = () => {
    //     //rc.youTubeShareVideo();
    // };
    // youTubeCloseBtn.onclick = () => {
    //     //rc.closeYouTube(true);
    // };
    sendAbortBtn.onclick = () => {
        rc.abortFileTransfer();
    };
    receiveHideBtn.onclick = () => {
        rc.hideFileTransfer();
    };
    whiteboardButton.onclick = () => {
        rc.toggleMySettings();
        toggleWhiteboard();
    };
    whiteboardPencilBtn.onclick = () => {
        whiteboardIsDrawingMode(true);
    };
    whiteboardObjectBtn.onclick = () => {
        whiteboardIsDrawingMode(false);
    };
    whiteboardUndoBtn.onclick = () => {
        whiteboardAction(getWhiteboardAction('undo'));
    };
    whiteboardRedoBtn.onclick = () => {
        whiteboardAction(getWhiteboardAction('redo'));
    };
    whiteboardSaveBtn.onclick = () => {
        wbCanvasSaveImg();
    };
    whiteboardImgFileBtn.onclick = () => {
        whiteboardAddObj('imgFile');
    };
    whiteboardImgUrlBtn.onclick = () => {
        whiteboardAddObj('imgUrl');
    };
    whiteboardTextBtn.onclick = () => {
        whiteboardAddObj('text');
    };
    whiteboardLineBtn.onclick = () => {
        whiteboardAddObj('line');
    };
    whiteboardRectBtn.onclick = () => {
        whiteboardAddObj('rect');
    };
    whiteboardCircleBtn.onclick = () => {
        whiteboardAddObj('circle');
    };
    whiteboardEraserBtn.onclick = () => {
        whiteboardIsEraser(true);
    };
    whiteboardCleanBtn.onclick = () => {
        confirmClearBoard();
    };
    whiteboardCloseBtn.onclick = () => {
        whiteboardAction(getWhiteboardAction('close'));
    };
    participantsButton.onclick = () => {
        rc.toggleMySettings();
        getRoomParticipants();
    };
    showParticipants.onclick = () => {
        getRoomParticipants();
    };
    participantsRefreshBtn.onclick = () => {
        getRoomParticipants(true);
    };
    participantsCloseBtn.onclick = () => {
        toggleParticipants();
    };
    lockRoomButton.onclick = () => {
        rc.roomAction('lock');
    };
    unlockRoomButton.onclick = () => {
        rc.roomAction('unlock');
    };
    aboutButton.onclick = () => {
        showAbout();
    };
}

// ####################################################
// HTML SELECTS
// ####################################################

function handleSelects() {
    // devices options
    microphoneSelect.onchange = () => {
        rc.closeThenProduce(RoomClient.mediaType.audio, microphoneSelect.value);
    };
    speakerSelect.onchange = () => {
        rc.attachSinkId(rc.myVideoEl, speakerSelect.value);
    };
    // videoSelect.onchange = () => {
    //     rc.closeThenProduce(RoomClient.mediaType.video, videoSelect.value);
    // };
    // styling
    // BtnsBarPosition.onchange = () => {
    //   rc.changeBtnsBarPosition(BtnsBarPosition.value);
    // };
    // whiteboard options
    wbDrawingLineWidthEl.onchange = () => {
        wbCanvas.freeDrawingBrush.width = parseInt(wbDrawingLineWidthEl.value, 10) || 1;
    };
    wbDrawingColorEl.onchange = () => {
        wbCanvas.freeDrawingBrush.color = wbDrawingColorEl.value;
        whiteboardIsDrawingMode(true);
    };
    wbBackgroundColorEl.onchange = () => {
        let data = {
            peer_name: peer_name,
            action: 'bgcolor',
            color: wbBackgroundColorEl.value,
        };
        whiteboardAction(data);
    };
}

// ####################################################
// HTML INPUTS
// ####################################################

function handleInputs() {
    chatMessage.onkeyup = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault();
            chatSendButton.click();
        }
    };
    rc.getId('chatEmoji').addEventListener('emoji-click', (e) => {
        chatMessage.value += e.detail.emoji.unicode;
        rc.toggleChatEmoji();
    });
}

// ####################################################
// ROOM CLIENT EVENT LISTNERS
// ####################################################

function handleRoomClientEvents() {
    // rc.on(RoomClient.EVENTS.startRec, () => {
    //     console.log('Room Client start recoding');
    //     hide(startRecButton);
    //     show(stopRecButton);
    //     show(pauseRecButton);
    //     startRecordingTimer();
    // });
    // rc.on(RoomClient.EVENTS.pauseRec, () => {
    //     console.log('Room Client pause recoding');
    //     hide(pauseRecButton);
    //     show(resumeRecButton);
    // });
    // rc.on(RoomClient.EVENTS.resumeRec, () => {
    //     console.log('Room Client resume recoding');
    //     hide(resumeRecButton);
    //     show(pauseRecButton);
    // });
    // rc.on(RoomClient.EVENTS.stopRec, () => {
    //     console.log('Room Client stop recoding');
    //     hide(stopRecButton);
    //     hide(pauseRecButton);
    //     hide(resumeRecButton);
    //     show(startRecButton);
    //     stopRecordingTimer();
    // });
    rc.on(RoomClient.EVENTS.raiseHand, () => {
        console.log('Room Client raise hand');
        console.log('Info: Raise Hand: ', RoomClient);
        // hide(raiseHandButton);
        // show(lowerHandButton);

        hide(raiseHandIcon);
        show(lowerHandIcon);
        //setColor(lowerHandButton, 'green');
        setColor(lowerHandIcon, 'green');
    });
    rc.on(RoomClient.EVENTS.lowerHand, () => {
        console.log('Room Client lower hand');
        console.log('Info: Lower Hand: ', RoomClient);
        // hide(lowerHandButton);
        // show(raiseHandButton);

        hide(lowerHandIcon);
        show(raiseHandIcon);
    });
    rc.on(RoomClient.EVENTS.startAudio, () => {
        console.log('Room Client start audio');
        hide(startAudioButton);
        show(stopAudioButton);
        setColor(startAudioButton, 'red');
        startMeter();
    });
    rc.on(RoomClient.EVENTS.pauseAudio, () => {
        console.log('Room Client pause audio');
        hide(stopAudioButton);
        show(startAudioButton);
    });
    rc.on(RoomClient.EVENTS.resumeAudio, () => {
        console.log('Room Client resume audio');
        hide(startAudioButton);
        show(stopAudioButton);
    });
    rc.on(RoomClient.EVENTS.stopAudio, () => {
        console.log('Room Client stop audio');
        hide(stopAudioButton);
        show(startAudioButton);
        stopMeter();
    });
    // rc.on(RoomClient.EVENTS.startVideo, () => {
    //     console.log('Room Client start video');
    //     hide(startVideoButton);
    //     show(stopVideoButton);
    //     setColor(startVideoButton, 'red');
    // });
    // rc.on(RoomClient.EVENTS.pauseVideo, () => {
    //     console.log('Room Client pause video');
    //     hide(stopVideoButton);
    //     show(startVideoButton);
    // });
    // rc.on(RoomClient.EVENTS.resumeVideo, () => {
    //     console.log('Room Client resume video');
    //     hide(startVideoButton);
    //     show(stopVideoButton);
    // });
    rc.on(RoomClient.EVENTS.stopVideo, () => {
        console.log('Room Client stop audio');
        // hide(stopVideoButton);
        // show(startVideoButton);
    });
    // rc.on(RoomClient.EVENTS.startScreen, () => {
    //     console.log('Room Client start screen');
    //     hide(startScreenButton);
    //     show(stopScreenButton);
    // });
    // rc.on(RoomClient.EVENTS.pauseScreen, () => {
    //     console.log('Room Client pause screen');
    // });
    // rc.on(RoomClient.EVENTS.resumeScreen, () => {
    //     console.log('Room Client resume screen');
    // });
    // rc.on(RoomClient.EVENTS.stopScreen, () => {
    //     console.log('Room Client stop screen');
    //     hide(stopScreenButton);
    //     show(startScreenButton);
    // });
    rc.on(RoomClient.EVENTS.roomLock, () => {
        console.log('Room Client lock room');
        hide(lockRoomButton);
        show(unlockRoomButton);
        setColor(unlockRoomButton, 'red');
    });
    rc.on(RoomClient.EVENTS.roomUnlock, () => {
        console.log('Room Client unlock room');
        hide(unlockRoomButton);
        show(lockRoomButton);
    });
    rc.on(RoomClient.EVENTS.exitRoom, () => {
        console.log('Room Client leave room');
        window.location.href = `${webBaseUrl}${webBaseUrlAudioPath}`;
    });
}

// ####################################################
// UTILITY
// ####################################################

function userLog(icon, message, position, timer = 3000) {
    const Toast = Swal.mixin({
        background: swalBackground,
        toast: true,
        position: position,
        showConfirmButton: false,
        timer: timer,
    });
    Toast.fire({
        icon: icon,
        title: message,
    });
}

function saveDataToFile(dataURL, fileName) {
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = dataURL;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(dataURL);
    }, 100);
}

function getDataTimeString() {
    const d = new Date();
    const date = d.toISOString().split('T')[0];
    const time = d.toTimeString().split(' ')[0];
    return `${date}-${time}`;
}

function showButtons() {
    if (isButtonsVisible || (rc.isMobileDevice && rc.isChatOpen) || (rc.isMobileDevice && rc.isMySettingsOpen)) return;
    control.style.display = 'flex';
    isButtonsVisible = true;
    // setTimeout(() => {
    //   control.style.display = "none";
    //   isButtonsVisible = false;
    // }, 10000);
}

// ####################################################
// UTILITY
// ####################################################

async function sound(name, play = false) {
    if (!play) return false;

    let sound = '../sounds/' + name + '.wav';
    let audio = new Audio(sound);
    try {
        await audio.play();
    } catch (err) {
        return false;
    }
}

function isImageURL(url) {
    return url.match(/\.(jpeg|jpg|gif|png|tiff|bmp)$/) != null;
}

// ####################################################
// HANDLE WHITEBOARD
// ####################################################

function toggleWhiteboard() {
    if (!wbIsOpen) rc.sound('open');
    let whiteboard = rc.getId('whiteboard');
    whiteboard.classList.toggle('show');
    whiteboard.style.top = '50%';
    whiteboard.style.left = '50%';
    wbIsOpen = wbIsOpen ? false : true;
}

function setupWhiteboard() {
    setupWhiteboardCanvas();
    setupWhiteboardCanvasSize();
    setupWhiteboardLocalListners();
}

function setupWhiteboardCanvas() {
    wbCanvas = new fabric.Canvas('wbCanvas');
    wbCanvas.freeDrawingBrush.color = '#FFFFFF';
    wbCanvas.freeDrawingBrush.width = 3;
    whiteboardIsDrawingMode(true);
}

function setupWhiteboardCanvasSize() {
    let optimalSize = [wbWidth, wbHeight];
    let scaleFactorX = window.innerWidth / optimalSize[0];
    let scaleFactorY = window.innerHeight / optimalSize[1];
    if (scaleFactorX < scaleFactorY && scaleFactorX < 1) {
        wbCanvas.setWidth(optimalSize[0] * scaleFactorX);
        wbCanvas.setHeight(optimalSize[1] * scaleFactorX);
        wbCanvas.setZoom(scaleFactorX);
        setWhiteboardSize(optimalSize[0] * scaleFactorX, optimalSize[1] * scaleFactorX);
    } else if (scaleFactorX > scaleFactorY && scaleFactorY < 1) {
        wbCanvas.setWidth(optimalSize[0] * scaleFactorY);
        wbCanvas.setHeight(optimalSize[1] * scaleFactorY);
        wbCanvas.setZoom(scaleFactorY);
        setWhiteboardSize(optimalSize[0] * scaleFactorY, optimalSize[1] * scaleFactorY);
    } else {
        wbCanvas.setWidth(optimalSize[0]);
        wbCanvas.setHeight(optimalSize[1]);
        wbCanvas.setZoom(1);
        setWhiteboardSize(optimalSize[0], optimalSize[1]);
    }
    wbCanvas.calcOffset();
    wbCanvas.renderAll();
}

function setWhiteboardSize(w, h) {
    document.documentElement.style.setProperty('--wb-width', w);
    document.documentElement.style.setProperty('--wb-height', h);
}

function whiteboardIsDrawingMode(status) {
    wbCanvas.isDrawingMode = status;
    if (status) {
        setColor(whiteboardPencilBtn, 'green');
        setColor(whiteboardObjectBtn, 'white');
        setColor(whiteboardEraserBtn, 'white');
        wbIsEraser = false;
    } else {
        setColor(whiteboardPencilBtn, 'white');
        setColor(whiteboardObjectBtn, 'green');
    }
}

function whiteboardIsEraser(status) {
    whiteboardIsDrawingMode(false);
    wbIsEraser = status;
    setColor(whiteboardEraserBtn, wbIsEraser ? 'green' : 'white');
}

function whiteboardAddObj(type) {
    switch (type) {
        case 'imgUrl':
            Swal.fire({
                background: swalBackground,
                title: 'Image URL',
                input: 'text',
                showCancelButton: true,
                confirmButtonText: 'OK',
            }).then((result) => {
                if (result.isConfirmed) {
                    let wbCanvasImgURL = result.value;
                    if (isImageURL(wbCanvasImgURL)) {
                        fabric.Image.fromURL(wbCanvasImgURL, function (myImg) {
                            addWbCanvasObj(myImg);
                        });
                    } else {
                        userLog('error', 'The URL is not a valid image', 'top-end');
                    }
                }
            });
            break;
        case 'imgFile':
            Swal.fire({
                allowOutsideClick: false,
                background: swalBackground,
                position: 'center',
                title: 'Select the image',
                input: 'file',
                inputAttributes: {
                    accept: wbImageInput,
                    'aria-label': 'Select the image',
                },
                showDenyButton: true,
                confirmButtonText: `OK`,
                denyButtonText: `Cancel`,
            }).then((result) => {
                if (result.isConfirmed) {
                    let wbCanvasImg = result.value;
                    if (wbCanvasImg && wbCanvasImg.size > 0) {
                        let reader = new FileReader();
                        reader.onload = function (event) {
                            let imgObj = new Image();
                            imgObj.src = event.target.result;
                            imgObj.onload = function () {
                                let image = new fabric.Image(imgObj);
                                image.set({ top: 0, left: 0 }).scale(0.3);
                                addWbCanvasObj(image);
                            };
                        };
                        reader.readAsDataURL(wbCanvasImg);
                    } else {
                        userLog('error', 'File not selected or empty', 'top-end');
                    }
                }
            });
            break;
        case 'text':
            Swal.fire({
                background: swalBackground,
                title: 'Enter the text',
                input: 'text',
                showCancelButton: true,
                confirmButtonText: 'OK',
            }).then((result) => {
                if (result.isConfirmed) {
                    let wbCanvasText = result.value;
                    if (wbCanvasText) {
                        const text = new fabric.Text(wbCanvasText, {
                            top: 0,
                            left: 0,
                            fontFamily: 'Comfortaa',
                            fill: wbCanvas.freeDrawingBrush.color,
                            strokeWidth: wbCanvas.freeDrawingBrush.width,
                            stroke: wbCanvas.freeDrawingBrush.color,
                        });
                        addWbCanvasObj(text);
                    }
                }
            });
            break;
        case 'line':
            const line = new fabric.Line([50, 100, 200, 200], {
                top: 0,
                left: 0,
                fill: wbCanvas.freeDrawingBrush.color,
                strokeWidth: wbCanvas.freeDrawingBrush.width,
                stroke: wbCanvas.freeDrawingBrush.color,
            });
            addWbCanvasObj(line);
            break;
        case 'circle':
            const circle = new fabric.Circle({
                radius: 50,
                fill: 'transparent',
                stroke: wbCanvas.freeDrawingBrush.color,
                strokeWidth: wbCanvas.freeDrawingBrush.width,
            });
            addWbCanvasObj(circle);
            break;
        case 'rect':
            const rect = new fabric.Rect({
                top: 0,
                left: 0,
                width: 150,
                height: 100,
                fill: 'transparent',
                stroke: wbCanvas.freeDrawingBrush.color,
                strokeWidth: wbCanvas.freeDrawingBrush.width,
            });
            addWbCanvasObj(rect);
            break;
    }
}

function addWbCanvasObj(obj) {
    if (obj) {
        wbCanvas.add(obj);
        whiteboardIsDrawingMode(false);
        wbCanvasToJson();
    }
}

function setupWhiteboardLocalListners() {
    wbCanvas.on('mouse:down', function (e) {
        mouseDown(e);
    });
    wbCanvas.on('mouse:up', function () {
        mouseUp();
    });
    wbCanvas.on('mouse:move', function () {
        mouseMove();
    });
    wbCanvas.on('object:added', function () {
        objectAdded();
    });
}

function mouseDown(e) {
    wbIsDrawing = true;
    if (wbIsEraser && e.target) {
        wbCanvas.remove(e.target);
        return;
    }
}

function mouseUp() {
    wbIsDrawing = false;
    wbCanvasToJson();
}

function mouseMove() {
    if (wbIsEraser) {
        wbCanvas.hoverCursor = 'not-allowed';
        return;
    }
    if (!wbIsDrawing) return;
}

function objectAdded() {
    if (!wbIsRedoing) wbPop = [];
    wbIsRedoing = false;
}

function wbCanvasBackgroundColor(color) {
    document.documentElement.style.setProperty('--wb-bg', color);
    wbBackgroundColorEl.value = color;
    wbCanvas.setBackgroundColor(color);
    wbCanvas.renderAll();
}

function wbCanvasUndo() {
    if (wbCanvas._objects.length > 0) {
        wbPop.push(wbCanvas._objects.pop());
        wbCanvas.renderAll();
    }
}

function wbCanvasRedo() {
    if (wbPop.length > 0) {
        wbIsRedoing = true;
        wbCanvas.add(wbPop.pop());
    }
}

function wbCanvasSaveImg() {
    const dataURL = wbCanvas.toDataURL({
        width: wbCanvas.getWidth(),
        height: wbCanvas.getHeight(),
        left: 0,
        top: 0,
        format: 'png',
    });
    const dataNow = getDataTimeString();
    const fileName = `whiteboard-${dataNow}.png`;
    saveDataToFile(dataURL, fileName);
}

function wbCanvasToJson() {
    if (rc.thereIsParticipants()) {
        let wbCanvasJson = JSON.stringify(wbCanvas.toJSON());
        rc.socket.emit('wbCanvasToJson', wbCanvasJson);
    }
}

function JsonToWbCanvas(json) {
    if (!wbIsOpen) toggleWhiteboard();

    wbCanvas.loadFromJSON(json);
    wbCanvas.renderAll();
}

function getWhiteboardAction(action) {
    return {
        peer_name: peer_name,
        action: action,
    };
}

function confirmClearBoard() {
    Swal.fire({
        background: swalBackground,
        imageUrl: image.delete,
        position: 'center',
        title: 'Clean the board',
        text: 'Are you sure you want to clean the board?',
        showDenyButton: true,
        confirmButtonText: `Yes`,
        denyButtonText: `No`,
        showClass: {
            popup: 'animate__animated animate__fadeInDown',
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp',
        },
    }).then((result) => {
        if (result.isConfirmed) {
            whiteboardAction(getWhiteboardAction('clear'));
        }
    });
}

function whiteboardAction(data, emit = true) {
    if (emit) {
        if (rc.thereIsParticipants()) {
            rc.socket.emit('whiteboardAction', data);
        }
    } else {
        userLog(
            'info',
            `${data.peer_name} <i class="fas fa-chalkboard-teacher"></i> whiteboard action: ${data.action}`,
            'top-end',
        );
    }

    switch (data.action) {
        case 'bgcolor':
            wbCanvasBackgroundColor(data.color);
            break;
        case 'undo':
            wbCanvasUndo();
            break;
        case 'redo':
            wbCanvasRedo();
            break;
        case 'clear':
            wbCanvas.clear();
            break;
        case 'close':
            if (wbIsOpen) toggleWhiteboard();
            break;
        //...
    }
}

// ####################################################
// HANDLE PARTICIPANTS
// ####################################################

function toggleParticipants() {
    let participants = rc.getId('participants');
    participants.classList.toggle('show');
    participants.style.top = '50%';
    participants.style.left = '50%';
}

async function getRoomParticipants(refresh = false) {
    let room_info = await rc.getRoomInfo();
    let peers = new Map(JSON.parse(room_info.peers));
    let table = await getParticipantsTable(peers);

    participantsCount = peers.size;
    roomParticipants.innerHTML = table;
    refreshParticipantsCount(participantsCount);

    if (!refresh) {
        toggleParticipants();
        sound('open');
    }
}

async function getParticipantsTable(peers) {
    var isModerator = rc.peer_isModerator;
    let table = `
    <table>
    <tr>
        <th></th>
        <th></th>
        <!--<th></th>-->
        <th></th>
        <!--<th></th>-->
        <th></th>
    </tr>`;

    table += isModerator
        ? `
    <tr>
        <td>👥 All</td>
        <td><button id="muteAllButton" onclick="rc.peerAction('me','${rc.peer_id}','mute',true,true)">${_PEER.audioOff}</button></td>
        <!--<td><button id="hideAllButton" onclick="rc.peerAction('me','${rc.peer_id}','hide',true,true)">${_PEER.videoOff}</button></td>-->
        <td></td>
        <!--<td><button id="sendAllButton" onclick="rc.selectFileToShare('${rc.peer_id}')">${_PEER.sendFile}</button></td>-->
        <td><button id="ejectAllButton" onclick="rc.peerAction('me','${rc.peer_id}','eject',true,true)">${_PEER.ejectPeer}</button></td>
    </tr>
    `
        : '';

    for (let peer of Array.from(peers.keys())) {
        let peer_info = peers.get(peer).peer_info;
        let peer_name = '👤 ' + peer_info.peer_name;
        let peer_audio = peer_info.peer_audio ? _PEER.audioOn : _PEER.audioOff;
        let peer_video = peer_info.peer_video ? _PEER.videoOn : _PEER.videoOff;
        let peer_hand = peer_info.peer_hand ? _PEER.raiseHand : _PEER.lowerHand;
        let peer_eject = _PEER.ejectPeer;
        let peer_sendFile = _PEER.sendFile;
        let peer_id = peer_info.peer_id;

        if (rc.peer_id === peer_id) {
            table += `
            <tr>
                <td>${peer_name} (me)</td>
                <td><!--<button>${peer_audio}</button>--></td>
                <!--<td><button>${peer_video}</button></td>-->
                <td><button id="${peer_id}__participantHandStatus">${peer_hand}</button></td>
                <!--<td></td>-->
                <td></td>
            </tr>
            `;
        } else {
            let audioButton = isModerator
                ? `<button id='${peer_id}___pAudio' onclick="rc.peerAction('me',this.id,'mute')">${peer_audio}</button>`
                : '';
            let videoButton = isModerator
                ? `<button id='${peer_id}___pVideo' onclick="rc.peerAction('me',this.id,'hide')">${peer_video}</button>`
                : '';
            let sendFile = isModerator
                ? `<button id='${peer_id}' onclick="rc.selectFileToShare(this.id, false)">${peer_sendFile}</button>`
                : '';
            let ejectButton = isModerator
                ? `<button id='${peer_id}___pEject' onclick="rc.peerAction('me',this.id,'eject')">${peer_eject}</button>`
                : '';
            let handButton = isModerator ? `<button>${peer_hand}</button>` : '';

            table += `
            <tr id='${peer_id}'>
                <td>${peer_name}</td>
                <td>${audioButton}</td>
                <!--<td>${videoButton}</td>-->
                <td>${handButton}</td>
                <!--<td>${sendFile}</td>-->
                <td>${ejectButton}</td>
            </tr>
            `;
        }
    }
    table += `</table>`;
    return table;
}

function refreshParticipantsCount(count) {
    participantsTitle.innerHTML = `<i class="fas fa-users"></i> Participants ( ${count} )`;
    participantsCountMenu.innerHTML = `(${count})`;
}

// ####################################################
// ABOUT
// ####################################################

function showAbout() {
    sound('open');

    Swal.fire({
        background: swalBackground,
        imageUrl: swalImageUrl,
        imageWidth: 300,
        imageHeight: 150,
        position: 'center',
        html: `
        <br/>
        <div id="about">
            TALGiving Audio Rooms
        </div>
        `,
        showClass: {
            popup: 'animate__animated animate__fadeInUp',
        },
        hideClass: {
            popup: 'animate__animated animate__fadeOutUp',
        },
    });
}

/*
 * Start Audio level functions
 */
function handleSuccessMeter(stream) {
    // Put variables in global scope to make them available to the
    // browser console.
    window.stream = stream;
    const soundMeter = (window.soundMeter = new SoundMeter(window.audioContext));
    soundMeter.connectToSource(stream, function (e) {
        if (e) {
            alert(e);
            return;
        }

        meterRefresh = setInterval(() => {
            const meterValue = soundMeter.instant.toFixed(2);
            console.log('sound meter', meterValue);
            if (meterValue > 0.01) {
                document.getElementById(rc.peer_id + '__speaking').innerHTML =
                    '<div class="boxContainer"><div class="box box1"></div><div class="box box2"></div><div class="box box3"></div></div>';
                rc.updatePeerInfo(peer_name, rc.peer_id, 'speaking', true);
            } else {
                document.getElementById(rc.peer_id + '__speaking').innerHTML = '';
                rc.updatePeerInfo(peer_name, rc.peer_id, 'speaking', false);
            }
        }, 200);
    });
}

function handleErrorMeter(error) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
}

function startMeter() {
    console.log('Requesting local stream');

    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        window.audioContext = new AudioContext();
    } catch (e) {
        alert('Web Audio API not supported.');
    }

    navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then(handleSuccessMeter).catch(handleErrorMeter);
}

function stopMeter() {
    console.log('Stopping local stream');

    window.stream.getTracks().forEach((track) => track.stop());
    window.soundMeter.stop();
    clearInterval(meterRefresh);
    document.getElementById(rc.peer_id + '__speaking').style.display = 'none';
}
// end of Audio level
