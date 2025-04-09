const Product = require('../models/Product');

class ProductService {
    static async createProduct(productData) {
        try {
            const product = new Product({
                name: productData.name,
                description: productData.description,
                imageUrl: productData.imageUrl,
                totalBids: productData.totalBids,
                bidPrice: productData.bidPrice,
                owner: productData.owner || null
            });
            
            const savedProduct = await product.save();
            return await Product.findById(savedProduct._id); // Refetch to ensure all fields
        } catch (error) {
            throw error;
        }
    }

    static async getProductById(productId) {
        try {
            return await Product.findById(productId);
        } catch (error) {
            throw error;
        }
    }

    static async getAllProducts() {
        try {
            return await Product.find({});
        } catch (error) {
            throw error;
        }
    }

    static async updateProduct(productId, updateData) {
        try {
            return await Product.findByIdAndUpdate(
                productId,
                updateData,
                { new: true, runValidators: true }
            );
        } catch (error) {
            throw error;
        }
    }

    static async deleteProduct(productId) {
        try {
            return await Product.findByIdAndDelete(productId);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = ProductService;