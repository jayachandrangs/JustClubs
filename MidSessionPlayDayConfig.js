let PlayDayConfig = JSON.parse(localStorage.getItem('PlayDayConfig')) || {
    courts: ['Court1', 'Court2', 'Court3', 'Court4', 'Court5', 'Court6'],
    ncourts: 6,
    pdb: '444rlist.csv',
    nsession: 5,
    sduration: 15,
    S1: 'Basic1',
    S2: 'Basic2',
    S3: 'MixedDiv1',
    S4: 'MixedDiv2',
    S5: 'Basic3',
    S6: 'Basic4',
    S7: 'MixedDiv3',
    S8: 'MixedDiv3',
    S9: 'Basic1',
    S10: 'Basic2',
    currentSession: 1,
    numberToAssign:0,
    winreload: 1,
};

let selectedCourts = PlayDayConfig.courts;
let ncourts = PlayDayConfig.ncourts;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize from PlayDayConfig
    let selectedCourts = PlayDayConfig.courts;
    let ncourts = PlayDayConfig.ncourts;
    // Rest of initialization
});

function updateNSession(select) {
    PlayDayConfig.nsession = select.value;
    updateConfig();
}

function updateSDuration(select) {
    PlayDayConfig.sduration = select.value;
    updateConfig();
}

function toggleCourt(court, courtName) {
    if (court.classList.contains('selected')) {
        court.classList.remove('selected');
        selectedCourts = selectedCourts.filter(c => c !== courtName);
        ncourts--;
    } else {
        court.classList.add('selected');
        if (!selectedCourts.includes(courtName)) {
            selectedCourts.push(courtName);
            ncourts++;
        }
    }

    PlayDayConfig.courts = selectedCourts;
    PlayDayConfig.ncourts = ncourts;
    sortCourts();
    updateConfig();
}

function updateSessionAllocation(select, session) {
    PlayDayConfig[session] = select.value;
    updateConfig();
}

async function commitChanges() {
    checkAndClearSessions();
    let playDayConfig = JSON.parse(localStorage.getItem('PlayDayConfig')) || {};
    playDayConfig.numberToAssign = 0;
    playDayConfig.currentSession = 0;
    localStorage.setItem('PlayDayConfig', JSON.stringify(playDayConfig));

    const csvUrl = "https://raw.githubusercontent.com/jayachandrangs/cbc/main/RiVi_playerlist.csv";
    try {
        const response = await fetch(csvUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const csvData = await response.text();
        processCSVData(csvData);
    } catch (error) {
        console.error("Error fetching CSV:", error);
        if (!navigator.onLine) {
            alert("No internet connection.");
        } else {
            alert("Error fetching file from the server. Please try again later.");
        }
    }
}

function processCSVData(csvData) {
    localStorage.removeItem('clubmembers');
    localStorage.removeItem('PlayingToday');
    const rows = csvData.split('\n');
    if (rows.length < 2) {
        alert('The CSV file does not contain valid data.');
        return;
    }

    const clubmembers = [];
    const headers = rows[0].split(',');
    console.log("CSV Headers:", headers);
    const requiredHeaders = ['Player', 'Gender', 'Primary_Division', 'Secondary_Division'];
    const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
    if (missingHeaders.length > 0) {
        alert('The CSV file is missing required fields: ' + missingHeaders.join(', ') + '.');
        return;
    }

    rows.forEach((row, index) => {
        if (index > 0) {
            const columns = row.split(',');
            console.log("Parsing row:", columns);
            if (columns.length < 4) {
                alert('The CSV file does not contain all required fields for player: ' + (columns[0] || "Unknown") + '.');
                return;
            }

            const player = {
                Player: columns[0],
                Gender: columns[1],
                Primary_Division: columns[2],
                Secondary_Division: columns[3],
                Team: columns[4] || '',
                FirstName: columns[5] || '',
                LastName: columns[6] || '',
                PlayingToday: 0,
                alloted: 0,
                rested: 0,
                played: 0,
                npgroup: 0,
                nsgroup: 0,
            };
            clubmembers.push(player);
        }
    });

    if (clubmembers.length > 0) {
        localStorage.setItem('clubmembers', JSON.stringify(clubmembers));
        alert('Changes committed successfully!');
        window.location.href = 'SelectedPlayers.html';
    } else {
        alert('No valid player data found in the CSV file.');
    }
}

function checkAndClearSessions() {
    const sessionKeys = [
        "Session_1", "Session_1_RestedPlayers",
        "Session_2", "Session_2_RestedPlayers",
        "Session_3", "Session_3_RestedPlayers",
        "Session_4", "Session_4_RestedPlayers",
        "Session_5", "Session_5_RestedPlayers",
        "Session_6", "Session_6_RestedPlayers",
        "Session_7", "Session_7_RestedPlayers",
        "Session_8", "Session_8_RestedPlayers",
        "Session_9", "Session_9_RestedPlayers",
        "Session_10", "Session_10_RestedPlayers",
        "playerDataForMPlay"
    ];
    sessionKeys.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
        }
    });

    const PlayDayConfig = JSON.parse(localStorage.getItem("PlayDayConfig"));
    if (PlayDayConfig) {
        PlayDayConfig.numberToAssign = 0;
        PlayDayConfig.removedNumbers = [];
        localStorage.setItem("PlayDayConfig", JSON.stringify(PlayDayConfig));
    }
}

