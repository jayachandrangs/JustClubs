function PlayerAllocation() {
    const PlayDayConfig = JSON.parse(localStorage.getItem("PlayDayConfig"));
    // convert to integer
    const nsession = parseInt(PlayDayConfig.nsession);

    for (let SessionID = 1; SessionID <= nsession; SessionID++) {
        let sessionNum = `S${SessionID}`;
        const sessionType = PlayDayConfig[sessionNum];
        switch (sessionType) {
            case "Basic1": Simple1(SessionID); break;
            case "Basic2": Simple2(SessionID); break;
            case "Basic3": Simple3(SessionID); break;
            case "Basic4": Simple4(SessionID); break;
            case "MixedDiv1": MixedDiv1(SessionID); break;
            case "MixedDiv2": MixedDiv2(SessionID); break;
            case "MixedDiv3": MixedDiv3(SessionID); break;
            case "MixedDiv4": MixedDiv4(SessionID); break;
            default: console.log(`Unknown session type: ${sessionType}`);
        }
    }
}

function goToPage(url) {
    window.location.href = url;  // Basic navigation
}

function Simple1(SessionID) {
    allocatePlayers(SessionID, 'Primary_Division', 'highest');
}

function Simple2(SessionID) {
    allocatePlayersReverse(SessionID, 'Primary_Division', 'lowest');
}

function Simple3(SessionID) {
    allocatePlayers(SessionID, 'Secondary_Division', 'highest');
}

function Simple4(SessionID) {
    allocatePlayersReverse(SessionID, 'Secondary_Division', 'lowest');
}

function MixedDiv1(SessionID) {
    let PlayingToday = JSON.parse(localStorage.getItem("PlayingToday"));
    const PlayDayConfig = JSON.parse(localStorage.getItem("PlayDayConfig"));

    initializeAllocation(PlayingToday);
    const { actualcourts, resting } = calculateCourts(PlayingToday, PlayDayConfig);

    PlayingToday.sort((a, b) => sortPlayersMixed(a, b));

    const restedPlayers = allocateRestingPlayers(PlayingToday, resting);
    localStorage.setItem(`Session_${SessionID}_RestedPlayers`, JSON.stringify(restedPlayers));

    const sessionAllocation = [];
    for (let courtId = 1; courtId <= actualcourts; courtId++) {
        const courtPrefix = `Court${courtId}`;
        const courtAllocation = {};
        let availablePlayers = PlayingToday.filter(p => p.alloted === 0);

        // Allocate Player 1 and 2 (highest division)
        for (let i = 1; i <= 2; i++) {
            if (availablePlayers.length > 0) {
                let maxDivision = Math.max(...availablePlayers.map(p => parseFloat(p.Primary_Division)));
                let eligiblePlayers = availablePlayers.filter(p => parseFloat(p.Primary_Division) === maxDivision);
                let selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
                courtAllocation[`${courtPrefix}P${i}`] = selectedPlayer.name;
                selectedPlayer.alloted = 1;
                selectedPlayer.played = (selectedPlayer.played || 0) + 1;
                availablePlayers = availablePlayers.filter(p => p !== selectedPlayer);
            } else {
                courtAllocation[`${courtPrefix}P${i}`] = "No player available";
            }
        }

        // Allocate Player 3 and 4 (lower division)
        let targetDivision = courtAllocation[`${courtPrefix}P1`] !== "No player available" 
            ? parseFloat(PlayingToday.find(p => p.name === courtAllocation[`${courtPrefix}P1`]).Primary_Division)
            : Math.max(...availablePlayers.map(p => parseFloat(p.Primary_Division)));

        for (let i = 3; i <= 4; i++) {
            if (availablePlayers.length > 0) {
                let eligiblePlayers = [];
                for (let diff of [1.5, 1, 0.5, 0]) {
                    eligiblePlayers = availablePlayers.filter(p => parseFloat(p.Primary_Division) === targetDivision - diff);
                    if (eligiblePlayers.length > 0) break;
                }
                if (eligiblePlayers.length === 0) {
                    const maxDivision = Math.max(...availablePlayers.map(p => 
                      parseFloat(p.Primary_Division)
                    ));
                    eligiblePlayers = availablePlayers.filter(p => 
                      parseFloat(p.Primary_Division) === maxDivision
                    );
                }
                let selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
                courtAllocation[`${courtPrefix}P${i}`] = selectedPlayer.name;
                selectedPlayer.alloted = 1;
                selectedPlayer.played = (selectedPlayer.played || 0) + 1;
                availablePlayers = availablePlayers.filter(p => p !== selectedPlayer);
            } else {
                courtAllocation[`${courtPrefix}P${i}`] = "No player available";
            }
        }

        sessionAllocation.push(Object.values(courtAllocation));
    }

    // Update localStorage with the modified PlayingToday array
    localStorage.setItem("PlayingToday", JSON.stringify(PlayingToday));

    storeAndPrintAllocation(SessionID, sessionAllocation, PlayDayConfig);
}


