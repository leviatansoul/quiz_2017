var models = require("../models");
var Sequelize = require('sequelize');

var paginate = require('../helpers/paginate').paginate;

// Autoload el quiz asociado a :quizId
exports.load = function (req, res, next, quizId) {

    models.Quiz.findById(quizId)
    .then(function (quiz) {
        if (quiz) {
            req.quiz = quiz;
            next();
        } else {
            throw new Error('No existe ningún quiz con id=' + quizId);
        }
    })
    .catch(function (error) {
        next(error);
    });
};


// GET /quizzes
exports.index = function (req, res, next) {

    var countOptions = {};

    // Busquedas:
    var search = req.query.search || '';
    if (search) {
        var search_like = "%" + search.replace(/ +/g,"%") + "%";

        countOptions.where = {question: { $like: search_like }};
    }

    models.Quiz.count(countOptions)
    .then(function (count) {

        // Paginacion:

        var items_per_page = 10;

        // La pagina a mostrar viene en la query
        var pageno = parseInt(req.query.pageno) || 1;

        // Crear un string con el HTML que pinta la botonera de paginacion.
        // Lo añado como una variable local de res para que lo pinte el layout de la aplicacion.
        res.locals.paginate_control = paginate(count, items_per_page, pageno, req.url);

        var findOptions = countOptions;

        findOptions.offset = items_per_page * (pageno - 1);
        findOptions.limit = items_per_page;

        return models.Quiz.findAll(findOptions);
    })
    .then(function (quizzes) {
        res.render('quizzes/index.ejs', {
            quizzes: quizzes,
            search: search
        });
    })
    .catch(function (error) {
        next(error);
    });
};


// GET /quizzes/:quizId
exports.show = function (req, res, next) {

    res.render('quizzes/show', {quiz: req.quiz});
};


// GET /quizzes/new
exports.new = function (req, res, next) {

    var quiz = {question: "", answer: ""};

    res.render('quizzes/new', {quiz: quiz});
};


