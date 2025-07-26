document.addEventListener('DOMContentLoaded', function() {
    const playerList = document.getElementById('playerList');
    let sortedPlayers = JSON.parse(localStorage.getItem('PlayingToday')) || [];
    let clubMembers = JSON.parse(localStorage.getItem('clubmembers')) || [];
    let ROTATENUM = 0;
    const FREENUM = Array(15).fill(0);

    function createPlayerRow(player) {
        const row = document.createElement('div');
        row.className = 'player-row';
        const playerNameDiv = document.createElement('div');
        playerNameDiv.className = 'player-name';
        playerNameDiv.innerText = `${player.Player || 'Unknown Player'}`;
        const numberDiv = document.createElement('div');
        numberDiv.className = 'player-number';
        numberDiv.innerText = player.number !== null ? player.number : '';
        playerNameDiv.onclick = () => togglePlayerNumber(player);
        row.appendChild(playerNameDiv);
        row.appendChild(numberDiv);
        return row;
    }

    function renderPlayers() {
        sortedPlayers.sort((a, b) => (a.number || Infinity) - (b.number || Infinity));
        playerList.innerHTML = '';
        sortedPlayers.forEach(player => {
            playerList.appendChild(createPlayerRow(player));
        });
    }

    function togglePlayerNumber(player) {
        const currentNumber = player.number;
        if (currentNumber !== null) {
            ROTATENUM++;
            FREENUM[ROTATENUM - 1] = currentNumber;
            player.number = null;
        } else if (ROTATENUM > 0) {
            const freeNumber = FREENUM[ROTATENUM - 1];
            player.number = freeNumber;
            FREENUM[ROTATENUM - 1] = 0;
            ROTATENUM--;
        }

        localStorage.setItem('PlayingToday', JSON.stringify(sortedPlayers));
        const clubMemberIndex = clubMembers.findIndex(member => member.Player === player.Player);
        if (clubMemberIndex !== -1) {
            clubMembers[clubMemberIndex].PlayingToday = player.number;
            localStorage.setItem('clubmembers', JSON.stringify(clubMembers));
        }

        renderPlayers();
    }

    function exportToCSV() {
        const csvContent = "data:text/csv;charset=utf-8,"
            + sortedPlayers.map(player => `${player.number || ''},${player.Player || 'Unnamed'},${player.division || ''}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "players.csv");
        document.body.appendChild(link);
        link.click();
    }

    renderPlayers();

    function resetPlayerStats() {
        // Get the PlayingToday data from localStorage
        let playingToday = JSON.parse(localStorage.getItem('PlayingToday')) || [];
    
        // Update each player's stats
        playingToday = playingToday.map(player => ({
            ...player,
            alloted: 0,
            played: 0,
            rested: 0
        }));
    
        // Save the updated data back to localStorage
        localStorage.setItem('PlayingToday', JSON.stringify(playingToday));
    }

    document.getElementById('backButton').addEventListener('click', () => {
        window.location.href = 'SelectedPlayers.html';
    });

    document.getElementById('allotCourtsButton').addEventListener('click', () => {
        console.log("allotCourtsButton clicked!");
        try {
            resetPlayerStats();
            
            // Check if all players in PlayingToday have a valid number
            const allPlayersHaveNumbers = sortedPlayers.every(player => player.number !== null && player.number !== undefined);
    
            if (!allPlayersHaveNumbers) {
                alert("Not all players have a number assigned. Please ensure all players have a valid number.");
                return;
            }
    
            const playersWithNumbers = sortedPlayers
                .filter(player => player.number !== null)
                .map(player => `${player.number},${player.Player},${player.division}`);
    
            playersWithNumbers.sort((a, b) => {
                const numA = parseInt(a.split(',')[0]);
                const numB = parseInt(b.split(',')[0]);
                return numA - numB;
            });
    
            localStorage.setItem('playerDataForMPlay', playersWithNumbers.join('\n'));
//            alert("Player selections confirmed. Redirecting to MPlay page.");
            window.location.href = 'DynamicCourts.html';
        } catch (error) {
            console.error("Error confirming player selections:", error);
            alert("There was an error confirming player selections. Please try again.");
        }
    });

//    document.getElementById('allotCourtsButton').addEventListener('click', () => {
//        console.log("allotCourtsButton clicked!");
//        try {
//            resetPlayerStats();
//            const playersWithNumbers = sortedPlayers
//                .filter(player => player.number !== null)
//                .map(player => `${player.number},${player.Player},${player.division}`);
//
//            if (playersWithNumbers.length !== 25) {
//                alert("25 players are not selected. Please select exactly 25 players.");
//                return;
//            }
//
//            playersWithNumbers.sort((a, b) => {
//                const numA = parseInt(a.split(',')[0]);
//                const numB = parseInt(b.split(',')[0]);
//                return numA - numB;
//            });
//
//            localStorage.setItem('playerDataForMPlay', playersWithNumbers.join('\n'));
//            alert("Player selections confirmed. Redirecting to MPlay page.");
//            window.location.href = 'DynamicCourts.html';
//        } catch (error) {
//            console.error("Error confirming player selections:", error);
//            alert("There was an error confirming player selections. Please try again.");
//        }
//    });

//    document.getElementById('allotCourtSimpleButton').addEventListener('click', () => {
//        try {
//            resetPlayerStats();
//            const playersWithNumbers = sortedPlayers
//                .filter(player => player.number !== null)
//                .map(player => `${player.number},${player.Player},${player.division}`);

////            if (playersWithNumbers.length !== 25) {
////                alert("25 players are not selected. Please select exactly 25 players.");
////                return;
////           }

//            playersWithNumbers.sort((a, b) => {
//                const numA = parseInt(a.split(',')[0]);
//                const numB = parseInt(b.split(',')[0]);
//                return numA - numB;
//            });
//
//            localStorage.setItem('playerDataForMPlay', playersWithNumbers.join('\n'));
//            alert("Player selections confirmed. Redirecting to NPlay page.");
//            window.location.href = 'NPlay.html';
//        } catch (error) {
//            console.error("Error confirming player selections:", error);
//            alert("There was an error confirming player selections. Please try again.");
//        }
//    });
});
