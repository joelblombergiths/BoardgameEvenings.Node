const nameDisplay = document.getElementById('eventName')
const dateDisplay = document.getElementById('eventDate')
const gameDisplay = document.getElementById('eventGame')
const eventEditLink = document.getElementById('eventEditLink')
const eventDeleteLink = document.getElementById('eventDeleteLink')
const eventEditIcon = document.getElementById('eventEditIcon')
const eventDeleteIcon = document.getElementById('eventDeleteIcon')

const nameInput = document.getElementById('name')
const gamesList = document.getElementById('game')

var EventEditMode = false
var AttendeeEditMode = false

const eventid = (new URLSearchParams(window.location.search)).get('id')
if(!eventid) 
{
    location.assign('index.html')
}

const loadEventInfo = async () => {
    const response = await fetch(`/event/${eventid}`)    
    if(!response.ok)
    {
        location.assign('index.html')
    }

    const data = await response.json()

    const nameBox = document.createElement('input')
    nameBox.id = 'eventNameBox'
    nameBox.type = 'text'
    nameBox.style.display = 'none'
    nameBox.value = data.Name
    nameDisplay.appendChild(nameBox)

    const nameSpan = document.createElement('span')
    nameSpan.id = 'eventNameSpan'
    nameSpan.innerText = data.Name
    nameDisplay.appendChild(nameSpan)

    const dateBox = document.createElement('input')
    dateBox.id = 'eventDateBox'
    dateBox.type = 'datetime-local'
    dateBox.style.display = 'none'
    dateBox.value = data.Date
    dateDisplay.appendChild(dateBox)

    const dateSpan = document.createElement('span')
    dateSpan.id = 'eventDateSpan'
    dateSpan.innerText = data.Date
    dateDisplay.appendChild(dateSpan)

    gameDisplay.innerText = data.TopVote

    eventEditLink.addEventListener('click', async () => {
        if(EventEditMode)
        {
            const data = {
                name: document.getElementById('eventNameBox').value,
                date: document.getElementById('eventDateBox').value.replace('T', ' ')
            }
            
            const req = {
                method : "PUT",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        
            const res = await fetch(`/event/${eventid}`, req)
            if(res.ok)
            {
                location.assign(`/event.html?id=${eventid}`)
            }
            else
            {
                console.log(res)
            }
        }
        else
        {
            EventEditMode = true
            eventEditIcon.classList.replace('fa-pen', 'fa-floppy-disk')

            document.getElementById('eventNameBox').style.display = 'inline'
            document.getElementById('eventNameSpan').style.display = 'none'

            document.getElementById('eventDateBox').style.display = 'inline'
            document.getElementById('eventDateSpan').style.display = 'none'
        }
    })
    
    eventDeleteLink.addEventListener('click', async () => {
        const confirmDelete = confirm('Are you sure you want to delete this event?')
        if(confirmDelete)
        {
            const req = {
                method : 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            }

            const res = await fetch(`/event/${eventid}`, req)
            if(res.ok)
            {
                location.assign('index.html')
            }
            else
            {
                console.log(res)
            }
        }
    })
}

const loadAttendees = async () => {
    const response = await fetch(`/event/${eventid}/attendees`)    
    if(response.status == 200)
    {        
        const data = await response.json()

        let counter = 0
        data.forEach(attendee => {
            const row = document.createElement("tr")
            
            const nameCol = document.createElement("td")
            
            const nameBox = document.createElement('input')
            nameBox.id = `nameBox${counter}`
            nameBox.type = 'text'
            nameBox.value = attendee.Name
            nameBox.style.display = 'none'
            nameCol.appendChild(nameBox)

            const nameSpan = document.createElement('span')
            nameSpan.id = `nameSpan${counter}`
            nameSpan.innerText = attendee.Name
            nameCol.appendChild(nameSpan)

            row.appendChild(nameCol)        
            
            const voteCol = document.createElement("td")

            const voteBox = document.createElement('select')
            voteBox.id = `voteBox${counter}`

            boardGames.forEach(game => {
                const option = document.createElement('option')
                option.innerText = game.substring(2)
                voteBox.appendChild(option)
            });

            voteBox.value = attendee.Vote
            voteBox.style.display = 'none'
            voteCol.appendChild(voteBox)

            const textSpan = document.createElement('span')
            textSpan.id = `voteSpan${counter}`
            textSpan.innerText = attendee.Vote
            voteCol.appendChild(textSpan)
            
            row.appendChild(voteCol)        

            const controlCol = document.createElement('td')

            const editLink = document.createElement('a')
            editLink.href = "#"
            editLink.addEventListener('click', async (e) =>  {
                const element = e.target
                const index = element.dataset.index

                if(AttendeeEditMode)
                {
                    const data = {
                        name: document.getElementById(`nameBox${index}`).value,
                        vote: document.getElementById(`voteBox${index}`).value
                    }

                    const req = {
                        method : 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(data)
                    }

                    const res = await fetch(`/event/${eventid}/attendee/${attendee.ID}`, req)
                    
                    if(res.ok)
                    {
                        location.assign(`/event.html?id=${eventid}`)
                    }
                    else
                    {
                        console.log(response)
                    }
                }
                else
                {
                    AttendeeEditMode = true
                    element.classList.replace('fa-pen', 'fa-floppy-disk')

                    const nameBox = document.getElementById(`nameBox${index}`)
                    nameBox.style.display = 'inline'
                    const nameSpan = document.getElementById(`nameSpan${index}`)
                    nameSpan.style.display = 'none'

                    const voteBox = document.getElementById(`voteBox${index}`)
                    voteBox.style.display = 'inline'
                    const voteSpan = document.getElementById(`voteSpan${index}`)
                    voteSpan.style.display = 'none'
                }
            })
            
            const editIcon = document.createElement('i')
            editIcon.classList.add('fa-solid')
            editIcon.classList.add('fa-pen')
            editIcon.dataset.index = counter++
            editLink.appendChild(editIcon)
            controlCol.appendChild(editLink)
            
            const deleteLink = document.createElement('a')
            deleteLink.href = "#"            
            deleteLink.addEventListener('click', () => {
                const confirmDelete = confirm('Are you sure you want to delete this attendee?')
                if(confirmDelete)
                {
                    const req = {
                        method : 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }
                    
                    fetch(`/event/${eventid}/attendee/${attendee.ID}`, req)
                    .then(response => {
                        if(response.ok)
                        {
                            location.assign(`/event.html?id=${eventid}`)
                        }
                        else
                        {
                            console.log(response)
                        }
                    })
                }
            })

            const deleteIcon = document.createElement('i')
            deleteIcon.classList.add('fa-solid')
            deleteIcon.classList.add('fa-trash-can')
            deleteLink.appendChild(deleteIcon)
            controlCol.appendChild(deleteLink)            

            row.appendChild(controlCol)

            attendeeTable.appendChild(row)
        })
    }
    else{
        const col = document.createElement('td')
        col.colSpan = 2
        col.innerText = 'partypoopers :('
        attendeeTable.appendChild(col)
    }
}

const loadBoardgames = async () => {
    const response = await fetch('https://raw.githubusercontent.com/joelblombergiths/boardgames/main/README.md')
    const data = await response.text()
    
    boardGames = data.split(/\n/)
    boardGames.splice(0, 2);
    boardGames.splice(boardGames.length -1, 1);
    
    boardGames.forEach(game => {
        const option = document.createElement('option')
        option.innerText = game.substring(2)
        gamesList.appendChild(option)
    });
}

document.getElementById('attendButton').addEventListener('click', async () => {
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
    
    const res = await fetch(`/event/${eventid}/attend`, req)

    if(res.ok)
    {
        location.assign(`/event.html?id=${eventid}`)
    }
    else 
    {
        console.log(res)
    }
})

var boardGames
loadBoardgames()
.then(loadEventInfo)
.then(loadAttendees)