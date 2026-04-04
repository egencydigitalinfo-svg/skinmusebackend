import Product from "../models/Products.js";
import cloudinary from "../config/cloudinary.js";
import Brand from "../models/Brands.js";
import Category from "../models/Category.js";

// Helper: upload image to Cloudinary
const uploadImageToCloudinary = async (fileBuffer, folder = "products") => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(fileBuffer);
  });
};

export const updateBrandDiscountFromProducts = async (brandId) => {
  try {
    const products = await Product.find({ brandId });

    // Filter products that have a positive discount
    const discounts = products
      .map((p) => Number(p.discount))
      .filter((d) => !isNaN(d) && d > 0);

    if (discounts.length === 0) {
      // No product has positive discount, so remove discount field from brand
      await Brand.findByIdAndUpdate(brandId, { $unset: { discount: "" } });
      return;
    }

    const highestDiscount = Math.max(...discounts);
    await Brand.findByIdAndUpdate(brandId, { discount: highestDiscount });
  } catch (err) {
    console.error("Failed to update brand discount:", err.message);
  }
};

// ✅ Add product (supports multiple images)
// export const addProduct = async (req, res) => {
//   try {
//     const { name, price, description, category, brandId, stock, productType } =
//       req.body;

//     if (!name || !price || !brandId) {
//       return res
//         .status(400)
//         .json({ message: "Name, Price, and Brand are required!" });
//     }

//     // Parse discount
//     let discount;
//     const discountNumber = Number(req.body.discount);
//     if (!isNaN(discountNumber) && discountNumber > 0) discount = discountNumber;

//     // Parse JSON fields
//     const safeParse = (key) => {
//       try {
//         return req.body[key] ? JSON.parse(req.body[key]) : [];
//       } catch {
//         return [];
//       }
//     };
//     const skinTypes = safeParse("skinTypes");
//     const ingredients = safeParse("ingredients");
//     const colors = safeParse("colors").map((c) => ({
//       name: c.name,
//       hex: c.hex,
//       stock: Number(c.stock) || 0,
//       price: Number(c.price) || undefined, // ✅ price per color
//     }));

//     const litres = safeParse("litres").map((l) => ({
//       amount: l.amount,
//       stock: Number(l.stock) || 0,
//       price: Number(l.price) || undefined, // ✅ price per litre
//     }));

//     // Upload multiple images
//     let imageUrls = [];
//     if (req.files && req.files.length > 0) {
//       imageUrls = await Promise.all(
//         req.files.map(async (file) => {
//           const result = await uploadImageToCloudinary(file.buffer, "products");
//           return result.secure_url;
//         })
//       );
//     }

//     const calculateTotalStock = () => {
//       let total = 0;

//       // Sum color variant stocks
//       if (colors.length > 0) {
//         total += colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0);
//       }

//       // Sum litre variant stocks
//       if (litres.length > 0) {
//         total += litres.reduce((sum, l) => sum + (Number(l.stock) || 0), 0);
//       }

//       // If no variants, use standalone stock
//       if (total === 0) {
//         total = parseInt(stock || "0");
//       }

//       return total;
//     };
//     const finalStock = calculateTotalStock();

//     const newProduct = new Product({
//       name,
//       price,
//       description,
//       category,
//       productType,
//       stock: finalStock,
//       brandId,
//       ...(discount ? { discount } : {}),
//       skinType: skinTypes,
//       ingredients,
//       colors,
//       litres,
//       images: imageUrls, // ✅ store array
//       isTrending: req.body.isTrending ?? false,
//       isHotSale: req.body.isHotSale ?? false,
//       isFeatured: req.body.isFeatured ?? false,
//     });

//     const saved = await newProduct.save();
//     await updateBrandDiscountFromProducts(saved.brandId);

//     res.status(201).json(saved);
//   } catch (error) {
//     console.error("Add Product Error:", error);
//     res.status(500).json({ message: error.message });
//   }
// };

