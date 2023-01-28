const nameInput = document.getElementById('name')
const dateInput = document.getElementById('date')
const updateButton = document.getElementById('updateButton')
const resultText = document.getElementById('result')

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
    
    nameInput.value = data.Name
    dateInput.value = data.Date
}
loadEventInfo()

updateButton.addEventListener('click', async () => {
    data = {
        name: nameInput.value,
        date: dateInput.value.replace('T', ' ')
    }
    
    const req = {
        method : "PUT",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }

    const res = await fetch(`/event/${eventid}`, req)
    updateButton.style.display = 'none'
    resultText.style.display = 'inline'

    if(res.ok)
    {
        resultText.innerText = 'Updated.'
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
