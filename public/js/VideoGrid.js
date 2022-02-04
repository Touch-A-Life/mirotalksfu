'use strict';

function Area(Increment, Count, Width, Height, Margin = 10) {
    let i = 0;
    let w = 0;
    let h = Increment * 0.75 + Margin * 2;
    while (i < Count) {
        if (w + Increment > Width) {
            w = 0;
            h = h + Increment * 0.75 + Margin * 2;
        }
        w = w + Increment + Margin * 2;
        i++;
    }
    if (h > Height) return false;
    else return Increment;
}

function resizeVideoMedia() {
    let Margin = 2;
    let Scenary = document.getElementById('videoMediaContainer');
    let Width = Scenary.offsetWidth - Margin * 2;
    let Height = Scenary.offsetHeight - Margin * 2;
    let Cameras = document.getElementsByClassName('Camera');
    let max = 0;

    // loop (i recommend you optimize this)
    let i = 1;
    while (i < 5000) {
        let w = Area(i, Cameras.length, Width, Height, Margin);
        if (w === false) {
            max = i - 1;
            break;
        }
        i++;
    }

    max = max - Margin * 2;
    setWidth(max, Margin);
}

function setWidth(width, margin) {
    let Cameras = document.getElementsByClassName('Camera');
    for (let s = 0; s < Cameras.length; s++) {
        Cameras[s].style.width = width + 'px';
        Cameras[s].style.margin = margin + 'px';
        Cameras[s].style.height = width * 0.7 + 'px';

        // Cameras[s].style.width = '300px';
        // Cameras[s].style.margin = '10px';
        // Cameras[s].style.height = '200px';
    }
}

window.addEventListener(
    'load',
    function (event) {
        resizeVideoMedia();
        window.onresize = resizeVideoMedia;
    },
    false,
);

// document.getElementById('videoMediaContainer').addEventListener(
//     'DOMNodeInserted',
//     function (e) {
//         e.target; //
//         console.log('hello', document.body.classList.contains('iammoderator'), e.target);
//         // const check = document.body.classList.contains('iammoderator') ? true : false;
//         // console.log('hello window', document.body.classList.contains('iammoderator'), check);
//     },
//     false,
// );

var myElement = document.getElementById('videoMediaContainer');
if (window.addEventListener) {
    // Normal browsers
    myElement.addEventListener('DOMSubtreeModified', contentChanged, false);
} else if (window.attachEvent) {
    // IE
    myElement.attachEvent('DOMSubtreeModified', contentChanged);
}

function contentChanged() {
    // this function will run each time the content of the DIV changes
    console.log('Hello im modified');
}