export const addProduct = async (req, res) => {
  try {
    const {
      name,
      price,
      description,
      category,
      subcategory,
      brandId,
      stock,
      productType,
    } = req.body;

    if (!name || !price || !brandId || !category) {
      return res.status(400).json({ message: "Name, Price, Brand, and Category are required!" });
    }

    // Parse discount
    let discount;
    const discountNumber = Number(req.body.discount);
    if (!isNaN(discountNumber) && discountNumber > 0) discount = discountNumber;

    // Parse JSON arrays safely
    const safeParse = (key) => {
      try {
        return req.body[key] ? JSON.parse(req.body[key]) : [];
      } catch {
        return [];
      }
    };

    const skinTypes = safeParse("skinTypes");
    const ingredients = safeParse("ingredients");
    const colors = safeParse("colors").map(c => ({
      name: c.name,
      hex: c.hex,
      stock: Number(c.stock) || 0,
      price: Number(c.price) || undefined,
    }));
    const litres = safeParse("litres").map(l => ({
      amount: l.amount,
      stock: Number(l.stock) || 0,
      price: Number(l.price) || undefined,
    }));

    // Upload images
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadImageToCloudinary(file.buffer, "products");
          return result.secure_url;
        })
      );
    }

    // Calculate total stock
    const finalStock = colors.reduce((sum, c) => sum + c.stock, 0) +
                       litres.reduce((sum, l) => sum + l.stock, 0) || parseInt(stock || 0);

    // Create product
    let newProduct = new Product({
      name,
      price,
      description,
      category,
      subcategory, // store subcategory ID
      productType,
      stock: finalStock,
      brandId,
      ...(discount ? { discount } : {}),
      skinType: skinTypes,
      ingredients,
      colors,
      litres,
      images: imageUrls,
      isTrending: req.body.isTrending ?? false,
      isHotSale: req.body.isHotSale ?? false,
      isFeatured: req.body.isFeatured ?? false,
    });

    newProduct = await newProduct.save();

    // 🔹 Populate subcategory (and optionally category) for response
    const populatedProduct = await Product.findById(newProduct._id)
      .populate("subcategory", "name") // include subcategory name
      .populate("category", "name");   // include category name if you want

    // Update brand discount
    await updateBrandDiscountFromProducts(populatedProduct.brandId);

    res.status(201).json({ message: "Product added successfully", product: populatedProduct });

  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ✅ Update product (can add new images & delete removed images)
// export const updateProduct = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { existingImages } = req.body; // stringified JSON array
//     const existingImagesArray = existingImages
//       ? JSON.parse(existingImages)
//       : [];

//     const { name, price, description, category, brandId, stock, productType } =
//       req.body;

//     const product = await Product.findById(id);
//     if (!product) return res.status(404).json({ message: "Product not found" });

//     // Parse JSON fields
//     const safeParse = (key) => {
//       try {
//         return req.body[key] ? JSON.parse(req.body[key]) : [];
//       } catch {
//         return [];
//       }
//     };
//     const skinTypes = safeParse("skinTypes");
//     const ingredients = safeParse("ingredients");
//     const colors = safeParse("colors");
//     const litres = safeParse("litres"); // NEW

//     // ✅ Remove deleted existing images
//     product.images = product.images.filter((imgUrl) =>
//       existingImagesArray.includes(imgUrl)
//     );

//     // ✅ Handle new images (append to existing ones)
//     if (req.files && req.files.length > 0) {
//       const newUrls = await Promise.all(
//         req.files.map(async (file) => {
//           const result = await uploadImageToCloudinary(file.buffer, "products");
//           return result.secure_url;
//         })
//       );
//       product.images = [...product.images, ...newUrls]; // append
//     }

//     // Update fields
//     product.name = name ?? product.name;
//     product.price = price ?? product.price;
//     product.description = description ?? product.description;
//     product.category = category ?? product.category;
//     product.productType = productType ?? product.productType;
//     product.brandId = brandId ?? product.brandId;
//     product.skinType = skinTypes;
//     product.ingredients = ingredients;
//     product.colors = colors;
//     product.litres = litres;

//     if (req.body.discount !== undefined) {
//       const discountNumber = Number(req.body.discount);
//       product.discount =
//         !isNaN(discountNumber) && discountNumber > 0
//           ? discountNumber
//           : undefined;
//     }

