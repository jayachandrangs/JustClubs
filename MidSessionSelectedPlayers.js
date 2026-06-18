// MidSessionSelectedPlayers.js

// Utility function to go to another page
function goToPage(page) {
  window.location.href = page;
}

// Initialize required variables
const NUMPLAYERS = 100;
let TOTALPLAYERS = 0; // Initialize to 0
let UNSETNUMBERS = 0;
let REMOVALOT;
const UNSETNUM = Array(10).fill(0);
const playerInfo = {};
let isLoading = false;
let selectedDivisions = new Set();        // empty ⇒ no div filter

function getPlayerName(player) {
  return player.name || player.Player;
}

function getNextAvailablePlayerNumber(playingToday) {
  const usedNumbers = new Set(
    playingToday
      .map(player => Number(player.number))
      .filter(number => Number.isInteger(number) && number > 0)
  );

  for (let number = 1; number <= NUMPLAYERS; number++) {
    if (!usedNumbers.has(number)) {
      return number;
    }
  }

  return null;
}

function syncPlayDayNumberState(playDayConfig, playingToday) {
  const usedNumbers = playingToday
    .map(player => Number(player.number))
    .filter(number => Number.isInteger(number) && number > 0);
  const highestNumber = usedNumbers.length ? Math.max(...usedNumbers) : 0;
  const usedNumberSet = new Set(usedNumbers);

  playDayConfig.numberToAssign = highestNumber;
  playDayConfig.removedNumbers = [];

  for (let number = 1; number < highestNumber; number++) {
    if (!usedNumberSet.has(number)) {
      playDayConfig.removedNumbers.push(number);
    }
  }
}

// Load players from localStorage or prompt for upload if not available
async function loadPlayers() {
  if (isLoading) {
    // console.log("Already loading, please wait.");
    return;
  }
  isLoading = true;
  // console.log("Loading players...");
  const storedData = localStorage.getItem('clubmembers');
  if (storedData) {
    try {
      const players = JSON.parse(storedData);
      // console.log(`Loaded ${players.length} players from localStorage`);
      displayPlayers(players);
    } catch (error) {
      // console.error("Error parsing stored data:", error);
      // promptForCSVUpload();
    }
  } else {
    // console.log("No stored data found. Prompting for CSV upload.");
    // promptForCSVUpload();
  }
  isLoading = false;
}

