const PORT = process.env.PORT || 3000
const databasePath = './db/database.db'

import express from 'express'
const app = express()

app.use(express.static('public'))
app.use(express.json())

import swaggerUi from 'swagger-ui-express'

import sqlite3 from 'sqlite3'
import {open} from 'sqlite'

import {queries} from './sql.js'

import {readFileSync, existsSync} from 'fs'

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
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile, {explorer: false, customCss: readFileSync('./swagger.css')}));

app.get('/')

app.get('/events', async (req, res) => {
    // #swagger.tags = ['Events']
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
    // #swagger.tags = ['Events']
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
    // #swagger.tags = ['Events']
    try
    {
        const {name, date} = req.body
        
        await db.run(queries.createEventSql, date, name)
        console.log(`Event ${name} on ${date} created `)
        
        res.send()
    }
    catch(err) 
    {
        console.log(err.message)
        res.status(400).send(err.message)
    }
})

app.put('/event/:id', async (req, res) => {
    // #swagger.tags = ['Events']
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
    // #swagger.tags = ['Events']
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

app.post('/event/:eventid/attend', async (req, res) => {
    // #swagger.tags = ['Attendees']
    try
    {
        const eventId = req.params.eventid
        const {name, vote} = req.body

        const found = await db.get(queries.checkIfExistsSql, eventId)
        if(!found)
        {
            return res.status(404).send()
        }

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

app.get('/event/:eventid/attendees', async (req, res) => {
    // #swagger.tags = ['Attendees']
    try {
        const eventid = req.params.eventid

        const found = await db.get(queries.checkIfExistsSql, eventid)
        if(!found)
        {
            return res.status(404).send()
        }
        
        const result = await db.all(queries.allAttendeesSql, eventid)        
        if(result.length)
        {            
            return res.json(result)
        }

        res.status(204).send()

    } catch (err) {
        console.log(err.message)
        res.status(400).send(err.message)    
    }
})

app.put('/event/:eventid/attendee/:attendeeid', async (req, res) => {
    // #swagger.tags = ['Attendees']    
    try
    {
        const {eventid, attendeeid} = req.params
        const {name, vote} = req.body

        const found = await db.get(queries.checkIfExistsSql, eventid)
        if(!found)
        {
            return res.status(404).send()
        }

        db.run(queries.updateAttendeeSql, name, attendeeid, eventid)
        await db.run(queries.updateVoteSql, vote, attendeeid, eventid)

        res.send()
    }
    catch(err)
    {        
        console.log(err.message)
        res.status(400).send(err.message)
    }
})

app.delete('/event/:eventid/attendee/:attendeeid', async (req, res) => {
    // #swagger.tags = ['Attendees']
    try
    {
        const {eventid, attendeeid} = req.params
        
        const found = await db.get(queries.checkIfExistsSql, eventid)
        if(!found)
        {
            return res.status(404).send()
        }

        db.run(queries.deleteAttendeeSql, eventid, attendeeid)
        await db.run(queries.deleteVoteSql, eventid, attendeeid)

        console.log(`Removed Attendee ID ${attendeeid} from event ${eventid}`)
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
