const gamesList = document.getElementById('games')

const eventid = (new URLSearchParams(window.location.search)).get('eventid')

async function loadBoardGames()
{
    const response = await fetch('https://raw.githubusercontent.com/joelblombergiths/boardgames/main/README.md');
    const data = await response.text();                                
    
    let boardGames = data.split(/\n/)
    boardGames.splice(0, 2);
    boardGames.splice(boardGames.length -1, 1);
    console.log(boardGames)
    
    boardGames.forEach(game => {
        const option = document.createElement('option')
        option.innerText = game.substring(2)
        gamesList.appendChild(option)
    });
}
loadBoardGames(); 

