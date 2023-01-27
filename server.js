const PORT = process.env.PORT || 3000
const databasePath = './db/database.db'

import express from 'express'
const app = express()

app.use(express.static('public'))
app.use(express.json())

import swaggerUi from 'swagger-ui-express'

import sqlite3 from 'sqlite3'
import {open} from 'sqlite'

import {readFileSync, existsSync} from 'fs'

const initEventTablesql = 'CREATE TABLE "Events" ("ID" INTEGER NOT NULL UNIQUE, "Date" TEXT NOT NULL CHECK(datetime("Date") IS NOT NULL),"Name" TEXT, PRIMARY KEY("ID" AUTOINCREMENT))'
const initAttendeeTableSql = 'CREATE TABLE "Attendees" ("ID" INTEGER NOT NULL UNIQUE, "EventID" INTEGER NOT NULL, "Name" TEXT NOT NULL, PRIMARY KEY("ID" AUTOINCREMENT))'
const initVotesTableSql = 'CREATE TABLE "GameVotes" ("ID" INTEGER NOT NULL, "EventID" INTEGER NOT NULL, "AttendeeID" INTEGER NOT NULL, "Vote" TEXT NOT NULL,PRIMARY KEY("ID","EventID","AttendeeID"))'

const allEventsSql = 'SELECT * FROM Events'
const checkIfExistsSql = 'SELECT * FROM Events WHERE ID = ?'
const createEventSql = 'INSERT INTO Events(Date, Name) VALUES(?,?)'
const getEventDetailSql = 'SELECT e.ID, e.Name, e.Date, IFNULL(gv.Vote, \'Any\') AS TopVote FROM Events e OUTER LEFT JOIN GameVotes gv ON gv.EventID = e.ID WHERE e.ID = ? GROUP BY gv.Vote ORDER BY count(*) DESC LIMIT 1'
const updateEventSql = 'UPDATE Events SET Name = ?, Date = ? WHERE ID = ?'
const deleteEventsql = 'DELETE FROM Events WHERE ID = ?'
const addAttendeeSql = 'INSERT INTO Attendees(EventId,Name) VALUES(?,?)'
const addVoteSql = 'INSERT INTO GameVotes(ID,EventID,AttendeeID,Vote) VALUES((SELECT IFNULL(MAX(ID) + 1, 1) FROM GameVotes ORDER BY ID DESC),?,?,?)'    
const deleteAttendeeSql = 'DELETE FROM Attendees WHERE EventId = ? AND ID = ?'
const deleteVoteSql = 'DELETE FROM GameVotes WHERE EventId = ? AND AttendeeID = ?'


const dbExists = existsSync(databasePath)

const dbconf = {
    filename: databasePath,
    driver: sqlite3.Database
}

var db
open(dbconf)
    .then(database => {    
        if(!dbExists)
        {
            (async () => {
                console.log('Initializing DB')
                
                database.run(initEventTablesql)
                database.run(initAttendeeTableSql)
                await database.run(initVotesTableSql)
            })()
        }
        console.log(`Database connected ${database.config.filename}`)
        db = database
    })

const swaggerFile = JSON.parse(readFileSync('./swagger.json'))
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile));

app.get('/')

app.get('/events', async (req, res) => {
    try
    {
        const result = await db.all(allEventsSql)        
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
    try
    {
        const eventId = req.params.id

        const result = await db.get(getEventDetailSql, eventId)
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
    try
    {
        const {id, name, date} = req.body

        const found = await db.get(checkIfExistsSql, id)
        if(!found)
        {
            await db.run(createEventSql, date, name)
            console.log(`Event ${name} on ${date} created `)
            return res.send()
        }

        res.status(400).send(`Event with ID ${id} already exists`)
    }
    catch(err) 
    {
        console.log(err.message)
        res.status(400).send(err.message)
    }
})

app.put('/event/:id', async (req, res) => {
    try
    {
        const eventId = req.params.id
        const {name, date} = req.body

        const found = await db.get(checkIfExistsSql, eventId)
        if(found)
        {
            await db.run(updateEventSql, name, date, eventId)
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
    try
    {
        const eventId = req.params.id

        const result = await db.run(deleteEventsql, eventId)
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
    try
    {
        const eventId = req.params.id
        const {name, vote} = req.body

        const attendeeResult = await db.run(addAttendeeSql, eventId, name)
        const attendeeId = attendeeResult.lastID
        
        await db.run(addVoteSql, eventId, attendeeId, vote)

        console.log(`${name} will attend event with ID ${eventId} and voted for ${vote}`)
        res.send()
    }
    catch(err)
    {
        console.log(err.message)
        res.status(400).send(err.message)    
    }
})

app.delete('/event/:eventid/attend/:attendeeid', async (req, res) => {
    try
    {
        const eventId = req.params.eventid
        const attendeeId = req.params.attendeeid
        
        db.run(deleteAttendeeSql, eventId, attendeeId)
        await db.run(deleteVoteSql, eventId, attendeeId)

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
