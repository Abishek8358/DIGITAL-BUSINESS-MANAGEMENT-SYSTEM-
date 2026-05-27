import { Router } from 'express';
import { 
  getProducts, createProduct, updateProduct, deleteProduct,
  getProductBrands, createBrand, deleteBrand,
  getBrandVariants, createVariant, updateVariant, deleteVariant,
  getFlatVariants, getProductsHierarchy
} from '../controllers/productController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Products
router.get('/', authenticateToken, getProducts);
router.post('/', authenticateToken, createProduct);
router.put('/:id', authenticateToken, updateProduct);
router.delete('/:id', authenticateToken, deleteProduct);

// Nested brands/variants hierarchies
router.get('/hierarchy', authenticateToken, getProductsHierarchy);
router.get('/flat', authenticateToken, getFlatVariants);

// Brands
router.get('/:productId/brands', authenticateToken, getProductBrands);
router.post('/brands', authenticateToken, createBrand);
router.delete('/brands/:id', authenticateToken, deleteBrand);

// Variants
router.get('/brands/:brandId/variants', authenticateToken, getBrandVariants);
router.post('/variants', authenticateToken, createVariant);
router.put('/variants/:id', authenticateToken, updateVariant);
router.delete('/variants/:id', authenticateToken, deleteVariant);

export default router;