//     // Update stock automatically
//     const updatedStock =
//       colors.length > 0 || litres.length > 0
//         ? colors.reduce((sum, c) => sum + (Number(c.stock) || 0), 0) +
//           litres.reduce((sum, l) => sum + (Number(l.stock) || 0), 0)
//         : parseInt(stock ?? product.stock);

//     product.stock = updatedStock;

//     product.isTrending = req.body.isTrending ?? product.isTrending;
//     product.isHotSale = req.body.isHotSale ?? product.isHotSale;
//     product.isFeatured = req.body.isFeatured ?? product.isFeatured;

//     const updatedProduct = await product.save();
//     if (updatedProduct.brandId)
//       await updateBrandDiscountFromProducts(updatedProduct.brandId);

//     res.json(updatedProduct);
//   } catch (err) {
//     console.error("Error updating product:", err);
//     res.status(500).json({ message: err.message });
//   }
// };


export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Extract images & JSON fields
    const { existingImages, category, subcategory } = req.body;
    const existingImagesArray = existingImages ? JSON.parse(existingImages) : [];

    const product = await Product.findById(id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Helper to safely parse JSON arrays from request body
    const safeParse = (key) => {
      try {
        return req.body[key] ? JSON.parse(req.body[key]) : [];
      } catch {
        return [];
      }
    };

    const skinTypes = safeParse("skinTypes");
    const ingredients = safeParse("ingredients");
    const colors = safeParse("colors").map(c => ({
      name: c.name,
      hex: c.hex,
      stock: Number(c.stock) || 0,
      price: Number(c.price) || undefined
    }));
    const litres = safeParse("litres").map(l => ({
      amount: l.amount,
      stock: Number(l.stock) || 0,
      price: Number(l.price) || undefined
    }));

    // Remove deleted existing images
    product.images = product.images.filter((imgUrl) =>
      existingImagesArray.includes(imgUrl)
    );

    // Upload new images
    if (req.files && req.files.length > 0) {
      const newUrls = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadImageToCloudinary(file.buffer, "products");
          return result.secure_url;
        })
      );
      product.images = [...product.images, ...newUrls];
    }

    // Update basic fields
    product.name = req.body.name ?? product.name;
    product.price = req.body.price ?? product.price;
    product.description = req.body.description ?? product.description;
    product.productType = req.body.productType ?? product.productType;
    product.brandId = req.body.brandId ?? product.brandId;

    // ✅ Update category and subcategory
    product.category = category ?? product.category;
    product.subcategory = subcategory ?? product.subcategory;

    // Update JSON arrays
    product.skinType = skinTypes;
    product.ingredients = ingredients;
    product.colors = colors;
    product.litres = litres;

    // Update discount if provided
    if (req.body.discount !== undefined) {
      const discountNumber = Number(req.body.discount);
      product.discount = !isNaN(discountNumber) && discountNumber > 0 ? discountNumber : undefined;
    }

    // Update stock automatically
    const updatedStock =
      colors.length > 0 || litres.length > 0
        ? colors.reduce((sum, c) => sum + c.stock, 0) +
          litres.reduce((sum, l) => sum + l.stock, 0)
        : parseInt(req.body.stock ?? product.stock);
    product.stock = updatedStock;

    // Update flags
    product.isTrending = req.body.isTrending ?? product.isTrending;
    product.isHotSale = req.body.isHotSale ?? product.isHotSale;
    product.isFeatured = req.body.isFeatured ?? product.isFeatured;

    // Save product
    const updatedProduct = await product.save();

    // Update brand discount automatically
    if (updatedProduct.brandId) await updateBrandDiscountFromProducts(updatedProduct.brandId);

    // Populate category & subcategory for response
    await updatedProduct.populate([
      { path: "category", select: "name" },
      { path: "subcategory", select: "name" },
      { path: "brandId", select: "name" },
    ]);

    res.json({
      success: true,
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("Error updating product:", err);
    res.status(500).json({ message: err.message });
  }
};


