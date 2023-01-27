const baseApiUri = 'http://localhost:3000'

const eventTable = document.getElementById('events')

const GetEvents = async () => {
    const res = await fetch(`${baseApiUri}/events`)
        
    if(res.status == 200)
    {
        const data = await res.json()
        const tbody = document.createElement('tbody')

        data.forEach(event => {
            const row = document.createElement("tr")
            row.onclick = () => {location.assign(`event.html?id=${event.ID}`)}
            
            const nameCol = document.createElement("td")
            nameCol.title = "Click to join event"
            nameCol.innerText = event.Name
            row.appendChild(nameCol)        
            
            const dateCol = document.createElement("td")
            dateCol.title = "Click to join event"
            dateCol.innerText = event.Date
            row.appendChild(dateCol)        

            tbody.appendChild(row)
        })

        eventTable.appendChild(tbody)
    }
    else
    {
        const row = document.createElement("tr")
        const col = document.createElement("td")        
        col.colSpan = 2
        col.innerText = 'Party poopers :('
        row.appendChild(col)
        eventTable.appendChild(row)
    }
}
GetEvents()