function MixedDiv2(SessionID) {
    let PlayingToday = JSON.parse(localStorage.getItem("PlayingToday"));
    const PlayDayConfig = JSON.parse(localStorage.getItem("PlayDayConfig"));

    initializeAllocation(PlayingToday);
    const { actualcourts, resting } = calculateCourts(PlayingToday, PlayDayConfig);

    PlayingToday.sort((a, b) => sortPlayersMixed(a, b));

    const restedPlayers = allocateRestingPlayers(PlayingToday, resting);
    localStorage.setItem(`Session_${SessionID}_RestedPlayers`, JSON.stringify(restedPlayers));

    const sessionAllocation = [];
    for (let courtId = 1; courtId <= actualcourts; courtId++) {
        const courtPrefix = `Court${courtId}`;
        const courtAllocation = {};
        let availablePlayers = PlayingToday.filter(p => p.alloted === 0);

        // Allocate Player 1 and 2 (lowest division)
        for (let i = 1; i <= 2; i++) {
            if (availablePlayers.length > 0) {
                let minDivision = Math.min(...availablePlayers.map(p => parseFloat(p.Primary_Division)));
                let eligiblePlayers = availablePlayers.filter(p => parseFloat(p.Primary_Division) === minDivision);
                let selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
                courtAllocation[`${courtPrefix}P${i}`] = selectedPlayer.name;
                selectedPlayer.alloted = 1;
                selectedPlayer.played = (selectedPlayer.played || 0) + 1;
                availablePlayers = availablePlayers.filter(p => p !== selectedPlayer);
            } else {
                courtAllocation[`${courtPrefix}P${i}`] = "No player available";
            }
        }

        // Allocate Player 3 and 4 (higher division)
        let targetDivision = courtAllocation[`${courtPrefix}P1`] !== "No player available" 
            ? parseFloat(PlayingToday.find(p => p.name === courtAllocation[`${courtPrefix}P1`]).Primary_Division)
            : Math.min(...availablePlayers.map(p => parseFloat(p.Primary_Division)));

        for (let i = 3; i <= 4; i++) {
            if (availablePlayers.length > 0) {
                let eligiblePlayers = [];
                for (let diff of [1.5, 1, 0.5, 0]) {
                    eligiblePlayers = availablePlayers.filter(p => parseFloat(p.Primary_Division) === targetDivision + diff);
                    if (eligiblePlayers.length > 0) break;
                }
                if (eligiblePlayers.length === 0) {
                    const minDivision = Math.min(...availablePlayers.map(p => 
                      parseFloat(p.Primary_Division)
                    ));
                    eligiblePlayers = availablePlayers.filter(p => 
                      parseFloat(p.Primary_Division) === minDivision
                    );
                }
                let selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
                courtAllocation[`${courtPrefix}P${i}`] = selectedPlayer.name;
                selectedPlayer.alloted = 1;
                selectedPlayer.played = (selectedPlayer.played || 0) + 1;
                availablePlayers = availablePlayers.filter(p => p !== selectedPlayer);
            } else {
                courtAllocation[`${courtPrefix}P${i}`] = "No player available";
            }
        }

        sessionAllocation.push(Object.values(courtAllocation));
    }

    localStorage.setItem("PlayingToday", JSON.stringify(PlayingToday));
    storeAndPrintAllocation(SessionID, sessionAllocation, PlayDayConfig);
}

