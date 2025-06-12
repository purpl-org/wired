UpdateAllMods()

async function UpdateAllMods(undata) {
    document.getElementById('restartNeeded').style.display = 'none';
    document.getElementById('showDuringVicRestart').style.display = 'none';

    var data = await GetCurrent('FreqChange');
    var radioButtons = document.getElementsByName("frequency");
    for (var i = 0; i < radioButtons.length; i++) {
        if (radioButtons[i].value == data.freq) {
            radioButtons[i].checked = true;
            break;
        }
    }
    checkAutoUpdateStatus()

    // data = await GetCurrent('RainbowLights');
    // console.log(data.enabled)
    // radioButtons = document.getElementsByName("rainbowlights");
    // for(var i = 0; i < radioButtons.length; i++){
    //     if(radioButtons[i].value == JSON.stringify(data.enabled)){
    //         radioButtons[i].checked = true;
    //         break;
    //     }
    // }

    // let response = await GetCurrent('BootAnim');
    // let checkbox = document.getElementById('bootAnimDefault');
    // let divUpload = document.getElementById('bootAnimUploadHide');

    // if(response.default == false) {
    //     checkbox.checked = false;
    //     divUpload.style.display = "block";

    //     let img = document.createElement('img');
    //     img.src = `data:image/gif;base64,${response.gifdata}`;
    //     document.getElementById('bootAnimCurrent').innerHTML = "";
    //     document.getElementById('bootAnimCurrent').appendChild(img);
    // } else {
    //     document.getElementById('bootAnimCurrent').innerHTML = "";
    //     checkbox.checked = true;
    //     divUpload.style.display = "none";
    // }
    // bootAnimCheckValidate()
}

async function GetCurrent(mod) {
    let response = await fetch('/api/mods/current/' + mod);
    let data = await response.json();
    return data;
}

function SetModStatus(message) {
    statusMsg = document.createElement("h3")
    statusDiv = document.getElementById('modStatus')
    statusMsg.textContent = message
    statusDiv.innerHTML = ""
    document.getElementById('modStatus').style.display = 'block';
    statusDiv.appendChild(statusMsg)
}

function HideModStatus() {
    document.getElementById('modStatus').style.display = 'none';
}

async function SendJSON(mod, json) {
    document.getElementById('mods').style.display = 'none';
    SetModStatus(mod + " is applying, please wait...")
    let response = await fetch('/api/mods/modify/' + mod, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: json,
    });
    let data = await response.json();
    UpdateAllMods(data)
    if (data.status == "success") {
        document.getElementById('mods').style.display = 'block';
        HideModStatus()
    } else {
        document.getElementById('mods').style.display = 'block';
        HideModStatus()
    }
    return data;
}

async function FreqChange_Submit() {
    let freq = document.querySelector('input[name="frequency"]:checked').value;
    let data = await SendJSON('FreqChange', `{"freq":` + freq + `}`);
    console.log('Success:', data);
    CheckIfRestartNeeded("FreqChange");
}

async function RainbowLights_Submit() {
    let enabled = document.querySelector('input[name="rainbowlights"]:checked').value;
    let data = await SendJSON('RainbowLights', `{"enabled":` + enabled + `}`);
    console.log('Success:', data);
    CheckIfRestartNeeded("RainbowLights");
}

/* <div id="wakeWordStatus">
</div>
<button id="startTraining" onclick="startWakeWordFlow()">
    Train a new wake word
</button>
<button id="wakeWordListen" onclick="doListen()" style="display:none">
    Listen
</button>
<button id="genWakeWord" onclick="genWakeWord()" style="display:none">
    Generate Wake Word
</button>
</div> */

function hide(element) {
    document.getElementById(element).style.display = 'none';
}

function show(element) {
    document.getElementById(element).style.display = 'block';
}

/*
        <div id="autoUpdateStatus"></div>
        <div class="button-container">
            <button id="autoUpdateInhibit" onclick="autoUpdateInhibit()">Set Inhibited</button>
            <button id="autoUpdateAllow" onclick="autoUpdateAllow()">Set Allowed</button>
        </div>
        <br>
*/

function setAutoUpdateStatus(status) {
    document.getElementById("autoUpdateStatus").innerHTML = ""
    let stat = document.createElement("p")
    stat.innerHTML = status
    document.getElementById("autoUpdateStatus").appendChild(stat)
    show("autoUpdateStatus")
}

async function checkAutoUpdateStatus() {
    hide("autoUpdateStatus")
    hide("autoUpdateInhibit")
    hide("autoUpdateAllow")
    var res = await fetch("/api/mods/AutoUpdate/isSelfMadeBuild")
    var str = await res.text() 
    if (str.includes("true")) {
        setAutoUpdateStatus("This is a self-made build. This build cannot auto-update.")
    } else {
        res = await fetch("/api/mods/AutoUpdate/isInhibitedByUser")
        str = await res.text() 
        if (str.includes("true")) {
            setAutoUpdateStatus("Auto-updates: not enabled")
            show("autoUpdateAllow")
        } else {
            setAutoUpdateStatus("Auto-updates: enabled")
            show("autoUpdateInhibit")
        }
    }
}