// ✅ Get all products
// export const getProducts = async (req, res) => {
//   try {
//     const products = await Product.find().populate({
//       path: "brandId",
//       select: "name category discount logo",
//     });

//     const productsWithBrand = products.map((p) => {
//       const brand = p.brandId; // may be null
//       return {
//         ...p._doc,
//         category: p.category || brand?.category || null, // ✅ ensure category always filled
//         brand: brand || null,
//         brandId: brand?._id || null,
//         isFeatured: p.isFeatured,
//         isTrending: p.isTrending,
//         isHotSale: p.isHotSale,
//         ingredients: p.ingredients || [],
//       };
//     });

//     res.json(productsWithBrand);
//   } catch (err) {
//     console.error("Error fetching products:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

// WithOut Brand Name
// export const getProducts = async (req, res) => {
//   try {
//     // Fetch all products and populate brand info
//     const products = await Product.find()
//       .populate({
//         path: "brandId",
//         select: "name category discount logo",
//       })
//       .lean();

//     // Fetch all categories once
//     const categories = await Category.find().lean();

//     const productsWithCategory = products.map((p) => {
//       const brand = p.brandId || null;

//       // Find main category object
//       const mainCategoryObj = categories.find(
//         (c) => c._id.toString() === (p.category?.toString() || "")
//       );

//       // Find subcategory object if product has subcategory
//       let subcategoryTitle = null;
//       if (p.subcategory) {
//         const subCategoryObj = categories.find(
//           (c) => c._id.toString() === p.subcategory.toString()
//         );
//         subcategoryTitle = subCategoryObj ? subCategoryObj.title : null;
//       }

//       return {
//         ...p,
//         category: mainCategoryObj?.title || brand?.category || null,
//         subcategory: subcategoryTitle,
//         brand: brand || null,
//         brandId: brand?._id || null,
//         isFeatured: p.isFeatured,
//         isTrending: p.isTrending,
//         isHotSale: p.isHotSale,
//         ingredients: p.ingredients || [],
//       };
//     });

//     res.json(productsWithCategory);
//   } catch (err) {
//     console.error("Error fetching products:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };

