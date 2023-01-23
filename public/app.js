const baseApiUri = 'http://localhost:3000'

const eventTable = document.getElementById('events')

const GetEvents = async () => {
    const res = await fetch(baseApiUri + '/events')
    const data = await res.json()

    console.log(data)

    data.forEach(event => {
        const row = document.createElement("tr")
        const col = document.createElement("td")
        col.innerText = event.Name
        row.appendChild()
        option.text = event
        categories.add(option)
    })
}

GetEvents()