async function autoUpdateInhibit() {
    hide("autoUpdateStatus")
    hide("autoUpdateInhibit")
    hide("autoUpdateAllow")
    await fetch("/api/mods/AutoUpdate/setInhibited")
    checkAutoUpdateStatus()
}

async function autoUpdateAllow() {
    hide("autoUpdateStatus")
    hide("autoUpdateInhibit")
    hide("autoUpdateAllow")
    await fetch("/api/mods/AutoUpdate/setAllowed")
    checkAutoUpdateStatus()
}

function setWakeStatus(status) {
    document.getElementById("wakeWordStatus").innerHTML = ""
    let stat = document.createElement("p")
    stat.innerHTML = status
    document.getElementById("wakeWordStatus").appendChild(stat)
}

let recIndex = 0

async function genWakeWord() {
    var keyword = document.getElementById("keyword").value
    setWakeStatus("Generating wake word...")
    hide("genWakeWord")
    hide("keyword")
    hide("revertDefaultWakeWord")
    hide("keywordLabel")
    try {
        const res = await fetch("/api/mods/wakeword-pv/request-model?keyword=" + keyword)
        if (!res.ok) {
            const err = await res.json()  // { status, message }
            setWakeStatus(`${err.status}: ${err.message}`)
        } else {
            setWakeStatus("Wake word generated and installed. Restarting anki programs...")
            await RestartVic()
            setWakeStatus("Your new wake word is now implemented.")
        }
    } catch (e) {
        setWakeStatus(`network error: ${e.message}`)
    } finally {
        show("keyword")
        show("genWakeWord")
        show("revertDefaultWakeWord")
        show("keywordLabel")
    }
}

async function revertDefaultWakeWord() {
    setWakeStatus("Deleting wake word...")
    hide("genWakeWord")
    hide("keyword")
    hide("revertDefaultWakeWord")
    hide("keywordLabel")
    await fetch("/api/mods/wakeword-pv/delete-model")
    setWakeStatus("Custom model deleted. Restarting Anki programs...")
    await RestartVic()
    setWakeStatus("Custom model deleted.")
    show("genWakeWord")
    show("keyword")
    show("keywordLabel")
    show("revertDefaultWakeWord")
}


async function CheckIfRestartNeeded(mod) {
    let response = await fetch('/api/mods/needsrestart/' + mod, {
        method: 'POST',
    });
    let data = await response.text()
    if (data.includes("true")) {
        document.getElementById('restartNeeded').style.display = 'block';
    }
}

async function RestartVic() {
    SetModStatus("")
    hide("cww")
    hide("aud")
    hide("mainmods")
    document.getElementById("restartButton").disabled = true
    document.getElementById('showDuringVicRestart').style.display = 'block';;
    document.getElementById('mods').style.display = 'none';
    fetch('/api/restartvic', {
        method: 'POST',
    }).then(response => { console.log(response); document.getElementById("restartButton").disabled = false; show("cww"); show("aud"); show("mainmods"); document.getElementById('restartNeeded').style.display = 'none'; document.getElementById('showDuringVicRestart').style.display = 'none'; document.getElementById('mods').style.display = 'block'; })
}

async function BootAnim_Test() {
    document.getElementById('mods').style.display = 'none';
    SetModStatus("Will show boot animation on screen for 10 seconds...")
    let response = await fetch('/api/mods/custom/TestBootAnim', {
        method: 'POST',
    });
    let data = await response.json();
    if (data.status == "success") {
        document.getElementById('mods').style.display = 'block';
        SetModStatus("")
    } else {
        document.getElementById('mods').style.display = 'block';
        SetModStatus("TestBootAnim error: " + data.message)
    }
    return data;
}

function bootAnimCheckValidate() {
    let checkbox = document.getElementById('bootAnimDefault');
    let divUpload = document.getElementById('bootAnimUploadHide');

    if (checkbox.checked == true) {
        divUpload.style.display = "none";
        document.getElementById('bootAnimCurrent').style.display = "none";
    } else {
        divUpload.style.display = "block";
        document.getElementById('bootAnimCurrent').style.display = "block";
    }
}

async function BootAnim_Submit() {
    let checkbox = document.getElementById('bootAnimDefault');
    let inputFile = document.getElementById('bootAnimUpload');
    let gifData = "";

    if (checkbox.checked == false && inputFile.files.length > 0) {
        let file = inputFile.files[0];
        gifData = await new Promise((resolve) => {
            let reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result.split(',')[1]);
            reader.readAsDataURL(file);
        });
    }

    let json = `{"default": ${checkbox.checked}, "gifdata": "${gifData}"}`;
    let banimresp = await SendJSON('BootAnim', json);
    if (banimresp == "error") {
        alert(banimresp)
    }
}