export const getProducts = async (req, res) => {
  try {
    const { category, subcategory } = req.query;

    // 🔹 Build filter (for API filtering)
    let filter = {};
    if (subcategory) {
      filter.subcategory = subcategory;
    } else if (category) {
      filter.category = category;
    }

    // 🔹 Fetch products
    const products = await Product.find(filter)
      .populate({
        path: "brandId",
        select: "name category discount logo",
      })
      .lean();

    // 🔹 Fetch categories
    const categories = await Category.find().lean();

    // 🔹 Map products
    const productsWithCategory = products.map((p) => {
      const brand = p.brandId || null;

      // ✅ Main category object
      const mainCategoryObj = categories.find(
        (c) => c._id.toString() === (p.category?.toString() || "")
      );

      // ✅ Subcategory object
      let subcategoryObj = null;
      if (p.subcategory) {
        subcategoryObj = categories.find(
          (c) => c._id.toString() === p.subcategory.toString()
        );
      }

      return {
        ...p,

        // ✅ CATEGORY (ID + TITLE)
        category: mainCategoryObj
          ? {
              _id: mainCategoryObj._id,
              title: mainCategoryObj.title,
            }
          : null,

        // ✅ SUBCATEGORY (ID + TITLE)
        subcategory: subcategoryObj
          ? {
              _id: subcategoryObj._id,
              title: subcategoryObj.title,
            }
          : null,

        // ✅ BRAND CLEAN STRUCTURE
        brand: brand
          ? {
              _id: brand._id || null,
              name: brand.name || null,
              category: brand.category || null,
              discount: brand.discount || null,
              logo: brand.logo || null,
            }
          : null,

        brandId: brand?._id || null,
        brandName: brand?.name || null,

        // Flags
        isFeatured: p.isFeatured,
        isTrending: p.isTrending,
        isHotSale: p.isHotSale,

        ingredients: p.ingredients || [],
      };
    });

    res.json(productsWithCategory);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};



export const getShopData = async (req, res) => {
  try {
    const { category, subcategory } = req.query;

    // 🔹 Fetch all data
    const [products, categories] = await Promise.all([
      Product.find()
        .populate({
          path: "brandId",
          select: "name category discount logo",
        })
        .lean(),
      Category.find().lean(),
    ]);

    // =========================================================
    // ✅ 1. PRODUCT FILTERING (based on query)
    // =========================================================
    let filteredProducts = products;

    if (subcategory) {
      filteredProducts = products.filter(
        (p) => p.subcategory?.toString() === subcategory
      );
    } else if (category) {
      filteredProducts = products.filter(
        (p) => p.category?.toString() === category
      );
    }

    // =========================================================
    // ✅ 2. COUNT CALCULATION
    // =========================================================
    const categoryCount = {};
    const subcategoryCount = {};

    products.forEach((p) => {
      if (p.category) {
        const key = p.category.toString();
        categoryCount[key] = (categoryCount[key] || 0) + 1;
      }

      if (p.subcategory) {
        const key = p.subcategory.toString();
        subcategoryCount[key] = (subcategoryCount[key] || 0) + 1;
      }
    });

    // =========================================================
    // ✅ 3. CATEGORY TREE BUILD
    // =========================================================
    const categoryTree = categories
      .filter((cat) => !cat.parent_id) // main categories
      .map((cat) => {
        const subs = categories
          .filter(
            (sub) => sub.parent_id?.toString() === cat._id.toString()
          )
          .map((sub) => ({
            _id: sub._id,
            title: sub.title,
            count: subcategoryCount[sub._id] || 0,
          }));

        return {
          _id: cat._id,
          title: cat.title,
          count: categoryCount[cat._id] || 0,
          subcategories: subs,
        };
      });

    // =========================================================
    // ✅ 4. FORMAT PRODUCTS (ID + TITLE)
    // =========================================================
    const formattedProducts = filteredProducts.map((p) => {
      const brand = p.brandId || null;

      const mainCategoryObj = categories.find(
        (c) => c._id.toString() === p.category?.toString()
      );

      const subCategoryObj = categories.find(
        (c) => c._id.toString() === p.subcategory?.toString()
      );

      return {
        ...p,

        category: mainCategoryObj
          ? {
              _id: mainCategoryObj._id,
              title: mainCategoryObj.title,
            }
          : null,

        subcategory: subCategoryObj
          ? {
              _id: subCategoryObj._id,
              title: subCategoryObj.title,
            }
          : null,

        brand: brand
          ? {
              _id: brand._id,
              name: brand.name,
              category: brand.category,
              discount: brand.discount,
              logo: brand.logo,
            }
          : null,

        brandId: brand?._id || null,
        brandName: brand?.name || null,
      };
    });

    // =========================================================
    // ✅ FINAL RESPONSE
    // =========================================================
    res.json({
      success: true,
      categories: categoryTree,
      products: formattedProducts,
      totalProducts: formattedProducts.length,
    });

  } catch (err) {
    console.error("❌ Shop API Error:", err);
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};





// export const getProducts = async (req, res) => {
//   try {
//     const products = await Product.find()
//       .populate({
//         path: "brandId",
//         select: "name category discount logo",
//       })
//       .lean();

//     const categories = await Category.find().lean();

//     const productsWithCategory = products.map((p) => {
//       const brand = p.brandId || null;

//       // ── Main category → resolve to title string ──────────────────────────
//       const mainCategoryObj = categories.find(
//         (c) => c._id.toString() === (p.category?.toString() || "")
//       );

//       // ── Subcategory → resolve to BOTH _id AND title ──────────────────────
//       // Frontend needs _id for filter matching AND title for display/count
//       let subcategoryData = null;
//       if (p.subcategory) {
//         const subCategoryObj = categories.find(
//           (c) => c._id.toString() === p.subcategory.toString()
//         );
//         if (subCategoryObj) {
//           subcategoryData = {
//             _id:   subCategoryObj._id,
//             title: subCategoryObj.title,
//           };
//         }
//       }

//       return {
//         ...p,
//         // Main category as title string (frontend uses for display + category filter)
//         category: mainCategoryObj?.title || brand?.category || null,

//         // Subcategory as object { _id, title } so frontend can match both ways
//         subcategory: subcategoryData,

//         brand: brand
//           ? {
//               _id:      brand._id      || null,
//               name:     brand.name     || null,
//               category: brand.category || null,
//               discount: brand.discount || null,
//               logo:     brand.logo     || null,
//             }
//           : null,
//         brandId:    brand?._id    || null,
//         brandName:  brand?.name   || null,
//         isFeatured: p.isFeatured,
//         isTrending: p.isTrending,
//         isHotSale:  p.isHotSale,
//         ingredients: p.ingredients || [],
//       };
//     });

//     res.json(productsWithCategory);
//   } catch (err) {
//     console.error("Error fetching products:", err);
//     res.status(500).json({ success: false, error: err.message });
//   }
// };





// ✅ Get highlighted products
export const getHighlights = async (req, res) => {
  try {
    const products = await Product.find().populate({
      path: "brandId",
      select: "name category discount logo",
    });

    const productsWithFlags = products.map((p) => {
      const brand = p.brandId;

      return {
        ...p._doc,
        brand: brand || null,
        brandId: brand?._id || null, // ✅ safe
        isFeatured: p.isFeatured,
        isTrending: p.isTrending,
        isHotSale: p.isHotSale,
        ingredients: p.ingredients || [],
      };
    });

    res.json(productsWithFlags);
  } catch (err) {
    console.error("Error fetching highlighted products:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Get product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id).populate({
      path: "brandId",
      select: "name category discount logo",
    });

    if (!product) return res.status(404).json({ message: "Product not found" });

    const brand = product.brandId;

    res.json({
      ...product._doc,
      brand: brand || null,
      brandId: brand?._id || null, // ✅ safe
      isFeatured: product.isFeatured,
      isTrending: product.isTrending,
      isHotSale: product.isHotSale,
      ingredients: product.ingredients || [],
    });
  } catch (err) {
    console.error("Error fetching product:", err);
    res.status(500).json({ message: err.message });
  }
};

// ✅ Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Delete all images
    if (product.images && product.images.length > 0) {
      for (const img of product.images) {
        try {
          const publicId = img.split("/").pop().split(".")[0];
          await cloudinary.uploader.destroy(`products/${publicId}`);
        } catch (err) {
          console.warn("⚠️ Failed to delete image:", err.message);
        }
      }
    }

    const brandId = product.brandId;
    await product.deleteOne();

    // 🔥 Update brand discount automatically
    if (brandId) await updateBrandDiscountFromProducts(brandId);

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting product:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

export const reviewOrder = async (req, res) => {
  try {
    const { productId, review, rating, userName, email, city } = req.body;

    // ✅ Validate required fields
    if (!productId || !review || !rating || !userName || !email || !city) {
      return res.status(400).json({
        message:
          "Product ID, review, rating, userName, email, and city are required",
      });
    }

    // ✅ Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Create review object
    const newReview = {
      rating,
      comment: review,
      userName,
      email,
      city,
      createdAt: new Date(),
    };

    // ✅ Push to reviews array
    product.reviews.push(newReview);

    // ✅ Save product with new review
    await product.save();

  const addedReview = product.reviews[product.reviews.length - 1];
  
    res.status(201).json({
      message: "Review added successfully",
      review: addedReview,
      product,
    });
  } catch (error) {
    console.error("❌ Error adding review:", error);
    res.status(500).json({ message: "Failed to add review." });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const { productId, reviewId } = req.params;

    // ✅ Find product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // ✅ Find review index
    const reviewIndex = product.reviews.findIndex(
      (r) => r._id.toString() === reviewId
    );
    if (reviewIndex === -1) {
      return res.status(404).json({ message: "Review not found" });
    }

    // ✅ Remove review
    product.reviews.splice(reviewIndex, 1);

    // ✅ Save product
    await product.save();

    res.json({ message: "Review deleted successfully", product });
  } catch (error) { 
    console.error("❌ Error deleting review:", error);
    res.status(500).json({ message: "Failed to delete review." });
  }
};