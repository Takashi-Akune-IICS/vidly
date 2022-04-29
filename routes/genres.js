const validateObjectId = require('../middleware/validateObjectId');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Genre, validate } = require('../models/genres');

router.get('/', async (req, res) => {
    // throw new Error('Could not get the genres');
    const genres = await Genre.find().sort({ name: 1 });
    res.send(genres);
});

router.get('/:id', validateObjectId, async (req, res) => {
    const genres = await Genre.findById(req.params.id);

    if (!genres) return res.status(404).send('Genre with given ID does not exist...');

    res.send(genres);
});

router.post('/', auth, async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let genre = new Genre({ name: req.body.name });

    genre = await genre.save();
    res.send(genre);
});

router.put('/:id', [auth, validateObjectId], async (req, res) => {
    const { error } = validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let genre = await Genre.findById(req.params.id);
    if (!genre) return res.status(404).send('Genre with given ID does not exist...');

    genre.set({ name: req.body.name });
    genre = await genre.save()
    res.send(genre);
});

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const genre = await Genre.findByIdAndDelete(req.params.id);
    if (!genre) return res.status(404).send('Genre with given ID does not exist...');

    res.send(genre);
});

module.exports = router;