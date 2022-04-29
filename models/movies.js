const Joi = require('joi');
const mongoose = require('mongoose');
const { genreSchema } = require('./genres')

const Movie = mongoose.model('Movie', new mongoose.Schema({
    title: {
        required: true,
        type: String,
        trim: true,
        minlength: 5,
        maxlength: 255
    },
    genre: {
        type: genreSchema,
        required: true
    },
    numberInStock: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    },
    dailyRentalRate: {
        type: Number,
        required: true,
        min: 0,
        max: 255
    }
}));

function validateMovie(movie) {
    const schema = Joi.object({
        title: Joi.string().min(3).required(),
        genreId: Joi.objectId().required(),
        numberInStock: Joi.number().min(0).required(),
        dailyRentalRate: Joi.number().min(0).required()    
    })
    return schema.validate(movie)
}

exports.validateMovie = validateMovie;
exports.Movie = Movie;