function MixedDiv3(SessionID) {
    let PlayingToday = JSON.parse(localStorage.getItem("PlayingToday"));
    const PlayDayConfig = JSON.parse(localStorage.getItem("PlayDayConfig"));

    initializeAllocation(PlayingToday);
    const { actualcourts, resting } = calculateCourts(PlayingToday, PlayDayConfig);

    PlayingToday.sort((a, b) => sortPlayersMixed(a, b));

    const restedPlayers = allocateRestingPlayers(PlayingToday, resting);
    localStorage.setItem(`Session_${SessionID}_RestedPlayers`, JSON.stringify(restedPlayers));

    const sessionAllocation = [];
    for (let courtId = 1; courtId <= actualcourts; courtId++) {
        const courtPrefix = `Court${courtId}`;
        const courtAllocation = {};
        let availablePlayers = PlayingToday.filter(p => p.alloted === 0);

        // Allocate Player 1 and 2 (highest division)
        for (let i = 1; i <= 2; i++) {
            if (availablePlayers.length > 0) {
                let maxDivision = Math.max(...availablePlayers.map(p => parseFloat(p.Primary_Division)));
                let eligiblePlayers = availablePlayers.filter(p => parseFloat(p.Primary_Division) === maxDivision);
                let selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
                courtAllocation[`${courtPrefix}P${i}`] = selectedPlayer.name;
                selectedPlayer.alloted = 1;
                selectedPlayer.played = (selectedPlayer.played || 0) + 1;
                availablePlayers = availablePlayers.filter(p => p !== selectedPlayer);
            } else {
                courtAllocation[`${courtPrefix}P${i}`] = "No player available";
            }
        }

        // Allocate Player 3 and 4 (lower division)
        let targetDivision = courtAllocation[`${courtPrefix}P1`] !== "No player available" 
            ? parseFloat(PlayingToday.find(p => p.name === courtAllocation[`${courtPrefix}P1`]).Primary_Division)
            : Math.max(...availablePlayers.map(p => parseFloat(p.Secondary_Division)));

        for (let i = 3; i <= 4; i++) {
            if (availablePlayers.length > 0) {
                let eligiblePlayers = [];
                for (let diff of [1.5, 1, 0.5, 0]) {
                    eligiblePlayers = availablePlayers.filter(p => parseFloat(p.Secondary_Division) === targetDivision - diff);
                    if (eligiblePlayers.length > 0) break;
                }
                if (eligiblePlayers.length === 0) {
                    const maxDivision = Math.max(...availablePlayers.map(p => 
                      parseFloat(p.Secondary_Division)
                    ));
                    eligiblePlayers = availablePlayers.filter(p => 
                      parseFloat(p.Secondary_Division) === maxDivision
                    );
                }
                let selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
                courtAllocation[`${courtPrefix}P${i}`] = selectedPlayer.name;
                selectedPlayer.alloted = 1;
                selectedPlayer.played = (selectedPlayer.played || 0) + 1;
                availablePlayers = availablePlayers.filter(p => p !== selectedPlayer);
            } else {
                courtAllocation[`${courtPrefix}P${i}`] = "No player available";
            }
        }

        sessionAllocation.push(Object.values(courtAllocation));
    }

    localStorage.setItem("PlayingToday", JSON.stringify(PlayingToday));
    storeAndPrintAllocation(SessionID, sessionAllocation, PlayDayConfig);
}