// Toggle player number assignment
function togglePlayerNumber(playerName, playerDiv) {
  // console.log(`togglePlayerNumber called for player: ${playerName}`);

  const existingBubble = playerDiv.querySelector('.player-number');
  // console.log(`Existing bubble:`, existingBubble);
  if (existingBubble) {
    // console.log(`Removing existing bubble`);
    playerDiv.removeChild(existingBubble);
  }

  let playersData = JSON.parse(localStorage.getItem('clubmembers')) || [];
  // console.log(`playersData from localStorage:`, playersData);
  let playerIndex = playersData.findIndex(p => p.Player === playerName);
  // console.log(`playerIndex:`, playerIndex);

  let playDayConfig = JSON.parse(localStorage.getItem('PlayDayConfig')) || {};
  // console.log(`playDayConfig from localStorage:`, playDayConfig);
  if (!playDayConfig.removedNumbers) {
    // console.log(`Initializing playDayConfig.removedNumbers to []`);
    playDayConfig.removedNumbers = [];
  }

  let playingToday = JSON.parse(localStorage.getItem('PlayingToday')) || [];
  // console.log(`playingToday from localStorage:`, playingToday);

  // console.log(`playerInfo[${playerName}].number:`, playerInfo[playerName]?.number); // Use optional chaining

  if (playerInfo[playerName].number === null) {
    // console.log(`playerInfo[${playerName}].number is null - Assigning a number`);

    playingToday = playingToday.filter(player => getPlayerName(player) !== playerName);
    let numberToAssign = getNextAvailablePlayerNumber(playingToday);

    if (numberToAssign !== null) {
      // console.log(`Number ${numberToAssign} is within NUMPLAYERS limit`);
      playerInfo[playerName].number = numberToAssign;
      // console.log(`Assigned number ${numberToAssign} to playerInfo[${playerName}].number`);
      createNumberBubble(playerDiv, numberToAssign);

      if (playerIndex !== -1) {
        // console.log(`playerIndex is valid`);
        playersData[playerIndex].PlayingToday = numberToAssign;
        // console.log(`Set playersData[${playerIndex}].PlayingToday to ${numberToAssign}`);
        TOTALPLAYERS++;
        // console.log(`Incremented TOTALPLAYERS to ${TOTALPLAYERS}`);
        playersData[playerIndex].alloted = 2;  // SET alloted to 2 (initial assignment)
        // console.log(`SET playersData[${playerIndex}].alloted to 2`);
        if (playingToday.length > 0) {
          let lowestPlayed = Math.min(...playingToday.map(p => p.played || 0));
          let highestRested = Math.max(...playingToday.map(p => p.rested || 1));
          // NEW: Calculate number of players with alloted=2
          const allotedTwoCount = playingToday.filter(p => p.alloted === 2).length;
          playersData[playerIndex].played = allotedTwoCount === 0 
            ? (lowestPlayed - 1) 
            : lowestPlayed;
          playersData[playerIndex].rested = Math.max(1, highestRested);  //MODIFIED to make sure the value is never less than 1
          // console.log(`Updated played and rested values for player`);
        } else {
          playersData[playerIndex].played = 0;
          playersData[playerIndex].rested = 1;
          // console.log(`Initialized played and rested values for player`);
        }

        playingToday.push({
          ...playerInfo[playerName],
          name: playerName,
          number: numberToAssign,
          played: playersData[playerIndex].played,
          rested: playersData[playerIndex].rested,
          alloted: playersData[playerIndex].alloted
        });
        // console.log(`Added player to playingToday`);
      }
    } else {
      alert("All numbers are already allocated.");
      return;
    }
  } else {
    // console.log(`playerInfo[${playerName}].number is NOT null - Removing number`);

    // console.log(`Removing number: ${playerInfo[playerName].number}`);
    playerInfo[playerName].number = null;
    // console.log(`Set playerInfo[${playerName}].number to null`);

    if (playerIndex !== -1) {
      playersData[playerIndex].PlayingToday = 0;
      // console.log(`Set playersData[${playerIndex}].PlayingToday to 0`);
      TOTALPLAYERS--;
      // console.log(`Decremented TOTALPLAYERS to ${TOTALPLAYERS}`);
      playersData[playerIndex].alloted = 0;
      // console.log(`Decremented playersData[${playerIndex}].alloted to ${playersData[playerIndex].alloted}`);
      playingToday = playingToday.filter(player => getPlayerName(player) !== playerName);
      // console.log(`Removed player from playingToday`);
    }
  }

  syncPlayDayNumberState(playDayConfig, playingToday);
  localStorage.setItem('clubmembers', JSON.stringify(playersData));
  // console.log(`Updated clubmembers in localStorage:`, playersData);
  localStorage.setItem('PlayDayConfig', JSON.stringify(playDayConfig));
  // console.log(`Updated PlayDayConfig in localStorage:`, playDayConfig);
  localStorage.setItem('PlayingToday', JSON.stringify(playingToday));
  // console.log(`Updated PlayingToday in localStorage:`, playingToday);

  updateTotalPlayersDisplay();
  // console.log(`Finished togglePlayerNumber for player: ${playerName}`);
}


// Function to update the display of TOTALPLAYERS (if needed)
function updateTotalPlayersDisplay() {
  const totalPlayersElement = document.getElementById('totalPlayersDisplay');
  if (totalPlayersElement) {
    totalPlayersElement.textContent = `Total Players: ${TOTALPLAYERS}`;
  }
}

