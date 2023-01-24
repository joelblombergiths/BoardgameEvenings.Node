const PORT = process.env.PORT || 3000

import express from 'express'
const app = express()

app.use(express.static('public'))
app.use(express.json())

import swaggerUi from 'swagger-ui-express'
import swaggerFile from './swagger.json' assert { type: 'json' }

import sqlite3 from 'sqlite3'
import {open} from 'sqlite'

async function openDb()
{
    return open({
        filename: './db/database.db',
        driver: sqlite3.Database
    })
}
const db = await openDb()
console.log(`Database connected ${db.config.filename}`)

app.get('/')

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get('/events', async (req, res) => {
    try
    {
        const result = await db.all('SELECT * FROM Events')        
        if(result.length)
        {            
            return res.json(result)
        }

        res.status(204).send()
    }
    catch(err)
    {
        console.log(err.message)
        res.status(400).send(err.message)
    }
})

app.get('/event/:id', async (req, res) => {
    const eventId = req.params.id
    const sql = 'SELECT e.ID, e.Name, e.Date, IFNULL(gv.Vote, \'Any\') AS TopVote FROM Events e OUTER LEFT JOIN GameVotes gv ON gv.EventID = e.ID WHERE e.ID = ? GROUP BY gv.Vote ORDER BY count(*) DESC LIMIT 1'

    try
    {
        const result = await db.get(sql, eventId)

        if(result)
        {
            return res.json(result)            
        }

        res.status(404).send(`Event with ID ${eventId} not found`)
    }
    catch(err)
    {
        console.log(err.message)
        res.status(400).send(err.message)
    }
})

app.post('/event', async (req, res) => {
    const data = req.body
    const getSql = 'SELECT * FROM Events WHERE ID = ?'
    const insertSql = 'INSERT INTO Events(Date, Name) VALUES(?,?)'

    try
    {
        const found = await db.get(getSql, data.id)

        if(!found)
        {
            await db.run(insertSql, data.date, data.name)
            console.log(`Event ${data.name} on ${data.date} created `)
            return res.send()
        }

        res.status(400).send(`Event with ID ${data.id} already exists`)
    }
    catch(err) 
    {
        console.log(err.message)
        res.status(400).send(err.message)
    }
})

app.put('/event/:id', async (req, res) => {
    const eventId = req.params.id
    const event = req.body
    const getSql = 'SELECT * FROM Events WHERE ID = ?'
    const updateSql = 'UPDATE Events SET Name = ?, Date = ? WHERE ID = ?'
    
    try
    {
        const found = await db.get(getSql, eventId)

        if(found)
        {
            await db.run(updateSql, event.name, event.date, eventId)
            return res.send()
        }

        res.status(404).send('Event does not exists')
    }
    catch(err)
    {
        console.log(err.message)
        res.status(400).send(err.message)
    }
})

app.delete('/event/:id', async (req, res) => {
    const eventId = req.params.id
    const sql = 'DELETE FROM Events WHERE ID = ?'    

    try
    {
        const result = await db.run(sql, eventId)

        if(result.changes > 0)
        {
            console.log(`Removed event with ID ${eventId}`)
            return res.send()            
        }

        res.status(404).send(`Event with ID ${eventId} not found`)
    }
    catch(err)
    {
        console.log(err.message)
        res.status(400).send(err.message)        
    }
})

app.post('/event/:id/attend', async (req, res) => {
    const eventId = req.params.id
    const data = req.body
    const attendeeSql = 'INSERT INTO Attendees(EventId,Name) VALUES(?,?)'
    const voteSql = 'INSERT INTO GameVotes(ID,EventID,AttendeeID,Vote) VALUES((SELECT IFNULL(MAX(ID) + 1, 1) FROM GameVotes ORDER BY ID DESC),?,?,?)'    

    try
    {
        const attendeeResult = await db.run(attendeeSql, eventId, data.name)
        const attendeeId = attendeeResult.lastID
        
        await db.run(voteSql, eventId, attendeeId, data.vote)

        console.log(`${data.name} will attend event with ID ${eventId} and voted for ${data.vote}`)
        res.send()
    }
    catch(err)
    {
        console.log(err.message)
        res.status(400).send(err.message)    
    }
})

app.delete('/event/:eventid/attend/:attendeeid', async (req, res) => {
    const eventId = req.params.eventid
    const attendeeId = req.params.attendeeid
    const attendeeSql = 'DELETE FROM Attendees WHERE EventId = ? AND ID = ?'
    const voteSql = 'DELETE FROM GameVotes WHERE EventId = ? AND AttendeeID = ?'

    try
    {
        db.run(attendeeSql, eventId, attendeeId)
        await db.run(voteSql, eventId, attendeeId)

        console.log(`Removed Attendee ID ${attendeeId} from event ${eventId}`)
        res.send()
    }
    catch(err)
    {        
        console.log(err.message)
        res.status(400).send(err.message)
    }
})

app.listen(PORT, () => {
    console.log(`Listening to port ${PORT}`)
})
