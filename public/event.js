const nameDisplay = document.getElementById('eventName')
const dateDisplay = document.getElementById('eventDate')
const gameDisplay = document.getElementById('eventGame')

const nameInput = document.getElementById('name')
const gamesList = document.getElementById('game')
const attendButton = document.getElementById('attendButton')
const resultText = document.getElementById('result')

// const baseApiUri = 'http://localhost:3000'
const baseApiUri = 'https://iths-bge.azurewebsites.net/'

const eventid = (new URLSearchParams(window.location.search)).get('id')
if(!eventid) 
{
    location.assign('index.html')
}

async function getEventInfo()
{
    const response = await fetch(`${baseApiUri}/event/${eventid}`)
    console.log(response)
    if(!response.ok)
    {
        location.assign('index.html')
    }

    const data = await response.json()
    
    nameDisplay.innerText = data.Name
    dateDisplay.innerText = data.Date
    gameDisplay.innerText = data.TopVote
}
getEventInfo()

async function loadBoardGames()
{
    const response = await fetch('https://raw.githubusercontent.com/joelblombergiths/boardgames/main/README.md');
    const data = await response.text();                                
    
    let boardGames = data.split(/\n/)
    boardGames.splice(0, 2);
    boardGames.splice(boardGames.length -1, 1);
    
    boardGames.forEach(game => {
        const option = document.createElement('option')
        option.innerText = game.substring(2)
        gamesList.appendChild(option)
    });
}
loadBoardGames(); 

attendButton.addEventListener('click', async () => {
    const data = {
        name : nameInput.value,
        vote : gamesList.value
    }
    
    const req = {
        method : "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }

    const res = await fetch(`${baseApiUri}/event/${eventid}/attend`, req)
    attendButton.style.display = 'none'
    resultText.style.display = 'inline'

    if(res.ok)
    {
        resultText.innerText = 'Noted.'
        setTimeout(() => {
            location.assign('index.html')
        }, 1000)
    }
    else 
    {
        console.log(res)
        resultText.style.color = 'red'
        resultText.innerText = 'The server made a boo-boo'
    }
})
