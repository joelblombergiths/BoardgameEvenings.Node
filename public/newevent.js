const createButton = document.getElementById('createButton')
const resultText = document.getElementById('result')
const nameInput = document.getElementById('name')
const dateInput = document.getElementById('date')

createButton.addEventListener('click', async () => {
    const data = {
        name: nameInput.value,
        date: dateInput.value.replace('T', ' ')
    }

    const req = {
        method : "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }

    const res = await fetch('/event', req)
    createButton.style.display = 'none'
    resultText.style.display = 'inline'

    if(res.ok)
    {
        resultText.innerText = 'Created!'
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