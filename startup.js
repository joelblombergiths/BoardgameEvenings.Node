import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'Boardgame Evenings API',
        description: 'Create and join fun gaming sessions with kind nerds'
    },
    host: 'localhost:3000',
    schemes: ['http']
}
    
swaggerAutogen({openapi: '3.0.0'})('./swagger.json', ['./server.js'], doc)