function MixedDiv4(SessionID) {
    let PlayingToday = JSON.parse(localStorage.getItem("PlayingToday"));
    const PlayDayConfig = JSON.parse(localStorage.getItem("PlayDayConfig"));

    initializeAllocation(PlayingToday);
    const { actualcourts, resting } = calculateCourts(PlayingToday, PlayDayConfig);

    PlayingToday.sort((a, b) => sortPlayersMixed(a, b));

    const restedPlayers = allocateRestingPlayers(PlayingToday, resting);
    localStorage.setItem(`Session_${SessionID}_RestedPlayers`, JSON.stringify(restedPlayers));

    const sessionAllocation = [];
    for (let courtId = 1; courtId <= actualcourts; courtId++) {
        const courtPrefix = `Court${courtId}`;
        const courtAllocation = {};
        let availablePlayers = PlayingToday.filter(p => p.alloted === 0);

        // Allocate Player 1 and 2 (lowest division)
        for (let i = 1; i <= 2; i++) {
            if (availablePlayers.length > 0) {
                let minDivision = Math.min(...availablePlayers.map(p => parseFloat(p.Secondary_Division)));
                let eligiblePlayers = availablePlayers.filter(p => parseFloat(p.Secondary_Division) === minDivision);
                let selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
                courtAllocation[`${courtPrefix}P${i}`] = selectedPlayer.name;
                selectedPlayer.alloted = 1;
                selectedPlayer.played = (selectedPlayer.played || 0) + 1;
                availablePlayers = availablePlayers.filter(p => p !== selectedPlayer);
            } else {
                courtAllocation[`${courtPrefix}P${i}`] = "No player available";
            }
        }

        // Allocate Player 3 and 4 (higher division)
        let targetDivision = courtAllocation[`${courtPrefix}P1`] !== "No player available" 
            ? parseFloat(PlayingToday.find(p => p.name === courtAllocation[`${courtPrefix}P1`]).Secondary_Division)
            : Math.min(...availablePlayers.map(p => parseFloat(p.Secondary_Division)));

        for (let i = 3; i <= 4; i++) {
            if (availablePlayers.length > 0) {
                let eligiblePlayers = [];
                for (let diff of [1.5, 1, 0.5, 0]) {
                    eligiblePlayers = availablePlayers.filter(p => parseFloat(p.Secondary_Division) === targetDivision + diff);
                    if (eligiblePlayers.length > 0) break;
                }
                if (eligiblePlayers.length === 0) {
                    const minDivision = Math.min(...availablePlayers.map(p => 
                      parseFloat(p.Secondary_Division)
                    ));
                    eligiblePlayers = availablePlayers.filter(p => 
                      parseFloat(p.Secondary_Division) === minDivision
                    );
                }
                let selectedPlayer = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
                courtAllocation[`${courtPrefix}P${i}`] = selectedPlayer.name;
                selectedPlayer.alloted = 1;
                selectedPlayer.played = (selectedPlayer.played || 0) + 1;
                availablePlayers = availablePlayers.filter(p => p !== selectedPlayer);
            } else {
                courtAllocation[`${courtPrefix}P${i}`] = "No player available";
            }
        }

        sessionAllocation.push(Object.values(courtAllocation));
    }

    localStorage.setItem("PlayingToday", JSON.stringify(PlayingToday));
    storeAndPrintAllocation(SessionID, sessionAllocation, PlayDayConfig);
}

function allocatePlayers(SessionID, divisionType, selectionType) {
    const PlayingToday = JSON.parse(localStorage.getItem("PlayingToday"));
    const PlayDayConfig = JSON.parse(localStorage.getItem("PlayDayConfig"));

    initializeAllocation(PlayingToday);
    const { actualcourts, resting } = calculateCourts(PlayingToday, PlayDayConfig);

    PlayingToday.sort((a, b) => sortPlayers(a, b));

    const restedPlayers = allocateRestingPlayers(PlayingToday, resting);
    localStorage.setItem(`Session_${SessionID}_RestedPlayers`, JSON.stringify(restedPlayers));

    const sessionAllocation = [];
    for (let courtId = 1; courtId <= actualcourts; courtId++) {
        const courtAllocation = [];
        for (let i = 0; i < 4; i++) {
         const playerName = selectPlayer(PlayingToday, divisionType, selectionType);
         if (playerName) {
             courtAllocation.push(playerName);
         } else {
             console.log("No player selected");
         }
        }
        sessionAllocation.push(courtAllocation);
    }

    storeAndPrintAllocation(SessionID, sessionAllocation, PlayDayConfig);
}

