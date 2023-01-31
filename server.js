const PORT = process.env.PORT || 3000

import express from 'express'
const app = express()

app.use(express.static('public'))
app.use(express.json())

import swaggerUi from 'swagger-ui-express'

import {readFileSync} from 'fs'

import firestore from 'firebase-admin'
import {getFirestore, FieldValue} from 'firebase-admin/firestore'

const serviceAccount = JSON.parse(readFileSync('./firestore.json')) 

firestore.initializeApp({
    credential: firestore.credential.cert(serviceAccount)
});

const db = getFirestore();
const eventRef = db.collection('Events')

const swaggerFile = JSON.parse(readFileSync('./swagger.json'))
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile, {explorer: false, customCss: readFileSync('./swagger.css')}));

app.get('/')

app.get('/events', async (req, res) => {
    // #swagger.tags = ['Events']
    try
    { 
        const result = await eventRef.get()

        const events = []
        if(!result.empty)
        {
            result.forEach(doc => {
                let event = doc.data()
                event.ID = doc.id
                events.push(event)
            })
            return res.json(events)
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

        const event = eventRef.doc(eventId)
        const eventObj = await event.get()
        if(eventObj.exists)
        {
            let eventData = eventObj.data()

            const attendees = await event.collection('Attendees').get()
            
            if(attendees.empty)
            {
                eventData.TopVote = 'Any'
            }
            else
            {
                let votes = []
                attendees.forEach(doc => {
                    votes.push((doc.data()).Vote)
                })
                
                eventData.TopVote = getTopVote(votes)                
            }

            return res.json(eventData)
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
        
        await eventRef.add({
            'Name': name,
            'Date': date
        })

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

        const event = eventRef.doc(eventId)

        const check = await event.get()
        if(check.exists)
        {
            await event.update({
                Name: name,
                Date: date
            })
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

        const event = eventRef.doc(eventId)
        
        const check = await event.get()
        if(check.exists)
        {
            await event.delete()
            //TODO delete all attendees
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

        const event = eventRef.doc(eventId)
        
        const check = await event.get()
        if(!check.exists)
        {
            return res.status(404).send()
        }

        await event.collection('Attendees').add({
            Name: name,
            Vote: vote
        })

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
        const eventId = req.params.eventid

        const event = eventRef.doc(eventId)
        
        const check = await event.get()
        if(!check.exists)
        {
            return res.status(404).send()
        }
        
        const result = await event.collection('Attendees').get()
        
        const attendees = []
        if(!result.empty)
        {
            result.forEach(doc => {
                let attendee = doc.data()
                attendee.ID = doc.id
                attendees.push(attendee)
            })
            return res.json(attendees)
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

        const event = eventRef.doc(eventid)
        
        const check = await event.get()
        if(!check.exists)
        {
            return res.status(404).send(`Event ${eventid} does not exist`)
        }

        const attendee = event.collection('Attendees').doc(attendeeid)
        const attendeeCheck = await attendee.get()
        if(!attendeeCheck.exists)
        {
            return res.status(404).send(`Attendee ${attendeeid} does not exist`)
        }
        
        await attendee.update({
            Name: name,
            Vote: vote
        })

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
        
        const event = eventRef.doc(eventid)
        
        const eventCheck = await event.get()
        if(!eventCheck.exists)
        {
            return res.status(404).send(`Event ${eventid} does not exist`)
        }

        const attendee = event.collection('Attendees').doc(attendeeid)
        
        const attendeeCheck = await attendee.get()
        if(!attendeeCheck.exists)
        {
            return res.status(404).send(`Attendee ${attendeeid} does not exist`)
        }
        
        await attendee.delete()
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


function getTopVote(arr)
{
    const topVotes = arr.reduce((allVotes, vote) => {
        const currCount = allVotes[vote] ?? 0;
        return {
            ...allVotes,
            [vote]: currCount + 1,
        };
    }, {});
    
    return Object.keys(topVotes).reduce((a, b) => topVotes[a] > topVotes[b] ? a : b)
}