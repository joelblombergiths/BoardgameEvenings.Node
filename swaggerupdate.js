import swaggerAutogen from 'swagger-autogen';

const doc = {
    info: {
        title: 'Boardgame Evenings API',
        description: 'Create and join fun gaming sessions with kind nerds'
    },
    servers: [
        {
            url: "https://iths-bge.azurewebsites.net/"
        },
        {
            url: "http://localhost:3000/"
        }
    ]
}

swaggerAutogen({openapi: '3.0.0'})('./swagger.json', ['./server.js'], doc)
