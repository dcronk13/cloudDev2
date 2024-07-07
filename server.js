const express = require('express');
const app = express();

const { Datastore } = require('@google-cloud/datastore');
const bodyParser = require('body-parser');

const datastore = new Datastore();

const BOAT = "Boat";
const SLIP = "Slip";

const router = express.Router();

app.use(bodyParser.json());

function fromDatastore(item) {
    item.id = item[Datastore.KEY].id;
    return item;
}

/* ------------- Begin Lodging Model Functions ------------- */
function post_boat(name, type, length) {
    var key = datastore.key(BOAT);
    const new_boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": new_boat }).then(() => { return key });
}

function post_slip(number) {
    var key = datastore.key(SLIP);
    const new_slip = { "number": number, "current_boat": null };
    return datastore.save({ "key": key, "data": new_slip }).then(() => { return key });
}

/**
 * The function datastore.query returns an array, where the element at index 0
 * is itself an array. Each element in the array at element 0 is a JSON object
 * with an entity fromt the type "Lodging".
 */
function get_boats() {
    const q = datastore.createQuery(BOAT);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

function get_slips() {
    const q = datastore.createQuery(SLIP);
    return datastore.runQuery(q).then((entities) => {
        // Use Array.map to call the function fromDatastore. This function
        // adds id attribute to every element in the array at element 0 of
        // the variable entities
        return entities[0].map(fromDatastore);
    });
}

/**
 * This function is not in the code discussed in the video. It demonstrates how
 * to get a single entity from Datastore using an id.
 * Note that datastore.get returns an array where each element is a JSON object 
 * corresponding to an entity of the Type "Lodging." If there are no entities
 * in the result, then the 0th element is undefined.
 * @param {number} id Int ID value
 * @returns An array of length 1.
 *      If a lodging with the provided id exists, then the element in the array
 *           is that lodging
 *      If no lodging with the provided id exists, then the value of the 
 *          element is undefined
 */
function get_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}

function get_slip(id) {
    const key = datastore.key([SLIP, parseInt(id, 10)]);
    return datastore.get(key).then((entity) => {
        if (entity[0] === undefined || entity[0] === null) {
            // No entity found. Don't try to add the id attribute
            return entity;
        } else {
            // Use Array.map to call the function fromDatastore. This function
            // adds id attribute to every element in the array entity
            return entity.map(fromDatastore);
        }
    });
}

function put_boat(id, name, type, length) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    const boat = { "name": name, "type": type, "length": length };
    return datastore.save({ "key": key, "data": boat });
}

function put_slip(id, number, current_boat) {
    const key = datastore.key([SLIP, parseInt(id, 10)]);
    const slip = { "number": number, "current_boat": current_boat };
    return datastore.save({ "key": key, "data": slip });
}

function delete_boat(id) {
    const key = datastore.key([BOAT, parseInt(id, 10)]);
    return datastore.delete(key);
}

function delete_slip(id,number,type) {
    if (type === 1) {
        const key = datastore.key([SLIP, parseInt(id, 10)]);
        const slip = { "number": number, "current_boat": null };
        return datastore.save({ "key": key, "data": slip });
    }
    else {
        const key = datastore.key([SLIP, parseInt(id, 10)]);
        return datastore.delete(key);
    }
}

/* ------------- End Model Functions ------------- */

/* ------------- Begin Controller Functions ------------- */

router.get('/boats', function (req, res) {
    const boats = get_boats()
        .then((boats) => {
            res.status(200).json(boats);
        });
});

router.get('/slips', function (req, res) {
    const slips = get_slips()
        .then((slips) => {
            res.status(200).json(slips);
        });
});

router.post('/boats', function (req, res) {
    if (JSON.stringify(req.body).includes("name") && JSON.stringify(req.body).includes("type") && JSON.stringify(req.body).includes("length")) {
        post_boat(req.body.name, req.body.type, req.body.length).then(key => { res.status(201).send(JSON.stringify({ id: key.id, name: req.body.name, type: req.body.type, length: req.body.length}))});
    }
    else {
        const obj = {Error: "The request object is missing at least one of the required attributes"};
        var data = JSON.stringify(obj)
        res.status(400).send(data);
    }
});

