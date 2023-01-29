const eventTable = document.getElementById('events')

const GetEvents = async () => {
    const res = await fetch('/events')
        
    const tbody = document.createElement('tbody')

    if(res.status == 200)
    {        
        const data = await res.json()
        data.forEach(event => {
            const row = document.createElement("tr")
            row.title = "Click to join event"
            row.onclick = () => {location.assign(`event.html?id=${event.ID}`)}

            const nameCol = document.createElement("td")
            nameCol.innerText = event.Name
            row.appendChild(nameCol)        
            
            const dateCol = document.createElement("td")            
            dateCol.innerText = event.Date
            row.appendChild(dateCol)        

            tbody.appendChild(row)
        })
    }
    else
    {
        const row = document.createElement("tr")
        const col = document.createElement("td")        
        col.colSpan = 2
        col.innerText = '[Create new Event]'
        row.onclick = () => {location.assign('newevent.html')}
        row.appendChild(col)
        tbody.appendChild(row)
    }

    eventTable.appendChild(tbody)
}
GetEvents()
