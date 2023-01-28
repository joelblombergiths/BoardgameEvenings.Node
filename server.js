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

import {queries} from './sql.js'

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
                
                database.run(queries.initEventTablesql)
                database.run(queries.initAttendeeTableSql)
                await database.run(queries.initVotesTableSql)
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
        const result = await db.all(queries.allEventsSql)        
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

        const result = await db.get(queries.getEventDetailSql, eventId)
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

        const found = await db.get(queries.checkIfExistsSql, id)
        if(!found)
        {
            await db.run(queries.createEventSql, date, name)
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

        const found = await db.get(queries.checkIfExistsSql, eventId)
        if(found)
        {
            await db.run(queries.updateEventSql, name, date, eventId)
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

        const result = await db.run(queries.deleteEventsql, eventId)
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

        const attendeeResult = await db.run(queries.addAttendeeSql, eventId, name)
        const attendeeId = attendeeResult.lastID
        
        await db.run(queries.addVoteSql, eventId, attendeeId, vote)

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
        
        db.run(queries.deleteAttendeeSql, eventId, attendeeId)
        await db.run(queries.deleteVoteSql, eventId, attendeeId)

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

