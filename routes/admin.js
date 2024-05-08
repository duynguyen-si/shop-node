const path = require('path');

const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get(
  '/add-product',
  isAuth,
  adminController.getAddProduct
);

// /admin/products => GET
router.get(
  '/products',
  isAuth,
  adminController.getProducts
);

// /admin/add-product => POST
router.post(
  '/add-product',
  [
    body(
      'title',
      'Title must be numbers or text and at least 5 characters.'
    )
      .trim()
      .isLength({ min: 5 })
      .isString(),
    body('imageUrl', 'Image URL is not valid.')
      .trim()
      .isURL(),
    body('price', 'Price must be float.').isFloat(),
    body(
      'description',
      'Description must be text or number and at least 5 character in length and max 500.'
    )
      .trim()
      .isLength({ min: 5, max: 500 }),
  ],
  isAuth,
  adminController.postAddProduct
);

router.get(
  '/edit-product/:productId',
  isAuth,
  adminController.getEditProduct
);

router.post(
  '/edit-product',
  [
    body(
      'title',
      'Title must be numbers or text and at least 5 characters.'
    )
      .trim()
      .isLength({ min: 5 })
      .isString(),
    body('imageUrl', 'Image URL is not valid.')
      .trim()
      .isURL(),
    body('price', 'Price must be float.').isFloat(),
    body(
      'description',
      'Description must be text or number and at least 5 character in length and max 500.'
    )
      .trim()
      .isLength({ min: 5, max: 500 }),
  ],
  isAuth,
  adminController.postEditProduct
);

router.post(
  '/delete-product',
  isAuth,
  adminController.postDeleteProduct
);

module.exports = router;
