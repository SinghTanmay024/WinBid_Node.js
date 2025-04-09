const ProductService = require("../services/productService");

class ProductController {
  static async createProduct(req, res) {
    console.log(req)
    // console.log(res)
    
    try {
      // Validate required fields
      const requiredFields = [
        "name",
        "description",
        "imageUrl",
        "totalBids",
        "bidPrice",
      ];
      const missingFields = requiredFields.filter((field) => !req.body[field]);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Missing required fields: ${missingFields.join(", ")}`,
        });
      }

      const product = await ProductService.createProduct(req.body);

      res.status(201).json({
        success: true,
        data: {
          _id: product._id,
          name: product.name,
          description: product.description,
          imageUrl: product.imageUrl,
          totalBids: product.totalBids,
          bidPrice: product.bidPrice,
          owner: product.owner,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getProduct(req, res) {
    try {
      const product = await ProductService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      res.status(200).json({
        success: true,
        data: product,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getAllProducts(req, res) {
    try {
      const products = await ProductService.getAllProducts();
      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async updateProduct(req, res) {
    try {
      const updatedProduct = await ProductService.updateProduct(
        req.params.id,
        req.body
      );
      if (!updatedProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      res.status(200).json({
        success: true,
        data: updatedProduct,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async deleteProduct(req, res) {
    try {
      const deletedProduct = await ProductService.deleteProduct(req.params.id);
      if (!deletedProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }
      res.status(200).json({
        success: true,
        message: "Product deleted successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

module.exports = ProductController;
