const express = require('express');
const router = express.Router();
const { ensureAuthenticated, forwardAuthenticated } = require('../config/auth');

// Login Page
router.get('/', forwardAuthenticated, (req, res) => res.redirect('users/login'));

// Dashboard
router.get('/index', ensureAuthenticated, (req, res) =>
    res.render('index', {
        user: req.user
    })
);

module.exports = router;