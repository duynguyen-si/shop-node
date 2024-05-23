const fs = require('fs');
const path = require('path');
const moment = require('moment');

const PDFDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

const ITEMS_PER_PAGE = 2;

const _this = this;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products',
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/',
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const products = user.cart.items;
      // If product is not available but still there are product ids remain causing null
      const updatedCartItems = products.filter(
        (prod) => prod.productId !== null
      );
      // Re-assign new value for user's cart
      user.cart.items = updatedCartItems;
      return user.save();
    })
    .then((userDoc) => {
      return res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: userDoc.cart.items,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect('/cart');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      products = user.cart.items;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });
      return fetch(
        'https://my.sepay.vn/userapi/bankaccounts/list',
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization:
              'Bearer A1KSOUGQORYFWCN7FPZD1D5XFLYE2X0YGHLIT39P9VD3VBISOMZES8VCNQWXKWQN',
          },
        }
      );
    })
    .then((cartListData) => {
      return cartListData.json();
    })
    .then((cartList) => {
      let cartData;
      if (
        !cartList.error &&
        cartList?.bankaccounts?.length > 0
      ) {
        cartData = cartList.bankaccounts[0];
      }

      const transaction = {
        code:
          'CK' +
          Math.random()
            .toString(16)
            .substring(2, 10)
            .toUpperCase(),
        to_account_number: cartData.account_number,
        date: moment().format('YYYY-MM-DD HH:mm:ss'),
      };

      req.session.transaction = transaction;

      return req.session.save((err) => {
        if (!err) {
          return res.render('shop/checkout', {
            path: '/checkout',
            pageTitle: 'Checkout',
            products: products,
            totalSum: Math.ceil(total * 100) / 100,
            cardData: cartData,
            transaction: transaction,
          });
        }
        return res.redirect('/');
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return {
          quantity: i.quantity,
          product: { ...i.productId._doc },
        };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then((orders) => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error('No order found.'));
      }
      if (
        order.user.userId.toString() !==
        req.user._id.toString()
      ) {
        return next(new Error('Unauthorized.'));
      }
      const invoiceName = 'invoice-' + orderId + '.pdf';
      const invoicePath = path.join(
        'data',
        'invoices',
        invoiceName
      );

      const pdfDoc = new PDFDocument();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        'inline; filename="' + invoiceName + '"'
      );

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);
      // Set up PDF content
      pdfDoc.fontSize(26).text('Invoice', {
        underline: true,
        stroke: true,
      });
      pdfDoc.text('------------------');
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;

        pdfDoc
          .fontSize(14)
          .text(
            prod.product.title +
              ' - ' +
              prod.quantity +
              ' x ' +
              '$' +
              prod.product.price
          );
      });
      pdfDoc.text('------------------');
      pdfDoc.text('Total: $' + totalPrice);
      // End PDF content
      pdfDoc.end();

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader('Content-Type', 'application/pdf');
      //   res.setHeader(
      //     'Content-Disposition',
      //     'inline; filename="' + invoiceName + '"'
      //   );
      //   res.send(data);
      // });

      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    })
    .catch((err) => next(err));
};

exports.getTransactions = (req, res, next) => {
  if (req.session?.transaction?.code) {
    fetch(
      `https://my.sepay.vn/userapi/transactions/list?transaction_date_min=${req.session?.transaction?.date}&limit=20`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization:
            'Bearer A1KSOUGQORYFWCN7FPZD1D5XFLYE2X0YGHLIT39P9VD3VBISOMZES8VCNQWXKWQN',
        },
      }
    )
      .then((data) => {
        return data.json();
      })
      .then((transactionList) => {
        // Check if the transaction list contain a transaction with
        const transactions = transactionList.transactions;
        if (
          transactions.find((transaction) =>
            transaction.transaction_content.includes(
              req.session?.transaction?.code
            )
          )
        ) {
          return req.user
            .populate('cart.items.productId')
            .then((user) => {
              const products = user.cart.items.map((i) => {
                return {
                  quantity: i.quantity,
                  product: { ...i.productId._doc },
                };
              });
              const order = new Order({
                user: {
                  email: req.user.email,
                  userId: req.user,
                },
                products: products,
              });
              return order.save();
            })
            .then((result) => {
              return req.user.clearCart();
            })
            .then((result) => {
              return res
                .status(200)
                .json({ isSuccess: true });
            });
        } else {
          return res.status(200).json({ isSuccess: false });
        }
      })
      .catch((err) => {
        return next(
          new Error(
            'There is an error while trying to get transaction data.'
          )
        );
      });
  }
};