// Update playday configuration in local storage
function updatePlaydayConfig(totalPlayers) {
  let config = JSON.parse(localStorage.getItem('playdayconfig')) || {};
  config.TOTALPLAYERS = totalPlayers;
  localStorage.setItem('playdayconfig', JSON.stringify(config));
}

// Create number bubble for assigned players
function createNumberBubble(playerDiv, number) {
  const numberBubble = document.createElement('div');
  numberBubble.classList.add('player-number');
  numberBubble.innerText = number;
  playerDiv.appendChild(numberBubble);
}

// Reset players
function resetPlayers() {
  const playerButtonsDiv = document.getElementById('playerButtons');
  playerButtonsDiv.innerHTML = '';
  Object.keys(playerInfo).forEach(playerName => {
    playerInfo[playerName].number = null;
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('player-div');
    playerDiv.onclick = () => togglePlayerNumber(playerName, playerDiv);
    playerDiv.innerText = `${playerName} - ${playerInfo[playerName].Primary_Division}`;
    playerDiv.id = `player-${playerName.replace(/\s+/g, '-')}`;
    playerButtonsDiv.appendChild(playerDiv);
  });
  UNSETNUMBERS = 0;
  UNSETNUM.fill(0);
  // Update localStorage
  let playersData = JSON.parse(localStorage.getItem('clubmembers')) || [];
  playersData.forEach(player => {
    player.PlayingToday = 0; // Reset playingToday for all players
   // player.alloted = 0; // Reset alloted count for all players  <--- REMOVE or COMMENT THIS LINE
  });
  let playDayConfig = JSON.parse(localStorage.getItem('PlayDayConfig')) || {};
  playDayConfig.numberToAssign = 0;
  playDayConfig.removedNumbers = [];
  localStorage.setItem('clubmembers', JSON.stringify(playersData));
  localStorage.setItem('PlayingToday', JSON.stringify([]));
  localStorage.setItem('PlayDayConfig', JSON.stringify(playDayConfig));
  TOTALPLAYERS = 0;
  updateTotalPlayersDisplay();
}

// Confirm allocation and store in LocalStorage
function confirmAllocation() {
    window.location.href = 'ListPlayers.html';
}
// Create alphabet scroll bar
function createAlphabetScrollBar() {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const scrollBar = document.getElementById('alphabetScrollBar');
  
  for (let letter of alphabet) {
    const letterDiv = document.createElement('div');
    letterDiv.textContent = letter;
    letterDiv.classList.add('alphabet-letter');
    letterDiv.onclick = () => scrollToLetter(letter);
    scrollBar.appendChild(letterDiv);
  }
}

