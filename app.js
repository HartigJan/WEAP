const express = require('express');
const bodyParser = require("body-parser");
const path = require('path');
const Joi = require('joi');

const db = require("./db");
const collection = "todo";
const collectionDeleted = "todoDeleted";
const app = express();

// Validator
const schema = Joi.object().keys({
    todo : Joi.string().required()
});


// Naparsovani json dat
app.use(bodyParser.json());


app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'index.html'));
});

// read
app.get('/getTodos',(req,res)=>{
    // Ziskatni všech todoček
    db.getDB().collection(collection).find({}).toArray((err,documents)=>{
        if(err)
            console.log(err);
        else{
            res.json(documents);
        }
    });
});

app.get('/getDeletedTodos',(req,res)=>{
    // Získání všech smazanych todoček
    db.getDB().collection(collectionDeleted).find({}).toArray((err,documents)=>{
        if(err)
            console.log(err);
        else{
            res.json(documents);
        }
    });
});

// update
app.put('/:id',(req,res)=>{
    // Najdi todočko podle ID a ktere chci updatnout
    const todoID = req.params.id;

    const userInput = req.body;
    // Najdi todočko podle ID a updatni ho
    db.getDB().collection(collection).findOneAndUpdate({_id : db.getPrimaryKey(todoID)},{$set : {todo : userInput.todo}},{returnOriginal : false},(err,result)=>{
        if(err)
            console.log(err);
        else{
            res.json(result);
        }      
    });
});


//create
app.post('/',(req,res,next)=>{
    // Co chci vložit
    const userInput = req.body;

    // Validace
    Joi.validate(userInput,schema,(err,result)=>{
        if(err){
            const error = new Error("Špatný vstup");
            error.status = 400;
            next(error);
        }
        else{
            db.getDB().collection(collection).insertOne(userInput,(err,result)=>{
                if(err){
                    const error = new Error("Chyba pri vkládání todočka");
                    error.status = 400;
                    next(error);
                }
                else
                    res.json({result : result, document : result.ops[0],msg : "Zase práce ?! Tak ja teda jdu",error : null});
            });
        }
    })    
});



//delete
app.delete('/:id',(req,res)=>{
    // Najdi todočko podle ID a pridej ho do kolekce smazanych
    const todoID = req.params.id;

    db.getDB().collection(collection).findOne({_id : db.getPrimaryKey(todoID)},(err,result)=>{
        if(err)
            console.log(err);
        else{
            db.getDB().collection(collectionDeleted).insertOne(result);
        }
    });

    // Najdi todočko podle ID a smaž ho
    db.getDB().collection(collection).findOneAndDelete({_id : db.getPrimaryKey(todoID)},(err,result)=>{
        if(err)
        {
            console.log(err);
        }
        else
            res.json(result);
    });
});

app.use((err,req,res,next)=>{
    res.status(err.status).json({
        error : {
            message : err.message
        }
    });
})

var server_port = process.env.YOUR_PORT || process.env.PORT || 80;
var server_host = process.env.YOUR_HOST || '0.0.0.0';

db.connect((err)=>{
    if(err){
        console.log('Nelze se připojit k databazi')
        process.exit(1);
    }
    else {
        app.listen(server_port, server_host, function() {
            console.log('Pripojen na port %d', server_port);
        });
    }
})
