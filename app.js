require('dotenv').config()

const path = require('path')
const express = require('express')
const errorhandler = require('errorhandler')
const app = express()
const port = 3000

const logger = require('morgan')
const Prismic = require('@prismicio/client')
const PrismicDOM = require('prismic-dom')
const bodyParser = require('body-parser')
const methodOverride = require('method-override')

const initApi = req => {
  return Prismic.getApi(process.env.PRISMIC_ENDPOINT, {
    accessToken: process.env.PRISMIC_ACCESS_TOKEN,
    req: req
  })
}

const handleLinkResolver = doc => {
  if (doc.type === 'product') {
    return `/detail/${doc.slug}`
  }
  if (doc.type === 'about') {
    return '/about'
  }
  if (doc.type === 'collections') {
    return '/collections'
  }
  return '/'
}

app.use(logger('dev'))
app.use(errorhandler())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(methodOverride())

app.use((req, res, next) => {
  // res.locals.ctx = {
  //   endpoint: process.env.PRISMIC_ENDPOINT,
  //   linkResolver: handleLinkResolver
  // }

  res.locals.Link = handleLinkResolver
  // add PrismicDOM in locals to access them in templates.
  res.locals.PrismicDOM = PrismicDOM
  res.locals.Numbers = index => {
    return index === 0 ? 'One' : index === 1 ? 'Two' : index === 2 ? 'Three' : index === 3 ? 'Four' : ''
  }

  next()
})

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')

const handleRequest = async api => {
  const meta = await api.getSingle('meta')
  const preloader = await api.getSingle('preloader')
  const navigation = await api.getSingle('navigation')
  return {
    preloader,
    navigation,
    meta
  }
}

app.get('/', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const home = await api.getSingle('home')
  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.product_image'
  })
  res.render('pages/home', {
    ...defaults,
    home,
    collections
  })
})

app.get('/about', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const about = await api.getSingle('about')
  res.render('pages/about', {
    ...defaults,
    about
  })
})

app.get('/detail/:uid', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const product = await api.getByUID('product', req.params.uid, {
    fetchLinks: 'collection.title'
  })
  console.log(product)
  res.render('pages/detail', {
    ...defaults,
    product
  })
})

app.get('/collections', async (req, res) => {
  const api = await initApi(req)
  const defaults = await handleRequest(api)
  const home = await api.getSingle('home')
  const { results: collections } = await api.query(Prismic.Predicates.at('document.type', 'collection'), {
    fetchLinks: 'product.product_image'
  })

  // collections.forEach(collection => {
  //   console.log(collection.data.products[0])
  // })

  // console.log(collections)

  res.render('pages/collections', {
    ...defaults,
    home,
    collections
  })
})

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