// POST /quizzes/create
exports.create = function (req, res, next) {

    var quiz = models.Quiz.build({
        question: req.body.question,
        answer: req.body.answer
    });

    // guarda en DB los campos pregunta y respuesta de quiz
    quiz.save({fields: ["question", "answer"]})
    .then(function (quiz) {
        req.flash('success', 'Quiz creado con éxito.');
        res.redirect('/quizzes/' + quiz.id);
    })
    .catch(Sequelize.ValidationError, function (error) {

        req.flash('error', 'Errores en el formulario:');
        for (var i in error.errors) {
            req.flash('error', error.errors[i].value);
        }

        res.render('quizzes/new', {quiz: quiz});
    })
    .catch(function (error) {
        req.flash('error', 'Error al crear un Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/edit
exports.edit = function (req, res, next) {

    res.render('quizzes/edit', {quiz: req.quiz});
};


// PUT /quizzes/:quizId
exports.update = function (req, res, next) {

    req.quiz.question = req.body.question;
    req.quiz.answer = req.body.answer;

    req.quiz.save({fields: ["question", "answer"]})
    .then(function (quiz) {
        req.flash('success', 'Quiz editado con éxito.');
        res.redirect('/quizzes/' + req.quiz.id);
    })
    .catch(Sequelize.ValidationError, function (error) {

        req.flash('error', 'Errores en el formulario:');
        for (var i in error.errors) {
            req.flash('error', error.errors[i].value);
        }

        res.render('quizzes/edit', {quiz: req.quiz});
    })
    .catch(function (error) {
        req.flash('error', 'Error al editar el Quiz: ' + error.message);
        next(error);
    });
};


// DELETE /quizzes/:quizId
exports.destroy = function (req, res, next) {

    req.quiz.destroy()
    .then(function () {
        req.flash('success', 'Quiz borrado con éxito.');
        res.redirect('/quizzes');
    })
    .catch(function (error) {
        req.flash('error', 'Error al editar el Quiz: ' + error.message);
        next(error);
    });
};


// GET /quizzes/:quizId/play
exports.play = function (req, res, next) {

    var answer = req.query.answer || '';

    res.render('quizzes/play', {
        quiz: req.quiz,
        answer: answer
    });
};


// GET /quizzes/:quizId/check
exports.check = function (req, res, next) {

    var answer = req.query.answer || "";

    var result = answer.toLowerCase().trim() === req.quiz.answer.toLowerCase().trim();

    res.render('quizzes/result', {
        quiz: req.quiz,
        result: result,
        answer: answer
    });
};

// Funciones accesorias

function getRandomInt(minInc, maxInc) {
    return Math.floor(Math.random() * (maxInc - minInc + 1)) + minInc;
}

function arrayDiff (a, b) {
    return a.filter(function(i) {return b.indexOf(i) < 0;});
}

function getRandomUnansweredId (allIds, answeredIds){
    var unansweredIds = arrayDiff(allIds, answeredIds);
    return unansweredIds[getRandomInt(0, unansweredIds.length -1)];
}



// GET + /quizzes/randomplay
exports.randomplay = function (req, res, next) {

    var countOptions = {};

    // Busquedas:
    var search = req.query.search || '';
    if (search) {
        var search_like = "%" + search.replace(/ +/g,"%") + "%";
        countOptions.where = {question: { $like: search_like }};
    }

    models.Quiz.count(countOptions)
    .then(function (count) {
        return models.Quiz.findAll();
    })
    .then(function (quizzes) {

        var allIds = quizzes.map(function(quiz){return quiz.id;});

        if (req.session.correctAnswersIds == undefined ) {
            req.session.correctAnswersIds = [];
        }

        var correctAnsweredQuestions = req.session.correctAnswersIds;
        var score = correctAnsweredQuestions.length

        var randomUnansweredId = getRandomUnansweredId(allIds, correctAnsweredQuestions)

        // Si hemos respondido a todo bien...
        if (randomUnansweredId == undefined) {

            // Reseteamos la puntuación por si quieren volver a jugar:
            req.session.correctAnswersIds = [];

            // Renderizamos la página que dice que no hay más preguntas
            res.render('quizzes/random_nomore.ejs', {score: score})

        // Si quedan cosas por contestar...
        } else {
            var quiz = quizzes[allIds.indexOf(randomUnansweredId)]

            res.render('quizzes/random_play.ejs', {
                quiz: quiz,
                score: score
            });
        }
    })
    .catch(function (error) {
        next(error);
    });
};

// GET + /quizzes/randomcheck/:quizId?answer=respuesta
exports.random_result = function (req, res, next) {

    // Sacamos la respuesta que nos han mandado
    var answer = req.query.answer;

    // Elegimos el quiz con quizId
    var quiz = req.quiz;

    // Sacamos su respuesta
    var expectedAnswer = quiz.answer

    // Si la respuesta coincide con la de los parámetros, añadimos esa respuesta
    // a su lista de contestadas y lo renderizamos en positivo
    var result = answer.toLowerCase().trim() === expectedAnswer.toLowerCase().trim();
    if (result) {
        if (req.session.correctAnswersIds == undefined ) {
            req.session.correctAnswersIds = [quiz.id];
        } else {
            req.session.correctAnswersIds.push(quiz.id);
        }

        var score = req.session.correctAnswersIds.length;

        res.render('quizzes/random_result.ejs', {
            score: score,
            result: true,
            answer: answer
        });

    // Si la respuesta no coincide, lo renderizamos en negativo y ya
    } else {

        var score;
        if (req.session.correctAnswersIds == undefined ) {
            score = 0;
        } else {
            score = req.session.correctAnswersIds.length;
        }

        // Reseteamos el número de respuestas acertadas, porque es un requisito
        // que éstas se acierten consecutivamente
        req.session.correctAnswersIds = []

        res.render('quizzes/random_result.ejs', {
            score: score,
            result: false,
            answer: answer
        });
    }
};










