const fs = require('fs');
const collection = require('../Downloads/W-API Collection.postman_collection.json');

function traverse(item) {
    if (item.item) {
        item.item.forEach(traverse);
    } else if (item.request) {
        const method = item.request.method;
        const url = item.request.url.raw;
        const name = item.name;
        // Log important endpoints
        if (url.includes('instance') || url.includes('create') || method === 'POST') {
            console.log(`[${method}] ${name} -> ${url}`);
        }
    }
}

collection.item.forEach(traverse);