function allocatePlayersReverse(SessionID, divisionType, selectionType) {
    const PlayingToday = JSON.parse(localStorage.getItem("PlayingToday"));
    const PlayDayConfig = JSON.parse(localStorage.getItem("PlayDayConfig"));

    initializeAllocation(PlayingToday);
    const { actualcourts, resting } = calculateCourts(PlayingToday, PlayDayConfig);

    PlayingToday.sort((a, b) => sortPlayers(a, b));

    const restedPlayers = allocateRestingPlayers(PlayingToday, resting);
    localStorage.setItem(`Session_${SessionID}_RestedPlayers`, JSON.stringify(restedPlayers));

    const sessionAllocation = [];
    for (let courtId = 1; courtId <= actualcourts; courtId++) {
        const courtAllocation = [];
        for (let i = 0; i < 4; i++) {
         const playerName = selectPlayerReverse(PlayingToday, divisionType, selectionType);
         if (playerName) {
             courtAllocation.push(playerName);
         } else {
             console.log("No player selected");
         }
        }
        sessionAllocation.push(courtAllocation);
    }

    storeAndPrintAllocation(SessionID, sessionAllocation, PlayDayConfig);
}


function initializeAllocation(PlayingToday) {
    PlayingToday.forEach(player => player.alloted = 0);
}

function calculateCourts(PlayingToday, PlayDayConfig) {
    const nplayers = PlayingToday.length;
    const courtbasedonplayer = Math.floor(nplayers / 4);
    const actualcourts = Math.min(PlayDayConfig.ncourts, courtbasedonplayer);
    const playing = actualcourts * 4;
    const resting = nplayers - playing;
    return { actualcourts, resting };
}

function sortPlayers(a, b) {
    if (a.rested !== b.rested) return a.rested - b.rested;
    if (a.played !== b.played) return b.played - a.played;
    return b.number - a.number;
}

function sortPlayersMixed(a, b) {
    if (a.rested !== b.rested) return a.rested - b.rested;
    if (b.rested !== a.rested) return b.rested - a.rested;
    return b.number - a.number;
}

function allocateRestingPlayers(PlayingToday, resting) {
    const restedPlayers = [];
    for (let i = 0; i < resting; i++) {
        const player = PlayingToday[i];
        player.alloted = 2;
        player.rested++;
        restedPlayers.push(player.name);
        updatePlayerInLocalStorage(player);
    }
    return restedPlayers;
}

function selectPlayer(PlayingToday, divisionType, selectionType) {
    console.log("Function called with divisionType:", divisionType);
    console.log("PlayingToday length:", PlayingToday.length);
    
    const availablePlayers = PlayingToday.filter(p => p.alloted === 0);
    console.log("Available players:", availablePlayers.length);

    if (availablePlayers.length === 0) {
        console.log("No available players");
        return null;
    }

    const validPlayers = availablePlayers.filter(p => {
        const divisionProperty = Object.keys(p).find(key => key.toLowerCase() === divisionType.toLowerCase());
        if (!divisionProperty) {
            console.log(`Division property not found for player ${p.Player}`);
            return false;
        }
        const divValue = parseFloat(p[divisionProperty]);
        console.log(`Player ${p.Player}, ${divisionProperty}: ${p[divisionProperty]}, parsed: ${divValue}`);
        return !isNaN(divValue);
    });
    console.log("Valid players (with numeric division):", validPlayers.length);

    if (validPlayers.length === 0) {
        console.log(`No players with valid numeric ${divisionType}`);
        return null;
    }

    let maxDivision = Math.max(...validPlayers.map(p => parseFloat(p[divisionType])));
    console.log("Max division:", maxDivision);

    let eligiblePlayers = validPlayers.filter(p => parseFloat(p[divisionType]) === maxDivision);
    console.log("Eligible players:", eligiblePlayers.length);

    if (eligiblePlayers.length === 0) {
        console.log("No eligible players found");
        return null;
    }

    let player = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
    
    if (player) {
        console.log("Selected player:", player.Player);
        player.alloted = 1;
        player.played++;
        updatePlayerInLocalStorage(player);
        console.log("Returning player:", player.Player);
        return player.Player;
    } else {
        console.log("Failed to select a player");
        return null;
    }
}

