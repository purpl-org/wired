const tabs = document.querySelectorAll('.tabs button');
tabs.forEach(btn => btn.addEventListener('click', () => {
    tabs.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelector(btn.dataset.target).classList.add('active');
}));

function hide(id) { document.getElementById(id).style.display = 'none'; }
function show(id) { document.getElementById(id).style.display = 'block'; }

async function GetCurrent(mod) {
    let res = await fetch(`/api/mods/${mod}/get`);
    return res.text();
}

function SetModStatus(msg) {
    const div = document.getElementById('modStatus');
    div.innerHTML = `<h3>${msg}</h3>`;
    div.style.display = msg ? 'block' : 'none';
}

function HideModStatus() { hide('modStatus'); }

async function UpdateAllMods() {
    hide('restartNeeded');
    hide('showDuringVicRestart');

    const data = await GetCurrent('FreqChange');
    document.getElementsByName('frequency')
        .forEach(rb => { if (rb.value == data) rb.checked = true; });
    checkAutoUpdateStatus();
    setSensitivity();
    getTimezone()
    getLocation()
    getTempUnits()
}

async function FreqChange_Submit() {
    hide('mods');
    SetModStatus('FreqChange is applying, please wait...');
    const freq = document.querySelector('input[name="frequency"]:checked').value;
    try {
        const res = await fetch(`/api/mods/FreqChange/set?freq=${freq}`);
        if (!res.ok) {
            const e = await res.json();
            SetModStatus(`FreqChange failed: ${e.message}`);
        } else {
            HideModStatus();
        }
    } catch {
        SetModStatus('FreqChange failed.');
    } finally {
        show('mods');
    }
}

async function setAutoUpdateStatus(status) {
    const el = document.getElementById('autoUpdateStatus');
    el.innerHTML = `<p>${status}</p>`;
    show('autoUpdateStatus');
}

async function checkAutoUpdateStatus() {
    ['autoUpdateStatus', 'autoUpdateInhibit', 'autoUpdateAllow'].forEach(hide);
    let res = await fetch('/api/mods/AutoUpdate/isSelfMadeBuild');
    let txt = await res.text();
    if (txt.includes('true')) {
        setAutoUpdateStatus('This is a self-made build. This build cannot auto-update.');
    } else {
        res = await fetch('/api/mods/AutoUpdate/isInhibitedByUser');
        txt = await res.text();
        if (txt.includes('true')) {
            setAutoUpdateStatus('Auto-updates: not enabled');
            show('autoUpdateAllow');
        } else {
            setAutoUpdateStatus('Auto-updates: enabled');
            show('autoUpdateInhibit');
        }
    }
}

async function autoUpdateInhibit() {
    ['autoUpdateStatus', 'autoUpdateInhibit', 'autoUpdateAllow'].forEach(hide);
    await fetch('/api/mods/AutoUpdate/setInhibited');
    checkAutoUpdateStatus();
}
async function autoUpdateAllow() {
    ['autoUpdateStatus', 'autoUpdateInhibit', 'autoUpdateAllow'].forEach(hide);
    await fetch('/api/mods/AutoUpdate/setAllowed');
    checkAutoUpdateStatus();
}

function setWakeStatus(status) {
    const el = document.getElementById('wakeWordStatus');
    el.innerHTML = `<p>${status}</p>`;
}

async function genWakeWord() {
    const kw = document.getElementById('keyword').value;
    setWakeStatus('Generating wake word...');
    //['genWakeWord', 'keyword', 'revertDefaultWakeWord', 'keywordLabel'].forEach(hide);
    try {
        const res = await fetch(`/api/mods/WakeWordPV/request-model?keyword=${kw}`);
        if (!res.ok) {
            const e = await res.json();
            setWakeStatus(`${e.status}: ${e.message}`);
        } else {
            setWakeStatus('Wake word generated and installed. Restarting...');
            await RestartVic();
            setWakeStatus('Your new wake word is now implemented.');
        }
    } catch (e) {
        setWakeStatus(`network error: ${e.message}`);
    } finally {
        //['keyword', 'genWakeWord', 'revertDefaultWakeWord', 'keywordLabel'].forEach(show);
    }
}

function setJdocStatus(status) {
    const el = document.getElementById('jdocStatus');
    el.innerHTML = `<p>${status}</p>`;
}

