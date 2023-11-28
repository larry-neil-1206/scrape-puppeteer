import express from 'express';
import ScrapperController from '../controllers/scrapper.controller.js'

const router = express.Router();

router.get('/', async (req, res) => {
  const products = await ScrapperController.getProducts();
  res.json(products);
});

export default router