function selectPlayerReverse(PlayingToday, divisionType, selectionType) {
    console.log("Function called with divisionType:", divisionType);
    console.log("PlayingToday length:", PlayingToday.length);
    
    const availablePlayers = PlayingToday.filter(p => p.alloted === 0);
    console.log("Available players:", availablePlayers.length);

    if (availablePlayers.length === 0) {
        console.log("No available players");
        return null;
    }

    const validPlayers = availablePlayers.filter(p => {
        const divisionProperty = Object.keys(p).find(key => key.toLowerCase() === divisionType.toLowerCase());
        if (!divisionProperty) {
            console.log(`Division property not found for player ${p.Player}`);
            return false;
        }
        const divValue = parseFloat(p[divisionProperty]);
        console.log(`Player ${p.Player}, ${divisionProperty}: ${p[divisionProperty]}, parsed: ${divValue}`);
        return !isNaN(divValue);
    });
    console.log("Valid players (with numeric division):", validPlayers.length);

    if (validPlayers.length === 0) {
        console.log(`No players with valid numeric ${divisionType}`);
        return null;
    }

    let minDivision = Math.min(...validPlayers.map(p => parseFloat(p[divisionType])));
    console.log("Min division:", minDivision);

    let eligiblePlayers = validPlayers.filter(p => parseFloat(p[divisionType]) === minDivision);
    console.log("Eligible players:", eligiblePlayers.length);

    if (eligiblePlayers.length === 0) {
        console.log("No eligible players found");
        return null;
    }

    let player = eligiblePlayers[Math.floor(Math.random() * eligiblePlayers.length)];
    
    if (player) {
        console.log("Selected player:", player.Player);
        player.alloted = 1;
        player.played++;
        updatePlayerInLocalStorage(player);
        console.log("Returning player:", player.Player);
        return player.Player;
    } else {
        console.log("Failed to select a player");
        return null;
    }
}

function updatePlayerInLocalStorage(player) {
    const PlayingToday = JSON.parse(localStorage.getItem("PlayingToday"));
    const index = PlayingToday.findIndex(p => p.name === player.name);
    if (index !== -1) {
        PlayingToday[index] = player;
        localStorage.setItem("PlayingToday", JSON.stringify(PlayingToday));
    }
}

function storeAndPrintAllocation(SessionID, sessionAllocation, PlayDayConfig) {
    localStorage.setItem(`Session_${SessionID}`, JSON.stringify(sessionAllocation));
    console.log(`Session: ${SessionID}`);
    
    // Print court allocations
    sessionAllocation.forEach((court, index) => {
        console.log(`Court ${PlayDayConfig.courts[index]}: ${court.join(', ')}`);
    });
    
    // Print rested players
    const restedPlayers = JSON.parse(localStorage.getItem(`Session_${SessionID}_RestedPlayers`));
    console.log(`Rested Players: ${restedPlayers.join(', ')}`);

    // Update HTML output if needed
    const outputElement = document.getElementById('output');
    if (outputElement) {
        outputElement.innerHTML += `<h3>Session: ${SessionID}</h3>`;
        sessionAllocation.forEach((court, index) => {
            outputElement.innerHTML += `<p>Court ${PlayDayConfig.courts[index]}: ${court.join(', ')}</p>`;
        });
        outputElement.innerHTML += `<p>Rested Players: ${restedPlayers.join(', ')}</p>`;
    }
}

// Expose the runAllocation function to the global scope
window.PlayerAllocation = PlayerAllocation;
document.addEventListener('DOMContentLoaded', PlayerAllocation);