function sortCourts() {
    PlayDayConfig.courts.sort();
    selectedCourts = PlayDayConfig.courts;
}

document.addEventListener('DOMContentLoaded', function() {
    loadValuesFromLocalStorage();

    const courts = document.querySelectorAll('.court');
    courts.forEach(court => {
        if(court){ //ADD THIS CHECK
            court.addEventListener('click', function() {
                toggleCourt(court, court.textContent);
            });
        }
    });

    const nsessionSelect = document.getElementById('nsession');
    if(nsessionSelect){ //ADD THIS CHECK
        nsessionSelect.addEventListener('change', function() {
            updateNSession(this);
        });
    }

    const sdurationSelect = document.getElementById('sduration');
    if(sdurationSelect){ //ADD THIS CHECK
        sdurationSelect.addEventListener('change', function() {
            updateSDuration(this);
        });
    }


    for (let i = 1; i <= 10; i++) {
        const sessionSelect = document.getElementById(`S${i}`);
         if(sessionSelect){ //ADD THIS CHECK
            sessionSelect.addEventListener('change', function() {
                updateSessionAllocation(this, `S${i}`);
            });
         }
    }

    const commitButton = document.getElementById('commit');
     if(commitButton){ //ADD THIS CHECK
        commitButton.addEventListener('click', commitChanges);
     }

    // Initialize ncourts and selectedCourts based on the DOM
    ncourts = PlayDayConfig.courts.length; // Initialize ncourts from PlayDayConfig
    selectedCourts = PlayDayConfig.courts; // Initialize selectedCourts from PlayDayConfig
    updateConfig(); // Save initial values to localStorage

});

function updateConfig() {
    localStorage.setItem('PlayDayConfig', JSON.stringify(PlayDayConfig));
}

function loadValuesFromLocalStorage() {
    const nsessionSelect = document.getElementById('nsession');
    const sdurationSelect = document.getElementById('sduration');

    if (PlayDayConfig.nsession) {
        nsessionSelect.value = PlayDayConfig.nsession;
    }

    if (PlayDayConfig.sduration) {
        sdurationSelect.value = PlayDayConfig.sduration;
    }

    for (let i = 1; i <= 10; i++) {
        const sessionKey = `S${i}`;
        if (PlayDayConfig[sessionKey]) {
            const sessionSelect = document.getElementById(sessionKey);
            if (sessionSelect) {
                sessionSelect.value = PlayDayConfig[sessionKey];
            }
        }
    }

    if (PlayDayConfig.courts) {
        const courtElements = document.querySelectorAll('.court');
        courtElements.forEach(courtElement => {
            const courtName = courtElement.textContent;
            if (PlayDayConfig.courts.includes(courtName)) {
                courtElement.classList.add('selected');
            } else {
                courtElement.classList.remove('selected');
            }
        });
    }
}
