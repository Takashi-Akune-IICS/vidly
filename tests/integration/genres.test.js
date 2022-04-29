const { default: mongoose } = require('mongoose');
const request = require('supertest');
const { Genre } = require('../../models/genres');
const { User } = require('../../models/user');
let server;

describe('/api/genres', () => {
    beforeEach(() => { server = require('../../index') });
    afterEach(async () => {
        await server.close();
        await Genre.deleteMany({});
    });

    describe('GET /', () => {
        it('should return all genres', async () => {
            await Genre.collection.insertMany([
                { name: 'genre1' },
                { name: 'genre2' }
            ]);

            const res = await request(server).get('/api/genres');
            expect(res.status).toBe(200);
            expect(res.body.length).toBe(2);
            expect(res.body.some(g => g.name === 'genre1')).toBeTruthy();
            expect(res.body.some(g => g.name === 'genre2')).toBeTruthy();
        })
    })

    describe('GET /:id', () => {
        it('should return 404 error if id is invalid', async () => {
            const res = await request(server).get('/api/genres/1');
            expect(res.status).toBe(404);
        });


        it('should return no genre with given id exists', async () => {
            const id = mongoose.Types.ObjectId();
            const res = await request(server).get('/api/genres/' + id);
            expect(res.status).toBe(404);
        });


        it('should return a genre if valid id is passed', async () => {
            const genre = new Genre({ name: 'genre1' });
            await genre.save();

            const res = await request(server).get('/api/genres/' + genre._id);

            expect(res.status).toBe(200);
            // expect(res.body.name).toBe(genre.name);
            expect(res.body).toHaveProperty('name', genre.name);
        })
    })

    describe('POST /', () => {
        let token;
        let name;
        const exec = async () => {
            return await request(server)
                .post('/api/genres/')
                .set('x-auth-token', token)
                .send({ name });
        }

        beforeEach(() => {
            token = new User().generateAuthToken();
            name = 'genre1';
        })

        it('should return a 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });
        it('should return a 400 if genre is less than 5 characters', async () => {
            name = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        })
        it('should return a 400 if genre is greater than 50 characters', async () => {
            name = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        })
        it('should save the genre if it is valid', async () => {
            await exec();

            const genre = await Genre.find({ name: 'genre1' });

            expect(genre).not.toBeNull();
        })
        it('should return the genre if it is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id');
            expect(res.body).toHaveProperty('name', 'genre1');

        })
    })

    describe('DELETE /:id', () => {
        let token, id;
        const exec = async () => {
            return await request(server)
                .delete('/api/genres/' + id)
                .set('x-auth-token', token)
                .send({})
        }

        beforeEach(async () => {
            token = new User({ isAdmin: true }).generateAuthToken();
            id = mongoose.Types.ObjectId();
            genre = new Genre({ _id: id, name: 'genre1' })
            await genre.save();
        })

        it('should return a 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return a 403 if client is not an Admin', async () => {
            token = new User({ isAdmin: false }).generateAuthToken();

            const res = await exec();

            expect(res.status).toBe(403);
        });

        it('should return 404 error if invalid ID', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return the deleted genre if id is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('_id', genre._id.toHexString());
            expect(res.body).toHaveProperty('name', 'genre1');
        })

        it('should delete the genre if id is valid', async () => {
            await exec();

            const genre = await Genre.findById(id);

            expect(genre).toBeNull();
        })

        it('should return 404 error if id does not exist', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        })
    })

    describe('PUT /:id', () => {
        let token, newName, genre, id;
        const exec = async () => {
            return await request(server)
                .put('/api/genres/' + id)
                .set('x-auth-token', token)
                .send({ name: newName });
        };

        beforeEach(async () => {
            genre = new Genre({ name: 'genre1' });
            await genre.save();

            id = genre._id;
            token = new User().generateAuthToken();
            newName = 'genre2';
        })

        it('should return a 401 if client is not logged in', async () => {
            token = '';

            const res = await exec();

            expect(res.status).toBe(401);
        });

        it('should return 400 error if name is shorter than 5 characters', async () => {
            newName = '1234';

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 400 error if name is longer than 50 characters', async () => {
            newName = new Array(52).join('a');

            const res = await exec();

            expect(res.status).toBe(400);
        });

        it('should return 404 error if genre with given id does not exist', async () => {
            id = mongoose.Types.ObjectId();

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should return 404 error if invalid ID', async () => {
            id = 1;

            const res = await exec();

            expect(res.status).toBe(404);
        });

        it('should update the genre if input is valid', async () => {
            await exec();

            const res = await Genre.findById(id);

            expect(res.name).toBe(newName);
        });

        it('should return the updated genre if input is valid', async () => {
            const res = await exec();

            expect(res.body).toHaveProperty('name', newName);
            expect(res.body).toHaveProperty('_id');
        });
    })
})