// Scroll to players starting with the selected letter
function scrollToLetter(letter) {
  const players = Array.from(document.getElementsByClassName('player-div'));
  const targetPlayer = players.find(player => player.textContent.trim().startsWith(letter));
  if (targetPlayer) {
    targetPlayer.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}


function filterPlayers(){
    const searchText = document.getElementById('searchBar').value.toLowerCase();
    const players    = document.getElementsByClassName('player-div');
    const separators = document.getElementsByClassName('alphabet-separator');

    let lastVisibleSeparator = null;

    for (let i = 0; i < players.length; i++){
        const pDiv      = players[i];
        const nameMatch = pDiv.dataset.name.startsWith(searchText);
        const voteMatch = !showOnlyVoted || +pDiv.dataset.team === 1;

        // division filter
        const divValue  = parseInt(pDiv.dataset.div, 10);
        const divMatch  = selectedDivisions.size === 0 || selectedDivisions.has(divValue);

        const visible   = nameMatch && voteMatch && divMatch;   // ← single declaration
        pDiv.style.display = visible ? '' : 'none';             // ← single assignment

        /* separator logic unchanged */
        if (i > 0 && separators[i - 1]) {
            separators[i - 1].style.display = visible
                 ? (lastVisibleSeparator !== separators[i - 1] ? '' : 'none')
                 : 'none';
            if (visible) lastVisibleSeparator = separators[i - 1];
        }
    }

    // hide trailing separator if nothing below it is visible
    if (lastVisibleSeparator &&
        lastVisibleSeparator === separators[separators.length - 1]) {

        let anyVisible = false;
        for (let i = separators.length - 1; i < players.length; i++){
            if (players[i].style.display !== 'none'){ anyVisible = true; break; }
        }
        if (!anyVisible) lastVisibleSeparator.style.display = 'none';
    }
}


// put the flag near your other globals
let showOnlyVoted = false;               // <-- 1  add back

document.addEventListener('DOMContentLoaded', () => {
  loadPlayers();                         // fill list
  createAlphabetScrollBar();             // A-Z bar

  // search box
  document.getElementById('searchBar')
          .addEventListener('input', filterPlayers);

  // voted-for-today toggle
  const voteBtn = document.getElementById('voteFilterBtn');   // <-- 2  declare
  if (voteBtn) {
      voteBtn.addEventListener('click', () => {
          showOnlyVoted = !showOnlyVoted;                      // flip ON/OFF
          console.log('showOnlyVoted now', showOnlyVoted);     // debug
          voteBtn.classList.toggle('active', showOnlyVoted);
          voteBtn.textContent = showOnlyVoted ? 'List all Players' : 'Voted for Today';
          filterPlayers();                                     // re-apply filter
      });
  }
});   // <-- 3  only ONE closing brace here

// division filter pills
document.querySelectorAll('.div-toggle-btn')
        .forEach(btn => btn.addEventListener('click', () => {
            const divNum = parseInt(btn.dataset.div, 10);

            // toggle membership in the Set
            if (selectedDivisions.has(divNum)) {
                selectedDivisions.delete(divNum);
                btn.classList.remove('active');
            } else {
                selectedDivisions.add(divNum);
                btn.classList.add('active');
            }
            filterPlayers();          // re-apply all filters
}));
	

function displayPlayers(players) {
  const playerListDiv = document.getElementById('playerList');
  playerListDiv.innerHTML = '';
  
  players.sort((a, b) => a.Player.localeCompare(b.Player));
  
  let currentLetter = '';
  
  players.forEach(player => {
    const firstLetter = player.Player.charAt(0).toUpperCase();
    
    if (firstLetter !== currentLetter) {
      currentLetter = firstLetter;
      const separatorDiv = document.createElement('div');
      separatorDiv.classList.add('alphabet-separator');
      separatorDiv.textContent = currentLetter;
      playerListDiv.appendChild(separatorDiv);
    }
    
    const playerDiv = document.createElement('div');
    playerDiv.classList.add('player-div');
    playerDiv.dataset.name = player.Player.toLowerCase();      // for search
    playerDiv.dataset.team = player.Team ?? 0;                 // Team field
    playerDiv.dataset.div = parseInt(player.Primary_Division ?? 0, 10);// ← NEW
    playerDiv.onclick = () => togglePlayerNumber(player.Player, playerDiv);
    // playerDiv.innerText = player.Player;
    playerDiv.innerText = `${player.Player}, ${player.Primary_Division || 'No Division'}`;
    playerDiv.id = `player-${player.Player.replace(/\s+/g, '-')}`;
    playerListDiv.appendChild(playerDiv);
    
    if (player.PlayingToday > 0) {
      createNumberBubble(playerDiv, player.PlayingToday);
      playerInfo[player.Player] = { ...player, number: player.PlayingToday };
    } else {
      playerInfo[player.Player] = { ...player, number: null };
    }
  });
  
  TOTALPLAYERS = players.filter(player => player.PlayingToday > 0).length;
  updateTotalPlayersDisplay();
}