router.post('/slips', function (req, res) {
    if (JSON.stringify(req.body).includes("number")) {
        post_slip(req.body.number).then(key => { res.status(201).send(JSON.stringify({ id: key.id, number: req.body.number, current_boat: null}))});
    } else {
        const obj = {Error: "The request object is missing the required number"};
        var data = JSON.stringify(obj)
        res.status(400).send(data);
    }
});

router.patch('/boats/:id', function (req, res) {
    get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).send(JSON.stringify({ Error: "No boat with this boat_id exists" }));
            } else if (JSON.stringify(req.body).includes("name") && JSON.stringify(req.body).includes("type") && JSON.stringify(req.body).includes("length")){
                put_boat(req.params.id, req.body.name, req.body.type, req.body.length)
                .then(res.status(200).send(JSON.stringify({ id: req.params.id, name: req.body.name, type: req.body.type, length: req.body.length})));
            }
            else {
                res.status(400).send(JSON.stringify({ Error: "The request object is missing at least one of the required attributes" }));
            }
        });
});

router.put('/slips/:sid/:bid', function (req, res) {
    get_slip(req.params.sid)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                res.status(404).send(JSON.stringify({ Error: "The specified boat and/or slip does not exist" }));
            } else {
                get_boat(req.params.bid)
                .then(boat => {
                    if (boat[0] === undefined || boat[0] === null) {
                        res.status(404).send(JSON.stringify({ Error: "The specified boat and/or slip does not exist" })); 
                    } else if (slip[0].current_boat != null){
                        res.status(403).send(JSON.stringify({ Error: "The slip is not empty" }));
                    } else {
                        put_slip(req.params.sid, slip[0].number, req.params.bid)
                        .then(res.status(204).end());
                    }             
                });
            }
        });
});

router.delete('/boats/:id', function (req, res) {
    get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                // The 0th element is undefined. This means there is no lodging with this id
                res.status(404).send(JSON.stringify({ Error: "No boat with this boat_id exists" }));
            } else {
                delete_boat(req.params.id).then(res.status(204).end())
            }
        });
});

router.delete('/slips/:id', function (req, res) {
    get_slip(req.params.id)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                res.status(404).send(JSON.stringify({ Error: "No slip with this slip_id exists" }));
            } else {
                delete_slip(req.params.id,slip[0].number,0).then(res.status(204).end())
            }
        });
});

router.delete('/slips/:sid/:bid', function (req, res) {
    get_slip(req.params.sid)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                res.status(404).send(JSON.stringify({ Error: "No boat with this boat_id is at the slip with this slip_id" }));
            } else {
                get_boat(req.params.bid)
                .then(boat => {
                    if (boat[0] === undefined || boat[0] === null) {
                        res.status(404).send(JSON.stringify({ Error: "No boat with this boat_id is at the slip with this slip_id"}));
                    } else {
                        if (slip[0].current_boat != boat[0].id){
                            res.status(404).send(JSON.stringify({ Error: "No boat with this boat_id is at the slip with this slip_id"}));
                        }
                        else{
                            delete_slip(req.params.sid,slip[0].number,1).then(res.status(204).end());
                        }
                    }
                });
            }           
        });
});

/**
 * This route is not in the file discussed in the video. It demonstrates how to
 * get a single lodging from Datastore using the provided id and also how to 
 * determine when no lodging exists with that ID.
 */
router.get('/boats/:id', function (req, res) {
    get_boat(req.params.id)
        .then(boat => {
            if (boat[0] === undefined || boat[0] === null) {
                res.status(404).send(JSON.stringify({ Error: "No boat with this boat_id exists" }));
            } else {
                res.status(200).json(boat[0]);
            }
        });
});

router.get('/slips/:id', function (req, res) {
    get_slip(req.params.id)
        .then(slip => {
            if (slip[0] === undefined || slip[0] === null) {
                res.status(404).send(JSON.stringify({ Error: "No slip with this slip_id exists" }));
            } else {
                res.status(200).json(slip[0]);
            }
        });
});

/* ------------- End Controller Functions ------------- */

app.use('/', router);

// Listen to the App Engine-specified port, or 8080 otherwise
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});