async function setLocation() {
    const v = document.getElementById('location').value;
    setJdocStatus("Setting location...")
    try {
        const res = await fetch(`/api/mods/JdocSettings/setLocation?location=${v}`);
        if (!res.ok) {
            const e = await res.json();
            setJdocStatus(`${e.status}: ${e.message}`);
        } else {
            getLocation()
            setJdocStatus('Successfully set location.');
        }
    } catch (e) {
        setJdocStatus(`network error: ${e.message}`);
    }
}

async function setTimezone() {
    const v = document.getElementById('timezone').value;
    setJdocStatus("Setting time zone...")
    try {
        const res = await fetch(`/api/mods/JdocSettings/setTimezone?timezone=${v}`);
        if (!res.ok) {
            const e = await res.json();
            setJdocStatus(`${e.status}: ${e.message}`);
        } else {
            getTimezone()
            setJdocStatus('Successfully set time zone.');
        }
    } catch (e) {
        setJdocStatus(`network error: ${e.message}`);
    }
}

async function setTempUnits() {
    const v = document.getElementById('tUnits').value;
    setJdocStatus("Setting time zone...")
    try {
        const res = await fetch(`/api/mods/JdocSettings/setFahrenheit?t=${v}`);
        if (!res.ok) {
            const e = await res.json();
            setJdocStatus(`${e.status}: ${e.message}`);
        } else {
            getTimezone()
            setJdocStatus('Successfully set temp units.');
        }
    } catch (e) {
        setJdocStatus(`network error: ${e.message}`);
    }
}

async function getLocation() {
    try {
        const res = await fetch(`/api/mods/JdocSettings/getLocation`);
        if (!res.ok) {
            const e = await res.json();
            console.log(`${e.status}: ${e.message}`);
        } else {
            const e = await res.text();
            document.getElementById('location').value = e;
        }
    } catch (e) {
        console.log(`network error: ${e.message}`);
    }
}

async function getTimezone() {
    try {
        const res = await fetch(`/api/mods/JdocSettings/getTimezone`);
        if (!res.ok) {
            const e = await res.json();
            console.log(`${e.status}: ${e.message}`);
        } else {
            const e = await res.text();
            document.getElementById('timezone').value = e;
        }
    } catch (e) {
        console.log(`network error: ${e.message}`);
    }
}

async function getTempUnits() {
    try {
        const res = await fetch(`/api/mods/JdocSettings/getFahrenheit`);
        if (!res.ok) {
            const e = await res.json();
            console.log(`${e.status}: ${e.message}`);
        } else {
            const e = await res.text();
            document.getElementById('tUnits').value = e;
        }
    } catch (e) {
        console.log(`network error: ${e.message}`);
    }
}

async function revertDefaultWakeWord() {
    setWakeStatus('Deleting wake word...');
    // ['genWakeWord', 'keyword', 'revertDefaultWakeWord', 'keywordLabel'].forEach(hide);
    await fetch('/api/mods/WakeWordPV/delete-model');
    setWakeStatus('Custom model deleted. Restarting...');
    await RestartVic();
    setWakeStatus('Custom model deleted.');
    //['keyword', 'genWakeWord', 'keywordLabel', 'revertDefaultWakeWord'].forEach(show);
}

function validateSensitivity(val) { return !(isNaN(val) || val < 0.001 || val > 0.999); }
async function setSensitivity() {
    const sld = document.getElementById('sensitivitySlider');
    const inp = document.getElementById('sensitivityInput');
    let txt = await (await fetch('/api/mods/SensitivityPV/get')).text();
    const v = parseFloat(txt);
    sld.value = v;
    inp.value = v;
}
async function sendSensitivity() {
    const raw = document.getElementById('sensitivityInput').value;
    const v = parseFloat(raw);
    if (!validateSensitivity(v)) return alert('value must be between 0.001 and 0.999');
    await fetch(`/api/mods/SensitivityPV/set?value=${v}`);
    console.log('sensitivity set to', v);
    RestartVic();
}

async function RestartVic() {
    const tabsEl = document.querySelector('.tabs');
    const activePanel = document.querySelector('.tab-content.active');
    tabsEl.style.display = 'none';
    if (activePanel) activePanel.classList.remove('active');
    show('showDuringVicRestart');
    await fetch('/api/extra/restartvic', { method: 'POST' });
    hide('showDuringVicRestart');
    tabsEl.style.display = 'flex';
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = '');
    if (activePanel) activePanel.classList.add('active');
}


UpdateAllMods();