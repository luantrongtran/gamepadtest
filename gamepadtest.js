/*
 * Gamepad API Test
 * Written in 2013 by Ted Mielczarek <ted@mielczarek.org>
 *
 * To the extent possible under law, the author(s) have dedicated all copyright and related and neighboring rights to this software to the public domain worldwide. This software is distributed without any warranty.
 *
 * You should have received a copy of the CC0 Public Domain Dedication along with this software. If not, see <http://creativecommons.org/publicdomain/zero/1.0/>.
 */
let url = 'http://localhost:9090/manual-control';
// let url = 'http://192.168.1.136:9090/manual-control';
// let url = 'http://192.168.1.184:8082/manual-control';

let selectedDrone = "luant-drone";

function serverChanged() {
    const element = document.getElementById("server-selector");
    url = element.value;
    console.log(element.innerText + " selected [" + element.value + "]");
}

function droneChanged() {
    const element = document.getElementById("drone-selector");
    selectedDrone = element.value;
    console.log(element.innerText + " selected - id: " + selectedDrone);
}

const COMMAND_TYPE = {
    NAVIGATION: "NAVIGATION",
    ARM: "ARM"
};

const buttonConfig = {
    "ARM": 9
};

var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var controllers = {};
var rAF =
    // window.mozRequestAnimationFrame ||
    // window.webkitRequestAnimationFrame ||
    window.requestAnimationFrame;

function connecthandler(e) {
    addgamepad(e.gamepad);
}

function addgamepad(gamepad) {
    console.log(gamepad);
    controllers[gamepad.index] = gamepad;
    var d = document.createElement("div");
    d.setAttribute("id", "controller" + gamepad.index);
    var t = document.createElement("h1");
    t.appendChild(document.createTextNode("gamepad: " + gamepad.id));
    d.appendChild(t);
    var b = document.createElement("div");
    b.className = "buttons";
    for (var i = 0; i < gamepad.buttons.length; i++) {
        var e = document.createElement("span");
        e.className = "button";
        //e.id = "b" + i;
        e.innerHTML = i;
        b.appendChild(e);
    }
    d.appendChild(b);
    var a = document.createElement("div");
    a.className = "axes";
    for (i = 0; i < gamepad.axes.length; i++) {
        e = document.createElement("meter");
        e.className = "axis";
        //e.id = "a" + i;
        e.setAttribute("min", "-1");
        e.setAttribute("max", "1");
        e.setAttribute("value", "0");
        e.innerHTML = i;
        a.appendChild(e);
    }
    d.appendChild(a);
    document.getElementById("start").style.display = "none";
    document.body.appendChild(d);
    rAF(updateStatus);
}

function disconnecthandler(e) {
    removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
    var d = document.getElementById("controller" + gamepad.index);
    document.body.removeChild(d);
    delete controllers[gamepad.index];
}


function updateStatus() {
    scangamepads();
    for (j in controllers) {
        var controller = controllers[j];
        var d = document.getElementById("controller" + j);
        var buttons = d.getElementsByClassName("button");
        var buttonStatus = [];
        for (var i = 0; i < controller.buttons.length; i++) {
            var b = buttons[i];
            var val = controller.buttons[i];
            var pressed = val == 1.0;
            var touched = false;
            if (typeof (val) == "object") {
                pressed = val.pressed;
                if ('touched' in val) {
                    touched = val.touched;
                }
                val = val.value;
            }
            var pct = Math.round(val * 100) + "%";
            b.style.backgroundSize = pct + " " + pct;
            b.className = "button";
            if (pressed) {
                b.className += " pressed";
            }
            if (touched) {
                b.className += " touched";
            }
            buttonStatus.push(pressed);
        }

        var axes = d.getElementsByClassName("axis");
        for (var i = 0; i < controller.axes.length; i++) {
            var a = axes[i];
            a.innerHTML = i + ": " + controller.axes[i].toFixed(4);
            a.setAttribute("value", controller.axes[i]);
        }

        let x = -controller.axes[2];
        let y = controller.axes[3];
        let z = -controller.axes[1];
        let r = controller.axes[0];

        let commandType = COMMAND_TYPE.NAVIGATION;
        if (buttonStatus[buttonConfig.ARM] == true) {
            commandType = COMMAND_TYPE.ARM;
            console.log(commandType);
        }

        console.log(commandType);
        post(x, y, z, r, commandType);
    }

    setTimeout(function(){ rAF(updateStatus); }, 200);
    // rAF(updateStatus);
}

function scangamepads() {
    var gamepads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
    for (var i = 0; i < gamepads.length; i++) {
        if (gamepads[i] && (gamepads[i].index in controllers)) {
            controllers[gamepads[i].index] = gamepads[i];
        }
    }
}

if (haveEvents) {
    window.addEventListener("gamepadconnected", connecthandler);
    window.addEventListener("gamepaddisconnected", disconnecthandler);
} else if (haveWebkitEvents) {
    window.addEventListener("webkitgamepadconnected", connecthandler);
    window.addEventListener("webkitgamepaddisconnected", disconnecthandler);
} else {
    setInterval(scangamepads, 500);
}

function post(x, y, z, r, commandType) {
    let jBody = {
        "data": {
            "type": "manual-control",
            "attributes": {
                "xAxis": x,
                "yAxis": y,
                "zAxis": z,
                "rAxis": r,
                "commandType": commandType
            },
            "relationships": {
                "vehicle": {
                    "data": {
                        // "id": "6ed26ba8-1901-4bb4-981b-21b2c782b7fc",
                        "id": selectedDrone,
                        // "id": "luant-drone",
                        "type": "vehicles"
                    }
                }
            }
        }
    };

    // xmlhttp.send(JSON.stringify(jBody));

    fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/vnd.api+json",
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            ,'Accept': 'application/vnd.api+json'
        }
        ,body: JSON.stringify(jBody)
    }).then(res => {
        // console.log("Request complete! response:", res);
    });

}