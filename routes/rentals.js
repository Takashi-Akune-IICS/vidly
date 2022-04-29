const express = require('express');
const mongoose = require('mongoose');
const Fawn = require('fawn');
const router = express.Router();
const { Rental, validateRental } = require('../models/rental')
const { Movie } = require('../models/movies');
const { Customer } = require('../models/customer');
const auth = require('../middleware/auth');

Fawn.init('mongodb://127.0.0.1:27017/vidly');

router.post('/', auth, async (req, res) => {
    const { error } = validateRental(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const customer = await Customer.findById(req.body.customerId);
    if (!customer) return res.status(400).send('Customer ID Not Found');

    const movie = await Movie.findById(req.body.movieId);
    if (!movie) return res.status(400).send('Movie ID Not Found');

    if (movie.numberInStock === 0) return res.status(400).send('Movie Not in Stock');

    let rental = new Rental({
        customer: {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone
        },
        movie: {
            _id: movie._id,
            title: movie.title,
            dailyRentalRate: movie.dailyRentalRate
        },
    });
    /*
    rental = await rental.save();
    movie.numberInStock--;
    movie.save();
    */
    try {
        new Fawn.Task()
            .save('rentals', rental)
            .update('movies', { _id: movie._id }, {
                $inc: { numberInStock: -1 }
            })
            .run();
        res.send(rental);
    } catch (error) {
        res.status(500).send('Something failed...');
    }
})

router.get('/', async (req, res) => {
    const rental = await Rental.find().sort('-dateOut');
    res.send(rental);
})

module.exports = router;